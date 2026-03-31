/**
 * Migration/backfill only: export a legacy reviewed corpus JSON into API `review-import.json` shape.
 * Ongoing generation should use `intake:encyclopedia-generated-review-records` against canonical snapshots.
 *
 * Usage (from apps/web):
 *   pnpm exec tsx scripts/encyclopedia/export-review-import.ts --source=content-batches/encyclopedia/review-store.json --output=data/encyclopedia/review-import.json
 *
 * Supports: array root, { items | candidates | rows | records }, pipeline review-store.json
 * ({ records, canonicalContent } per row), and reviewed-candidate files with snapshot fields.
 */
import path from "node:path";
import { exportReviewedCorpusToImportFile } from "../../src/lib/encyclopedia/reviewImportExporter";

function getArg(name: string): string | null {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function run() {
  console.warn(
    "[migration only] export-review-import.ts is for backfill/migration from the legacy reviewed corpus into the API review store import shape.",
  );

  const sourceArg = getArg("source");
  const outputArg = getArg("output");

  if (!sourceArg) {
    throw new Error("Missing required --source=...");
  }

  const sourcePath = path.resolve(process.cwd(), sourceArg);
  const outputPath = outputArg
    ? path.resolve(process.cwd(), outputArg)
    : path.resolve(process.cwd(), "data/encyclopedia/review-import.json");

  const result = exportReviewedCorpusToImportFile({
    sourcePath,
    outputPath,
  });

  console.log("REVIEW IMPORT EXPORT RESULT");
  console.log(JSON.stringify(result, null, 2));
}

run();
