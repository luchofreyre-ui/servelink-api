export type ScoreBand = "strong" | "steady" | "watch" | "critical";

export type TrendDirection = "improving" | "stable" | "worsening";

export type ExplainableScore = {
  domainKey: PortfolioHealthDomainKey;
  label: string;
  score: number;
  band: ScoreBand;
  trend: TrendDirection;
  dimensionsIncluded: string[];
  topDegraders: string[];
  topImprovers: string[];
  watchState: boolean;
  recommendedManagementAction: string;
  whoShouldActNext: "ops_lead" | "quality_lead" | "capacity_lead" | "finance_lead" | "admin_pool";
};

export type PortfolioHealthDomainKey =
  | "operationsHealth"
  | "executionHealth"
  | "outcomeHealth"
  | "communicationHealth"
  | "capacityHealth"
  | "economicsHealth"
  | "policyDiscipline"
  | "adminInterventionHealth";

export type PortfolioHealthModel = {
  domains: Record<PortfolioHealthDomainKey, ExplainableScore>;
  portfolioHeadline: string;
  highestRiskDomain: PortfolioHealthDomainKey;
  mostImprovedDomain: PortfolioHealthDomainKey;
  fleetAttentionSummary: string;
};

export const PORTFOLIO_HEALTH_DOMAIN_LABELS: Record<
  PortfolioHealthDomainKey,
  string
> = {
  operationsHealth: "Operations rhythm",
  executionHealth: "Execution / SLA",
  outcomeHealth: "Outcome quality",
  communicationHealth: "Communication fidelity",
  capacityHealth: "Capacity load",
  economicsHealth: "Economics & margin",
  policyDiscipline: "Policy discipline",
  adminInterventionHealth: "Admin intervention quality",
};

export function scoreToBand(score: number): ScoreBand {
  if (score >= 82) return "strong";
  if (score >= 68) return "steady";
  if (score >= 52) return "watch";
  return "critical";
}
