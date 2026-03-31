/**
 * Find literal legacy paths still embedded in key authority/navigation files.
 * Run from apps/web: npm run plan:encyclopedia-canonical-audit
 *
 * Options: --json
 */
import {
  buildCanonicalCleanupAudit,
  summarizeCanonicalCleanupAudit,
} from "../../src/lib/encyclopedia/canonicalCleanupAudit";

const asJson = process.argv.includes("--json");
const rows = buildCanonicalCleanupAudit();
const summary = summarizeCanonicalCleanupAudit(rows);

if (asJson) {
  console.log(JSON.stringify({ summary, rows }, null, 2));
  process.exit(0);
}

console.log("Canonical cleanup audit (live redirect sources vs internal literals)");
console.log(JSON.stringify(summary, null, 2));
if (rows.length === 0) {
  console.log("\nNo literal legacy paths found in audited files.");
} else {
  console.log("");
  for (const r of rows) {
    console.log(`- [${r.status}] ${r.sourceArea}`);
    console.log(`    ${r.oldHref} → ${r.preferredHref}`);
  }
}
