/**
 * Maintenance State Evolution — pure deterministic evaluation (shadow V1).
 */

import { evolutionNarrativeLines } from "./maintenance-state-explanations";
import {
  applyDraftDeltas,
  buildTimeDecayTransition,
  classifyMaintenanceState,
  detectCadenceGapPressure,
  draftToMaintenanceState,
  recurringCadenceToNominalDays,
  transitionTypeOrder,
  type MaintenanceDraft,
} from "./maintenance-state-transitions";
import { MAINTENANCE_STATE_SCHEMA_VERSION } from "./maintenance-state.types";
import type {
  MaintenanceStateConfidence,
  MaintenanceStateCreatedFrom,
  MaintenanceStateEvolutionInput,
  MaintenanceStateEvolutionResult,
  MaintenanceStateRecommendedAction,
  MaintenanceStateTransition,
  ProjectedRiskLevel,
  ResetReviewPressure,
} from "./maintenance-state.types";

export function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Deterministic short anchor from estimate-shaped records (key order–stable). */
export function hashRecordForMaintenanceAnchor(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  const tuples = keys.map((k) => [k, obj[k]] as const);
  return fnv1aHex(JSON.stringify(tuples));
}

function stableSerialize(input: MaintenanceStateEvolutionInput): string {
  const ordered = {
    evaluationAnchor: input.evaluationAnchor,
    cadenceIntent: input.cadenceIntent,
    lastProfessionalCleanDeltaDays: input.lastProfessionalCleanDeltaDays,
    simulationElapsedDays: input.simulationElapsedDays ?? null,
    recurringOperationalStatus: input.recurringOperationalStatus ?? "unknown",
    missedVisit: Boolean(input.missedVisit),
    professionalCleanCompleted: Boolean(input.professionalCleanCompleted),
    consecutiveSuccessfulMaintenanceCount:
      input.consecutiveSuccessfulMaintenanceCount ?? 0,
    workloadVarianceRatios: [...(input.workloadVarianceRatios ?? [])].sort(
      (a, b) => a - b,
    ),
    escalation: input.escalation
      ? {
          escalationLevel: input.escalation.escalationLevel,
          recommendedActions: [...input.escalation.recommendedActions].sort(),
        }
      : null,
    recurringEconomics: input.recurringEconomics
      ? { ...input.recurringEconomics }
      : null,
    recurringTransition: input.recurringTransition
      ? {
          classification: input.recurringTransition.classification,
          uncertaintyDrivers: [
            ...input.recurringTransition.uncertaintyDrivers,
          ].sort(),
        }
      : null,
    scopeSparseIntake: Boolean(input.scopeSparseIntake),
    petAmbiguityDrivers: [...(input.petAmbiguityDrivers ?? [])].sort(),
  };
  return JSON.stringify(ordered);
}

export function computeMaintenanceStateId(
  input: MaintenanceStateEvolutionInput,
  suffix?: string,
): string {
  const base = fnv1aHex(`${MAINTENANCE_STATE_SCHEMA_VERSION}:${stableSerialize(input)}`);
  return suffix ? `mse:${base}:${suffix}` : `mse:${base}`;
}

