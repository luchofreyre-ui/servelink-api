// reviewStore.ts

import type { StoredReviewRecord } from "./reviewPersistenceTypes";
import type { ReviewStatus, ReviewablePage } from "./renderTypes";

export type ReviewStoreRecord = Pick<
  StoredReviewRecord,
  "slug" | "reviewStatus" | "reviewNotes" | "approvedAt" | "editorialOverrideMode"
>;

export function applyReviewState(
  pages: ReviewablePage[],
  reviewRecords: ReviewStoreRecord[]
): ReviewablePage[] {
  const reviewMap = new Map(reviewRecords.map((r) => [r.slug, r]));

  return pages.map((page) => {
    const record = reviewMap.get(page.slug);

    if (!record) return page;

    return {
      ...page,
      reviewStatus: record.reviewStatus,
      reviewNotes: record.reviewNotes,
      approvedAt: record.approvedAt,
      editorialOverrideMode:
        record.editorialOverrideMode === "force-pass"
          ? "force-pass"
          : page.editorialOverrideMode,
    };
  });
}
