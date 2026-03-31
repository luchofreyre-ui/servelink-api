import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildClusterDensityReport } from "../../src/lib/encyclopedia/clusterDensity";
import { loadEncyclopediaIndexEntriesForAnalysis } from "../../src/lib/encyclopedia/loadEncyclopediaIndexEntries";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const OUT = path.join(
  repoRoot,
  "content-batches",
  "encyclopedia",
  "reports",
  "cluster-density-report.json",
);

function main() {
  const entries = loadEncyclopediaIndexEntriesForAnalysis();
  const report = buildClusterDensityReport(entries, new Date().toISOString());

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const thin = report.rows.filter((r) => r.status === "thin").length;
  const dev = report.rows.filter((r) => r.status === "developing").length;
  const dense = report.rows.filter((r) => r.status === "dense").length;

  console.log("Encyclopedia cluster density report");
  console.log(`  Corpus: ${entries.length} published file-backed pages`);
  console.log(`  Clusters: ${report.totalClusters}`);
  console.log(`  Status mix — thin: ${thin}, developing: ${dev}, dense: ${dense}`);
  console.log(`  Wrote: ${path.relative(repoRoot, OUT)}`);
  console.log("");
  console.log("Top clusters by page count:");
  const sorted = [...report.rows].sort((a, b) => b.counts.total - a.counts.total).slice(0, 12);
  for (const row of sorted) {
    console.log(
      `  ${row.clusterSlug.padEnd(28)} total=${String(row.counts.total).padStart(3)} status=${row.status.padEnd(11)} p=${row.counts.problems} m=${row.counts.methods} s=${row.counts.surfaces} q=${row.counts.questions} cmp=${row.counts.comparisons}`,
    );
  }
}

main();
