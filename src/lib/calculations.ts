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

export function calculateEstimate(wedding: WeddingSelection): WeddingEstimateResult {
  const categories: CategoryEstimate[] = [];

  for (const cat of CATEGORY_ORDER) {
    const tier = wedding.tiers[cat];
    if (!tier) continue;
    const example = wedding.tierExamples?.[cat];
    const { low, high } = example !== undefined
      ? { low: example.price, high: example.price }
      : calculateCategoryTotal(tier, wedding.isPeak, wedding.guestMidpoint);
    categories.push({
      category: cat,
      tierName: tier.tierName,
      blurb: tier.blurb,
      pricingType: tier.pricingType,
      totalLow: low,
      totalHigh: high,
    });
  }

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
