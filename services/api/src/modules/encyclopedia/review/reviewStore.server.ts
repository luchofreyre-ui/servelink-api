import fs from "fs";
import path from "path";
import type {
  ReviewRecord,
  ReviewStatus,
  PublishStatus,
} from "./reviewPromotionTypes";

function getStorePath(): string {
  return (
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH ??
    path.join(process.cwd(), "data/encyclopedia/review-store.json")
  );
}

function readStore(): ReviewRecord[] {
  const STORE_PATH = getStorePath();
  if (!fs.existsSync(STORE_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  return Array.isArray(raw) ? raw : [];
}

function writeStore(records: ReviewRecord[]) {
  const STORE_PATH = getStorePath();
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(records, null, 2));
}

export function getAllReviewRecords(): ReviewRecord[] {
  return readStore();
}

export function getOperationalReviewRecords(): ReviewRecord[] {
  return readStore().sort((a, b) => {
    const score = (record: ReviewRecord) => {
      if (record.publishStatus === "failed") return 0;
      if (record.reviewStatus === "pending") return 1;
      if (
        record.reviewStatus === "approved" &&
        record.publishStatus !== "live"
      ) {
        return 2;
      }
      if (record.publishStatus === "live") return 3;
      if (record.reviewStatus === "rejected") return 4;
      return 5;
    };

    const scoreDiff = score(a) - score(b);
    if (scoreDiff !== 0) return scoreDiff;

    return a.slug.localeCompare(b.slug);
  });
}

export function getMigrationSummary() {
  const records = readStore();

  const summary = {
    total: records.length,
    imported: 0,
    manual: 0,
    live: 0,
    approvedNotLive: 0,
    pending: 0,
    failed: 0,
  };

  for (const record of records) {
    if (record.source === "pipeline_import") summary.imported++;
    if (record.source === "api_manual") summary.manual++;
    if (record.publishStatus === "live") summary.live++;
    if (
      record.reviewStatus === "approved" &&
      record.publishStatus !== "live"
    ) {
      summary.approvedNotLive++;
    }
    if (record.reviewStatus === "pending") summary.pending++;
    if (record.publishStatus === "failed") summary.failed++;
  }

  return summary;
}

export function listApprovedUnpromoted(): ReviewRecord[] {
  return readStore().filter(
    (r) => r.reviewStatus === "approved" && r.publishStatus !== "live"
  );
}

export function listFailedPromotions(): ReviewRecord[] {
  return readStore().filter((r) => r.publishStatus === "failed");
}

export function markReviewApproved(slug: string) {
  const store = readStore();

  const updated = store.map((r) =>
    r.slug === slug
      ? {
          ...r,
          reviewStatus: "approved" as ReviewStatus,
          approvedAt: new Date().toISOString(),
          ...(r.source === undefined ? { source: "api_manual" as const } : {}),
        }
      : r
  );

  writeStore(updated);
}

export function markReviewRejected(slug: string) {
  const store = readStore();

  const updated = store.map((r) =>
    r.slug === slug
      ? {
          ...r,
          reviewStatus: "rejected" as ReviewStatus,
        }
      : r
  );

  writeStore(updated);
}

export function markPromotionSucceeded(slug: string) {
  const store = readStore();

  const updated = store.map((r) =>
    r.slug === slug
      ? {
          ...r,
          publishStatus: "live" as PublishStatus,
          promotedAt: new Date().toISOString(),
          promotionErrors: [],
        }
      : r
  );

  writeStore(updated);
}

export function markPromotionFailed(slug: string, errors: string[]) {
  const store = readStore();

  const updated = store.map((r) =>
    r.slug === slug
      ? {
          ...r,
          publishStatus: "failed" as PublishStatus,
          lastPromotionAttemptAt: new Date().toISOString(),
          promotionErrors: errors,
        }
      : r
  );

  writeStore(updated);
}
