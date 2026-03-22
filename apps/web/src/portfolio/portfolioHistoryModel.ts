export type PortfolioHistorySeverity = "info" | "attention" | "critical";

export type PortfolioHistoryEvent = {
  id: string;
  occurredAt: string;
  category:
    | "operations_health"
    | "economics_health"
    | "proof_discipline"
    | "rework_cohort"
    | "overload_cohort"
    | "decision_consistency"
    | "governance_watch";
  headline: string;
  detail: string;
  domainKey?: string;
};

export type PortfolioHistoryRollup = {
  events: PortfolioHistoryEvent[];
  /** Cap for UI */
  truncated: boolean;
};
