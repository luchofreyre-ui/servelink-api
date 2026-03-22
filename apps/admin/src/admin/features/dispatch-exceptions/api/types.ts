/**
 * Aligned to backend AdminDispatchExceptionItemDto + optional display fields.
 */
export type DispatchExceptionSeverity = "critical" | "high" | "medium" | "low";

export type DispatchExceptionStatus = "open" | "acknowledged" | "resolved";

export type DispatchExceptionReason =
  | "no_candidates"
  | "all_excluded"
  | "no_selection"
  | "multi_pass";

export type DispatchExceptionItem = {
  bookingId: string;
  bookingStatus: string | null;
  scheduledStart: string | null;
  estimatedDurationMin: number | null;
  latestDecisionStatus: string | null;
  latestTrigger: string | null;
  latestTriggerDetail: string | null;
  latestCreatedAt: string | null;
  totalDispatchPasses: number;
  selectedDecisionCount: number;
  noCandidatesCount: number;
  allExcludedCount: number;
  exceptionReasons: string[];
  latestSelectedFranchiseOwnerId: string | null;
  hasManualIntervention: boolean;
  latestManualActionAt: string | null;
  latestManualActionBy: string | null;
  severity: DispatchExceptionSeverity;
  recommendedAction: string;
  availableActions: string[];
  priorityScore: number;
  priorityBucket: string;
  staleSince: string | null;
  requiresFollowUp: boolean;
  detailPath: string;
  /** Optional: from booking lookup */
  customerName?: string | null;
  serviceAddress?: string | null;
};

export type DispatchExceptionListResponse = {
  items: DispatchExceptionItem[];
  nextCursor: string | null;
  totalCount?: number;
};

export type DispatchExceptionsParams = {
  type?: string;
  bookingStatus?: string;
  priorityBucket?: string;
  requiresFollowUp?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  pageSize?: number;
  cursor?: string | null;
  minDispatchPasses?: number;
  /** Client-side filter by booking ID (not sent to API) */
  search?: string;
};