function computeMaintenanceConfidence(
  input: MaintenanceStateEvolutionInput,
): MaintenanceStateConfidence {
  const reasons: string[] = [];
  let historyDepthReliability = 55;
  let recencyReliability = 60;
  let cadenceConsistencyReliability = 62;
  let workloadVarianceReliability = 40;
  let recurringMaintenanceStreakReliability = 45;

  const streak = input.consecutiveSuccessfulMaintenanceCount ?? 0;
  if (streak >= 3) {
    recurringMaintenanceStreakReliability = Math.min(
      95,
      52 + streak * 12,
    );
    historyDepthReliability = Math.min(92, historyDepthReliability + streak * 10);
  } else if (streak > 0) {
    recurringMaintenanceStreakReliability = 50 + streak * 14;
    historyDepthReliability = Math.min(85, historyDepthReliability + streak * 8);
  }

  if (input.lastProfessionalCleanDeltaDays != null) {
    recencyReliability = Math.min(92, recencyReliability + 18);
  } else {
    recencyReliability = 38;
    reasons.push("unknown_professional_clean_horizon");
  }

  if (
    input.cadenceIntent !== "unknown" &&
    input.cadenceIntent !== "none"
  ) {
    cadenceConsistencyReliability = Math.min(
      90,
      cadenceConsistencyReliability + 12,
    );
  } else {
    cadenceConsistencyReliability = 44;
    reasons.push("cadence_context_weak");
  }

  const ratios = input.workloadVarianceRatios ?? [];
  if (ratios.length >= 2) {
    workloadVarianceReliability = Math.min(88, 48 + ratios.length * 14);
  } else if (ratios.length === 1) {
    workloadVarianceReliability = 52;
  }

  if (input.scopeSparseIntake) {
    historyDepthReliability = Math.max(22, historyDepthReliability - 22);
    recencyReliability = Math.max(25, recencyReliability - 15);
    reasons.push("sparse_structured_intake");
  }

  const pets = input.petAmbiguityDrivers?.length ?? 0;
  if (pets > 0) {
    recencyReliability = Math.max(28, recencyReliability - Math.min(18, pets * 5));
    reasons.push("pet_ambiguity_present");
  }

  const dims = [
    historyDepthReliability,
    recencyReliability,
    cadenceConsistencyReliability,
    workloadVarianceReliability,
    recurringMaintenanceStreakReliability,
  ];
  const score =
    Math.round(
      (dims.reduce((a, b) => a + b, 0) / dims.length) * 1000,
    ) / 1000;

  return {
    score,
    historyDepthReliability,
    recencyReliability,
    cadenceConsistencyReliability,
    workloadVarianceReliability,
    recurringMaintenanceStreakReliability,
    reasons: [...new Set(reasons)].sort((a, b) => a.localeCompare(b)),
  };
}

function buildBootstrapDraft(
  input: MaintenanceStateEvolutionInput,
  factors: MaintenanceDraft["maintenanceFactors"],
): MaintenanceDraft {
  let maintenanceScore = 68;
  let degradationPressure = 32;
  let retentionStrength = 58;
  const delta = input.lastProfessionalCleanDeltaDays;

  if (delta != null) {
    if (delta <= 10) {
      maintenanceScore += 14;
      degradationPressure -= 12;
      retentionStrength += 10;
    } else if (delta <= 21) {
      maintenanceScore += 8;
      degradationPressure -= 8;
      retentionStrength += 6;
    } else if (delta <= 45) {
      maintenanceScore += 2;
      degradationPressure -= 4;
    } else if (delta <= 90) {
      maintenanceScore -= 10;
      degradationPressure += 12;
      retentionStrength -= 8;
    } else if (delta <= 150) {
      maintenanceScore -= 22;
      degradationPressure += 22;
      retentionStrength -= 12;
    } else {
      maintenanceScore -= 34;
      degradationPressure += 30;
      retentionStrength -= 16;
    }
  }

  maintenanceScore -= Math.min(14, factors.petPressure * 0.12);
  degradationPressure += Math.min(16, factors.petPressure * 0.14);
  maintenanceScore -= Math.min(12, factors.clutterPressure * 0.11);
  degradationPressure += Math.min(14, factors.clutterPressure * 0.13);
  maintenanceScore -= Math.min(12, factors.conditionPressure * 0.11);
  degradationPressure += Math.min(12, factors.conditionPressure * 0.12);
  degradationPressure += Math.min(18, factors.cadenceMismatchPressure * 0.2);
  maintenanceScore -= Math.min(10, factors.intakeSparsityPressure * 0.1);
  degradationPressure += Math.min(14, factors.intakeSparsityPressure * 0.14);
  degradationPressure += Math.min(20, factors.recurringWeaknessPressure * 0.18);
  maintenanceScore -= Math.min(16, factors.recurringWeaknessPressure * 0.15);

  return {
    maintenanceScore: Math.min(100, Math.max(0, maintenanceScore)),
    degradationPressure: Math.min(100, Math.max(0, degradationPressure)),
    retentionStrength: Math.min(100, Math.max(0, retentionStrength)),
    accumulatedRiskSignals: [],
    maintenanceFactors: { ...factors },
    recurringCadenceContext: input.cadenceIntent,
    lastKnownProfessionalCleanDeltaDays: input.lastProfessionalCleanDeltaDays,
  };
}

