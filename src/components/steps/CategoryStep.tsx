"use client";

import { useState, useEffect } from "react";
import { useEstimate } from "@/context/EstimateContext";
import { Button } from "@/components/ui/Button";
import { TierExampleModal } from "@/components/TierExampleModal";
import { calculateCategoryTotal, formatCurrency } from "@/lib/calculations";
import { CATEGORY_LABELS } from "@/types";
import type { WeddingCategory, TierOption, WeddingSelection } from "@/types";

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

  const getTierSpread = (tier: TierOption) => {
    const { low, high } = calculateCategoryTotal(tier, wedding.isPeak, wedding.guestMidpoint);
    return high - low;
  };

  const tierNeedsExample = (tier: TierOption) =>
    (tier.examples?.length ?? 0) > 0 && getTierSpread(tier) > 5_000;

  const handleSelect = (tier: TierOption) => {
    setSelected(tier);
    setTierForCategory(category, tier);
  };

  const exampleChosen = wedding.tierExamples?.[category] !== undefined;

  const handleContinue = () => {
    if (selectedTier && tierNeedsExample(selectedTier) && !exampleChosen) {
      setShowExampleModal(true);
      return;
    }
    onNext();
  };

  const handleExampleConfirm = (price: number) => {
    setExampleForCategory(category, price);
    setShowExampleModal(false);
    onNext();
  };

  const canContinue = !!selectedTier;

  return (
    <div>
      <p className="text-sage-600 font-medium text-sm mb-1 uppercase tracking-wide">
        {wedding.city}
      </p>
      <h1 className="font-display text-2xl sm:text-3xl text-sand-900 mb-2 font-bold">
        {CATEGORY_INTROS[category]}
      </h1>
      <p className="text-sand-500 mb-6">
        Choose your {CATEGORY_LABELS[category].toLowerCase()} tier. You&apos;ll see prices on the results page.
      </p>

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
            return (
              <button
                key={tier.id}
                onClick={() => handleSelect(tier)}
                className={`w-full text-left rounded-2xl border-2 p-5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-sage-500 bg-sage-50 shadow-sm"
                    : "border-sand-200 bg-white hover:border-sand-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`font-medium ${isSelected ? "text-sage-700" : "text-sand-800"}`}>
                    {tier.tierName}
                  </p>
                  <p className={`text-sm font-semibold shrink-0 ${isSelected ? "text-sage-600" : "text-sand-600"}`}>
                    {priceText}
                  </p>
                </div>
                {isSelected && (
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
