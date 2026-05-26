/**
 * Data integrity check — exits non-zero on failure.
 *
 * Asserts, against the imported DB:
 *   1. Every Tier with category bar/catering has pricingType="per_head".
 *   2. Every Tier with category venue/photography/music/planner/attire/stationery/florals
 *      has pricingType="flat".
 *   3. No two TierExample rows share the same tierId+displayOrder.
 *   4. Every Tier that has any TierExample rows has at least 3 of them.
 *
 * Run: npm run test:data
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname2 = path.dirname(
  typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url),
);
const DB_PATH = path.join(__dirname2, "../prisma/dev.db");
const db = new Database(DB_PATH, { readonly: true });

// NOTE: florals is currently classified `flat` but is slated to move to `per_head`
// in a future schema pass. When that conversion lands, move "florals" from
// FLAT_CATEGORIES to PER_HEAD_CATEGORIES — this test will then verify it.
const PER_HEAD_CATEGORIES = ["bar", "catering"];
const FLAT_CATEGORIES = ["venue", "photography", "music", "planner", "attire", "stationery", "florals"];

const failures: string[] = [];

// ── 1. per_head categories ───────────────────────────────────────────────────
{
  const bad = db.prepare(`
    SELECT d.slug, t.category, t.tierOrder, t.tierName, t.pricingType
    FROM Tier t JOIN Destination d ON t.destinationId = d.id
    WHERE t.category IN (${PER_HEAD_CATEGORIES.map(() => "?").join(",")})
      AND t.pricingType != 'per_head'
  `).all(...PER_HEAD_CATEGORIES) as { slug: string; category: string; tierOrder: number; tierName: string; pricingType: string }[];
  for (const r of bad) {
    failures.push(
      `[per_head] ${r.slug}/${r.category}/T${r.tierOrder} "${r.tierName}" pricingType=${r.pricingType} (expected per_head)`,
    );
  }
}

// ── 2. flat categories ───────────────────────────────────────────────────────
{
  const bad = db.prepare(`
    SELECT d.slug, t.category, t.tierOrder, t.tierName, t.pricingType
    FROM Tier t JOIN Destination d ON t.destinationId = d.id
    WHERE t.category IN (${FLAT_CATEGORIES.map(() => "?").join(",")})
      AND t.pricingType != 'flat'
  `).all(...FLAT_CATEGORIES) as { slug: string; category: string; tierOrder: number; tierName: string; pricingType: string }[];
  for (const r of bad) {
    failures.push(
      `[flat] ${r.slug}/${r.category}/T${r.tierOrder} "${r.tierName}" pricingType=${r.pricingType} (expected flat)`,
    );
  }
}

// ── 3. no duplicate (tierId, displayOrder) ───────────────────────────────────
{
  const dups = db.prepare(`
    SELECT e.tierId, e.displayOrder, COUNT(*) as n,
           d.slug, t.category, t.tierOrder
    FROM TierExample e
    JOIN Tier t ON e.tierId = t.id
    JOIN Destination d ON t.destinationId = d.id
    GROUP BY e.tierId, e.displayOrder
    HAVING n > 1
  `).all() as { tierId: number; displayOrder: number; n: number; slug: string; category: string; tierOrder: number }[];
  for (const r of dups) {
    failures.push(
      `[dup-displayOrder] ${r.slug}/${r.category}/T${r.tierOrder} displayOrder=${r.displayOrder} appears ${r.n} times (tierId=${r.tierId})`,
    );
  }
}

// ── 4. tiers with examples must have >= 3 ────────────────────────────────────
{
  const short = db.prepare(`
    SELECT d.slug, t.category, t.tierOrder, t.tierName, COUNT(e.id) as n
    FROM Tier t
    JOIN Destination d ON t.destinationId = d.id
    JOIN TierExample e ON e.tierId = t.id
    GROUP BY t.id
    HAVING n < 3
  `).all() as { slug: string; category: string; tierOrder: number; tierName: string; n: number }[];
  for (const r of short) {
    failures.push(
      `[min-examples] ${r.slug}/${r.category}/T${r.tierOrder} "${r.tierName}" has ${r.n} example(s) (expected >= 3)`,
    );
  }
}

db.close();

if (failures.length === 0) {
  console.log("✅ Data integrity check passed.");
  process.exit(0);
} else {
  console.error(`❌ Data integrity check failed — ${failures.length} issue(s):`);
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
