# Archived migration scripts

These are **historical one-shot scripts** that were already executed against earlier versions of the DB. They are kept for reference only.

**Do not re-run them.** Both operate against assumptions about the data that no longer hold (tier counts, city counts), and re-running them against the current DB would corrupt the data.

| Script | What it did | When |
|---|---|---|
| `restructure-venues.ts` | Expanded venue tier count from 6 to 8 across 20 cities. | Earlier dev session |
| `split-top-tiers.ts` | Split the top tier of venue, photography, florals, and music into two tiers across 20 cities. | Earlier dev session |

Both have been superseded by the current `scripts/template.csv` content, which already reflects the post-migration state.
