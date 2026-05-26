# BallparkMyWedding — Current Implementation Report

_Generated 2026-05-26 from a direct walk of the codebase and database._

## A. Modules Built

### App routes (Next.js App Router — `src/app/`)
| Path | What it does | Status |
|---|---|---|
| `src/app/page.tsx` | Home page; Step 1 wizard — city + month + year + guest-bucket dropdowns; `Build my estimate` button calls `setWedding()` and routes to `/estimate`. | **Working** |
| `src/app/estimate/page.tsx` | Wraps `<CategoryStep>` and advances through the 9 categories in order. Redirects to `/` if no wedding state. | **Working** |
| `src/app/result/page.tsx` | Calls `calculateEstimate()` client-side, eagerly POSTs the result to `/api/report` for a share token, then fires a POST to `/api/reports/[token]/insight` for LLM copy. Renders `<ReportView>`, email-capture form, share button. | **Working** |
| `src/app/report/[token]/page.tsx` + `SharedReportClient.tsx` | Public shareable read-only view of a saved report. | **Working** (assumed — not re-verified this report) |
| `src/app/api/destinations/route.ts` | `GET` returns all `Destination` rows, sorted by a hard-coded 20-city order (lines 7–12) — any cities beyond those 20 fall back to alphabetical. **Note: 32 cities have been added beyond that hard-coded list; they sort alphabetically at the end.** | **Working but stale ordering list** |
| `src/app/api/tiers/route.ts` | `GET` returns tiers for a destination + category, with `examples` included. | **Working** |
| `src/app/api/report/route.ts` | `POST` creates a `Report` row with a nanoid token; `GET` reads one by token. | **Working** |
| `src/app/api/reports/[token]/insight/route.ts` | `POST` generates an LLM insight string (Claude Haiku per `.env`) and saves it to the `Report` row. | **Working** (per code presence; not exercised here) |
| `src/app/api/leads/route.ts` | Email lead capture. | **Working** (per code presence) |
| `src/app/api/share/route.ts` | Email-the-PDF-to-recipients share flow. | **Working** (per code presence) |

### Components (`src/components/`)
| Path | What it does |
|---|---|
| `src/components/steps/CategoryStep.tsx` | The 9-step tier-picker UI. Renders tier cards from `/api/tiers`, selects a tier, gates `Continue` on the `<TierExampleModal>` when needed. |
| `src/components/TierExampleModal.tsx` | The "Help us narrow this down" popup. Receives `tier`, `city`, `isPeak`, `onConfirm(price)`. Category-aware framing: venue gets "what you have in mind"; other categories get "the style and scale you're imagining". |
| `src/components/ReportView.tsx` | Renders the grand total, per-guest cost, LLM insight card, and per-category breakdown cards on the results page. |
| `src/components/ShareModal.tsx` | The Send-PDF-by-email modal opened from Step 2 on results. |
| `src/components/ui/{Button,Card,ProgressBar,Select,StepLayout}.tsx` | Small UI primitives. |

### State / lib
| Path | What it does |
|---|---|
| `src/context/EstimateContext.tsx` | React Context for the whole wizard. Holds `wedding` (one `WeddingSelection`) and `currentCategoryIndex`. Exposes `setWedding`, `setTierForCategory`, `setExampleForCategory`, `goNext`, `goBack`, `reset`. |
| `src/lib/calculations.ts` | Pure functions: `isPeakSeason`, `getGuestMidpoint`, `calculateCategoryTotal`, `calculateEstimate`, `formatCurrency`, `MONTH_NAMES`. |
| `src/lib/db.ts` | Single Prisma client singleton, wired to SQLite via `@prisma/adapter-better-sqlite3` at `prisma/dev.db`. |
| `src/lib/llmService.ts` | Claude Haiku call for the insight card. |
| `src/lib/generateReport.tsx` | PDF rendering via `@react-pdf/renderer`. |
| `src/lib/klaviyo.ts` | Lead/email side-effect integration. |
| `src/lib/emailTemplates/{estimateEmail,shareEmail}.ts` | Email body templates. |
| `src/types/index.ts` | All shared types: `WeddingCategory`, `GuestBucket`, `WEDDING_CATEGORIES`, `CATEGORY_LABELS`, `Destination`, `TierExample`, `TierOption`, `WeddingSelection`, `WeddingState`, `CategoryEstimate`, `WeddingEstimateResult`. |

