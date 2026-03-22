export type DispatchExceptionType =
  | "all"
  | "no_candidates"
  | "all_excluded"
  | "no_selection"
  | "multi_pass";

export type AdminDispatchRecommendedAction =
  | "manual_redispatch"
  | "manual_assign"
  | "review_exclusions"
  | "open_detail"
  | "monitor";

export type AdminDispatchSeverity = "high" | "medium" | "low";

export type AdminDispatchPriorityBucket =
  | "urgent"
  | "high"
  | "normal"
  | "low";

export type AdminDispatchExceptionItemDto = {
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

  severity: AdminDispatchSeverity;
  recommendedAction: AdminDispatchRecommendedAction;
  availableActions: string[];

  priorityScore: number;
  priorityBucket: AdminDispatchPriorityBucket;

  staleSince: string | null;
  requiresFollowUp: boolean;

  detailPath: string;
};

export type AdminDispatchExceptionsResponseDto = {
  items: AdminDispatchExceptionItemDto[];
  nextCursor: string | null;
  totalCount?: number;
};

export type AdminDispatchExceptionsSortBy =
  | "priority"
  | "lastDecisionAt"
  | "scheduledStart"
  | "createdAt";

export type GetAdminDispatchExceptionsQueryDto = {
  type?: DispatchExceptionType;
  bookingStatus?: string;
  minDispatchPasses?: string;
  limit?: string;
  cursor?: string;
  sortBy?: AdminDispatchExceptionsSortBy;
  sortOrder?: "asc" | "desc";
  requiresFollowUp?: string;
  priorityBucket?: string;
};
