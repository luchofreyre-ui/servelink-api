export type IncidentValidationState = "pending" | "passed" | "failed";

export type IncidentValidationReason =
  | "still_absent"
  | "reappeared_in_latest_run"
  | "families_reappeared"
  | "trend_not_improving"
  | "insufficient_history";

export interface SystemTestIncidentValidationResult {
  incidentKey: string;
  passed: boolean;
  reason: IncidentValidationReason;
  latestRunId: string | null;
  currentGapRuns: number;
  reappearedAfterGap: boolean;
  activeFamilyKeys: string[];
  latestSeverity: string | null;
  trendDelta: number | null;
}

export interface SyncIncidentActionFromRunInput {
  incidentKey: string;
  runId: string;
  actorUserId?: string | null;
}

export interface SyncResolvedActionsForRunInput {
  runId: string;
  actorUserId?: string | null;
}
