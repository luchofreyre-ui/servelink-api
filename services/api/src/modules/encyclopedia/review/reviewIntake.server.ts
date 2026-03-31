import fs from "fs";
import path from "path";
import type { CanonicalPageSnapshot } from "../canonical/canonicalTypes";
import type { ReviewRecord } from "./reviewPromotionTypes";
import { getAllReviewRecords } from "./reviewStore.server";

function getStorePath() {
  return (
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH ||
    path.join(process.cwd(), "data/encyclopedia/review-store.json")
  );
}

function writeStore(records: ReviewRecord[]) {
  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(records, null, 2));
}

export function upsertGeneratedReviewRecord(
  snapshot: CanonicalPageSnapshot,
): ReviewRecord {
  const store = getAllReviewRecords();
  const now = new Date().toISOString();

  const next: ReviewRecord = {
    slug: snapshot.slug,
    title: snapshot.title,
    canonicalSnapshot: snapshot,
    reviewStatus: "pending",
    publishStatus: "draft",
    source: "api_manual",
    sourceDetail: "generation_intake",
    importedAt: now,
    promotionErrors: [],
  };

  const index = store.findIndex((item) => item.slug === snapshot.slug);

  if (index === -1) {
    store.push(next);
  } else {
    const existing = store[index]!;
    store[index] = {
      ...existing,
      title: snapshot.title,
      canonicalSnapshot: snapshot,
      reviewStatus:
        existing.publishStatus === "live" ? existing.reviewStatus : "pending",
      publishStatus:
        existing.publishStatus === "live" ? existing.publishStatus : "draft",
      promotionErrors: [],
      source: existing.source ?? "api_manual",
      sourceDetail: "generation_intake",
    };
  }

  writeStore(store);

  return index === -1 ? next : store[index]!;
}

export function batchUpsertGeneratedReviewRecords(
  snapshots: CanonicalPageSnapshot[],
) {
  const createdOrUpdated = snapshots.map((snapshot) =>
    upsertGeneratedReviewRecord(snapshot),
  );

  return {
    attempted: snapshots.length,
    upserted: createdOrUpdated.length,
    slugs: createdOrUpdated.map((item) => item.slug),
  };
}
