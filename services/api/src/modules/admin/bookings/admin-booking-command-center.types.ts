import type { BookingAuthorityReviewStatus } from "@prisma/client";

/**
 * Stored resolver output + review workflow (from `BookingAuthorityResult`).
 * Timestamps are ISO strings for audit-style inspection in the command center.
 */
export type AdminBookingAuthorityPersistedSnapshot = {
  surfaces: string[];
  problems: string[];
  methods: string[];
  status: BookingAuthorityReviewStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  /** Row creation time (first persist of this booking’s authority result). */
  createdAt: string;
  /** Last mutation time (resolver upsert, review, or override). */
  updatedAt: string;
};

/** Runtime keyword resolver output when no row is persisted yet. */
export type AdminBookingAuthorityDerivedSnapshot = {
  surfaces: string[];
  problems: string[];
  methods: string[];
};

/** Compact hints for admin UI copy around review / override / recompute (derived from persisted row only). */
export type AdminBookingAuthorityOperatorHints = {
  hasPersistedRow: boolean;
  persistedStatus: BookingAuthorityReviewStatus | null;
  /** Recompute API skips overwriting persisted tags when overridden. */
  recomputeSkipsOverwrite: boolean;
  /** A persisted row exists; recompute may refresh tags when not overridden. */
  recomputeMayRefreshPersistedRow: boolean;
  /** No persisted row; recompute returns preview only. */
  recomputePreviewOnly: boolean;
};

export type AdminBookingAuthorityBlock = {
  persisted: AdminBookingAuthorityPersistedSnapshot | null;
  derived: AdminBookingAuthorityDerivedSnapshot | null;
  operatorHints: AdminBookingAuthorityOperatorHints;
};

export type AdminBookingCommandCenterActivityPreview = {
  id: string;
  type: string;
  summary: string;
  actorUserId: string;
  actorRole: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type AdminBookingCommandCenterCorePayload = {
  success: true;
  bookingId: string;
  status: string;
  workflowState: "open" | "held" | "in_review" | "approved" | "reassign_requested";
  operatorNote: string | null;
  anomaly: {
    id: string;
    status: string;
    reviewState: string | null;
    commandCenterHeld: boolean;
    reassignmentRequested: boolean;
  } | null;
  availableActions: {
    canSaveOperatorNote: boolean;
    canHold: boolean;
    canMarkInReview: boolean;
    canApprove: boolean;
    canReassign: boolean;
  };
  activityPreview: AdminBookingCommandCenterActivityPreview[];
};

export type AdminBookingCommandCenterPayload = AdminBookingCommandCenterCorePayload & {
  /**
   * `persisted` is set when a `BookingAuthorityResult` exists.
   * `derived` is only set when there is no persisted row and the deterministic resolver yields tags from booking notes (etc.).
   */
  authority: AdminBookingAuthorityBlock;
};
