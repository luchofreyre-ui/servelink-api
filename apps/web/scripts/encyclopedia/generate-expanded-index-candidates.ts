import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildExpandedIndexCandidates } from "./lib/build-expanded-index-candidates";
import type { ExpansionSourceFamily } from "./lib/generation-expansion-config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const DEFAULT_OUTPUT = path.join(
  repoRoot,
  "content-batches",
  "encyclopedia",
  "generated-expanded-index-candidates.json",
);

const VALID_FAMILIES = new Set<ExpansionSourceFamily>([
  "problem_surface",
  "method_surface",
  "problem_surface_severity",
  "method_surface_severity",
  "method_surface_tool",
  "question_why_problem_surface",
  "question_cause_problem_surface",
  "prevention_problem_surface",
  "maintenance_problem_surface",
  "avoid_problem_surface",
  "comparison_method_method",
  "comparison_problem_problem",
  "comparison_surface_surface",
  "question_symptom_cause",
  "question_prevention_troubleshooting",
]);

function parseArgs(argv: string[]): { outputPath: string; families?: ExpansionSourceFamily[] } {
  const outArg = argv.find((a) => a.startsWith("--output="));
  const famArg = argv.find((a) => a.startsWith("--families="));

  const outputPath = outArg
    ? path.resolve(repoRoot, outArg.slice("--output=".length).trim())
    : DEFAULT_OUTPUT;

  let families: ExpansionSourceFamily[] | undefined;
  if (famArg) {
    const raw = famArg.slice("--families=".length).trim();
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as ExpansionSourceFamily[];
    for (const p of parts) {
      if (!VALID_FAMILIES.has(p)) {
        throw new Error(
          `Invalid family "${p}". Expected one of: ${[...VALID_FAMILIES].sort().join(", ")}`,
        );
      }
    }
    families = parts;
  }

  return { outputPath, families };
}

function main() {
  const { outputPath, families } = parseArgs(process.argv.slice(2));

  const result = buildExpandedIndexCandidates({ families });

  const payload = {
    generatedAt: new Date().toISOString(),
    total: result.totalGenerated,
    excludedCount: result.excludedCount,
    flaggedCount: result.flaggedCount,
    countsByFamily: result.countsByFamily,
    candidates: result.candidates,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("Expanded encyclopedia index candidates");
  console.log(`  Total written: ${result.totalGenerated}`);
  console.log(`  Excluded (guard rules): ${result.excludedCount}`);
  console.log(`  Skipped (surface compatibility): ${result.compatibilityExcludedCount}`);
  console.log(`  Flagged (weak seeds kept): ${result.flaggedCount}`);
  console.log("  By family:");
  for (const key of (Object.keys(result.countsByFamily) as ExpansionSourceFamily[]).sort()) {
    console.log(`    ${key}: ${result.countsByFamily[key]}`);
  }
  console.log(`  Output: ${path.relative(repoRoot, outputPath)}`);
}

main();