function computeMaintenanceFactors(
  input: MaintenanceStateEvolutionInput,
): MaintenanceDraft["maintenanceFactors"] {
  const pet = input.petAmbiguityDrivers?.length ?? 0;
  const petPressure = Math.min(100, pet * 22);

  const clutterDrivers =
    input.recurringTransition?.uncertaintyDrivers.filter((d) =>
      d.includes("clutter"),
    ).length ?? 0;
  const clutterPressure = Math.min(100, clutterDrivers * 26);

  const conditionDrivers =
    input.recurringTransition?.uncertaintyDrivers.filter((d) =>
      d.includes("condition"),
    ).length ?? 0;
  const conditionPressure = Math.min(100, conditionDrivers * 26);

  let cadenceMismatchPressure = 0;
  const rt = input.recurringTransition?.uncertaintyDrivers ?? [];
  if (rt.includes("cadence_vs_recency_mismatch"))
    cadenceMismatchPressure += 52;
  if (rt.includes("legacy_recency_unstable_for_recurring"))
    cadenceMismatchPressure += 44;

  const intakeSparsityPressure = input.scopeSparseIntake ? 48 : 0;

  let recurringWeaknessPressure = 0;
  const cls = input.recurringTransition?.classification;
  if (cls === "critical") recurringWeaknessPressure += 72;
  else if (cls === "low") recurringWeaknessPressure += 48;
  else if (cls === "medium") recurringWeaknessPressure += 22;

  const econ = input.recurringEconomics;
  if (econ?.maintenanceViability === "unstable") recurringWeaknessPressure += 24;
  if (econ?.maintenanceViability === "watch") recurringWeaknessPressure += 12;
  if (econ?.economicRiskLevel === "critical") recurringWeaknessPressure += 18;
  if (econ?.economicRiskLevel === "high") recurringWeaknessPressure += 10;

  const rtDrivers = input.recurringTransition?.uncertaintyDrivers ?? [];
  if (rtDrivers.includes("recurring_price_collapse_vs_prior"))
    recurringWeaknessPressure += 28;

  recurringWeaknessPressure = Math.min(100, recurringWeaknessPressure);

  return {
    petPressure,
    clutterPressure,
    conditionPressure,
    cadenceMismatchPressure,
    intakeSparsityPressure,
    recurringWeaknessPressure,
  };
}

export function unstableGateFromSignals(input: MaintenanceStateEvolutionInput): boolean {
  const esc = input.escalation?.escalationLevel;
  if (
    esc === "hard_block" ||
    esc === "intervention_required"
  )
    return true;

  const actions = new Set(input.escalation?.recommendedActions ?? []);
  if (actions.has("recommend_recurring_reset_review")) {
    const econ = input.recurringEconomics;
    if (
      econ?.resetReviewRecommendation === "required" ||
      econ?.maintenanceViability === "unstable"
    )
      return true;
  }

  if (input.recurringTransition?.classification === "critical") return true;

  const econ = input.recurringEconomics;
  if (
    econ?.maintenanceViability === "unstable" &&
    (econ.riskScore ?? 0) >= 72
  )
    return true;

  return false;
}

function elapsedDaysForSimulation(input: MaintenanceStateEvolutionInput): number {
  if (
    typeof input.simulationElapsedDays === "number" &&
    Number.isFinite(input.simulationElapsedDays) &&
    input.simulationElapsedDays >= 0
  ) {
    return Math.min(540, Math.floor(input.simulationElapsedDays));
  }
  const delta = input.lastProfessionalCleanDeltaDays;
  if (delta != null && delta >= 0) return Math.min(540, Math.floor(delta));
  return recurringCadenceToNominalDays(input.cadenceIntent);
}

function projectedRiskLevel(args: {
  degradation: number;
  maintenanceScore: number;
  econRisk?: string | null;
}): ProjectedRiskLevel {
  const econOrder: ProjectedRiskLevel[] = [
    "none",
    "low",
    "medium",
    "high",
    "critical",
  ];
  let base: ProjectedRiskLevel = "none";
  if (args.maintenanceScore <= 28 || args.degradation >= 78) base = "critical";
  else if (args.maintenanceScore <= 42 || args.degradation >= 64) base = "high";
  else if (args.maintenanceScore <= 56 || args.degradation >= 50) base = "medium";
  else if (args.maintenanceScore <= 72 || args.degradation >= 38) base = "low";

  if (args.econRisk && econOrder.includes(args.econRisk as ProjectedRiskLevel)) {
    const idx = Math.max(
      econOrder.indexOf(base),
      econOrder.indexOf(args.econRisk as ProjectedRiskLevel),
    );
    return econOrder[idx]!;
  }
  return base;
}