### Scripts (`scripts/`)
| Path | What it does | Status |
|---|---|---|
| `scripts/import-db.ts` | Wipes Destination/Tier/TierExample and re-imports from `template.csv` + `tier_examples.csv` in one transaction. | **Working** |
| `scripts/export-db.ts` | DB → `template.csv` round-trip (re-emits the current Destination + Tier state). | **Working** |
| `scripts/restructure-venues.ts` | One-shot venue-tier reshape (already executed historically). | **Historical** |
| `scripts/split-top-tiers.ts` | One-shot split of top tiers in venue/photo/florals/music (already executed). | **Historical** |
| `scripts/template.csv` | Canonical source-of-truth for Destinations + Tiers. 2341 lines = 1 header + 2340 data rows. |
| `scripts/tier_examples.csv` | Canonical source-of-truth for TierExample. |

---

## B. Data Layer

### Full current `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "sqlite"
}

model Destination {
  id              Int    @id @default(autoincrement())
  city            String
  state           String
  slug            String @unique
  marketType      String @default("")
  peakSeasonStart Int    // month number 1–12
  peakSeasonEnd   Int    // month number 1–12
  tiers           Tier[]
}

model Tier {
  id               Int           @id @default(autoincrement())
  destinationId    Int
  destination      Destination   @relation(fields: [destinationId], references: [id])
  category         String        // "venue"|"catering"|"bar"|"photography"|"florals"|"music"|"planner"|"attire"|"stationery"
  tierName         String
  tierOrder        Int
  pricingType      String        // "flat" | "per_head"
  priceLowPeak     Float
  priceHighPeak    Float
  priceLowOffPeak  Float
  priceHighOffPeak Float
  blurb            String
  examples         TierExample[]
  @@index([destinationId, category])
}

model TierExample {
  id           Int      @id @default(autoincrement())
  tierId       Int
  exampleLabel String
  pricePeak    Int
  priceOffPeak Int
  displayOrder Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  tier         Tier     @relation(fields: [tierId], references: [id], onDelete: Cascade)
  @@index([tierId])
}

model Lead {
  id        Int      @id @default(autoincrement())
  email     String
  city      String
  createdAt DateTime @default(now())
}

model ReportShare {
  id             Int      @id @default(autoincrement())
  shareToken     String
  recipientEmail String
  createdAt      DateTime @default(now())
  @@index([shareToken])
}

