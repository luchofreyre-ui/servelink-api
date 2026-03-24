import type { DeepCleanEstimatorConfigPayloadApi } from "@/types/deepCleanEstimatorConfig";

export type DeepCleanEstimatorConfigStatusApi = "draft" | "active" | "archived";

export type DeepCleanEstimatorVersionHistoryRowApi = {
  id: string;
  version: number;
  status: DeepCleanEstimatorConfigStatusApi;
  label: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string | null;
  publishedByUserId: string | null;
};

/** Alias for governance history rows (used by decision selectors). */
export type DeepCleanEstimatorGovernanceRow = DeepCleanEstimatorVersionHistoryRowApi;

export type DeepCleanEstimatorVersionDetailApi = DeepCleanEstimatorVersionHistoryRowApi & {
  config: DeepCleanEstimatorConfigPayloadApi;
};

export type DeepCleanEstimatorGovernanceHistoryResponseApi = {
  kind: "deep_clean_estimator_config_history";
  rows: DeepCleanEstimatorVersionHistoryRowApi[];
};

export type DeepCleanEstimatorGovernanceDetailResponseApi = {
  kind: "deep_clean_estimator_config_detail";
  row: DeepCleanEstimatorVersionDetailApi;
};

export type DeepCleanEstimatorRestoreDraftResponseApi = {
  kind: "deep_clean_estimator_config_restored_to_draft";
  draft: DeepCleanEstimatorVersionDetailApi;
  restoredFromVersion: number;
};
