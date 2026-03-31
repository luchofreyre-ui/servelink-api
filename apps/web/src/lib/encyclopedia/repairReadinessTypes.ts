export type RepairReadiness = "not_ready" | "ready";

export type RepairReadinessRecord = {
  slug: string;
  readiness: RepairReadiness;
  reasons: string[];
};

export type RepairReadinessSummary = {
  slug: string;
  readiness: RepairReadiness;
  reasons: string[];
};