model Report {
  id                 Int       @id @default(autoincrement())
  shareToken         String    @unique
  reportData         String    // JSON snapshot of WeddingEstimateResult
  createdAt          DateTime  @default(now())
  insight            String?
  insightGeneratedAt DateTime?
  insightModel       String?
}
```

### Tables touched by the wizard / estimate flow
| Table | Used for | Populated by | Currently has |
|---|---|---|---|
| `Destination` | Step 1 city dropdown; seasonality lookup. | CSV import (`template.csv`). | **52 rows** (real data). |
| `Tier` | The 9 tier-card screens. | CSV import (`template.csv`). | **2,340 rows** (real data). |
| `TierExample` | The "Help us narrow this down" popup. | CSV import (`tier_examples.csv`). | **828 rows** (real data). |
| `Report` | Stores JSON snapshot of each completed estimate (POST `/api/report`). | App writes at runtime. | **9 rows** (real session data from testing). |
| `Lead` | Email captures. | App writes at runtime. | **0 rows**. |
| `ReportShare` | Records each recipient email a share was sent to. | `/api/share` writes at runtime. | **0 rows**. |

No table contains mock/seed/placeholder data. All data is either CSV-imported or runtime-written.

---

## C. The Main Tier Data (the 9 wizard tier cards)

**Prisma model:** `Tier` (full fields above).

**Source file:** `scripts/template.csv` — 2341 lines (1 header + 2340 data rows).

**CSV columns:**
```
city,state,slug,market_type,peak_season_start,peak_season_end,llm_context,
category,tier_order,tier_name,pricing_type,
price_low_peak,price_high_peak,price_low_off_peak,price_high_off_peak,blurb
```
The `llm_context` column is parsed but **intentionally ignored** by the importer (line ~26 of `scripts/import-db.ts`).

**Import path:** `scripts/import-db.ts` (the only writer to `Tier`). Run as `npm run db:import scripts/template.csv` (defined in `package.json`).

**How the importer maps CSV → DB:**
- Groups rows by `slug` to build a Destination, then inserts each tier row.
- Display-name → slug for `category` (e.g., `"Bar & Beverages"` → `"bar"`) via the `CATEGORY_SLUGS` map in `import-db.ts`.
- Month-name → integer for peak season via `MONTH_NUMBERS`.
- Validates `pricing_type` is `"flat"` or `"per_head"`; non-negative prices; positive integer tier_order. Any failed row skips the entire destination.

**Current distribution in DB:**
- venue: 468 rows (9 tiers × 52 cities)
- photography / music / florals / catering: 260 each (5 tiers × 52)
- stationery / planner / bar / attire: 208 each (4 tiers × 52)

---

## D. The TierExample Data ("Help us narrow this down" popup)

**Prisma model:** `TierExample` (full fields above).

**Source file:** `scripts/tier_examples.csv`.

**CSV columns:**
```
city_slug,category,tier_order,example_label,price_peak,price_off_peak,display_order
```

**Import path:** Same script (`scripts/import-db.ts`). After main `Destination`/`Tier` insert, the importer:
1. Builds an in-memory map `tierIdMap: Map<"slug:category:tierOrder", tierId>` as it inserts Tier rows.
2. Reads `tier_examples.csv` lines and looks up the parent `tierId` via `(city_slug, category-lowercased-and-slug-mapped, tier_order)`.
3. Inserts `TierExample` rows with the resolved `tierId`.
4. Wraps everything in a single DB transaction; cascade-delete on `tierId` is declared in the schema.

**The relation key linking an example to its parent tier:**
`TierExample.tierId → Tier.id` (declared `@relation(fields: [tierId], references: [id], onDelete: Cascade)`).
The CSV has no `tier_id` column — the link is resolved at import time via the `(city_slug, category, tier_order)` triple.

---

## E. Per-Person Categories (Catering & Bar & Beverages)

**Where their main tier data lives:** Exactly the same as every other category — rows in the **`Tier` table**, with `pricingType = "per_head"` and price columns holding **per-person amounts** (e.g., catering T1 in San Francisco = `$140–$220 per head`). Nothing is hardcoded.

**Where their popup data lives:** **Nowhere.** Confirmed by direct DB query — `SELECT COUNT(*) FROM TierExample e JOIN Tier t ON e.tierId = t.id WHERE t.category IN ('catering','bar','attire','planner','stationery')` returns **0**.

**Popup coverage by category in DB (TierExample rows):**
| Category | Rows |
|---|---|
| venue | 453 |
| florals | 228 |
| music | 114 |
| photography | 33 |
| catering | 0 |
| bar | 0 |
| attire | 0 |
| planner | 0 |
| stationery | 0 |

So catering and bar each have full **per-person tier ranges** in `Tier` (5 and 4 tiers respectively per city), but **zero example/popup rows**. The popup never fires for these two categories because `CategoryStep.tierNeedsExample` requires `tier.examples.length > 0`.

**Anomaly:** Two `bar` rows have `pricingType = "flat"` instead of `"per_head"`: New Orleans T3 "Beer & Wine Only" and Savannah T4 "Dry Wedding". This means in those two cities the bar price would be charged as a flat amount rather than scaled by guest count. Likely a CSV data-entry error.

---

## F. All 9 Categories — Data Source and Popup Status

| # | Wizard step | `Tier` rows feed list? | Has popup? | Popup data source |
|---|---|---|---|---|
| 1 | Venue | Yes (468 rows, 9 tiers) | Yes, 42 of 52 cities | `TierExample` (453 rows) |
| 2 | Catering | Yes (260, 5 tiers, per_head) | **No** | None |
| 3 | Bar & Beverages | Yes (208, 4 tiers, per_head — 2 mislabeled flat) | **No** | None |
| 4 | Photography & Video | Yes (260, 5 tiers) | Yes, ~6 cities (Aspen-Vail, Key West, Lake Tahoe, Maui, Napa-Sonoma, Sedona) | `TierExample` (33 rows) |
| 5 | Florals & Decor | Yes (260, 5 tiers) | Yes, ~32 cities | `TierExample` (228 rows) |
| 6 | Music & Entertainment | Yes (260, 5 tiers) | Yes, ~21 cities | `TierExample` (114 rows) |
| 7 | Wedding Planner | Yes (208, 4 tiers) | **No** | None |
| 8 | Attire & Beauty | Yes (208, 4 tiers) | **No** | None |
| 9 | Stationery & Invitations | Yes (208, 4 tiers) | **No** | None |

Cities still missing **venue** popup data (10): boulder, cape-cod, honolulu, indianapolis, kansas-city, nantucket, pittsburgh, raleigh-durham, santa-fe, telluride. These are the 10 cities most recently added by `template.csv`; their TierExample rows were never written.

The popup is also gated client-side by **spread > $5,000** (`CategoryStep.tsx` line 55: `getTierSpread(tier) > 5_000`), so even when examples exist a narrow tier won't trigger it.

---

## G. The Estimate Engine

**Location:** `src/lib/calculations.ts` — `calculateEstimate()` (function declared lines 58–96).

**Where it runs:** Client-side. Called from `src/app/result/page.tsx` line 36:
```ts
setResult(calculateEstimate(state.wedding));
```
There is no server-side computation; the server only **stores** the already-computed `WeddingEstimateResult` as JSON in the `Report` table (`/api/report` POST handler).

**The exact combination function:**
```ts
// src/lib/calculations.ts:36-51
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
```

```ts
// src/lib/calculations.ts:58-96
export function calculateEstimate(wedding: WeddingSelection): WeddingEstimateResult {
  const categories: CategoryEstimate[] = [];
  for (const cat of CATEGORY_ORDER) {
    const tier = wedding.tiers[cat];
    if (!tier) continue;
    const examplePrice = wedding.tierExamples?.[cat];
    const { low, high } = examplePrice !== undefined
      ? { low: examplePrice, high: examplePrice }     // popup collapses range to point
      : calculateCategoryTotal(tier, wedding.isPeak, wedding.guestMidpoint);
    categories.push({ category: cat, tierName: tier.tierName, blurb: tier.blurb,
      pricingType: tier.pricingType, totalLow: low, totalHigh: high });
  }
  const grandTotalLow  = categories.reduce((s, c) => s + c.totalLow,  0);
  const grandTotalHigh = categories.reduce((s, c) => s + c.totalHigh, 0);
  return { /* ... */, categories, grandTotalLow, grandTotalHigh,
    perGuestLow:  Math.round(grandTotalLow  / wedding.guestMidpoint),
    perGuestHigh: Math.round(grandTotalHigh / wedding.guestMidpoint),
  };
}
```

**Specifically how Venue and Catering/Bar are added together:**
There is no special-casing. Each category goes through the **same** `calculateCategoryTotal()`:
- **Venue** (`pricingType: "flat"`) → uses peak/off-peak low/high as-is.
- **Catering / Bar** (`pricingType: "per_head"`) → multiplies low/high by `guestMidpoint`.

Both produce a `{ low, high }` pair, and **all 9 category pairs are summed with a flat `reduce`**: `categories.reduce((s, c) => s + c.totalLow, 0)`. Venue's flat dollars and catering's scaled dollars are added with no weighting or transformation.

**Popup override:** If the user picked an example via the popup, `wedding.tierExamples[cat]` holds a single resolved price. That price **replaces the entire range** for that category (low = high = the picked example's `pricePeak` or `priceOffPeak`). This applies regardless of `pricingType`, which means a popup-selected example collapses to a flat total even if the underlying tier is per-head — there's no scale-by-guest re-multiplication on the example price.

---

## H. Guest Count

**How it's stored:** As a **string enum key** (`GuestBucket`) plus a **derived integer midpoint** (`guestMidpoint`). Neither min/max pair nor the human label is stored on `WeddingSelection`.

**Where it's defined** — `src/types/index.ts` lines 12–30:
```ts
export type GuestBucket =
  | "0to25" | "25to50" | "50to75" | "75to100"
  | "100to125" | "125to150" | "150to175" | "175to200"
  | "200to225" | "225to250" | "250to300" | "300plus";

