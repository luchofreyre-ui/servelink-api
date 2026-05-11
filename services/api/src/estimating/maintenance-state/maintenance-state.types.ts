/**
 * Maintenance State Evolution — canonical shadow-mode representation (V1).
 * Advisory only; no pricing, enforcement, or autonomous ops.
 */

export const MAINTENANCE_STATE_SCHEMA_VERSION =
  "maintenance_state_evolution_v1" as const;

export type StateClassification =
  | "pristine"
  | "stable"
  | "maintained"
  | "drifting"
  | "degraded"
  | "unstable";

export type RecurringCadenceContext =
  | "weekly"
  | "every_10_days"
  | "biweekly"
  | "monthly"
  | "none"
  | "unknown";

export type RecurringOperationalStatus =
  | "active"
  | "paused"
  | "none"
  | "unknown";

export type MaintenanceStateCreatedFromSource =
  | "estimate_shadow_v1"
  | "fixture"
  | "replay";

export type MaintenanceStateCreatedFrom = {
  source: MaintenanceStateCreatedFromSource;
  /** Stable anchor (e.g. booking id, test id, hashed intake). */
  anchor: string;
};

export type MaintenanceFactors = {
  petPressure: number;
  clutterPressure: number;
  conditionPressure: number;
  cadenceMismatchPressure: number;
  intakeSparsityPressure: number;
  recurringWeaknessPressure: number;
};

/** Separate from estimator aggregate confidence — reflects reliability of evolution inputs. */
export type MaintenanceStateConfidence = {
  score: number;
  /** 0–100 each; higher = more reliable signal in that dimension. */
  historyDepthReliability: number;
  recencyReliability: number;
  cadenceConsistencyReliability: number;
  workloadVarianceReliability: number;
  recurringMaintenanceStreakReliability: number;
  reasons: string[];
};

export type TransitionType =
  | "time_decay"
  | "professional_clean"
  | "missed_visit"
  | "cadence_gap"
  | "high_load_recovery"
  | "instability_event";

export type MaintenanceState = {
  schemaVersion: typeof MAINTENANCE_STATE_SCHEMA_VERSION;
  maintenanceStateId: string;
  stateClassification: StateClassification;
  /** 0–100; higher = healthier maintained condition. */
  maintenanceScore: number;
  maintenanceConfidence: MaintenanceStateConfidence;
  /** 0–100; upward pressure on drift/degradation. */
  degradationPressure: number;
  /** 0–100; resilience / ability to hold cleanliness between visits. */
  retentionStrength: number;
  recurringCadenceContext: RecurringCadenceContext;
  lastKnownProfessionalCleanDeltaDays: number | null;
  accumulatedRiskSignals: string[];
  maintenanceFactors: MaintenanceFactors;
  createdFrom: MaintenanceStateCreatedFrom;
};

export type MaintenanceStateTransition = {
  previousState: MaintenanceState;
  transitionType: TransitionType;
  transitionReasons: string[];
  degradationDelta: number;
  retentionDelta: number;
  resultingState: MaintenanceState;
};

export type MaintenanceReplayMetadata = {
  schemaVersion: typeof MAINTENANCE_STATE_SCHEMA_VERSION;
  transitionStepCount: number;
  orderedTransitionTypes: TransitionType[];
  projectionHorizonDays: number;
};

export type ProjectedRiskLevel =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ResetReviewPressure = "none" | "low" | "suggested" | "required";

export type MaintenanceStateRecommendedAction =
  | "no_shadow_action"
  | "monitor_maintenance_trajectory"
  | "review_reset_alignment_shadow"
  | "collect_condition_evidence_shadow"
  | "review_cadence_vs_recency_shadow";

/** Compact admin-only narrative payload — shadow lane diagnostics. */
export type MaintenanceStateEvolutionAdminSummary = {
  narrative: string[];
  degradationPressure: number;
  retentionStrength: number;
  maintenanceScore: number;
  projectedMaintenanceScore: number;
  projectedDegradationPressure: number;
  projectedRetentionStrength: number;
};

export type MaintenanceStateEvolutionResult = {
  currentState: MaintenanceState;
  projectedState: MaintenanceState;
  transitionHistory: MaintenanceStateTransition[];
  projectedRiskLevel: ProjectedRiskLevel;
  resetReviewPressure: ResetReviewPressure;
  maintenanceWarnings: string[];
  recommendedActions: MaintenanceStateRecommendedAction[];
  replayMetadata: MaintenanceReplayMetadata;
  adminShadowSummary: MaintenanceStateEvolutionAdminSummary;
};

/** Minimal escalation slice — avoids tight coupling to full governance object. */
export type MaintenanceEvolutionEscalationSlice = {
  escalationLevel: string;
  recommendedActions: readonly string[];
};

/** Minimal recurring economics slice for instability routing. */
export type MaintenanceEvolutionRecurringEconomicsSlice = {
  maintenanceViability: string;
  resetReviewRecommendation: string;
  economicRiskLevel: string;
  riskScore: number;
};

/** Minimal recurring-transition slice from confidence breakdown. */
export type MaintenanceEvolutionRecurringTransitionSlice = {
  classification: string;
  uncertaintyDrivers: readonly string[];
};

export type MaintenanceStateEvolutionInput = {
  /** Stable anchor for deterministic ids (booking id, synthetic test key, etc.). */
  evaluationAnchor: string;
  createdFromSource?: MaintenanceStateCreatedFromSource;
  cadenceIntent: RecurringCadenceContext;
  /** Primary timeline — days since last professional clean (null = unknown). */
  lastProfessionalCleanDeltaDays: number | null;
  /** Simulation window for time decay (defaults derived from delta + cadence). */
  simulationElapsedDays?: number | null;
  recurringOperationalStatus?: RecurringOperationalStatus;
  missedVisit?: boolean;
  /** When true, models a completed maintenance-class visit improving retention. */
  professionalCleanCompleted?: boolean;
  consecutiveSuccessfulMaintenanceCount?: number;
  /** Ratios actualMinutes / estimatedMinutes; values &lt; 1 imply lighter-than-expected workload. */
  workloadVarianceRatios?: readonly number[];
  escalation?: MaintenanceEvolutionEscalationSlice | null;
  recurringEconomics?: MaintenanceEvolutionRecurringEconomicsSlice | null;
  recurringTransition?: MaintenanceEvolutionRecurringTransitionSlice | null;
  scopeSparseIntake?: boolean;
  petAmbiguityDrivers?: readonly string[];
};
