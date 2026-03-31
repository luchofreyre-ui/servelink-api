import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { encyclopediaIndexEntrySchema } from "../../src/lib/encyclopedia/schema";
import {
  buildClusterGapBackfillPayload,
  type ClusterGapGuardRule,
} from "../../src/lib/encyclopedia/clusterGapBackfill";
import { loadEncyclopediaIndexEntriesForAnalysis } from "../../src/lib/encyclopedia/loadEncyclopediaIndexEntries";
import { loadMasterIndexLookup } from "../../src/lib/encyclopedia/masterIndexLookup";
import { GENERATION_EXPANSION_CONFIG } from "./lib/generation-expansion-config";
import { readJsonFile } from "./utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const MASTER = path.join(
  repoRoot,
  "src",
  "content",
  "encyclopedia",
  "_index",
  "master-index.json",
);

const OUT = path.join(
  repoRoot,
  "content-batches",
  "encyclopedia",
  "generated-gap-backfill-candidates.json",
);

function parseArgs(argv: string[]): { targetClusters?: string[]; outputPath: string } {
  const clustersArg = argv.find((a) => a.startsWith("--clusters="));
  const outputArg = argv.find((a) => a.startsWith("--output="));

  const targetClusters = clustersArg
    ? clustersArg
        .slice("--clusters=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  const outputPath = outputArg
    ? path.resolve(repoRoot, outputArg.slice("--output=".length).trim())
    : OUT;

  return { targetClusters, outputPath };
}

function main() {
  const { targetClusters, outputPath } = parseArgs(process.argv.slice(2));

  const raw = readJsonFile<unknown>(MASTER);
  if (!Array.isArray(raw)) {
    throw new Error("master-index.json must be an array.");
  }
  const existingSlugs = new Set(
    raw.map((row) => encyclopediaIndexEntrySchema.parse(row).slug),
  );
  const masterLookup = loadMasterIndexLookup(MASTER);

  const entries = loadEncyclopediaIndexEntriesForAnalysis();
  const guardRules = GENERATION_EXPANSION_CONFIG.guardRules.filter(
    (r): r is ClusterGapGuardRule =>
      r.appliesTo === "problem_surface" || r.appliesTo === "method_surface",
  );
  const payload = buildClusterGapBackfillPayload(
    entries,
    {
      problems: GENERATION_EXPANSION_CONFIG.problems,
      methods: GENERATION_EXPANSION_CONFIG.methods,
      surfaces: GENERATION_EXPANSION_CONFIG.surfaces,
    },
    existingSlugs,
    {
      guardRules,
      masterLookup,
      ...(targetClusters?.length ? { targetClusters } : {}),
    },
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("Gap backfill candidates");
  if (targetClusters?.length) {
    console.log(`  Cluster filter: ${targetClusters.join(", ")}`);
  }
  console.log(`  Suppressed (already in master index): ${payload.masterIndexSuppressedCount}`);
  console.log(`  Total new candidates: ${payload.totalCandidates}`);
  console.log(`  Clusters with output rows: ${payload.clusters.filter((c) => c.candidatesAdded > 0).length}`);
  console.log(`  Wrote: ${path.relative(repoRoot, outputPath)}`);
  console.log("");
  const top = [...payload.clusters]
    .filter((c) => c.candidatesAdded > 0)
    .slice(0, 8);
  for (const c of top) {
    console.log(
      `  ${c.clusterSlug} | ${c.status} | priority=${c.priority} | +${c.candidatesAdded}`,
    );
  }
}

main();
