/**
 * Presentation helpers for the venue's food/alcohol inclusion model.
 *
 * These helpers do not change estimate numbers — Pass B's engine already
 * produces the correct totals. They only derive the UI's display state from
 * the venue tier's foodModel / alcoholModel / minimum fields.
 */
import type { TierOption, WeddingCategory } from "@/types";

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
