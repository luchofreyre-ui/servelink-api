export type FoCohortId =
  | "stable_operators"
  | "watched_operators"
  | "tight_supervision"
  | "high_rework"
  | "documentation_drift"
  | "recovery_heavy"
  | "overloaded_stable"
  | "overloaded_risky"
  | "improving_after_coaching";

export type FoCohortSegment = {
  id: FoCohortId;
  label: string;
  count: number;
  recentTrend: "improving" | "stable" | "worsening";
  dominantRisk: string;
  dominantImprovementArea: string;
  recommendedAdminPosture: string;
  foIds: string[];
};

export type FoCohortModel = {
  segments: FoCohortSegment[];
  unassignedCount: number;
};
