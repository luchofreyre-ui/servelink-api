#!/usr/bin/env npx tsx
/**
 * npm run report:comparison-candidates
 *
 * Audits product comparison lattice: accepted/rejected counts, bridge volume, low-score warnings.
 */

import { buildProductComparisonLatticeAudit } from "../../src/authority/data/authorityProductComparisonLattice";

function topEntries(rec: Record<string, number>, n: number): [string, number][] {
  return Object.entries(rec)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

const audit = buildProductComparisonLatticeAudit();

const rejectReasons: Record<string, number> = {};
for (const r of audit.rejected) {
  const key = r.reason.split("(")[0] ?? r.reason;
  rejectReasons[key] = (rejectReasons[key] ?? 0) + 1;
}

console.log("=== Product comparison lattice ===");
console.log("Generated (accepted):", audit.accepted.length);
console.log("Rejected (total):", audit.rejected.length);
console.log("");
console.log("Reject reasons (grouped):");
for (const [k, v] of Object.entries(rejectReasons).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log("");
console.log("Top accepted bridges (by volume):");
for (const [id, n] of topEntries(audit.bridgeAcceptCounts, 5)) {
  console.log(`  ${id}: ${n}`);
}
console.log("");
console.log("Top rejected bridge tags (heuristic):");
for (const [id, n] of topEntries(audit.bridgeRejectCounts, 12)) {
  console.log(`  ${id}: ${n}`);
}
console.log("");
console.log("Suspicious accepted (score at threshold):");
for (const s of audit.suspiciousLowScore.slice(0, 15)) {
  console.log(`  ${s.slug} score=${s.score} bridge=${s.bridgeId} ${s.breakdown.join(" ")}`);
}
