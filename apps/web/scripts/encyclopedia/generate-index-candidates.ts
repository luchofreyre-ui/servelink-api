import fs from "node:fs";
import path from "node:path";

import { buildGeneratedIndexCandidates } from "../../src/lib/encyclopedia/topicGenerator";

const outputPath = path.resolve(
  process.cwd(),
  "content-batches/encyclopedia/generated-index-candidates.json",
);

const candidates = buildGeneratedIndexCandidates();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: candidates.length,
      candidates,
    },
    null,
    2,
  ),
);

console.log(`Generated ${candidates.length} index candidates`);
console.log(`File: ${outputPath}`);
