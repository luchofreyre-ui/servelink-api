// reviewPersistence.server.ts — read-only access to file-backed review store (legacy mirror)

import fs from "node:fs";
import path from "node:path";
import type {
  ReviewActionInput,
  ReviewStoreFile,
  StoredReviewRecord,
} from "./reviewPersistenceTypes";

const REVIEW_DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const REVIEW_FILE = path.join(REVIEW_DIR, "review-store.json");

const LEGACY_WRITE_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

function readStoreFile(): ReviewStoreFile {
  if (!fs.existsSync(REVIEW_FILE)) {
    return { records: [] };
  }

  const raw = fs.readFileSync(REVIEW_FILE, "utf8");
  const parsed = JSON.parse(raw) as ReviewStoreFile;

  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}

export function getStoredReviewRecords(): StoredReviewRecord[] {
  return readStoreFile().records;
}

export function getStoredReviewRecordBySlug(
  slug: string
): StoredReviewRecord | undefined {
  return readStoreFile().records.find((r) => r.slug === slug);
}

export function replaceStoredReviewRecord(_record: StoredReviewRecord): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function upsertStoredReviewRecord(_input: ReviewActionInput): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function deleteStoredReviewRecord(_slug: string): never {
  throw new Error(LEGACY_WRITE_REMOVED);
}

export function getReviewStoreFilePath(): string {
  return REVIEW_FILE;
}
