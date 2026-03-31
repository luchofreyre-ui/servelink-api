import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildExpandedReviewedIndexCandidatesForExport,
  parseExpandedIndexCandidatesFile,
} from "./lib/expanded-to-reviewed-index-candidates";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const DEFAULT_INPUT = path.join(
  repoRoot,
  "content-batches",
  "encyclopedia",
  "generated-expanded-index-candidates.json",
);

const DEFAULT_OUTPUT = path.join(
  repoRoot,
  "content-batches",
  "encyclopedia",
  "generated-expanded-reviewed-index-candidates.json",
);

function parseArgs(argv: string[]): { inputPath: string; outputPath: string } {
  const inArg = argv.find((a) => a.startsWith("--input="));
  const outArg = argv.find((a) => a.startsWith("--output="));
  return {
    inputPath: inArg ? path.resolve(repoRoot, inArg.slice("--input=".length).trim()) : DEFAULT_INPUT,
    outputPath: outArg ? path.resolve(repoRoot, outArg.slice("--output=".length).trim()) : DEFAULT_OUTPUT,
  };
}

function main() {
  const { inputPath, outputPath } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${path.relative(repoRoot, inputPath)}`);
    console.error("Run: npm run generate:encyclopedia-expanded-index-candidates");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(inputPath, "utf8")) as unknown;
  const parsed = parseExpandedIndexCandidatesFile(raw);
  const candidates = buildExpandedReviewedIndexCandidatesForExport(parsed.candidates);

  const summary = {
    total: candidates.length,
    promote: candidates.filter((x) => x.recommendation === "promote").length,
    review: candidates.filter((x) => x.recommendation === "review").length,
    reject: candidates.filter((x) => x.recommendation === "reject").length,
  };

  const bySourceFamily = candidates.reduce<Record<string, { promote: number; review: number; reject: number }>>(
    (acc, c) => {
      const k = c.sourceFamily;
      if (!acc[k]) {
        acc[k] = { promote: 0, review: 0, reject: 0 };
      }
      acc[k][c.recommendation] += 1;
      return acc;
    },
    {},
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceFile: path.relative(repoRoot, inputPath),
        summary,
        bySourceFamily,
        candidates,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log("Expanded → reviewed encyclopedia index candidates");
  console.log(JSON.stringify(summary, null, 2));
  console.log("By sourceFamily (final recommendation):");
  console.log(JSON.stringify(bySourceFamily, null, 2));
  console.log(`Wrote: ${path.relative(repoRoot, outputPath)}`);
}

main();
