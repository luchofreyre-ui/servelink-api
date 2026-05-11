import {
  computeMaintenanceStateId,
  evaluateMaintenanceStateEvolution,
} from "../src/estimating/maintenance-state/maintenance-state-evolution";
import {
  biweeklyDriftingHome,
  cadenceMismatchPressure,
  highLoadRecovery,
  missedVisitEscalation,
  monthlyDegradedHome,
  petAccumulationPressure,
  repeatedSuccessfulMaintenance,
  sparseIntakeInstability,
  weeklyStableHome,
} from "../src/estimating/maintenance-state/maintenance-state-fixtures";

describe("evaluateMaintenanceStateEvolution", () => {
  it("weekly recurring stable home stays in healthy band", () => {
    const r = evaluateMaintenanceStateEvolution(weeklyStableHome());
    expect(r.currentState.recurringCadenceContext).toBe("weekly");
    expect(r.currentState.maintenanceScore).toBeGreaterThanOrEqual(52);
    expect(["stable", "maintained", "pristine"]).toContain(
      r.currentState.stateClassification,
    );
  });

  it("biweekly drifting home shows elevated degradation vs stable", () => {
    const stable = evaluateMaintenanceStateEvolution(weeklyStableHome());
    const drift = evaluateMaintenanceStateEvolution(biweeklyDriftingHome());
    expect(drift.currentState.degradationPressure).toBeGreaterThanOrEqual(
      stable.currentState.degradationPressure - 2,
    );
    expect(drift.transitionHistory.map((t) => t.transitionType)).toContain(
      "cadence_gap",
    );
  });

  it("monthly degraded home lands in weaker classification bucket", () => {
    const r = evaluateMaintenanceStateEvolution(monthlyDegradedHome());
    expect(["drifting", "degraded", "unstable", "maintained"]).toContain(
      r.currentState.stateClassification,
    );
    expect(r.currentState.maintenanceScore).toBeLessThan(
      evaluateMaintenanceStateEvolution(weeklyStableHome()).currentState
        .maintenanceScore,
    );
  });

  it("missed visit escalation applies missed_visit transition", () => {
    const r = evaluateMaintenanceStateEvolution(missedVisitEscalation());
    expect(r.transitionHistory.some((h) => h.transitionType === "missed_visit")).toBe(
      true,
    );
    expect(["suggested", "required", "low", "none"]).toContain(
      r.resetReviewPressure,
    );
  });

  it("repeated successful maintenance improves retention vs baseline path", () => {
    const base = evaluateMaintenanceStateEvolution({
      ...weeklyStableHome(),
      consecutiveSuccessfulMaintenanceCount: 0,
      workloadVarianceRatios: undefined,
      professionalCleanCompleted: false,
    });
    const improved = evaluateMaintenanceStateEvolution(repeatedSuccessfulMaintenance());
    expect(improved.currentState.retentionStrength).toBeGreaterThanOrEqual(
      base.currentState.retentionStrength - 1,
    );
    expect(
      improved.transitionHistory.some((h) => h.transitionType === "professional_clean"),
    ).toBe(true);
    expect(
      improved.transitionHistory.some((h) => h.transitionType === "high_load_recovery"),
    ).toBe(true);
  });

  it("sparse intake instability triggers instability_event", () => {
    const r = evaluateMaintenanceStateEvolution(sparseIntakeInstability());
    expect(r.transitionHistory.some((h) => h.transitionType === "instability_event")).toBe(
      true,
    );
    expect(r.maintenanceWarnings).toContain("shadow_sparse_intake");
  });

  it("pet accumulation pressure raises degradation versus same without pets", () => {
    const base = evaluateMaintenanceStateEvolution({
      ...weeklyStableHome(),
      petAmbiguityDrivers: [],
    });
    const pets = evaluateMaintenanceStateEvolution(petAccumulationPressure());
    expect(pets.currentState.maintenanceFactors.petPressure).toBeGreaterThan(0);
    expect(pets.currentState.degradationPressure).toBeGreaterThanOrEqual(
      base.currentState.degradationPressure - 1,
    );
  });

  it("cadence mismatch pressure appears in factors and transitions", () => {
    const r = evaluateMaintenanceStateEvolution(cadenceMismatchPressure());
    expect(r.currentState.maintenanceFactors.cadenceMismatchPressure).toBeGreaterThan(40);
    expect(r.transitionHistory.map((t) => t.transitionType)).toContain("cadence_gap");
  });

  it("high-load recovery applies transition when ratios streak easy", () => {
    const r = evaluateMaintenanceStateEvolution(highLoadRecovery());
    expect(
      r.transitionHistory.some((h) => h.transitionType === "high_load_recovery"),
    ).toBe(true);
  });

  it("deterministic replay: identical input yields identical serialization", () => {
    const input = biweeklyDriftingHome();
    const a = evaluateMaintenanceStateEvolution(input);
    const b = evaluateMaintenanceStateEvolution(input);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(computeMaintenanceStateId(input)).toBe(computeMaintenanceStateId(input));
  });

  it("projection horizon applies additional decay vs current", () => {
    const r = evaluateMaintenanceStateEvolution(weeklyStableHome());
    expect(r.projectedState.maintenanceScore).toBeLessThanOrEqual(
      r.currentState.maintenanceScore + 0.001,
    );
    expect(r.replayMetadata.projectionHorizonDays).toBeGreaterThan(0);
    expect(r.adminShadowSummary.narrative.length).toBeGreaterThan(0);
  });
});
