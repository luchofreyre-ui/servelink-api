/**
 * GUARD: **Migration / legacy only.** Writes the file-backed pipeline review corpus, not the API store.
 *
 * Validated ingest into the **legacy** file-backed pipeline (content-batches review corpus).
 *
 * Operational path: send the same `pages` JSON to the API review store via
 * `pnpm run intake:encyclopedia-generated-review-records -- --source=path/to/snapshots.json`
 * (API must be running; set SERVELINK_ACCESS_TOKEN or `--token=` for auth).
 *
 * JSON file must be `{ "pages": CanonicalPageSnapshot[] }`.
 *
 * Usage:
 *   pnpm exec tsx scripts/encyclopedia/ingest-validated.ts path/to/snapshots.json
 */
import fs from "node:fs";
import path from "node:path";
import { ingestWithValidation } from "./lib/migration/legacyIngestionWithValidation.server";
import type { CanonicalPageSnapshot } from "../../src/lib/encyclopedia/encyclopediaPipelineTypes";

console.warn(
  "[legacy pipeline] ingest-validated.ts is migration-only. Ongoing operational intake should use intake:encyclopedia-generated-review-records into the API review store.",
);

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: tsx scripts/encyclopedia/ingest-validated.ts <input.json>");
  process.exit(1);
}

const fullPath = path.resolve(filePath);
const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8")) as {
  pages?: CanonicalPageSnapshot[];
};

if (!Array.isArray(raw.pages)) {
  console.error('Input JSON must have a "pages" array of CanonicalPageSnapshot objects');
  process.exit(1);
}

try {
  const result = ingestWithValidation(raw.pages, {
    sourceArtifactPath: fullPath,
  });
  console.log({
    ingested: result.ingested,
    rejected: result.rejected,
    ingestedSlugs: result.ingestedSlugs,
    skippedSlugs: result.skippedSlugs,
  });
  if (result.rejectedPages.length > 0) {
    console.info("[encyclopedia:ingest:validation-rejected]", result.rejectedPages);
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
