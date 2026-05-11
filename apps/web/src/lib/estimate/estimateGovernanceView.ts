import type {
  EscalationGovernanceSummary,
  SnapshotGovernanceDomainRow,
} from "./estimateGovernanceSnapshot";
import {
  getConfidenceBreakdownFromSnapshot,
  getEscalationGovernanceFromSnapshot,
  getEscalationSummary,
  getIntakeStabilityDriverHits,
  getRecurringEconomicsGovernanceFromSnapshot,
  getTopUncertaintyDrivers,
  getWeakestConfidenceDomains,
  RECURRING_ECONOMICS_GOVERNANCE_SCHEMA,
} from "./estimateGovernanceSnapshot";

export type EstimateGovernancePanelModel = {
  hasBreakdown: boolean;
  hasGovernance: boolean;
  overallConfidencePct: string | null;
  confidenceClassification: string | null;
  escalationSummary: EscalationGovernanceSummary;
  weakestDomains: SnapshotGovernanceDomainRow[];
  topUncertaintyDrivers: string[];
  intakeStabilityDriverHits: string[];
  intakeStabilityLines: string[];
  recurringTransitionReasoning: string[];
};

export type RecurringEconomicsGovernanceViewModel = {
  economicRiskLevel: string;
  maintenanceViability: string;
  recurringDiscountRisk: string;
  resetReviewRecommendation: string;
  marginProtectionSignal: string;
  riskScore: number;
  recommendedActions: string[];
  topEconomicReasons: string[];
  topMaintenanceReasons: string[];
};

const INTAKE_STABILITY_COPY: Record<string, string> = {
  structured_intake_gaps: "Sparse structured intake — questionnaire coverage gaps.",
  cadence_vs_recency_mismatch: "Cadence vs last-clean timing mismatch (recurring stability).",
  legacy_recency_unstable_for_recurring: "Legacy last-professional-clean horizon unstable for recurring.",
  recurring_price_collapse_vs_prior: "Large drop vs prior estimate — transition pricing worth reviewing.",
  pet_presence_unknown: "Pet presence unclear.",
  pet_impact_vs_presence_conflict: "Pet impact conflicts with presence answers.",
  pet_shedding_missing: "Shedding not specified while pets present.",
  pet_accidents_ambiguous: "Pet accident / litter risk left ambiguous.",
  recency_unknown_dual_channel: "Last professional clean timing unclear.",
  structured_recency_stale_or_unknown: "Structured recency shows stale or unknown baseline.",
  recency_cross_channel_conflict: "Legacy vs structured recency disagree.",
  first_time_unknown: "First-time-with-platform signal unsure.",
  occupancy_vs_access_conflict: "Occupancy vs access/clutter answers disagree.",
  occupancy_vs_clutter_band_conflict: "Occupancy suggests clutter vs light clutter band.",
  clutter_access_vs_band_conflict: "Access pathways vs clutter band mismatch.",
  condition_cross_signal_conflict: "Condition narrative conflicts with kitchen/bathroom signals.",
  kitchen_intensity_missing: "Kitchen intensity not captured.",
};

function readGovernanceStringField(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v.trim() : "unknown";
}

function readCodeList(obj: Record<string, unknown>, key: string, limit: number): string[] {
  const v = obj[key];
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, limit);
}

/**
 * Admin recurring economics view from persisted snapshot root object.
 */