function resetReviewPressureFromSignals(args: {
  missedVisit: boolean;
  econReset?: string | null;
  escalationActions: readonly string[];
  cadenceMismatch: boolean;
}): ResetReviewPressure {
  if (args.missedVisit && args.cadenceMismatch) return "required";
  if (args.missedVisit) return "suggested";
  if (args.econReset === "required") return "required";
  if (
    args.escalationActions.includes("recommend_recurring_reset_review") &&
    args.cadenceMismatch
  )
    return "required";
  if (
    args.econReset === "suggested" ||
    args.escalationActions.includes("recommend_recurring_reset_review")
  )
    return "suggested";
  if (args.cadenceMismatch) return "low";
  return "none";
}

function recommendedShadowActions(params: {
  resetPressure: ResetReviewPressure;
  sparseIntake: boolean;
  cadenceMismatch: boolean;
  instability: boolean;
}): MaintenanceStateRecommendedAction[] {
  const out: MaintenanceStateRecommendedAction[] = [];
  if (
    params.resetPressure === "required" ||
    params.resetPressure === "suggested"
  ) {
    out.push("review_reset_alignment_shadow");
  }
  if (params.cadenceMismatch) {
    out.push("review_cadence_vs_recency_shadow");
  }
  if (params.sparseIntake) {
    out.push("collect_condition_evidence_shadow");
  }
  if (params.instability || params.resetPressure !== "none") {
    out.push("monitor_maintenance_trajectory");
  }
  if (!out.length) out.push("no_shadow_action");
  return [...new Set(out)];
}

function draftMatchesUnstableThreshold(draft: MaintenanceDraft): boolean {
  return (
    classifyMaintenanceState({
      maintenanceScore: draft.maintenanceScore,
      degradationPressure: draft.degradationPressure,
      unstableGate: false,
    }) === "unstable"
  );
}

function draftIsUnstable(
  input: MaintenanceStateEvolutionInput,
  draft: MaintenanceDraft,
): boolean {
  return unstableGateFromSignals(input) || draftMatchesUnstableThreshold(draft);
}

function cloneDraft(d: MaintenanceDraft): MaintenanceDraft {
  return {
    maintenanceScore: d.maintenanceScore,
    degradationPressure: d.degradationPressure,
    retentionStrength: d.retentionStrength,
    accumulatedRiskSignals: [...d.accumulatedRiskSignals],
    maintenanceFactors: { ...d.maintenanceFactors },
    recurringCadenceContext: d.recurringCadenceContext,
    lastKnownProfessionalCleanDeltaDays: d.lastKnownProfessionalCleanDeltaDays,
  };
}

