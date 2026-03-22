import type { FleetRollup, OperationalBookingSignal } from "./portfolioOperationalSnapshot";
import { buildFleetRollup } from "./portfolioOperationalSnapshot";
import type {
  ExplainableScore,
  PortfolioHealthDomainKey,
  PortfolioHealthModel,
  TrendDirection,
} from "./portfolioHealthModel";
import {
  PORTFOLIO_HEALTH_DOMAIN_LABELS,
  scoreToBand,
} from "./portfolioHealthModel";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function trendFromDelta(delta: number): TrendDirection {
  if (delta > 3) return "improving";
  if (delta < -3) return "worsening";
  return "stable";
}

/** Derived fractional metrics from dispatch-focused fleet rollup (contract-normalized signals). */
type SyntheticFleetMetrics = {
  bookingCount: number;
  pctMissingProof: number;
  pctThinMargin: number;
  pctOpenIssueNoFollowUp: number;
  pctPolicyHitNoOwner: number;
  pctStaleAck: number;
  pctDocLag: number;
  pctReworkHeavy: number;
  pctOverloadRisk: number;
  avgEconomicsPressure: number;
  avgQualityDrag: number;
};

function rollupToSyntheticMetrics(rollup: FleetRollup): SyntheticFleetMetrics {
  const n = Math.max(rollup.totalBookings, 1);
  return {
    bookingCount: rollup.totalBookings,
    pctMissingProof: rollup.noShowRiskCount / n,
    pctThinMargin: (rollup.offerExpiredCount / n) * 0.5,
    pctOpenIssueNoFollowUp: rollup.reassignmentCount / n,
    pctPolicyHitNoOwner: rollup.noAcceptanceCount / n,
    pctStaleAck: (rollup.offerExpiredCount / n) * 0.4,
    pctDocLag: 0,
    pctReworkHeavy: rollup.slaMissCount / n,
    pctOverloadRisk: rollup.overloadRiskCount / n,
    avgEconomicsPressure: Math.min(
      100,
      ((rollup.noAcceptanceCount + rollup.offerExpiredCount + rollup.slaMissCount) / n) * 90,
    ),
    avgQualityDrag: Math.min(
      100,
      ((rollup.reassignmentCount + rollup.noShowRiskCount + rollup.overloadRiskCount) / n) * 85,
    ),
  };
}

function computeRawScores(
  fleet: SyntheticFleetMetrics,
): Record<PortfolioHealthDomainKey, number> {
  const operations = clamp(
    100 - fleet.pctMissingProof * 32 - fleet.pctDocLag * 24 - fleet.pctOpenIssueNoFollowUp * 28,
  );
  const execution = clamp(100 - fleet.pctReworkHeavy * 35 - fleet.pctOverloadRisk * 20);
  const outcome = clamp(100 - fleet.avgQualityDrag * 0.85);
  const communication = clamp(100 - fleet.pctOpenIssueNoFollowUp * 30 - fleet.pctStaleAck * 25);
  const capacity = clamp(100 - fleet.pctOverloadRisk * 45 - fleet.pctThinMargin * 15);
  const economics = clamp(100 - fleet.avgEconomicsPressure * 0.9 - fleet.pctThinMargin * 22);
  const policy = clamp(100 - fleet.pctPolicyHitNoOwner * 40 - fleet.pctStaleAck * 18);
  const adminIntervention = clamp(
    100 -
      fleet.pctPolicyHitNoOwner * 22 -
      fleet.pctOpenIssueNoFollowUp * 24 -
      fleet.pctStaleAck * 20,
  );
  return {
    operationsHealth: operations,
    executionHealth: execution,
    outcomeHealth: outcome,
    communicationHealth: communication,
    capacityHealth: capacity,
    economicsHealth: economics,
    policyDiscipline: policy,
    adminInterventionHealth: adminIntervention,
  };
}

function whoActs(
  key: PortfolioHealthDomainKey,
): ExplainableScore["whoShouldActNext"] {
  if (key === "economicsHealth") return "finance_lead";
  if (key === "capacityHealth") return "capacity_lead";
  if (key === "outcomeHealth" || key === "executionHealth") return "quality_lead";
  return "admin_pool";
}

export type PriorFleetRollup = FleetRollup | null;

