/**
 * scripts/import-db.ts
 *
 * Completely replaces Destination + Tier data from a CSV file.
 *
 * Usage:
 *   npx tsx scripts/import-db.ts <path-to-csv>
 *
 * Example:
 *   npx tsx scripts/import-db.ts scripts/template.csv
 *
 * CSV columns (first row must be the header):
 *   city, state, slug, market_type, peak_season_start, peak_season_end,
 *   llm_context (ignored), category, tier_order, tier_name, pricing_type,
 *   price_low_peak, price_high_peak, price_low_off_peak, price_high_off_peak, blurb
 *
 * Rules:
 *   - One row = one tier. Destination fields repeat on every row for that destination.
 *   - Rows are grouped by slug.
 *   - If any required field is missing/invalid for a row, the entire destination is
 *     skipped and a warning is printed.
 *   - peak_season_start / peak_season_end must be full month names (e.g., "April").
 *   - pricing_type must be "flat" or "per_head".
 *   - price_* fields must be non-negative numbers.
 *   - tier_order must be a positive integer.
 *   - llm_context column is present in the CSV but intentionally ignored.
 */

import Database from "better-sqlite3";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Path resolution ──────────────────────────────────────────────────────────

const __filename2 =
  typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
const DB_PATH = path.join(__dirname2, "..", "prisma", "dev.db");

// ── Month name → number ──────────────────────────────────────────────────────

const MONTH_NUMBERS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function parseMonth(s: string): number | null {
  const n = MONTH_NUMBERS[s.trim().toLowerCase()];
  return n ?? null;
}

// ── Category slug mapping ────────────────────────────────────────────────────

const CATEGORY_SLUGS: Record<string, string> = {
  "venue": "venue",
  "catering": "catering",
  "bar & beverages": "bar",
  "photography & video": "photography",
  "florals & decor": "florals",
  "music & entertainment": "music",
  "wedding planner": "planner",
  "attire & beauty": "attire",
  "stationery & invitations": "stationery",
};

const VALID_PRICING_TYPES = new Set(["flat", "per_head"]);

// ── TierExample CSV types ────────────────────────────────────────────────────

interface ExampleCsvRow {
  city_slug: string;
  category: string;
  tier_order: string;
  example_label: string;
  price_peak: string;
  price_off_peak: string;
  display_order: string;
}

interface ExampleRow {
  citySlug: string;
  category: string;
  tierOrder: number;
  exampleLabel: string;
  pricePeak: number;
  priceOffPeak: number;
  displayOrder: number;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CsvRow {
  city: string;
  state: string;
  slug: string;
  market_type: string;
  peak_season_start: string;
  peak_season_end: string;
  llm_context: string; // present in CSV, intentionally ignored
  category: string;
  tier_order: string;
  tier_name: string;
  pricing_type: string;
  price_low_peak: string;
  price_high_peak: string;
  price_low_off_peak: string;
  price_high_off_peak: string;
  blurb: string;
}

interface TierRow {
  category: string;
  tierOrder: number;
  tierName: string;
  pricingType: string;
  priceLowPeak: number;
  priceHighPeak: number;
  priceLowOffPeak: number;
  priceHighOffPeak: number;
  blurb: string;
}

interface DestGroup {
  city: string;
  state: string;
  slug: string;
  marketType: string;
  peakSeasonStart: number;
  peakSeasonEnd: number;
  tiers: TierRow[];
  rowNumbers: number[];
}

// ── Validation helpers ───────────────────────────────────────────────────────

const REQUIRED_DEST_FIELDS: (keyof CsvRow)[] = [
  "city", "state", "slug", "peak_season_start", "peak_season_end",
];

const REQUIRED_TIER_FIELDS: (keyof CsvRow)[] = [
  "category", "tier_order", "tier_name", "pricing_type",
  "price_low_peak", "price_high_peak", "price_low_off_peak", "price_high_off_peak",
  "blurb",
];

function parsePrice(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) || n < 0 ? null : n;
}

