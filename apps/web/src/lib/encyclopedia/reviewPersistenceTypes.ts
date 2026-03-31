// reviewPersistenceTypes.ts

import type { ReviewStatus } from "./renderTypes";
import type {
  CanonicalPageSnapshot,
  EncyclopediaContentOrigin,
  EncyclopediaPromotionStatus,
} from "./encyclopediaPipelineTypes";

export type StoredReviewStatus = ReviewStatus;

export type StoredEditorialOverrideMode = "force-pass";

export type StoredReviewRecord = {
  slug: string;
  reviewStatus: ReviewStatus;
  reviewNotes?: string;
  approvedAt?: string;
  updatedAt: string;
  editorialOverrideMode?: StoredEditorialOverrideMode;

  /** Canonical pipeline: separate from reviewStatus. */
  promotionStatus?: EncyclopediaPromotionStatus;
  contentOrigin?: EncyclopediaContentOrigin;
  generatedAt?: string;
  ingestedAt?: string;
  promotedAt?: string;
  sourceBatchId?: string;
  sourceArtifactPath?: string;
  /** Hash of canonical machine snapshot at last ingest. */
  contentHash?: string;
  /** Hash last successfully written to live store for this slug. */
  liveContentHash?: string;
  promotionError?: string;
  /** Latest machine-owned page body from generation / ingest. */
  canonicalContent?: CanonicalPageSnapshot;
};

export type ReviewActionInput = {
  slug: string;
  reviewStatus: ReviewStatus;
  reviewNotes?: string;
  /** Omit to leave `editorialOverrideMode` unchanged (e.g. batch / auto-fail). */
  editorialOverrideChoice?: "none" | "force-pass";
};

export type ReviewStoreFile = {
  records: StoredReviewRecord[];
};
