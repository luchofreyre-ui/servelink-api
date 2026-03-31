import type { CanonicalPageSnapshot } from "../canonical/canonicalTypes";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type PublishStatus =
  | "draft"
  | "promoted"
  | "live"
  | "failed";

export type ReviewRecordSource =
  | "api_manual"
  | "pipeline_import"
  | "reviewed_candidates";

export type ReviewRecord = {
  slug: string;
  title: string;

  reviewStatus: ReviewStatus;
  publishStatus: PublishStatus;

  canonicalSnapshot: CanonicalPageSnapshot;

  source?: ReviewRecordSource;
  sourceDetail?: string;
  importedAt?: string;

  approvedAt?: string;
  promotedAt?: string;
  lastPromotionAttemptAt?: string;

  promotionErrors?: string[];
};
