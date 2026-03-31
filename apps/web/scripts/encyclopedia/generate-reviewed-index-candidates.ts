import fs from "node:fs";
import path from "node:path";

import { buildReviewedIndexCandidatesForExport } from "./lib/build-reviewed-index-candidates";

const outputPath = path.resolve(
  process.cwd(),
  "content-batches/encyclopedia/generated-reviewed-index-candidates.json",
);

const candidates = buildReviewedIndexCandidatesForExport();

const summary = {
  total: candidates.length,
  promote: candidates.filter((x) => x.recommendation === "promote").length,
  review: candidates.filter((x) => x.recommendation === "review").length,
  reject: candidates.filter((x) => x.recommendation === "reject").length,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary,
      candidates,
    },
    null,
    2,
  ) + "\n",
);

console.log("Generated reviewed encyclopedia candidates");
console.log(JSON.stringify(summary, null, 2));
console.log(`Wrote file: ${outputPath}`);
