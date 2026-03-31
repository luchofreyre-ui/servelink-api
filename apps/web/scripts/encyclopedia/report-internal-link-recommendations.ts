import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getInternalLinkRecommendations } from "../../src/lib/encyclopedia/internalLinkRecommendations";
import { loadEncyclopediaIndexEntriesForAnalysis } from "../../src/lib/encyclopedia/loadEncyclopediaIndexEntries";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

function parseArgs(argv: string[]): { slug: string | null; output: string | null } {
  const slugArg = argv.find((a) => a.startsWith("--slug="));
  const outArg = argv.find((a) => a.startsWith("--output="));
  return {
    slug: slugArg ? slugArg.slice("--slug=".length).trim() : null,
    output: outArg ? path.resolve(repoRoot, outArg.slice("--output=".length).trim()) : null,
  };
}

function main() {
  const { slug, output } = parseArgs(process.argv.slice(2));
  if (!slug) {
    console.error("Usage: tsx report-internal-link-recommendations.ts --slug=some-page-slug [--output=path.json]");
    process.exit(1);
  }

  const corpus = loadEncyclopediaIndexEntriesForAnalysis();
  const result = getInternalLinkRecommendations(slug, corpus);

  console.log(`Internal link recommendations for slug: ${slug}`);
  console.log(`  Count: ${result.recommendations.length}`);
  for (const r of result.recommendations) {
    console.log(`  - ${r.score}  ${r.reason.padEnd(22)} ${r.slug} → ${r.href}`);
  }

  if (output) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(`Wrote: ${path.relative(repoRoot, output)}`);
  }
}

main();
