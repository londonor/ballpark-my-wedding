import type {
  WeddingCategory,
  GuestBucket,
  TierOption,
  CategoryEstimate,
  WeddingEstimateResult,
  WeddingSelection,
} from "@/types";
import { GUEST_BUCKETS } from "@/types";

export function getGuestMidpoint(bucket: GuestBucket): number {
  return GUEST_BUCKETS.find((b) => b.key === bucket)?.midpoint ?? 75;
}

/**
 * Determines whether a given wedding month falls in peak season.
 * Handles inverted (wrap-around) seasons — e.g., Phoenix peaks Nov–Apr.
 */
export function isPeakSeason(
  weddingMonth: number,
  peakSeasonStart: number,
  peakSeasonEnd: number,
): boolean {
  if (peakSeasonStart <= peakSeasonEnd) {
    return weddingMonth >= peakSeasonStart && weddingMonth <= peakSeasonEnd;
  }
  // Wrap-around: peak straddles the year boundary (e.g., Nov=11 to Apr=4)
  return weddingMonth >= peakSeasonStart || weddingMonth <= peakSeasonEnd;
}

/**
 * Computes the cost range for a single category tier.
 * - "flat" tiers use the price as-is.
 * - "per_head" tiers multiply by the guest count midpoint.
 */
export function calculateCategoryTotal(
  tier: TierOption,
  peak: boolean,
  guestMidpoint: number,
): { low: number; high: number } {
  const low = peak ? tier.priceLowPeak : tier.priceLowOffPeak;
  const high = peak ? tier.priceHighPeak : tier.priceHighOffPeak;

  if (tier.pricingType === "per_head") {
    return {
      low: Math.round(low * guestMidpoint),
      high: Math.round(high * guestMidpoint),
    };
  }
  return { low: Math.round(low), high: Math.round(high) };
}

const CATEGORY_ORDER: WeddingCategory[] = [
  "venue", "catering", "bar", "photography", "florals",
  "music", "planner", "attire", "stationery",
];

/**
 * Resolves the contribution range for a category when the user has picked a
 * TierExample via the "Help us narrow this down" popup.
 *
 * - Flat tiers: example price used verbatim for both low and high.
 * - Per-head tiers with example.guestCount = null: example price used verbatim.
 * - Per-head tiers with example.guestCount > 0: re-scaled to the user's guest
 *   count so the contribution moves with how many people are actually coming:
 *       scaled = round(example.price / example.guestCount * wedding.guestMidpoint)
 *
 * The re-scaling path is currently dormant against all real data — no per_head
 * category (catering, bar) has TierExample rows today, and every existing
 * TierExample.guestCount is null. It's wired up now so it will activate cleanly
 * when florals is converted to per_head in a future schema pass, or when
 * per-head examples with guest counts are added.
 */
function resolveExampleContribution(
  tier: TierOption,
  example: { price: number; guestCount: number | null },
  guestMidpoint: number,
): { low: number; high: number } {
  if (
    tier.pricingType === "per_head" &&
    example.guestCount !== null &&
    example.guestCount > 0
  ) {
    const scaled = Math.round(example.price / example.guestCount * guestMidpoint);
    return { low: scaled, high: scaled };
  }
  return { low: example.price, high: example.price };
}

/**
 * Applies the venue tier's inclusion model to the catering and bar
 * contributions. Mutates the caller's `contributions` map in place.
 *
 * Rules:
 *   foodModel    = "included" → catering contributes $0
 *   foodModel    = "minimum"  → catering = max(catering, foodMinimum)
 *   alcoholModel = "included" → bar contributes $0
 *   alcoholModel = "minimum"  → bar = max(bar, alcoholMinimum)
 *   foodModel    = "extra" (default) → catering unchanged
 *   alcoholModel = "extra" (default) → bar unchanged
 *
 * Special case: minimumIsCombined === true. The venue has a single combined
 * F&B floor (held in foodMinimum; alcoholMinimum is null). Compute the sum of
 * the normal catering and bar contributions, apply the floor once, and let
 * that combined figure replace the catering+bar pair. In this case the
 * per-category foodModel/alcoholModel rules above are skipped — the combined
 * path takes precedence and the floor is applied exactly once.
 *
 * When minimumIsCombined is true and both catering and bar are selected, the
 * combined adjusted total is placed on the catering line and bar is zeroed so
 * the grand-total sum is correct. When only one of them is selected, that one
 * carries the combined floor; the other was already 0.
 *
 * If there is no venue tier selected, the contributions map is left untouched.
 */