function applyOrderedTransitions(params: {
  draft: MaintenanceDraft;
  input: MaintenanceStateEvolutionInput;
  confidence: MaintenanceStateConfidence;
  createdFrom: MaintenanceStateCreatedFrom;
  baseId: string;
}): { history: MaintenanceStateTransition[]; draft: MaintenanceDraft } {
  const history: MaintenanceStateTransition[] = [];
  let draft = params.draft;
  const cadenceDays = recurringCadenceToNominalDays(draft.recurringCadenceContext);
  const elapsed = elapsedDaysForSimulation(params.input);

  const pushTransition = (
    type: MaintenanceStateTransition["transitionType"],
    reasons: string[],
    deltas: { scoreDelta: number; degradationDelta: number; retentionDelta: number },
    riskCodes: string[],
  ) => {
    const prevState = draftToMaintenanceState({
      draft,
      maintenanceStateId: `${params.baseId}:step:${history.length}`,
      maintenanceConfidence: params.confidence,
      createdFrom: params.createdFrom,
      unstableGate: draftIsUnstable(params.input, draft),
    });

    applyDraftDeltas(draft, {
      ...deltas,
      riskCodes,
    });

    const nextState = draftToMaintenanceState({
      draft,
      maintenanceStateId: `${params.baseId}:step:${history.length + 1}`,
      maintenanceConfidence: params.confidence,
      createdFrom: params.createdFrom,
      unstableGate: draftIsUnstable(params.input, draft),
    });

    history.push({
      previousState: prevState,
      transitionType: type,
      transitionReasons: reasons,
      degradationDelta: Math.round(deltas.degradationDelta * 1000) / 1000,
      retentionDelta: Math.round(deltas.retentionDelta * 1000) / 1000,
      resultingState: nextState,
    });
  };

  // time_decay
  {
    const td = buildTimeDecayTransition({
      previousState: draftToMaintenanceState({
        draft,
        maintenanceStateId: `${params.baseId}:pre`,
        maintenanceConfidence: params.confidence,
        createdFrom: params.createdFrom,
        unstableGate: draftIsUnstable(params.input, draft),
      }),
      elapsedDays: elapsed,
      cadenceDays,
      reasons: [],
    });
    pushTransition(
      "time_decay",
      [
        `elapsed_days=${elapsed}`,
        `cadence_nominal_days=${cadenceDays}`,
      ],
      {
        scoreDelta: td.scoreDelta,
        degradationDelta: td.degradationDelta,
        retentionDelta: td.retentionDelta,
      },
      td.riskCodes,
    );
  }

  // cadence_gap
  const gapPressure = detectCadenceGapPressure({
    deltaDays: params.input.lastProfessionalCleanDeltaDays,
    cadenceDays,
  });
  if (gapPressure > 0.5) {
    pushTransition(
      "cadence_gap",
      [`modeled_gap_pressure=${Math.round(gapPressure * 100) / 100}`],
      {
        scoreDelta: -Math.min(14, gapPressure * 0.55),
        degradationDelta: Math.min(18, gapPressure * 0.72),
        retentionDelta: -Math.min(12, gapPressure * 0.48),
      },
      ["cadence_gap_pressure"],
    );
  }

  // instability_event
  const instability =
    (params.input.recurringTransition?.classification === "low" ||
      params.input.recurringTransition?.classification === "critical") &&
    ((params.input.recurringTransition?.uncertaintyDrivers.length ?? 0) > 0 ||
      (params.input.recurringEconomics?.riskScore ?? 0) >= 48);

  const sparseMismatch =
    Boolean(params.input.scopeSparseIntake) &&
    (params.input.recurringTransition?.uncertaintyDrivers.includes(
      "cadence_vs_recency_mismatch",
    ) ??
      false);

  if (instability || sparseMismatch) {
    pushTransition(
      "instability_event",
      [
        ...(instability ? ["recurring_lane_pressure"] : []),
        ...(sparseMismatch ? ["sparse_intake_with_cadence_recency_mismatch"] : []),
      ],
      {
        scoreDelta: sparseMismatch ? -12 : -10,
        degradationDelta: sparseMismatch ? 18 : 14,
        retentionDelta: sparseMismatch ? -10 : -8,
      },
      ["instability_shadow_event"],
    );
  }

  // missed_visit
  if (params.input.missedVisit) {
    pushTransition(
      "missed_visit",
      ["missed_scheduled_maintenance_occurrence"],
      {
        scoreDelta: -18,
        degradationDelta: 28,
        retentionDelta: -14,
      },
      ["missed_visit_pressure"],
    );
  }

  // professional_clean
  if (params.input.professionalCleanCompleted) {
    pushTransition(
      "professional_clean",
      ["professional_maintenance_visit_completed"],
      {
        scoreDelta: 16,
        degradationDelta: -18,
        retentionDelta: 22,
      },
      ["professional_visit_recovery"],
    );
  }

  // high_load_recovery — repeated easier-than-expected workload
  const ratios = params.input.workloadVarianceRatios ?? [];
  const easyStreak = ratios.filter((r) => r > 0 && r <= 0.88).length;
  if (easyStreak >= 2) {
    pushTransition(
      "high_load_recovery",
      [`easy_workload_ratio_streak=${easyStreak}`],
      {
        scoreDelta: 6,
        degradationDelta: -6,
        retentionDelta: 8,
      },
      ["high_load_recovery_shadow"],
    );
  }

  return { history, draft };
}