export const GUEST_BUCKETS: { key: GuestBucket; label: string; midpoint: number }[] = [
  { key: "0to25",    label: "Up to 25 guests",   midpoint: 13  },
  { key: "25to50",   label: "25–50 guests",       midpoint: 38  },
  // … through:
  { key: "300plus",  label: "300+ guests",        midpoint: 350 },
];
```

**Where it's set** — `src/app/page.tsx` lines 49–66:
```ts
const midpoint = getGuestMidpoint(guestBucket as GuestBucket);
setWedding({
  // ...
  guestBucket:   guestBucket as GuestBucket,
  guestMidpoint: midpoint,
  tiers:         {},
});
```

**Where the estimate code reads it** — `src/lib/calculations.ts` line 67:
```ts
: calculateCategoryTotal(tier, wedding.isPeak, wedding.guestMidpoint);
```
and line 93–94:
```ts
perGuestLow:  Math.round(grandTotalLow  / wedding.guestMidpoint),
perGuestHigh: Math.round(grandTotalHigh / wedding.guestMidpoint),
```
`calculateCategoryTotal` then uses `guestMidpoint` only when `pricingType === "per_head"` (line 44).

The `guestBucket` key is also persisted onto `WeddingEstimateResult` so the share view can re-render the human label via `GUEST_BUCKETS.find(...)` (used in `ReportView.tsx` line 32).

---

## I. Inclusion Data

**Neither `Tier` nor `TierExample` stores anything about food/alcohol inclusion, F&B minimums, or guest count.**

The actual columns are:
- `Tier`: id, destinationId, category, tierName, tierOrder, pricingType, priceLowPeak, priceHighPeak, priceLowOffPeak, priceHighOffPeak, blurb.
- `TierExample`: id, tierId, exampleLabel, pricePeak, priceOffPeak, displayOrder, createdAt, updatedAt.

There is **no** F&B-minimum column, **no** what's-included flag, **no** per-tier guest-count cap, **no** required-caterer field. Such information, where present, is only embedded as free-form prose inside `Tier.blurb` (e.g., the Newport venue T1 blurb literally contains the string "$40,000 site + F&B minimum $55,000"). Nothing structured. The blurb is rendered to the user in `ReportView.tsx` but the estimate engine never parses it.

---

## J. Import & Migration Mechanics

**Import command:**
```
npm run db:import scripts/template.csv
```
which is defined in `package.json` line 10 as:
```
"db:import": "tsx scripts/import-db.ts"
```
The script wipes `TierExample`, then `Tier`, then `Destination` (in that order, inside a single transaction), resets `sqlite_sequence` for those three tables, then re-inserts everything. `tier_examples.csv` is auto-loaded from the same `scripts/` directory if present (no second argument needed).

**Migration mechanics:**
- `prisma.config.ts` declares `migrations.path = "prisma/migrations"`, but **`prisma/migrations` does not exist** in the project tree. `ls prisma/` shows only `dev.db` and `schema.prisma`.
- Schema changes are applied via `npx prisma db push` (used historically, not via migrations).
- Prisma 7 setup uses `@prisma/adapter-better-sqlite3`; `DATABASE_URL` in `.env` = `file:./prisma/dev.db`; `prisma.config.ts` reads it via `process.env["DATABASE_URL"]`.
- After schema changes the dev server must be restarted (the Prisma client is cached in the Node process's module memory — observed and confirmed during current development).

**Generation:** `npx prisma generate` writes the client to `node_modules/.prisma/client/` and re-exports via `node_modules/@prisma/client/`. There is no migration history file to roll back through.

---

## Disagreements / Ambiguities Worth Flagging

1. **`api/destinations` city order** hard-codes only 20 cities (lines 7–12), but the DB has **52**. The remaining 32 fall back to alphabetical at the end of the dropdown. The list code calls itself "canonical display order for the 20 wedding cities" — the comment is stale.

2. **2 bar tier rows are mislabeled `"flat"` instead of `"per_head"`** (New Orleans T3 "Beer & Wine Only", Savannah T4 "Dry Wedding"). For those two combos, the estimate engine will charge a flat $25–$42 / $5–$12 instead of multiplying by guest count. Likely a CSV typo.

3. **The TierExample modal collapses any selected example to a flat total**, but for `per_head` tiers this conflicts with the rest of the engine, which scales by guest count. In practice this never triggers because no `per_head` category currently has TierExample rows — but if catering/bar examples were added, the price would *not* re-scale to guest count automatically. This is a latent inconsistency, not a current bug.

4. **`prisma.config.ts` references `prisma/migrations`** but that directory doesn't exist. Schema changes have been applied via `db push`, not migrations. Anyone running `prisma migrate` for the first time would be on a blank slate.

5. **No automated tests anywhere** in the project tree (no `*.test.ts`, `*.spec.ts`, or `__tests__/`).