/**
 * Explainable domain scores from normalized operational booking signals.
 * Optional prior rollup (same shape as `buildFleetRollup` output) for session trends.
 */
export function buildPortfolioHealthModel(
  signals: OperationalBookingSignal[],
  prior: PriorFleetRollup = null,
): PortfolioHealthModel {
  const fleet = buildFleetRollup(signals);
  const synthetic = rollupToSyntheticMetrics(fleet);
  const priorSynthetic = prior ? rollupToSyntheticMetrics(prior) : null;

  const scores = computeRawScores(synthetic);
  const priorScores = priorSynthetic ? computeRawScores(priorSynthetic) : null;

  const domains = {} as Record<PortfolioHealthDomainKey, ExplainableScore>;
  (Object.keys(scores) as PortfolioHealthDomainKey[]).forEach((key) => {
    const score = scores[key];
    const prev = priorScores?.[key] ?? score;
    const trend = trendFromDelta(score - prev);

    const degraders: string[] = [];
    const improvers: string[] = [];
    if (synthetic.pctMissingProof > 0.05) {
      degraders.push("Attendance / proof-adjacent risk from dispatch signals");
    }
    if (synthetic.pctThinMargin > 0.08) {
      degraders.push("Offer / timing churn concentration");
    }
    if (synthetic.pctOpenIssueNoFollowUp > 0.06) {
      degraders.push("Reassignment churn across in-view bookings");
    }
    if (synthetic.pctPolicyHitNoOwner > 0.04) {
      degraders.push("No-acceptance concentration — ownership path unclear");
    }
    if (synthetic.pctReworkHeavy > 0.06) {
      degraders.push("SLA miss concentration on starts");
    }
    if (degraders.length === 0) {
      degraders.push("No dominant drag — monitor tails");
    }

    if (synthetic.pctMissingProof < 0.03) {
      improvers.push("No-show risk share is contained");
    }
    if (synthetic.avgQualityDrag < 35) {
      improvers.push("Execution drag from dispatch flags is low");
    }
    if (synthetic.pctPolicyHitNoOwner < 0.02) {
      improvers.push("Acceptance path mostly healthy");
    }
    if (improvers.length === 0) {
      improvers.push("Stable execution — reinforce standards");
    }

    domains[key] = {
      domainKey: key,
      label: PORTFOLIO_HEALTH_DOMAIN_LABELS[key],
      score,
      band: scoreToBand(score),
      trend,
      dimensionsIncluded: [
        "Normalized operational signal contract (dispatch / execution)",
        "Fleet rollup derived from acceptance, SLA, reassignment, overload, no-show",
      ],
      topDegraders: degraders.slice(0, 3),
      topImprovers: improvers.slice(0, 3),
      watchState:
        scoreToBand(score) === "watch" || scoreToBand(score) === "critical",
      recommendedManagementAction:
        score < 60
          ? "Run a focused governance sweep on this domain today."
          : score < 72
            ? "Schedule supervisor review + operator coaching touchpoints."
            : "Keep monitoring; reinforce standards in stand-up.",
      whoShouldActNext: whoActs(key),
    };
  });

  const entries = Object.entries(scores) as [PortfolioHealthDomainKey, number][];
  const sortedRisk = [...entries].sort((a, b) => a[1] - b[1]);
  const sortedImprove = [...entries].sort((a, b) => b[1] - a[1]);

  const highestRiskDomain = sortedRisk[0][0];
  const mostImprovedDomain = sortedImprove[0][0];

  const portfolioHeadline =
    domains[highestRiskDomain].band === "critical"
      ? `Portfolio in critical watch — ${PORTFOLIO_HEALTH_DOMAIN_LABELS[highestRiskDomain]} needs executive attention.`
      : domains[highestRiskDomain].band === "watch"
        ? `Portfolio steady but ${PORTFOLIO_HEALTH_DOMAIN_LABELS[highestRiskDomain]} is the watch zone.`
        : "Portfolio health is within governed bands — tighten follow-through on tails.";

  const fleetAttentionSummary = `${fleet.totalBookings} bookings in view · ${fleet.flaggedBookings} flagged for dispatch stress · SLA misses ${fleet.slaMissCount} · no acceptance ${fleet.noAcceptanceCount}`;

  return {
    domains,
    portfolioHeadline,
    highestRiskDomain,
    mostImprovedDomain,
    fleetAttentionSummary,
  };
}
