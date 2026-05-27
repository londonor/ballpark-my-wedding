"use client";

import { Fragment } from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency, MONTH_NAMES } from "@/lib/calculations";
import { CATEGORY_LABELS, GUEST_BUCKETS } from "@/types";
import type { WeddingEstimateResult, WeddingCategory } from "@/types";

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

interface ReportViewProps {
  result: WeddingEstimateResult;
  isShared?: boolean;
  insight?: string | null;
  insightLoading?: boolean;
  insightSlowHint?: boolean;
}

export function ReportView({
  result,
  isShared = false,
  insight,
  insightLoading = false,
  insightSlowHint = false,
}: ReportViewProps) {
  const monthName  = MONTH_NAMES[result.weddingMonth - 1] ?? "";
  const guestLabel = GUEST_BUCKETS.find((b) => b.key === result.guestBucket)?.label ?? "";

  return (
    <div>
      {/* Grand Total */}
      <div className="text-center mb-10">
        <p className="text-sand-500 text-sm uppercase tracking-wide mb-2">
          Your ballpark wedding estimate at {result.guestMidpoint} guests
        </p>
        <p className="font-display font-bold text-4xl sm:text-5xl text-sand-900 mb-2">
          {formatCurrency(result.grandTotalLow)} – {formatCurrency(result.grandTotalHigh)}
        </p>
        <p className="text-sand-400">
          {result.city}, {result.state} · {monthName} {result.weddingYear}
          {result.isPeak && <span className="ml-2 text-coral-500">· Peak season</span>}
        </p>
        <p className="text-sand-400 text-sm mt-1">{guestLabel}</p>
      </div>

      {/* Per-guest */}
      <Card className="mb-6">
        <h3 className="font-semibold text-sand-800 mb-4">Per-guest cost</h3>
        <div className="flex items-center justify-between">
          <span className="text-sand-600">
            Per guest{" "}
            <span className="text-sand-400 text-sm">(est. {result.guestMidpoint} guests)</span>
          </span>
          <span className="font-medium text-sand-800">
            {formatCurrency(result.perGuestLow)} – {formatCurrency(result.perGuestHigh)}
          </span>
        </div>
      </Card>

      {/* LLM insight — loading shimmer */}
      {insightLoading && !insight && (
        <Card className="mb-6">
          <h3 className="font-semibold text-sand-800 mb-4 animate-pulse">
            Generating your wedding insights…
          </h3>
          <div className="h-3 rounded bg-sand-200 animate-pulse mb-2 w-5/6" />
          <div className="h-3 rounded bg-sand-200 animate-pulse mb-2 w-11/12" />
          <div className="h-3 rounded bg-sand-200 animate-pulse w-3/4" />
          {insightSlowHint && (
            <p className="text-sand-400 text-xs mt-4">
              Putting this together — usually takes 20–30 seconds on first run.
            </p>
          )}
        </Card>
      )}

      {/* LLM insight — loaded */}
      {insight && (
        <Card className="mb-6">
          <h3 className="font-semibold text-sand-800 mb-4">
            What to know about your wedding
          </h3>
          <p className="text-sand-400 text-xs leading-relaxed font-light whitespace-pre-line">
            {renderBold(insight)}
          </p>
        </Card>
      )}

      {/* Category breakdowns */}
      {result.categories.map((cat, index) => {
        const isZero = cat.totalLow === 0 && cat.totalHigh === 0;
        // Tier name and blurb are suppressed when the engine zeroed this
        // category because the venue includes it — the user's tier pick (if
        // any) was an auto-pick on a locked step and is not meaningful copy.
        const hideTierDetails = isZero && !!cat.inclusionNote;
        const priceLabel = isZero
          ? cat.inclusionNote
            ? "Included"
            : "$0"
          : `${formatCurrency(cat.totalLow)} – ${formatCurrency(cat.totalHigh)}`;
        return (
          <Card key={index} className="mb-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-sand-800">
                {CATEGORY_LABELS[cat.category as WeddingCategory] ?? cat.category}
              </h3>
              <p className="font-semibold text-sand-800 shrink-0 ml-4">{priceLabel}</p>
            </div>
            {!hideTierDetails && (
              <p className="text-sand-500 text-sm mb-1">{cat.tierName}</p>
            )}
            {!hideTierDetails && cat.blurb && (
              <p className="text-sand-400 text-xs leading-relaxed font-light">{cat.blurb}</p>
            )}
            {cat.inclusionNote && (
              <p className={`text-sand-500 text-xs leading-relaxed ${hideTierDetails ? "" : "mt-2 pt-2 border-t border-sand-200"}`}>
                {cat.inclusionNote}
              </p>
            )}
          </Card>
        );
      })}

      {/* Brand on shared view */}
      {isShared && (
        <div className="text-center py-6 border-t border-sand-200">
          <p className="text-sand-400 text-sm mb-1">Estimated with</p>
          <p className="font-display font-bold text-xl text-sage-700">
            ballparkmywedding.com
          </p>
        </div>
      )}
    </div>
  );
}
