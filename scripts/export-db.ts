/**
 * scripts/export-db.ts
 *
 * Exports the current database state back to scripts/template.csv,
 * overwriting the file so the CSV and DB are in sync.
 *
 * Run: npx tsx scripts/export-db.ts
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename2 = typeof __filename !== "undefined"
  ? __filename
  : fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const DB_PATH  = path.join(__dirname2, "../prisma/dev.db");
const CSV_PATH = path.join(__dirname2, "template.csv");

const MONTH_NAMES: Record<number, string> = {
  1: "January", 2: "February", 3: "March",    4: "April",
  5: "May",     6: "June",     7: "July",      8: "August",
  9: "September", 10: "October", 11: "November", 12: "December",
};

const CATEGORY_DISPLAY: Record<string, string> = {
  venue:       "Venue",
  catering:    "Catering",
  bar:         "Bar & Beverages",
  photography: "Photography & Video",
  florals:     "Florals & Decor",
  music:       "Music & Entertainment",
  planner:     "Wedding Planner",
  attire:      "Attire & Beauty",
  stationery:  "Stationery & Invitations",
};

function csvField(value: string | number): string {
  const s = String(value);
  // Wrap in quotes if it contains comma, double-quote, or newline
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const db = new Database(DB_PATH);

const destinations = db.prepare(`
  SELECT id, city, state, slug, marketType, peakSeasonStart, peakSeasonEnd
  FROM Destination
  ORDER BY city
`).all() as {
  id: number; city: string; state: string; slug: string;
  marketType: string; peakSeasonStart: number; peakSeasonEnd: number;
}[];

const getTiers = db.prepare(`
  SELECT category, tierOrder, tierName, pricingType,
         priceLowPeak, priceHighPeak, priceLowOffPeak, priceHighOffPeak, blurb,
         foodModel, alcoholModel, foodMinimum, alcoholMinimum, minimumIsCombined
  FROM Tier
  WHERE destinationId = ?
  ORDER BY category, tierOrder
`);

const HEADER = "city,state,slug,market_type,peak_season_start,peak_season_end,llm_context,category,tier_order,tier_name,pricing_type,price_low_peak,price_high_peak,price_low_off_peak,price_high_off_peak,blurb,foodModel,alcoholModel,foodMinimum,alcoholMinimum,minimumIsCombined";

const lines: string[] = [HEADER];

// null/undefined → "" (round-trips back to null on import)
function csvOptionalNumber(v: number | null): string {
  return v === null || v === undefined ? "" : csvField(v);
}

for (const dest of destinations) {
  const tiers = getTiers.all(dest.id) as {
    category: string; tierOrder: number; tierName: string; pricingType: string;
    priceLowPeak: number; priceHighPeak: number;
    priceLowOffPeak: number; priceHighOffPeak: number; blurb: string;
    foodModel: string; alcoholModel: string;
    foodMinimum: number | null; alcoholMinimum: number | null;
    minimumIsCombined: number;  // SQLite stores boolean as 0/1
  }[];

  for (const tier of tiers) {
    const row = [
      csvField(dest.city),
      csvField(dest.state),
      csvField(dest.slug),
      csvField(dest.marketType),
      csvField(MONTH_NAMES[dest.peakSeasonStart] ?? dest.peakSeasonStart),
      csvField(MONTH_NAMES[dest.peakSeasonEnd]   ?? dest.peakSeasonEnd),
      "",  // llm_context — intentionally blank
      csvField(CATEGORY_DISPLAY[tier.category] ?? tier.category),
      csvField(tier.tierOrder),
      csvField(tier.tierName),
      csvField(tier.pricingType),
      csvField(tier.priceLowPeak),
      csvField(tier.priceHighPeak),
      csvField(tier.priceLowOffPeak),
      csvField(tier.priceHighOffPeak),
      csvField(tier.blurb),
      csvField(tier.foodModel),
      csvField(tier.alcoholModel),
      csvOptionalNumber(tier.foodMinimum),
      csvOptionalNumber(tier.alcoholMinimum),
      csvField(tier.minimumIsCombined ? "true" : "false"),
    ].join(",");
    lines.push(row);
  }
}

fs.writeFileSync(CSV_PATH, lines.join("\n"), "utf-8");
db.close();

console.log(`✅ Exported ${lines.length - 1} tier rows to ${CSV_PATH}`);
