/** Bump when canonical algorithms change; stale rows must be reprocessed. */
export const SYSTEM_TEST_INTELLIGENCE_VERSION = "v2" as const;

export type SystemTestIntelligenceAnalysisStatus =
  | "pending"
  | "completed"
  | "failed";