export function evaluateMaintenanceStateEvolution(
  input: MaintenanceStateEvolutionInput,
): MaintenanceStateEvolutionResult {
  const confidence = computeMaintenanceConfidence(input);
  const factors = computeMaintenanceFactors(input);
  const bootstrap = buildBootstrapDraft(input, factors);
  const createdFrom: MaintenanceStateCreatedFrom = {
    source: input.createdFromSource ?? "estimate_shadow_v1",
    anchor: input.evaluationAnchor,
  };

  const baseId = computeMaintenanceStateId(input);

  const { history, draft } = applyOrderedTransitions({
    draft: bootstrap,
    input,
    confidence,
    createdFrom,
    baseId,
  });

  const currentState = draftToMaintenanceState({
    draft,
    maintenanceStateId: computeMaintenanceStateId(input, "current"),
    maintenanceConfidence: confidence,
    createdFrom,
    unstableGate: draftIsUnstable(input, draft),
  });

  const cadenceDays = recurringCadenceToNominalDays(draft.recurringCadenceContext);
  const projDraft = cloneDraft(draft);
  const td = buildTimeDecayTransition({
    previousState: currentState,
    elapsedDays: cadenceDays,
    cadenceDays,
    reasons: [],
  });
  applyDraftDeltas(projDraft, {
    scoreDelta: td.scoreDelta,
    degradationDelta: td.degradationDelta,
    retentionDelta: td.retentionDelta,
    riskCodes: [...td.riskCodes, "projection_horizon_decay"],
  });

  const projectedState = draftToMaintenanceState({
    draft: projDraft,
    maintenanceStateId: computeMaintenanceStateId(input, "projected"),
    maintenanceConfidence: confidence,
    createdFrom,
    unstableGate: draftIsUnstable(input, projDraft),
  });

  const escalationActions = input.escalation?.recommendedActions ?? [];
  const cadenceMismatch =
    Boolean(
      input.recurringTransition?.uncertaintyDrivers.includes(
        "cadence_vs_recency_mismatch",
      ),
    ) || factors.cadenceMismatchPressure >= 40;

  const resetReviewPressure = resetReviewPressureFromSignals({
    missedVisit: Boolean(input.missedVisit),
    econReset: input.recurringEconomics?.resetReviewRecommendation ?? null,
    escalationActions,
    cadenceMismatch,
  });

  const projectedRisk = projectedRiskLevel({
    degradation: projectedState.degradationPressure,
    maintenanceScore: projectedState.maintenanceScore,
    econRisk: input.recurringEconomics?.economicRiskLevel ?? null,
  });

  const warnings: string[] = [];
  if (history.some((h) => h.transitionType === "time_decay"))
    warnings.push("shadow_time_decay");
  if (history.some((h) => h.transitionType === "cadence_gap"))
    warnings.push("shadow_cadence_gap");
  if (history.some((h) => h.transitionType === "instability_event"))
    warnings.push("shadow_instability");
  if (history.some((h) => h.transitionType === "missed_visit"))
    warnings.push("shadow_missed_visit");
  if (history.some((h) => h.transitionType === "professional_clean"))
    warnings.push("shadow_professional_touch_up");
  if (history.some((h) => h.transitionType === "high_load_recovery"))
    warnings.push("shadow_high_load_recovery");
  if (input.scopeSparseIntake) warnings.push("shadow_sparse_intake");
  if (input.lastProfessionalCleanDeltaDays == null)
    warnings.push("shadow_unknown_recency");

  const recommendedActions = recommendedShadowActions({
    resetPressure: resetReviewPressure,
    sparseIntake: Boolean(input.scopeSparseIntake),
    cadenceMismatch,
    instability: history.some((h) => h.transitionType === "instability_event"),
  });

  const replayMetadata = {
    schemaVersion: MAINTENANCE_STATE_SCHEMA_VERSION,
    transitionStepCount: history.length,
    orderedTransitionTypes: transitionTypeOrder().filter((t) =>
      history.some((h) => h.transitionType === t),
    ),
    projectionHorizonDays: cadenceDays,
  };

  const narrative = evolutionNarrativeLines({
    currentClassification: currentState.stateClassification,
    projectedClassification: projectedState.stateClassification,
    transitionTypes: replayMetadata.orderedTransitionTypes,
    resetReviewPressure,
  });

  return {
    currentState,
    projectedState,
    transitionHistory: history,
    projectedRiskLevel: projectedRisk,
    resetReviewPressure,
    maintenanceWarnings: [...new Set(warnings)].sort((a, b) =>
      a.localeCompare(b),
    ),
    recommendedActions,
    replayMetadata,
    adminShadowSummary: {
      narrative,
      degradationPressure: currentState.degradationPressure,
      retentionStrength: currentState.retentionStrength,
      maintenanceScore: currentState.maintenanceScore,
      projectedMaintenanceScore: projectedState.maintenanceScore,
      projectedDegradationPressure: projectedState.degradationPressure,
      projectedRetentionStrength: projectedState.retentionStrength,
    },
  };
}