function parseTierOrder(s: string): number | null {
  const n = parseInt(s, 10);
  return isNaN(n) || n < 1 ? null : n;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const [, , csvArg] = process.argv;

  if (!csvArg) {
    console.error("Usage: npx tsx scripts/import-db.ts <path-to-csv>");
    process.exit(1);
  }

  const csvPath = path.resolve(process.cwd(), csvArg);
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  // ── Parse CSV ──────────────────────────────────────────────────────────────

  const raw = fs.readFileSync(csvPath, "utf-8");
  let rows: CsvRow[];
  try {
    rows = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as CsvRow[];
  } catch (err) {
    console.error("CSV parse error:", err);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.error("CSV is empty (no data rows).");
    process.exit(1);
  }

  console.log(`Parsed ${rows.length} data rows from ${path.basename(csvPath)}`);

  // ── Group rows by slug ─────────────────────────────────────────────────────

  const groups = new Map<string, DestGroup>();
  const slugErrors = new Set<string>();
  let totalWarnings = 0;

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const slug = (row.slug ?? "").trim();

    if (slugErrors.has(slug)) return;

    // Validate destination-level fields
    const missingDest = REQUIRED_DEST_FIELDS.filter((f) => !(row[f] ?? "").trim());
    if (missingDest.length > 0) {
      console.warn(
        `⚠  Row ${rowNum}: missing required destination field(s): ${missingDest.join(", ")}. ` +
          `Skipping "${slug || "(no slug)"}".`,
      );
      slugErrors.add(slug);
      totalWarnings++;
      return;
    }

    const peakStart = parseMonth(row.peak_season_start);
    if (peakStart === null) {
      console.warn(
        `⚠  Row ${rowNum} (${slug}): peak_season_start "${row.peak_season_start}" is not a valid month name. ` +
          `Skipping destination.`,
      );
      slugErrors.add(slug);
      totalWarnings++;
      return;
    }

    const peakEnd = parseMonth(row.peak_season_end);
    if (peakEnd === null) {
      console.warn(
        `⚠  Row ${rowNum} (${slug}): peak_season_end "${row.peak_season_end}" is not a valid month name. ` +
          `Skipping destination.`,
      );
      slugErrors.add(slug);
      totalWarnings++;
      return;
    }

    // Validate tier-level fields
    const missingTier = REQUIRED_TIER_FIELDS.filter((f) => !(row[f] ?? "").trim());
    if (missingTier.length > 0) {
      console.warn(
        `⚠  Row ${rowNum} (${slug}): missing required tier field(s): ${missingTier.join(", ")}. ` +
          `Skipping destination.`,
      );
      slugErrors.add(slug);
      totalWarnings++;
      return;
    }

    const categoryRaw = row.category.trim().toLowerCase();
    const categorySlug = CATEGORY_SLUGS[categoryRaw];
    if (!categorySlug) {
      console.warn(
        `⚠  Row ${rowNum} (${slug}): unrecognised category "${row.category}". ` +
          `Valid categories: ${Object.keys(CATEGORY_SLUGS).join(", ")}. Skipping destination.`,
      );
      slugErrors.add(slug);
      totalWarnings++;
      return;
    }

    const pricingTypeRaw = row.pricing_type.trim().toLowerCase();
    if (!VALID_PRICING_TYPES.has(pricingTypeRaw)) {
      console.warn(
        `⚠  Row ${rowNum} (${slug}): pricing_type "${row.pricing_type}" must be "flat" or "per_head". ` +
          `Skipping destination.`,
      );
      slugErrors.add(slug);
      totalWarnings++;
      return;
    }

    const tierOrder = parseTierOrder(row.tier_order);
    if (tierOrder === null) {
      console.warn(
        `⚠  Row ${rowNum} (${slug}): tier_order "${row.tier_order}" is not a positive integer. ` +
          `Skipping destination.`,
      );
      slugErrors.add(slug);
      totalWarnings++;
      return;
    }

    const priceLowPeak = parsePrice(row.price_low_peak);
    const priceHighPeak = parsePrice(row.price_high_peak);
    const priceLowOffPeak = parsePrice(row.price_low_off_peak);
    const priceHighOffPeak = parsePrice(row.price_high_off_peak);

    if (
      priceLowPeak === null || priceHighPeak === null ||
      priceLowOffPeak === null || priceHighOffPeak === null
    ) {
      console.warn(
        `⚠  Row ${rowNum} (${slug}): one or more price fields are invalid. ` +
          `Skipping destination.`,
      );
      slugErrors.add(slug);
      totalWarnings++;
      return;
    }

    // Accumulate into group
    if (!groups.has(slug)) {
      groups.set(slug, {
        city: row.city.trim(),
        state: row.state.trim(),
        slug,
        marketType: (row.market_type ?? "").trim(),
        peakSeasonStart: peakStart,
        peakSeasonEnd: peakEnd,
        tiers: [],
        rowNumbers: [],
      });
    }

    const group = groups.get(slug)!;
    group.rowNumbers.push(rowNum);

    group.tiers.push({
      category: categorySlug,
      tierOrder,
      tierName: row.tier_name.trim(),
      pricingType: pricingTypeRaw,
      priceLowPeak,
      priceHighPeak,
      priceLowOffPeak,
      priceHighOffPeak,
      blurb: row.blurb.trim(),
    });
  });

  // Remove any groups whose slug was flagged after initial insertion
  for (const slug of slugErrors) {
    groups.delete(slug);
  }

  const validGroups = [...groups.values()];

  if (validGroups.length === 0) {
    console.error("No valid destinations to import. Aborting.");
    process.exit(1);
  }

  const totalTiers = validGroups.reduce((s, g) => s + g.tiers.length, 0);
  console.log(
    `\nReady to import: ${validGroups.length} destination(s), ${totalTiers} tier(s)`,
  );
  if (totalWarnings > 0) {
    console.log(`Warnings: ${totalWarnings} row(s) skipped`);
  }
  console.log("");

  // ── Parse tier_examples.csv ────────────────────────────────────────────────

  const examplesPath = path.join(__dirname2, "tier_examples.csv");
  const exampleRows: ExampleRow[] = [];

  if (fs.existsSync(examplesPath)) {
    const rawEx = fs.readFileSync(examplesPath, "utf-8");
    let exRows: ExampleCsvRow[];
    try {
      exRows = parse(rawEx, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      }) as ExampleCsvRow[];
    } catch (err) {
      console.warn("⚠  Could not parse tier_examples.csv:", err);
      exRows = [];
    }

    const validSlugs = new Set(validGroups.map((g) => g.slug));

    for (const row of exRows) {
      const citySlug = (row.city_slug ?? "").trim();
      if (!validSlugs.has(citySlug)) continue; // skip cities not in main import

      const categoryRaw = (row.category ?? "").trim().toLowerCase();
      const categorySlug = CATEGORY_SLUGS[categoryRaw] ?? categoryRaw;

      const tierOrder = parseTierOrder(row.tier_order);
      if (tierOrder === null) continue;

      const pricePeak = parsePrice(row.price_peak);
      const priceOffPeak = parsePrice(row.price_off_peak);
      const displayOrder = parseTierOrder(row.display_order);
      if (pricePeak === null || priceOffPeak === null || displayOrder === null) continue;

      const exampleLabel = (row.example_label ?? "").trim();
      if (!exampleLabel) continue;

      exampleRows.push({ citySlug, category: categorySlug, tierOrder, exampleLabel, pricePeak, priceOffPeak, displayOrder });
    }

    console.log(`Parsed ${exampleRows.length} tier example row(s) from tier_examples.csv\n`);
  } else {
    console.log("No tier_examples.csv found — skipping examples import.\n");
  }

  // ── Open DB and replace data in a transaction ──────────────────────────────

  const db = new Database(DB_PATH);
  console.log(`Database: ${DB_PATH}`);

  const insertDest = db.prepare(`
    INSERT INTO "Destination"
      (city, state, slug, "marketType", "peakSeasonStart", "peakSeasonEnd")
    VALUES
      (@city, @state, @slug, @marketType, @peakSeasonStart, @peakSeasonEnd)
  `);

  const insertTier = db.prepare(`
    INSERT INTO "Tier"
      ("destinationId", category, "tierName", "tierOrder", "pricingType",
       "priceLowPeak", "priceHighPeak", "priceLowOffPeak", "priceHighOffPeak", blurb)
    VALUES
      (@destinationId, @category, @tierName, @tierOrder, @pricingType,
       @priceLowPeak, @priceHighPeak, @priceLowOffPeak, @priceHighOffPeak, @blurb)
  `);

  const insertExample = db.prepare(`
    INSERT INTO "TierExample"
      ("tierId", "exampleLabel", "pricePeak", "priceOffPeak", "displayOrder", "createdAt", "updatedAt")
    VALUES
      (@tierId, @exampleLabel, @pricePeak, @priceOffPeak, @displayOrder, @createdAt, @updatedAt)
  `);

  const runImport = db.transaction(() => {
    db.prepare('DELETE FROM "TierExample"').run();
    const tierDel = db.prepare('DELETE FROM "Tier"').run();
    const destDel = db.prepare('DELETE FROM "Destination"').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('TierExample', 'Tier', 'Destination')").run();
    console.log(
      `Cleared ${destDel.changes} destination(s) and ${tierDel.changes} tier(s) from DB`,
    );

    // track (slug:category:tierOrder) → tierId for examples
    const tierIdMap = new Map<string, number>();

    for (const group of validGroups) {
      const destResult = insertDest.run({
        city: group.city,
        state: group.state,
        slug: group.slug,
        marketType: group.marketType,
        peakSeasonStart: group.peakSeasonStart,
        peakSeasonEnd: group.peakSeasonEnd,
      });

      const destinationId = destResult.lastInsertRowid;

      for (const t of group.tiers) {
        const tierResult = insertTier.run({
          destinationId,
          category: t.category,
          tierName: t.tierName,
          tierOrder: t.tierOrder,
          pricingType: t.pricingType,
          priceLowPeak: t.priceLowPeak,
          priceHighPeak: t.priceHighPeak,
          priceLowOffPeak: t.priceLowOffPeak,
          priceHighOffPeak: t.priceHighOffPeak,
          blurb: t.blurb,
        });
        tierIdMap.set(`${group.slug}:${t.category}:${t.tierOrder}`, Number(tierResult.lastInsertRowid));
      }

      console.log(`  ✓ ${group.city}, ${group.state} (${group.slug}) — ${group.tiers.length} tiers`);
    }

    // Insert tier examples
    if (exampleRows.length > 0) {
      const now = new Date().toISOString();
      let examplesInserted = 0;
      let examplesSkipped = 0;
      for (const ex of exampleRows) {
        const tierId = tierIdMap.get(`${ex.citySlug}:${ex.category}:${ex.tierOrder}`);
        if (!tierId) { examplesSkipped++; continue; }
        insertExample.run({
          tierId,
          exampleLabel: ex.exampleLabel,
          pricePeak: ex.pricePeak,
          priceOffPeak: ex.priceOffPeak,
          displayOrder: ex.displayOrder,
          createdAt: now,
          updatedAt: now,
        });
        examplesInserted++;
      }
      console.log(`\n  Examples: ${examplesInserted} inserted, ${examplesSkipped} skipped (tier not found)`);
    }
  });

  try {
    runImport();
    console.log(`\n✅ Import complete: ${validGroups.length} destinations imported.`);
  } catch (err) {
    console.error("\n❌ Import failed (transaction rolled back):", err);
    db.close();
    process.exit(1);
  }

  db.close();
}

main();
