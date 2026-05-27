"use client";

import { useState, useEffect } from "react";
import { useEstimate } from "@/context/EstimateContext";
import { Button } from "@/components/ui/Button";
import { TierExampleModal } from "@/components/TierExampleModal";
import { calculateCategoryTotal, formatCurrency } from "@/lib/calculations";
import { venueInclusionCardLabel, venueIncludesCategory } from "@/lib/inclusion";
import { CATEGORY_LABELS } from "@/types";
import type { WeddingCategory, TierOption, WeddingSelection } from "@/types";

// Copy shown above the tier list when the venue's inclusion model locks
// this step. Brand voice: calm, plain, knowledgeable-friend.
const LOCKED_COPY: Partial<Record<WeddingCategory, string>> = {
  catering: "Your venue includes catering, so there's no separate choice to make here. Continue when you're ready.",
  bar:      "Your venue includes the bar, so there's no separate choice to make here. Continue when you're ready.",
};

interface CategoryStepProps {
  wedding: WeddingSelection;
  category: WeddingCategory;
  onNext: () => void;
}

const CATEGORY_INTROS: Record<WeddingCategory, string> = {
  venue:       "Where will you exchange your vows?",
  catering:    "What style of dining fits your vision?",
  bar:         "How will you toast to the occasion?",
  photography: "How will you preserve the day?",
  florals:     "How will you set the scene?",
  music:       "What will fill the room?",
  planner:     "How much planning support do you want?",
  attire:      "How are you dressing for the day?",
  stationery:  "How are you inviting your guests?",
};

export function CategoryStep({ wedding, category, onNext }: CategoryStepProps) {
  const { setTierForCategory, setExampleForCategory } = useEstimate();
  const [tiers, setTiers]         = useState<TierOption[]>([]);
  const [selectedTier, setSelected] = useState<TierOption | null>(
    wedding.tiers[category] ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    fetch(`/api/tiers?destinationId=${wedding.destinationId}&category=${category}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTiers(data);
        } else {
          console.error("[CategoryStep] /api/tiers returned non-array:", data);
          setLoadError(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("[CategoryStep] /api/tiers fetch failed:", err);
        setLoadError(true);
        setLoading(false);
      });
  }, [wedding.destinationId, category]);

  // When the selected venue includes this category, this step locks:
  // tiers render non-interactive, an explanatory line shows, and Continue
  // is enabled without requiring a tier pick. We silently pin tier 1 to
  // the wedding state so the results page still has a category entry to
  // attach the "included with your venue" note to.
  const isLocked = venueIncludesCategory(wedding.tiers.venue, category);

  useEffect(() => {
    if (isLocked && tiers.length > 0 && !selectedTier) {
      setSelected(tiers[0]);
      setTierForCategory(category, tiers[0]);
    }
  }, [isLocked, tiers, selectedTier, category, setTierForCategory]);

  const getTierSpread = (tier: TierOption) => {
    const { low, high } = calculateCategoryTotal(tier, wedding.isPeak, wedding.guestMidpoint);
    return high - low;
  };

  const tierNeedsExample = (tier: TierOption) =>
    (tier.examples?.length ?? 0) > 0 && getTierSpread(tier) > 5_000;

  const handleSelect = (tier: TierOption) => {
    if (isLocked) return; // ignore clicks on locked-step cards
    setSelected(tier);
    setTierForCategory(category, tier);
  };

  const exampleChosen = wedding.tierExamples?.[category] !== undefined;

  const handleContinue = () => {
    if (isLocked) {
      onNext();
      return;
    }
    if (selectedTier && tierNeedsExample(selectedTier) && !exampleChosen) {
      setShowExampleModal(true);
      return;
    }
    onNext();
  };

  const handleExampleConfirm = (price: number, guestCount: number | null) => {
    setExampleForCategory(category, price, guestCount);
    setShowExampleModal(false);
    onNext();
  };

  const canContinue = isLocked || !!selectedTier;

  return (
    <div>
      <p className="text-sage-600 font-medium text-sm mb-1 uppercase tracking-wide">
        {wedding.city}
      </p>
      <h1 className="font-display text-2xl sm:text-3xl text-sand-900 mb-2 font-bold">
        {CATEGORY_INTROS[category]}
      </h1>
      {isLocked ? (
        <div className="mb-6 rounded-2xl border border-sage-200 bg-sage-50 p-4 text-sage-800 text-sm leading-relaxed">
          {LOCKED_COPY[category]}
        </div>
      ) : (
        <p className="text-sand-500 mb-6">
          Choose your {CATEGORY_LABELS[category].toLowerCase()} tier. You&apos;ll see prices on the results page.
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-sand-100 animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="mb-8 rounded-2xl border border-coral-200 bg-coral-50 p-5 text-coral-700 text-sm">
          Couldn&apos;t load options — please refresh.
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {tiers.map((tier) => {
            const isSelected = selectedTier?.id === tier.id;
            const isPerHead = tier.pricingType === "per_head";
            const rawLow  = wedding.isPeak ? tier.priceLowPeak  : tier.priceLowOffPeak;
            const rawHigh = wedding.isPeak ? tier.priceHighPeak : tier.priceHighOffPeak;
            const { low, high } = isPerHead
              ? { low: rawLow, high: rawHigh }
              : calculateCategoryTotal(tier, wedding.isPeak, wedding.guestMidpoint);
            const priceText = (low === 0 && high === 0)
              ? "$0"
              : isPerHead
                ? `${formatCurrency(low)} – ${formatCurrency(high)} /person`
                : `${formatCurrency(low)} – ${formatCurrency(high)}`;
            const venueInclusionLabel =
              category === "venue" ? venueInclusionCardLabel(tier) : null;
            const baseClasses = "w-full text-left rounded-2xl border-2 p-5 transition-all";
            const interactiveClasses = isSelected
              ? "border-sage-500 bg-sage-50 shadow-sm cursor-pointer"
              : "border-sand-200 bg-white hover:border-sand-300 cursor-pointer";
            const lockedClasses = "border-sand-200 bg-sand-50 opacity-60 cursor-not-allowed";
            return (
              <button
                key={tier.id}
                onClick={() => handleSelect(tier)}
                disabled={isLocked}
                aria-disabled={isLocked}
                className={`${baseClasses} ${isLocked ? lockedClasses : interactiveClasses}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`font-medium ${isSelected && !isLocked ? "text-sage-700" : "text-sand-800"}`}>
                    {tier.tierName}
                  </p>
                  <p className={`text-sm font-semibold shrink-0 ${isSelected && !isLocked ? "text-sage-600" : "text-sand-600"}`}>
                    {priceText}
                  </p>
                </div>
                {venueInclusionLabel && (
                  <p className={`text-xs mt-1.5 ${isSelected ? "text-sage-600" : "text-sand-500"}`}>
                    {venueInclusionLabel}
                  </p>
                )}
                {!isLocked && isSelected && (
                  <p className="text-sand-600 text-sm leading-relaxed mt-2">
                    {tier.blurb}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Button size="lg" className="w-full" disabled={!canContinue} onClick={handleContinue}>
        Continue
      </Button>

      {showExampleModal && selectedTier && (
        <TierExampleModal
          tier={selectedTier}
          city={wedding.city}
          isPeak={wedding.isPeak}
          onConfirm={handleExampleConfirm}
        />
      )}
    </div>
  );
}
