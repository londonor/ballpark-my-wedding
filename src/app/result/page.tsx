"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEstimate } from "@/context/EstimateContext";
import { ReportView } from "@/components/ReportView";
import { Button } from "@/components/ui/Button";
import { ShareModal } from "@/components/ShareModal";
import { calculateEstimate } from "@/lib/calculations";
import { MONTH_NAMES } from "@/lib/calculations";
import { decorateInclusion } from "@/lib/inclusion";
import type { WeddingEstimateResult } from "@/types";

export default function ResultPage() {
  const router = useRouter();
  const { state, reset } = useEstimate();
  const [result, setResult] = useState<WeddingEstimateResult | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightSlowHint, setInsightSlowHint] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (!state.wedding) {
      router.replace("/");
      return;
    }
    const computed = calculateEstimate(state.wedding);
    // Attach UI-only inclusionNote strings to catering/bar entries when the
    // venue's inclusion model adjusted them. This runs in the consumer, not
    // in the engine, so calculations.ts stays a pure numeric function.
    decorateInclusion(computed, state.wedding);
    setResult(computed);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Eagerly create share token once result is ready
  useEffect(() => {
    if (!result) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });
        const data = await res.json();
        if (!cancelled) {
          setShareUrl(`${window.location.origin}/report/${data.shareToken}`);
          setShareToken(data.shareToken);
        }
      } catch (err) {
        console.error("[result] Failed to create share token via /api/report:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [result]);

  // Request LLM insight once share token is available
  useEffect(() => {
    if (!shareToken) return;
    let cancelled = false;
    setInsightLoading(true);
    setInsightSlowHint(false);

    const slowTimer = setTimeout(() => {
      if (!cancelled) setInsightSlowHint(true);
    }, 8_000);

    (async () => {
      try {
        const res = await fetch(`/api/reports/${shareToken}/insight`, {
          method: "POST",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (!cancelled && typeof data.insight === "string") {
          setInsight(data.insight);
        }
      } catch (err) {
        console.error("[result] Failed to fetch LLM insight:", err);
      } finally {
        clearTimeout(slowTimer);
        if (!cancelled) {
          setInsightLoading(false);
          setInsightSlowHint(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [shareToken]);

  if (!result) return null;

  const monthName = MONTH_NAMES[result.weddingMonth - 1] ?? "";

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmittingEmail(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, shareToken: shareToken ?? undefined }),
      });
      if (res.ok) setEmailSent(true);
    } catch {
      // silently fail
    }
    setSubmittingEmail(false);
  };

  const handleStartOver = () => {
    reset();
    router.push("/");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-sand-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <a href="/">
              <img src="/logo.png" alt="Ballpark my wedding" className="h-24 w-auto" />
            </a>
            <button
              onClick={handleStartOver}
              className="text-sm text-sand-500 hover:text-sand-700 transition-colors cursor-pointer"
            >
              Start Over
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        {/* Banner image */}
        <div className="mb-4 -mx-4 sm:-mx-6">
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

        <div className="mb-8">
          <p className="font-display font-bold text-sand-900 text-base leading-snug">
            Wedding in {result.city}, {result.state} — {monthName} {result.weddingYear}
          </p>
          <p className="text-sage-600 text-xs mt-0.5 font-medium">
            ballparkmywedding.com
          </p>
        </div>

        <ReportView
          result={result}
          insight={insight}
          insightLoading={insightLoading}
          insightSlowHint={insightSlowHint}
        />

        {/* Next steps */}
        <div className="mb-8">
          <h2 className="font-display font-bold text-3xl text-sand-900 mb-6">
            Your Next Steps
          </h2>

          {/* Step 1 — Email */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm mb-4">
            <div className="flex gap-5 items-start">
              <span className="font-display font-bold text-5xl text-sage-500 leading-none shrink-0 select-none">
                1
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sand-800 text-base mb-1">
                  Email this estimate to yourself
                </p>
                {emailSent ? (
                  <div className="mt-3">
                    <p className="text-sage-700 font-medium mb-0.5">Check your inbox!</p>
                    <p className="text-sand-500 text-sm">
                      Sent to <span className="font-medium">{email}</span>
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sand-500 text-sm leading-relaxed mb-4">
                      We&apos;ll send a PDF of your full estimate — so you have a real
                      number to share with your partner, family, or anyone helping with the budget.
                    </p>
                    <form onSubmit={handleEmailSubmit} className="flex gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="flex-1 min-w-0 rounded-xl border border-sand-300 px-4 py-2.5 text-sand-800 text-sm shadow-sm focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400/20"
                      />
                      <Button type="submit" disabled={submittingEmail}>
                        {submittingEmail ? "..." : "Send it"}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Step 2 — Share */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm mb-4">
            <div className="flex gap-5 items-start">
              <span className="font-display font-bold text-5xl text-sage-500 leading-none shrink-0 select-none">
                2
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sand-800 text-base mb-1">
                  Share with your crew
                </p>
                <p className="text-sand-500 text-sm leading-relaxed mb-4">
                  Send it to your partner, family, or anyone helping plan — no group chat chaos.
                </p>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShareModalOpen(true)}
                  disabled={!shareUrl}
                >
                  {shareUrl ? "Share this estimate with your crew" : "Preparing share link…"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Start over */}
        <div className="text-center pb-6">
          <button
            onClick={handleStartOver}
            className="text-sand-500 hover:text-sand-700 transition-colors text-sm cursor-pointer"
          >
            Start a new estimate
          </button>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl bg-sand-100 p-5 mb-8">
          <p className="text-sand-600 text-sm leading-relaxed">
            This is a ballpark estimate based on real vendor data for{" "}
            {result.city}. Actual costs will vary by venue availability, vendor
            choice, and the specific details of your day. Use it as a starting
            point — not a quote.
          </p>
        </div>
      </main>

      {shareModalOpen && shareToken && (
        <ShareModal
          cityTitle={`${result.city}, ${result.state}`}
          weddingYear={result.weddingYear}
          shareToken={shareToken}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
}
