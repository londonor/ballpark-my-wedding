"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/calculations";
import type { TierOption, TierExample } from "@/types";

interface TierExampleModalProps {
  tier: TierOption;
  city: string;
  isPeak: boolean;
  onConfirm: (price: number) => void;
}

export function TierExampleModal({ tier, city, isPeak, onConfirm }: TierExampleModalProps) {
  const [selected, setSelected] = useState<TierExample | null>(null);

  const examples = [...(tier.examples ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(isPeak ? selected.pricePeak : selected.priceOffPeak);
  };

  const isVenue = tier.category === "venue";
  const framing = isVenue
    ? "Pick the example closest to what you have in mind"
    : "Pick the example closest to the style and scale you're imagining";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-sand-900/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="font-semibold text-sand-900 text-lg leading-tight">
            Help us narrow this down
          </h2>
          <p className="text-sand-600 text-sm mt-1 leading-relaxed">
            The {tier.tierName} tier in {city} covers a wide price range. {framing} — we&apos;ll
            use that as your estimate.
          </p>
          <p className="text-sand-500 text-xs mt-2 leading-relaxed">
            These are representative examples of what this tier looks like. You&apos;re not booking
            these specific vendors — just helping us estimate based on something similar.
          </p>
        </div>

        <div className="space-y-2">
          {examples.map((ex) => {
            const price = isPeak ? ex.pricePeak : ex.priceOffPeak;
            const isSelected = selected?.id === ex.id;
            return (
              <button
                key={ex.id}
                onClick={() => setSelected(ex)}
                className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all cursor-pointer ${
                  isSelected
                    ? "border-sage-500 bg-sage-50"
                    : "border-sand-200 bg-white hover:border-sand-300"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm leading-snug ${isSelected ? "text-sage-800 font-medium" : "text-sand-800"}`}>
                    {ex.exampleLabel}
                  </p>
                  <p className={`text-sm font-semibold shrink-0 ${isSelected ? "text-sage-600" : "text-sand-500"}`}>
                    {formatCurrency(price)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <Button size="lg" className="w-full" disabled={!selected} onClick={handleConfirm}>
          Use this estimate
        </Button>
      </div>
    </div>
  );
}
