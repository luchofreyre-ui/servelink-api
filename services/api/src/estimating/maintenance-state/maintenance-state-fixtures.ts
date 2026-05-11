import type { MaintenanceStateEvolutionInput } from "./maintenance-state.types";

/** Fixture presets — tests & manual diagnostics only. */
export const weeklyStableHome = (): MaintenanceStateEvolutionInput => ({
  evaluationAnchor: "fixture:weekly_stable",
  createdFromSource: "fixture",
  cadenceIntent: "weekly",
  lastProfessionalCleanDeltaDays: 8,
  recurringOperationalStatus: "active",
  recurringTransition: {
    classification: "high",
    uncertaintyDrivers: [],
  },
  scopeSparseIntake: false,
});

export const biweeklyDriftingHome = (): MaintenanceStateEvolutionInput => ({
  evaluationAnchor: "fixture:biweekly_drifting",
  createdFromSource: "fixture",
  cadenceIntent: "biweekly",
  lastProfessionalCleanDeltaDays: 48,
  simulationElapsedDays: 48,
  recurringTransition: {
    classification: "medium",
    uncertaintyDrivers: ["cadence_vs_recency_mismatch"],
  },
  scopeSparseIntake: false,
});

export const monthlyDegradedHome = (): MaintenanceStateEvolutionInput => ({
  evaluationAnchor: "fixture:monthly_degraded",
  createdFromSource: "fixture",
  cadenceIntent: "monthly",
  lastProfessionalCleanDeltaDays: 160,
  simulationElapsedDays: 160,
  recurringTransition: {
    classification: "low",
    uncertaintyDrivers: ["legacy_recency_unstable_for_recurring"],
  },
  recurringEconomics: {
    maintenanceViability: "watch",
    resetReviewRecommendation: "suggested",
    economicRiskLevel: "medium",
    riskScore: 52,
  },
});

export const missedVisitEscalation = (): MaintenanceStateEvolutionInput => ({
  evaluationAnchor: "fixture:missed_visit",
  createdFromSource: "fixture",
  cadenceIntent: "biweekly",
  lastProfessionalCleanDeltaDays: 35,
  missedVisit: true,
  recurringTransition: {
    classification: "medium",
    uncertaintyDrivers: [],
  },
});

export const repeatedSuccessfulMaintenance = (): MaintenanceStateEvolutionInput => ({
  evaluationAnchor: "fixture:repeat_success",
  createdFromSource: "fixture",
  cadenceIntent: "weekly",
  lastProfessionalCleanDeltaDays: 10,
  consecutiveSuccessfulMaintenanceCount: 5,
  workloadVarianceRatios: [0.82, 0.85, 0.86],
  professionalCleanCompleted: true,
  recurringTransition: { classification: "high", uncertaintyDrivers: [] },
});

export const sparseIntakeInstability = (): MaintenanceStateEvolutionInput => ({
  evaluationAnchor: "fixture:sparse_instability",
  createdFromSource: "fixture",
  cadenceIntent: "weekly",
  lastProfessionalCleanDeltaDays: 95,
  scopeSparseIntake: true,
  recurringTransition: {
    classification: "low",
    uncertaintyDrivers: ["cadence_vs_recency_mismatch", "structured_intake_gaps"],
  },
});

export const petAccumulationPressure = (): MaintenanceStateEvolutionInput => ({
  evaluationAnchor: "fixture:pet_pressure",
  createdFromSource: "fixture",
  cadenceIntent: "biweekly",
  lastProfessionalCleanDeltaDays: 25,
  petAmbiguityDrivers: [
    "pet_presence_unknown",
    "pet_impact_vs_presence_conflict",
  ],
  recurringTransition: {
    classification: "medium",
    uncertaintyDrivers: [],
  },
});

export const cadenceMismatchPressure = (): MaintenanceStateEvolutionInput => ({
  evaluationAnchor: "fixture:cadence_mismatch",
  createdFromSource: "fixture",
  cadenceIntent: "weekly",
  lastProfessionalCleanDeltaDays: 88,
  recurringTransition: {
    classification: "low",
    uncertaintyDrivers: ["cadence_vs_recency_mismatch"],
  },
});

export const highLoadRecovery = (): MaintenanceStateEvolutionInput => ({
  evaluationAnchor: "fixture:high_load_recovery",
  createdFromSource: "fixture",
  cadenceIntent: "monthly",
  lastProfessionalCleanDeltaDays: 22,
  workloadVarianceRatios: [0.84, 0.87, 0.86],
  recurringTransition: { classification: "high", uncertaintyDrivers: [] },
});
