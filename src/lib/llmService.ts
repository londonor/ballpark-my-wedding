/**
 * src/lib/llmService.ts
 *
 * Wedding insight generation via the Anthropic Messages API (Claude Haiku).
 * Server-only — never import from client components.
 */

import type { WeddingEstimateResult } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { MONTH_NAMES } from "@/lib/calculations";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const ANTHROPIC_MODEL   = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

/** Ollama-compatible 180-second timeout. */
const TIMEOUT_MS = 180_000;

// ── Prompt ─────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a wedding cost advisor for BallparkMyWedding.com.
You write in a calm, specific, slightly pragmatic voice — the user is making a major financial decision and arrives stressed.
No bullet points. No headers. No markdown.
Write in flowing paragraphs. Be specific — use city names, tier details, real examples.
Never use phrases like "dream wedding" or "special day" or "unforgettable."
Always format currency with a dollar sign and no spaces — write $12,000 not 12000. Never write dollar amounts as plain numbers.
Use markdown bold (**like this**) for every dollar amount in your response and for one key concept per paragraph. Use no other markdown formatting — no headers, no bullet points, no italics. Just bold.
Keep the full response under 300 words.`;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface InsightInput {
  result: WeddingEstimateResult;
  alternativeCities: string[];
}

// ── Message builder ────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function buildUserMessage({ result, alternativeCities }: InsightInput): string {
  const monthName = MONTH_NAMES[result.weddingMonth - 1] ?? "Unknown";
  const season = result.isPeak ? "PEAK SEASON" : "off-peak";

  const categoriesBlock = result.categories
    .map((cat) => {
      const label = CATEGORY_LABELS[cat.category] ?? cat.category;
      const range = `${fmt(cat.totalLow)}–${fmt(cat.totalHigh)}`;
      const note = cat.pricingType === "per_head" ? " (per-head pricing)" : "";
      return `  ${label}: ${cat.tierName} — ${range}${note}`;
    })
    .join("\n");

  const visitingCity = result.city;
  const alternativesLine = alternativeCities.length > 0
    ? alternativeCities.join(", ")
    : "no alternatives available";

  return `Here is a wedding cost estimate. Write your insight in 4 paragraphs covering: \
(1) why the estimate range is wide — be specific, name the tiers and numbers that drive the gap; \
(2) any tier nudges worth mentioning — skip entirely if nothing genuine to say; \
(3) one or two closing practical tips tailored to this exact wedding (season, guest count, spending level); \
(4) suggest one or two genuinely similar wedding destinations from this list only: ${alternativesLine} — never suggest ${visitingCity}. \
Be specific about why each alternative is worth considering: market type, seasonal pricing, and what kind of couple it suits.

City: ${result.city}, ${result.state}
Wedding month: ${monthName} ${result.weddingYear} (${season})
Guest count: ~${result.guestMidpoint} guests (${result.guestBucket.replace("to", "–").replace("under", "Under ").replace("plus", "+")})
Grand total: ${fmt(result.grandTotalLow)}–${fmt(result.grandTotalHigh)}
Per guest: ${fmt(result.perGuestLow)}–${fmt(result.perGuestHigh)}

Category breakdown:
${categoriesBlock}`;
}

// ── Anthropic API call ─────────────────────────────────────────────────────────

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  error?: { type: string; message: string };
}

export async function generateInsight(input: InsightInput): Promise<{
  text: string;
  model: string;
}> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserMessage(input) }],
      }),
      signal: controller.signal,
    });

    const data = (await res.json()) as AnthropicResponse;

    if (!res.ok) {
      throw new Error(
        `Anthropic API error ${res.status}: ${data.error?.message ?? "unknown"}`,
      );
    }

    const text = data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";

    if (!text) throw new Error("Empty response from Anthropic API");

    return { text, model: ANTHROPIC_MODEL };
  } finally {
    clearTimeout(timer);
  }
}
