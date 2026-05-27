/**
 * Presentation helpers for the venue's food/alcohol inclusion model.
 *
 * These helpers do not change estimate numbers — Pass B's engine already
 * produces the correct totals. They only derive the UI's display state from
 * the venue tier's foodModel / alcoholModel / minimum fields.
 */
import { calculateCategoryTotal } from "@/lib/calculations";
import type {
  TierOption,
  WeddingCategory,
  WeddingEstimateResult,
  WeddingSelection,
} from "@/types";

/**
 * For a venue tier, returns a short label describing which downstream
 * categories are included in the price. Returns null when nothing is
 * included (the default "extra" state, or only minimums set).
 */
export function venueInclusionCardLabel(venueTier: TierOption): string | null {
  const food = venueTier.foodModel === "included";
  const alc = venueTier.alcoholModel === "included";
  if (food && alc) return "Catering and bar included";
  if (food) return "Catering included";
  if (alc) return "Bar included";
  return null;
}

/**
 * Does the selected venue tier include the given category, such that the
 * category's wizard step should be locked?
 *
 * Only meaningful for "catering" and "bar" — all other categories return
 * false. Returns false when no venue tier is selected.
 */
export function venueIncludesCategory(
  venueTier: TierOption | undefined,
  category: WeddingCategory,
): boolean {
  if (!venueTier) return false;
  if (category === "catering") return venueTier.foodModel === "included";
  if (category === "bar") return venueTier.alcoholModel === "included";
  return false;
}

// ─── Results-page inclusion notes ─────────────────────────────────────────────

const NOTE_INCLUDED = "Included with your venue.";
const NOTE_FOOD_MIN = "Your venue has a catering minimum, and your selected tier came in below it. The estimate reflects the minimum.";
const NOTE_BAR_MIN  = "Your venue has a bar minimum, and your selected tier came in below it. The estimate reflects the minimum.";
const NOTE_COMBINED_ANCHOR =
  "Your venue requires a combined food and beverage minimum. The estimate reflects that minimum here, with the bar rolled in.";
const NOTE_COMBINED_FOLDED = "Combined with catering above.";

/**
 * Mutates `result.categories` in place, attaching inclusionNote strings to
 * any catering / bar entry whose total was adjusted by the venue's
 * inclusion model. Does nothing for tiers where the venue's behavior is
 * "extra" (the default) or where a minimum exists but did not bind.
 *
 * Called by the results page after calculateEstimate. The decorated result
 * is what gets stored as the shared-report snapshot, so the explanations
 * survive a `share → open shared link` round trip.
 */
export function decorateInclusion(
  result: WeddingEstimateResult,
  wedding: WeddingSelection,
): void {
  const venue = wedding.tiers.venue;
  if (!venue) return;

  const cateringTier = wedding.tiers.catering;
  const barTier = wedding.tiers.bar;
  const cateringNatural = cateringTier
    ? calculateCategoryTotal(cateringTier, wedding.isPeak, wedding.guestMidpoint)
    : null;
  const barNatural = barTier
    ? calculateCategoryTotal(barTier, wedding.isPeak, wedding.guestMidpoint)
    : null;

  const cateringEntry = result.categories.find((c) => c.category === "catering");
  const barEntry = result.categories.find((c) => c.category === "bar");

  // Combined-minimum path takes precedence over per-category logic.
  if (venue.minimumIsCombined && venue.foodMinimum !== null) {
    const naturalSum = (cateringNatural?.low ?? 0) + (barNatural?.low ?? 0);
    if (naturalSum < venue.foodMinimum) {
      if (cateringEntry) cateringEntry.inclusionNote = NOTE_COMBINED_ANCHOR;
      if (barEntry)      barEntry.inclusionNote = NOTE_COMBINED_FOLDED;
    }
    return;
  }

  // Per-category food
  if (cateringEntry) {
    if (venue.foodModel === "included") {
      cateringEntry.inclusionNote = NOTE_INCLUDED;
    } else if (
      venue.foodModel === "minimum" &&
      venue.foodMinimum !== null &&
      cateringNatural !== null &&
      cateringNatural.low < venue.foodMinimum
    ) {
      cateringEntry.inclusionNote = NOTE_FOOD_MIN;
    }
  }

  // Per-category alcohol
  if (barEntry) {
    if (venue.alcoholModel === "included") {
      barEntry.inclusionNote = NOTE_INCLUDED;
    } else if (
      venue.alcoholModel === "minimum" &&
      venue.alcoholMinimum !== null &&
      barNatural !== null &&
      barNatural.low < venue.alcoholMinimum
    ) {
      barEntry.inclusionNote = NOTE_BAR_MIN;
    }
  }
}
