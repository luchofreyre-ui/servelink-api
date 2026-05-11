/**
 * Builds maintenance evolution input/results from estimate-time context.
 * Type-only import from estimator avoids runtime circular dependency.
 */

import type { EstimateEscalationGovernance } from "../escalation/estimate-escalation-governance.types";
import type { EstimateConfidenceBreakdown } from "../confidence/estimate-confidence-breakdown.types";
import type { RecurringEconomicsGovernance } from "../recurring-economics/recurring-economics-governance.types";
import {
  evaluateMaintenanceStateEvolution,
  hashRecordForMaintenanceAnchor,
} from "./maintenance-state-evolution";
import type {
  MaintenanceStateEvolutionInput,
  MaintenanceStateEvolutionResult,
  RecurringCadenceContext,
} from "./maintenance-state.types";
import type { EstimateInput } from "../../modules/estimate/estimator.service";

export function mapRecurringCadenceContextForMaintenanceEvolution(
  input: EstimateInput,
): RecurringCadenceContext {
  const raw = input.recurring_cadence_intent;
  if (raw === "weekly") return "weekly";
  if (raw === "biweekly") return "biweekly";
  if (raw === "monthly") return "monthly";
  if (raw === "none") return "none";
  if (input.service_type === "maintenance") return "unknown";
  return "none";
}

export function mapLastProfessionalCleanDeltaDaysForMaintenanceEvolution(
  input: EstimateInput,
): number | null {
  const r = input.last_pro_clean_recency;
  if (r != null) {
    if (r === "within_30_days") return 18;
    if (r === "days_30_90") return 60;
    if (r === "days_90_plus") return 115;
    if (r === "unknown_or_not_recently") return null;
  }
  const lp = input.last_professional_clean;
  if (lp === "under_2_weeks") return 8;
  if (lp === "2_4_weeks") return 21;
  if (lp === "1_3_months") return 45;
  if (lp === "3_6_months") return 120;
  if (lp === "6_plus_months") return 195;
  return null;
}

export function buildMaintenanceEvolutionInputFromEstimateContext(params: {
  input: EstimateInput;
  confidenceBreakdown: EstimateConfidenceBreakdown;
  escalationGovernance: EstimateEscalationGovernance;
  recurringEconomicsGovernance: RecurringEconomicsGovernance | undefined;
  overrides?: Partial<MaintenanceStateEvolutionInput>;
}): MaintenanceStateEvolutionInput {
  const anchor =
    params.overrides?.evaluationAnchor ??
    hashRecordForMaintenanceAnchor(params.input as unknown as Record<string, unknown>);

  const base: MaintenanceStateEvolutionInput = {
    evaluationAnchor: anchor,
    cadenceIntent: mapRecurringCadenceContextForMaintenanceEvolution(params.input),
    lastProfessionalCleanDeltaDays:
      mapLastProfessionalCleanDeltaDaysForMaintenanceEvolution(params.input),
    escalation: {
      escalationLevel: params.escalationGovernance.escalationLevel,
      recommendedActions: params.escalationGovernance.recommendedActions,
    },
    recurringEconomics: params.recurringEconomicsGovernance
      ? {
          maintenanceViability: params.recurringEconomicsGovernance.maintenanceViability,
          resetReviewRecommendation:
            params.recurringEconomicsGovernance.resetReviewRecommendation,
          economicRiskLevel: params.recurringEconomicsGovernance.economicRiskLevel,
          riskScore: params.recurringEconomicsGovernance.riskScore,
        }
      : undefined,
    recurringTransition: {
      classification:
        params.confidenceBreakdown.recurringTransitionConfidence.classification,
      uncertaintyDrivers:
        params.confidenceBreakdown.recurringTransitionConfidence.uncertaintyDrivers,
    },
    scopeSparseIntake:
      params.confidenceBreakdown.scopeCompletenessConfidence.uncertaintyDrivers.includes(
        "structured_intake_gaps",
      ),
    petAmbiguityDrivers:
      params.confidenceBreakdown.petConfidence.uncertaintyDrivers.filter((d) =>
        [
          "pet_presence_unknown",
          "pet_impact_vs_presence_conflict",
          "pet_shedding_missing",
          "pet_accidents_ambiguous",
        ].includes(d),
      ),
  };

  return {
    ...base,
    ...params.overrides,
    evaluationAnchor:
      params.overrides?.evaluationAnchor ?? anchor,
  };
}

export function evaluateMaintenanceEvolutionFromEstimateContext(params: {
  input: EstimateInput;
  confidenceBreakdown: EstimateConfidenceBreakdown;
  escalationGovernance: EstimateEscalationGovernance;
  recurringEconomicsGovernance: RecurringEconomicsGovernance | undefined;
  overrides?: Partial<MaintenanceStateEvolutionInput>;
}): MaintenanceStateEvolutionResult {
  const evolutionInput = buildMaintenanceEvolutionInputFromEstimateContext(params);
  return evaluateMaintenanceStateEvolution(evolutionInput);
}
