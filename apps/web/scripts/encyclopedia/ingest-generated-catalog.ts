/**
 * Legacy pipeline: ingests generated candidates into the **file-backed** encyclopedia review corpus.
 * Operational intake for the API review store: `npm run intake:encyclopedia-generated-review-records`.
 */
import { ingestGeneratedEncyclopediaPagesAndRevalidate } from "./lib/migration/legacyEncyclopediaIngestion.server";
import { generatePages } from "../../src/lib/encyclopedia/generateCandidates";

console.warn(
  "[legacy pipeline] ingest-generated-catalog.ts belongs to the legacy pipeline. The operational path is API review intake via intake:encyclopedia-generated-review-records.",
);

const pages = generatePages();
const result = ingestGeneratedEncyclopediaPagesAndRevalidate(pages, {
  sourceArtifactPath: "scripts/encyclopedia/ingest-generated-catalog.ts",
});
console.log(result);
