// encyclopediaThroughputMetrics.server.ts

import { generatePages } from "./generateCandidates";
import { getStoredReviewRecords } from "./reviewPersistence.server";

export type EncyclopediaThroughputCounts = {
  generatedNotIngested: number;
  ingestedPendingReview: number;
  approvedNotPromoted: number;
  promoted: number;
  failedPromotion: number;
};

export function buildEncyclopediaThroughputCounts(): EncyclopediaThroughputCounts {
  const generatedSlugs = new Set(generatePages().map((p) => p.slug));
  const records = getStoredReviewRecords();
  const bySlug = new Map(records.map((r) => [r.slug, r]));

  let generatedNotIngested = 0;
  for (const slug of generatedSlugs) {
    const r = bySlug.get(slug);
    if (!r?.ingestedAt) {
      generatedNotIngested += 1;
    }
  }

  let ingestedPendingReview = 0;
  for (const r of records) {
    if (
      r.ingestedAt &&
      (r.reviewStatus === "draft" || r.reviewStatus === "reviewed")
    ) {
      ingestedPendingReview += 1;
    }
  }

  let approvedNotPromoted = 0;
  for (const r of records) {
    if (
      r.reviewStatus === "approved" &&
      r.promotionStatus !== "promoted"
    ) {
      approvedNotPromoted += 1;
    }
  }

  const promoted = records.filter((r) => r.promotionStatus === "promoted").length;
  const failedPromotion = records.filter(
    (r) => r.promotionStatus === "failed"
  ).length;

  return {
    generatedNotIngested,
    ingestedPendingReview,
    approvedNotPromoted,
    promoted,
    failedPromotion,
  };
}
