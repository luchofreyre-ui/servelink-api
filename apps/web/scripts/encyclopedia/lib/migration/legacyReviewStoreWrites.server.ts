/**
 * Migration-only: file-backed review-store.json writes for local scripts.
 * Not part of operational encyclopedia system. Use API-backed review instead.
 */

import fs from "node:fs";
import path from "node:path";
import type {
  ReviewActionInput,
  ReviewStoreFile,
  StoredReviewRecord,
} from "../../../../src/lib/encyclopedia/reviewPersistenceTypes";

const REVIEW_DIR = path.join(process.cwd(), "content-batches", "encyclopedia");
const REVIEW_FILE = path.join(REVIEW_DIR, "review-store.json");

function stripSystemOverrideLines(notes?: string) {
  if (!notes) return undefined;

  const cleaned = notes
    .split("\n")
    .filter((line) => line.trim() !== "[override] force-pass")
    .join("\n")
    .trim();

  return cleaned || undefined;
}

function ensureStore(): void {
  fs.mkdirSync(REVIEW_DIR, { recursive: true });

  if (!fs.existsSync(REVIEW_FILE)) {
    const initial: ReviewStoreFile = { records: [] };
    fs.writeFileSync(REVIEW_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

function readStoreFile(): ReviewStoreFile {
  ensureStore();

  const raw = fs.readFileSync(REVIEW_FILE, "utf8");
  const parsed = JSON.parse(raw) as ReviewStoreFile;

  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };
}

function writeStoreFile(data: ReviewStoreFile): void {
  ensureStore();

  const normalized: ReviewStoreFile = {
    records: [...data.records].sort((a, b) => a.slug.localeCompare(b.slug)),
  };

  fs.writeFileSync(REVIEW_FILE, JSON.stringify(normalized, null, 2), "utf8");
}

/** Full replace for canonical ingest / promotion patches (preserves nothing beyond `record`). */
export function replaceStoredReviewRecord(record: StoredReviewRecord): void {
  const store = readStoreFile();
  const sanitized: StoredReviewRecord = {
    ...record,
    reviewNotes: stripSystemOverrideLines(record.reviewNotes),
  };
  const idx = store.records.findIndex((r) => r.slug === sanitized.slug);
  if (idx >= 0) {
    store.records[idx] = sanitized;
  } else {
    store.records.push(sanitized);
  }
  writeStoreFile(store);
}

export function upsertStoredReviewRecord(
  input: ReviewActionInput
): StoredReviewRecord {
  const store = readStoreFile();
  const now = new Date().toISOString();
  const prev = store.records.find((r) => r.slug === input.slug);

  let nextEditorialOverride = prev?.editorialOverrideMode;
  if (input.editorialOverrideChoice === "force-pass") {
    nextEditorialOverride = "force-pass";
  } else if (input.editorialOverrideChoice === "none") {
    nextEditorialOverride = undefined;
  }

  const nextRecord: StoredReviewRecord = {
    ...(prev ?? {
      slug: input.slug,
      reviewStatus: input.reviewStatus,
      updatedAt: now,
    }),
    slug: input.slug,
    reviewStatus: input.reviewStatus,
    reviewNotes:
      input.reviewNotes !== undefined
        ? stripSystemOverrideLines(input.reviewNotes)
        : stripSystemOverrideLines(prev?.reviewNotes),
    approvedAt:
      input.reviewStatus === "approved"
        ? now
        : prev?.approvedAt,
    updatedAt: now,
  };

  if (nextEditorialOverride === "force-pass") {
    nextRecord.editorialOverrideMode = "force-pass";
  } else if (input.editorialOverrideChoice === "none") {
    delete nextRecord.editorialOverrideMode;
  }

  const existingIndex = store.records.findIndex((r) => r.slug === input.slug);

  if (existingIndex >= 0) {
    store.records[existingIndex] = nextRecord;
  } else {
    store.records.push(nextRecord);
  }

  writeStoreFile(store);

  return nextRecord;
}
