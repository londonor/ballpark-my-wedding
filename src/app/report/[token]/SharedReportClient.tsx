"use client";

import { ReportView } from "@/components/ReportView";
import { Button } from "@/components/ui/Button";
import type { WeddingEstimateResult } from "@/types";

interface Props {
  result: WeddingEstimateResult;
  insight?: string | null;
}

export function SharedReportClient({ result, insight }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-sand-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <a href="/">
            <img src="/logo.png" alt="Ballpark my wedding" className="h-24 w-auto" />
          </a>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        {/* Banner image */}
        <div className="mb-6 -mx-4 sm:-mx-6">
          <img
            src={`/images/destinations/${result.slug}/banner/1.png`}
            alt={result.city}
            className="w-full block"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              const generic = "/images/destinations/generic/banner/1.png";
              if (img.src.includes("/generic/")) {
                img.style.display = "none";
              } else {
                img.src = generic;
              }
            }}
          />
        </div>

        <ReportView result={result} isShared insight={insight} />

        <div className="mt-8">
          <Button
            size="lg"
            className="w-full"
            onClick={() => (window.location.href = "/")}
          >
            Build your own wedding estimate
          </Button>
        </div>

        <div className="rounded-2xl bg-sand-100 p-5 mt-8 mb-4">
          <p className="text-sand-600 text-sm leading-relaxed">
            This is a ballpark estimate based on real vendor data for{" "}
            {result.city}. Actual costs will vary by venue availability, vendor
            choice, and the specific details of your day. Use it as a starting
            point — not a quote.
          </p>
        </div>
      </main>
    </div>
  );
}
