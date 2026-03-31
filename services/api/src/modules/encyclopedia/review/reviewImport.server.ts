import fs from "fs";
import path from "path";
import type { CanonicalPageSnapshot } from "../canonical/canonicalTypes";
import type { ReviewRecord } from "./reviewPromotionTypes";
import { getAllReviewRecords } from "./reviewStore.server";

const DEFAULT_IMPORT_PATH = path.join(
  process.cwd(),
  "data/encyclopedia/review-import.json"
);

function getImportPath(): string {
  return process.env.ENCYCLOPEDIA_REVIEW_IMPORT_PATH ?? DEFAULT_IMPORT_PATH;
}

function getStoreWritePath(): string {
  return (
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH ??
    path.join(process.cwd(), "data/encyclopedia/review-store.json")
  );
}

function writeStoreRecords(records: ReviewRecord[]) {
  const storePath = getStoreWritePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(records, null, 2));
}

type ImportPayload = Array<{
  slug: string;
  title: string;
  canonicalSnapshot: CanonicalPageSnapshot;
  reviewStatus?: "pending" | "approved" | "rejected";
  publishStatus?: "draft" | "promoted" | "live" | "failed";
}>;

export function importReviewRecordsFromFile() {
  const importPath = getImportPath();

  if (!fs.existsSync(importPath)) {
    throw new Error(`Import file not found: ${importPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(importPath, "utf-8"));
  if (!Array.isArray(raw)) {
    throw new Error("Import file must be a JSON array");
  }
  const payload = raw as ImportPayload;

  const existing = [...getAllReviewRecords()];
  const existingBySlug = new Map(existing.map((r) => [r.slug, r]));

  let created = 0;
  let skipped = 0;

  for (const item of payload) {
    if (existingBySlug.has(item.slug)) {
      skipped++;
      continue;
    }

    existing.push({
      slug: item.slug,
      title: item.title,
      canonicalSnapshot: item.canonicalSnapshot,
      reviewStatus: item.reviewStatus ?? "pending",
      publishStatus: item.publishStatus ?? "draft",
      source: "pipeline_import",
      sourceDetail: importPath,
      importedAt: new Date().toISOString(),
      approvedAt: undefined,
      promotedAt: undefined,
      lastPromotionAttemptAt: undefined,
      promotionErrors: [],
    });
    const createdRecord = existing[existing.length - 1]!;
    existingBySlug.set(item.slug, createdRecord);
    created++;
  }

  writeStoreRecords(existing);

  return {
    importPath,
    attempted: payload.length,
    created,
    skipped,
    total: existing.length,
  };
}