export function buildRecurringEconomicsGovernanceViewFromParsedOutput(
  output: Record<string, unknown> | null | undefined,
): RecurringEconomicsGovernanceViewModel | null {
  if (!output) return null;
  const raw = getRecurringEconomicsGovernanceFromSnapshot(output);
  if (!raw || raw.schemaVersion !== RECURRING_ECONOMICS_GOVERNANCE_SCHEMA) return null;
  const rs = raw.riskScore;
  const riskScore =
    typeof rs === "number" && Number.isFinite(rs)
      ? Math.round(Math.max(0, Math.min(100, rs)))
      : 0;
  const recommendedActions = readCodeList(raw, "recommendedActions", 48).sort((a, b) =>
    a.localeCompare(b),
  );
  return {
    economicRiskLevel: readGovernanceStringField(raw, "economicRiskLevel"),
    maintenanceViability: readGovernanceStringField(raw, "maintenanceViability"),
    recurringDiscountRisk: readGovernanceStringField(raw, "recurringDiscountRisk"),
    resetReviewRecommendation: readGovernanceStringField(raw, "resetReviewRecommendation"),
    marginProtectionSignal: readGovernanceStringField(raw, "marginProtectionSignal"),
    riskScore,
    recommendedActions,
    topEconomicReasons: readCodeList(raw, "economicReasons", 8),
    topMaintenanceReasons: readCodeList(raw, "maintenanceReasons", 8),
  };
}

function pctFromConfidence(raw: unknown): string | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return `${Math.round(raw * 100)}%`;
}

function readClassification(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function readReasoningLines(domainObj: unknown, limit = 6): string[] {
  if (!domainObj || typeof domainObj !== "object" || Array.isArray(domainObj)) return [];
  const rs = (domainObj as Record<string, unknown>).reasoning;
  if (!Array.isArray(rs)) return [];
  return rs
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, limit);
}

/**
 * Builds a null-safe admin view from already-parsed `outputJson` (booking snapshot root).
 * Parsing mirrors `estimateGovernanceSnapshot.ts` (aligned with API snapshot reads).
 */
export function buildEstimateGovernanceViewFromParsedOutput(
  output: Record<string, unknown> | null | undefined,
): EstimateGovernancePanelModel | null {
  if (!output) return null;
  const breakdown = getConfidenceBreakdownFromSnapshot(output);
  const governance = getEscalationGovernanceFromSnapshot(output);

  if (!breakdown && !governance) {
    return {
      hasBreakdown: false,
      hasGovernance: false,
      overallConfidencePct: null,
      confidenceClassification: null,
      escalationSummary: {
        escalationLevel: null,
        severityScore: null,
        recommendedActions: [],
        blockingReasons: [],
        escalationReasons: [],
      },
      weakestDomains: [],
      topUncertaintyDrivers: [],
      intakeStabilityDriverHits: [],
      intakeStabilityLines: [],
      recurringTransitionReasoning: [],
    };
  }

  const topUncertaintyDrivers = getTopUncertaintyDrivers(breakdown, 16);
  const hits = getIntakeStabilityDriverHits(topUncertaintyDrivers);
  const intakeStabilityLines = hits.map(
    (code: string) => INTAKE_STABILITY_COPY[code] ?? `Signal: ${code}`,
  );

  const recurringBlock = breakdown?.recurringTransitionConfidence;
  const recurringTransitionReasoning = readReasoningLines(recurringBlock, 8);

  return {
    hasBreakdown: Boolean(breakdown),
    hasGovernance: Boolean(governance),
    overallConfidencePct: pctFromConfidence(breakdown?.overallConfidence),
    confidenceClassification: readClassification(breakdown?.confidenceClassification),
    escalationSummary: getEscalationSummary(governance),
    weakestDomains: getWeakestConfidenceDomains(breakdown, 5),
    topUncertaintyDrivers,
    intakeStabilityDriverHits: hits,
    intakeStabilityLines,
    recurringTransitionReasoning,
  };
}

export function estimateGovernanceRiskBadge(view: EstimateGovernancePanelModel | null): {
  label: string;
  tone: "neutral" | "info" | "warn" | "danger";
} {
  if (!view?.hasGovernance && !view?.hasBreakdown) {
    return { label: "No governance metadata", tone: "neutral" };
  }
  const level = view.escalationSummary.escalationLevel;
  if (!level) {
    return { label: "Governance n/a", tone: "neutral" };
  }
  if (level === "hard_block") return { label: "Hard block (advisory)", tone: "danger" };
  if (level === "intervention_required") return { label: "Intervention", tone: "danger" };
  if (level === "review") return { label: "Review", tone: "warn" };
  if (level === "monitor") return { label: "Monitor", tone: "info" };
  return { label: "None", tone: "neutral" };
}
