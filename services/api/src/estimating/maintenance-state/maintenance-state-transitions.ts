/**
 * Deterministic transition primitives — bounded deltas, explainable reasons.
 */

import { MAINTENANCE_STATE_SCHEMA_VERSION } from "./maintenance-state.types";
import type {
  MaintenanceFactors,
  MaintenanceState,
  MaintenanceStateConfidence,
  MaintenanceStateCreatedFrom,
  RecurringCadenceContext,
  TransitionType,
} from "./maintenance-state.types";

export function recurringCadenceToNominalDays(
  c: RecurringCadenceContext,
): number {
  switch (c) {
    case "weekly":
      return 7;
    case "every_10_days":
      return 10;
    case "biweekly":
      return 14;
    case "monthly":
      return 30;
    default:
      return 14;
  }
}

export type MaintenanceDraft = {
  maintenanceScore: number;
  degradationPressure: number;
  retentionStrength: number;
  accumulatedRiskSignals: string[];
  maintenanceFactors: MaintenanceFactors;
  recurringCadenceContext: RecurringCadenceContext;
  lastKnownProfessionalCleanDeltaDays: number | null;
};

export function clamp01(x: number): number {
  return Math.min(100, Math.max(0, x));
}

export function applyDraftDeltas(
  d: MaintenanceDraft,
  params: {
    scoreDelta: number;
    degradationDelta: number;
    retentionDelta: number;
    riskCodes?: string[];
  },
): void {
  d.maintenanceScore = clamp01(d.maintenanceScore + params.scoreDelta);
  d.degradationPressure = clamp01(d.degradationPressure + params.degradationDelta);
  d.retentionStrength = clamp01(d.retentionStrength + params.retentionDelta);
  if (params.riskCodes?.length) {
    d.accumulatedRiskSignals = [
      ...new Set([...d.accumulatedRiskSignals, ...params.riskCodes]),
    ].sort((a, b) => a.localeCompare(b));
  }
}

export function classifyMaintenanceState(args: {
  maintenanceScore: number;
  degradationPressure: number;
  unstableGate: boolean;
}): MaintenanceState["stateClassification"] {
  const { maintenanceScore: s, degradationPressure: g, unstableGate } = args;
  if (unstableGate || s <= 20 || g >= 88) return "unstable";
  if (s <= 36 || g >= 72) return "degraded";
  if (s <= 50 || g >= 58) return "drifting";
  if (s <= 66 || g >= 46) return "maintained";
  if (s <= 82) return "stable";
  return "pristine";
}

export function draftToMaintenanceState(params: {
  draft: MaintenanceDraft;
  maintenanceStateId: string;
  maintenanceConfidence: MaintenanceStateConfidence;
  createdFrom: MaintenanceStateCreatedFrom;
  unstableGate: boolean;
}): MaintenanceState {
  const cls = classifyMaintenanceState({
    maintenanceScore: params.draft.maintenanceScore,
    degradationPressure: params.draft.degradationPressure,
    unstableGate: params.unstableGate,
  });
  return {
    schemaVersion: MAINTENANCE_STATE_SCHEMA_VERSION,
    maintenanceStateId: params.maintenanceStateId,
    stateClassification: cls,
    maintenanceScore: Math.round(params.draft.maintenanceScore * 1000) / 1000,
    maintenanceConfidence: params.maintenanceConfidence,
    degradationPressure:
      Math.round(params.draft.degradationPressure * 1000) / 1000,
    retentionStrength: Math.round(params.draft.retentionStrength * 1000) / 1000,
    recurringCadenceContext: params.draft.recurringCadenceContext,
    lastKnownProfessionalCleanDeltaDays:
      params.draft.lastKnownProfessionalCleanDeltaDays,
    accumulatedRiskSignals: [...params.draft.accumulatedRiskSignals].sort((a, b) =>
      a.localeCompare(b),
    ),
    maintenanceFactors: { ...params.draft.maintenanceFactors },
    createdFrom: params.createdFrom,
  };
}

export function buildTimeDecayTransition(args: {
  previousState: MaintenanceState;
  elapsedDays: number;
  cadenceDays: number;
  reasons: string[];
}): {
  degradationDelta: number;
  retentionDelta: number;
  scoreDelta: number;
  riskCodes: string[];
} {
  void args.previousState;
  void args.reasons;
  const cadenceDays = Math.max(1, args.cadenceDays);
  const u = Math.max(0, args.elapsedDays / cadenceDays);
  const degradationDelta = Math.min(22, u * 8);
  const retentionDelta = -Math.min(18, u * 6);
  const scoreDelta = -Math.min(25, u * 7);
  return {
    degradationDelta,
    retentionDelta,
    scoreDelta,
    riskCodes: ["time_decay_applied"],
  };
}

export function detectCadenceGapPressure(args: {
  deltaDays: number | null;
  cadenceDays: number;
}): number {
  if (args.deltaDays == null || args.deltaDays <= 0) return 0;
  const cadenceDays = Math.max(1, args.cadenceDays);
  const ratio = args.deltaDays / cadenceDays;
  if (ratio <= 1.25) return 0;
  return Math.min(22, (ratio - 1.25) * 18);
}

export function transitionTypeOrder(): TransitionType[] {
  return [
    "time_decay",
    "cadence_gap",
    "instability_event",
    "missed_visit",
    "professional_clean",
    "high_load_recovery",
  ];
}