function applyVenueInclusion(
  venue: TierOption | undefined,
  contributions: Map<WeddingCategory, { low: number; high: number }>,
): void {
  if (!venue) return;
  const c = contributions.get("catering");
  const b = contributions.get("bar");

  if (venue.minimumIsCombined) {
    const floor = venue.foodMinimum ?? 0;
    const cLow  = c?.low  ?? 0;
    const cHigh = c?.high ?? 0;
    const bLow  = b?.low  ?? 0;
    const bHigh = b?.high ?? 0;
    const combinedLow  = Math.max(cLow  + bLow,  floor);
    const combinedHigh = Math.max(cHigh + bHigh, floor);
    if (c) {
      c.low = combinedLow;
      c.high = combinedHigh;
      if (b) { b.low = 0; b.high = 0; }
    } else if (b) {
      b.low = combinedLow;
      b.high = combinedHigh;
    }
    return;
  }

  if (c) {
    if (venue.foodModel === "included") {
      c.low = 0;
      c.high = 0;
    } else if (venue.foodModel === "minimum" && venue.foodMinimum !== null) {
      c.low  = Math.max(c.low,  venue.foodMinimum);
      c.high = Math.max(c.high, venue.foodMinimum);
    }
  }
  if (b) {
    if (venue.alcoholModel === "included") {
      b.low = 0;
      b.high = 0;
    } else if (venue.alcoholModel === "minimum" && venue.alcoholMinimum !== null) {
      b.low  = Math.max(b.low,  venue.alcoholMinimum);
      b.high = Math.max(b.high, venue.alcoholMinimum);
    }
  }
}

export function calculateEstimate(wedding: WeddingSelection): WeddingEstimateResult {
  // Pass 1 — compute the normal contribution for each selected category.
  const contributions = new Map<WeddingCategory, { low: number; high: number }>();
  const orderedTiers: { cat: WeddingCategory; tier: TierOption }[] = [];

  for (const cat of CATEGORY_ORDER) {
    const tier = wedding.tiers[cat];
    if (!tier) continue;
    orderedTiers.push({ cat, tier });
    const example = wedding.tierExamples?.[cat];
    const contrib = example !== undefined
      ? resolveExampleContribution(tier, example, wedding.guestMidpoint)
      : calculateCategoryTotal(tier, wedding.isPeak, wedding.guestMidpoint);
    contributions.set(cat, contrib);
  }

  // Pass 2 — let the venue's inclusion model adjust catering and bar.
  // No-op when foodModel/alcoholModel are "extra" and minimumIsCombined is false
  // (the current default state of every Tier row).
  applyVenueInclusion(wedding.tiers.venue, contributions);

  // Build the result categories in the unchanged CATEGORY_ORDER iteration order.
  const categories: CategoryEstimate[] = orderedTiers.map(({ cat, tier }) => {
    const c = contributions.get(cat) ?? { low: 0, high: 0 };
    return {
      category: cat,
      tierName: tier.tierName,
      blurb: tier.blurb,
      pricingType: tier.pricingType,
      totalLow: c.low,
      totalHigh: c.high,
    };
  });

  const grandTotalLow  = categories.reduce((s, c) => s + c.totalLow,  0);
  const grandTotalHigh = categories.reduce((s, c) => s + c.totalHigh, 0);

  return {
    city: wedding.city,
    state: wedding.state,
    slug: wedding.slug,
    weddingMonth: wedding.weddingMonth,
    weddingYear: wedding.weddingYear,
    isPeak: wedding.isPeak,
    guestBucket: wedding.guestBucket,
    guestMidpoint: wedding.guestMidpoint,
    categories,
    grandTotalLow,
    grandTotalHigh,
    perGuestLow:  Math.round(grandTotalLow  / wedding.guestMidpoint),
    perGuestHigh: Math.round(grandTotalHigh / wedding.guestMidpoint),
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
