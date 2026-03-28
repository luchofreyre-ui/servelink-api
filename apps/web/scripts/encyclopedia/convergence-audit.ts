/**
 * Compare pipeline encyclopedia vs legacy authority URLs (read-only audit).
 * Run from apps/web: npm run audit:encyclopedia-convergence
 *
 * Options:
 *   --json    Emit one JSON object (summary + sampleRows + policy) to stdout
 *   --verbose Include all rows in JSON output (can be large)
 */
import {
  ENCYCLOPEDIA_GROWTH_RULES,
  PIPELINE_ENCYCLOPEDIA_CONTENT_ROOT,
  PIPELINE_ENCYCLOPEDIA_INDEX_FILE,
} from "../../src/lib/encyclopedia/convergenceGuardrails";
import {
  LEGACY_TAXONOMY_EXPANSION_FROZEN,
  PIPELINE_FIRST_ENCYCLOPEDIA_CATEGORIES,
} from "../../src/lib/encyclopedia/convergenceOwnershipPolicy";
import {
  getConvergenceAuditRows,
  summarizeConvergenceAudit,
} from "../../src/lib/encyclopedia/convergenceAudit";

const wantJson = process.argv.includes("--json");
const verbose = process.argv.includes("--verbose");

const rows = getConvergenceAuditRows();
const summary = summarizeConvergenceAudit(rows);

const bridgeRows = rows.filter((r) => r.treatment === "bridge_to_pipeline");
const redirectRows = rows.filter(
  (r) => r.treatment === "candidate_redirect_later",
);
const conflictRows = rows.filter((r) => r.overlapType === "conflict");

const policySnapshot = {
  pipelineFirstCategories: [...PIPELINE_FIRST_ENCYCLOPEDIA_CATEGORIES],
  legacyTaxonomyExpansionFrozen: { ...LEGACY_TAXONOMY_EXPANSION_FROZEN },
  pipelineContentRoot: PIPELINE_ENCYCLOPEDIA_CONTENT_ROOT,
  pipelineIndexFile: PIPELINE_ENCYCLOPEDIA_INDEX_FILE,
  growthRules: [...ENCYCLOPEDIA_GROWTH_RULES],
};

if (wantJson) {
  const out = {
    summary,
    policy: policySnapshot,
    samples: {
      bridgeToPipeline: bridgeRows.slice(0, 40),
      candidateRedirectLater: redirectRows.slice(0, 40),
      conflicts: conflictRows.slice(0, 40),
    },
    ...(verbose ? { rows } : {}),
  };
  // eslint-disable-next-line no-console -- CLI script
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

// eslint-disable-next-line no-console -- CLI script
console.log(`
Encyclopedia ↔ authority convergence audit (read-only)
=======================================================

Counts
------
Total topic keys:           ${summary.totalRows}
Pipeline-only:              ${summary.pipelineOnlyCount}
Legacy-only:                ${summary.legacyOnlyCount}
Exact overlap (slug+kind):  ${summary.byOverlap.exact}
Near overlap (titles):      ${summary.byOverlap.near}
Conflicts (titles diverge): ${summary.byOverlap.conflict}
Review rows (owner):        ${summary.reviewRowsCount}

Treatment plan (no redirects applied in this phase)
---------------------------------------------------
bridge_to_pipeline:         ${summary.bridgeToPipelineCandidates}
candidate_redirect_later:   ${summary.candidateRedirectLaterCount}
keep_for_now (+ pipeline-only): see per-row treatment in JSON (--json)

Ownership policy snapshot
-------------------------
Pipeline-first categories: ${PIPELINE_FIRST_ENCYCLOPEDIA_CATEGORIES.join(", ")}
Frozen legacy expansion:   ${Object.entries(LEGACY_TAXONOMY_EXPANSION_FROZEN)
  .filter(([, v]) => v)
  .map(([k]) => k)
  .join(", ")}

Guardrails
----------
Content root:  ${PIPELINE_ENCYCLOPEDIA_CONTENT_ROOT}
Index file:    ${PIPELINE_ENCYCLOPEDIA_INDEX_FILE}
`);

// eslint-disable-next-line no-console -- CLI script
console.log("Sample: bridge_to_pipeline (up to 15)");
// eslint-disable-next-line no-console -- CLI script
console.log(
  bridgeRows
    .slice(0, 15)
    .map(
      (r) =>
        `  ${r.topicKey}\n    pipeline: ${r.pipelineHref ?? "—"} | legacy: ${r.legacyHref ?? "—"}`,
    )
    .join("\n") || "  (none)",
);

// eslint-disable-next-line no-console -- CLI script
console.log("\nSample: candidate_redirect_later (up to 15)");
// eslint-disable-next-line no-console -- CLI script
console.log(
  redirectRows
    .slice(0, 15)
    .map(
      (r) =>
        `  ${r.topicKey}\n    pipeline: ${r.pipelineHref} | legacy: ${r.legacyHref}`,
    )
    .join("\n") || "  (none)",
);

// eslint-disable-next-line no-console -- CLI script
console.log("\nSample: conflicts / review (up to 15)");
// eslint-disable-next-line no-console -- CLI script
console.log(
  conflictRows
    .slice(0, 15)
    .map(
      (r) =>
        `  ${r.topicKey}\n    pipeline title: ${r.pipelineTitle}\n    legacy title:  ${r.legacyTitle}`,
    )
    .join("\n") || "  (none)",
);

// eslint-disable-next-line no-console -- CLI script
console.log(
  "\nFull machine-readable output: npm run audit:encyclopedia-convergence -- --json",
);
// eslint-disable-next-line no-console -- CLI script
console.log(
  "All rows: npm run audit:encyclopedia-convergence -- --json --verbose\n",
);
