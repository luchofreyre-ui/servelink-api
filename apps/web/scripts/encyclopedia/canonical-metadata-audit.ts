/**
 * Verify migrated legacy paths resolve to encyclopedia URLs in metadata helpers.
 * Run from apps/web: npm run plan:encyclopedia-canonical-metadata-audit
 *
 * Options: --json
 */
import {
  buildCanonicalMetadataAudit,
  summarizeCanonicalMetadataAudit,
} from "../../src/lib/encyclopedia/canonicalMetadataAudit";

const asJson = process.argv.includes("--json");
const rows = buildCanonicalMetadataAudit();
const summary = summarizeCanonicalMetadataAudit(rows);

if (asJson) {
  console.log(JSON.stringify({ summary, rows }, null, 2));
  process.exit(summary.needsUpdate > 0 ? 1 : 0);
}

console.log("Encyclopedia canonical metadata audit (pipeline migrations)");
console.log(JSON.stringify(summary, null, 2));
if (rows.length === 0) {
  console.log("\nNo redirect rows loaded.");
} else {
  const bad = rows.filter((r) => r.status === "needs_update");
  if (bad.length === 0) {
    console.log("\nAll checks passed.");
  } else {
    console.log("\nNeeds update:");
    for (const r of bad) {
      console.log(`- [${r.sourceArea}] ${r.legacyPath} → expected ${r.preferredPath}`);
    }
  }
}

process.exit(summary.needsUpdate > 0 ? 1 : 0);
