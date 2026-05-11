import type {
  ConfidenceClassification,
  EstimateConfidenceBreakdown,
} from "../src/estimating/confidence/estimate-confidence-breakdown.types";
import type { EstimateEscalationGovernance } from "../src/estimating/escalation/estimate-escalation-governance.types";
import { evaluateRecurringEconomicsGovernance } from "../src/estimating/recurring-economics/recurring-economics-governance";

function domain(cls: ConfidenceClassification, drivers: string[] = []) {
  return {
    score: cls === "critical" ? 0.15 : cls === "low" ? 0.35 : 0.85,
    classification: cls,
    reasoning: [] as string[],
    evidenceSignals: [] as string[],
    uncertaintyDrivers: drivers,
  };
}

function baseBreakdown(
  overrides: Partial<EstimateConfidenceBreakdown> = {},
): EstimateConfidenceBreakdown {
  return {
    schemaVersion: "estimate_confidence_breakdown_v1",
    overallConfidence: 0.82,
    confidenceClassification: "high",
    conditionConfidence: domain("high"),
    clutterConfidence: domain("high"),
    kitchenConfidence: domain("high"),
    bathroomConfidence: domain("high"),
    petConfidence: domain("high"),
    recencyConfidence: domain("high"),
    recurringTransitionConfidence: domain("high"),
    customerConsistencyConfidence: domain("high"),
    scopeCompletenessConfidence: domain("high"),
    ...overrides,
  };
}

function escFixture(
  level: EstimateEscalationGovernance["escalationLevel"],
  extras: Partial<EstimateEscalationGovernance> = {},
): EstimateEscalationGovernance {
  return {
    schemaVersion: "estimate_escalation_governance_v1",
    sourceConfidenceSchemaVersion: "estimate_confidence_breakdown_v1",
    escalationLevel: level,
    escalationReasons: [],
    recommendedActions: [],
    blockingReasons: [],
    affectedDomains: [],
    severityScore: level === "hard_block" ? 94 : 40,
    customerSafeSummary: [],
    adminSummary: [],
    confidenceInputs: {
      overallConfidence: 0.82,
      confidenceClassification: "high",
      domainScores: {},
      domainClassifications: {},
      distinctUncertaintyDriverCount: 0,
    },
    auditSignals: [],
    ...extras,
  };
}

describe("evaluateRecurringEconomicsGovernance", () => {
  const maintenanceWeeklyStable = (): EstimateConfidenceBreakdown =>
    baseBreakdown({
      overallConfidence: 0.88,
      confidenceClassification: "high",
      recurringTransitionConfidence: domain("high"),
      scopeCompletenessConfidence: domain("high"),
      recencyConfidence: domain("high"),
    });

  it("deep_clean yields maintenance not_applicable and benign economics", () => {
    const g = evaluateRecurringEconomicsGovernance({
      serviceType: "deep_clean",
      confidenceBreakdown: baseBreakdown(),
      escalationGovernance: escFixture("none"),
      riskPercentUncapped: 10,
    });
    expect(g.maintenanceViability).toBe("not_applicable");
    expect(g.economicRiskLevel).toBe("none");
    expect(g.recurringDiscountRisk).toBe("none");
    expect(g.schemaVersion).toBe("recurring_economics_governance_v1");
    expect(g.recommendedActions).toContain("no_action");
  });

  it("weekly maintenance with strong breakdown stays stable with low risk", () => {
    const g = evaluateRecurringEconomicsGovernance({
      serviceType: "maintenance",
      recurringCadenceIntent: "weekly",
      confidenceBreakdown: maintenanceWeeklyStable(),
      escalationGovernance: escFixture("none"),
      riskPercentUncapped: 8,
    });
    expect(g.maintenanceViability).toBe("stable");
    expect(g.recurringDiscountRisk).toBe("none");
    expect(g.resetReviewRecommendation).toBe("none");
    expect(g.riskScore).toBeLessThanOrEqual(25);
  });

  it("price collapse driver elevates recurring discount risk", () => {
    const bd = baseBreakdown({
      recurringTransitionConfidence: domain("low", ["recurring_price_collapse_vs_prior"]),
      scopeCompletenessConfidence: domain("medium"),
    });
    const g = evaluateRecurringEconomicsGovernance({
      serviceType: "maintenance",
      recurringCadenceIntent: "biweekly",
      confidenceBreakdown: bd,
      escalationGovernance: escFixture("review"),
      riskPercentUncapped: 22,
    });
    expect(["high", "critical", "medium"].includes(g.recurringDiscountRisk)).toBe(true);
    expect(g.recommendedActions).toContain("review_recurring_discount");
  });

  it("cadence mismatch drives reset review recommendation", () => {
    const bd = baseBreakdown({
      recurringTransitionConfidence: domain("low", ["cadence_vs_recency_mismatch"]),
      recencyConfidence: domain("low", ["structured_recency_stale_or_unknown"]),
    });
    const g = evaluateRecurringEconomicsGovernance({
      serviceType: "maintenance",
      recurringCadenceIntent: "weekly",
      confidenceBreakdown: bd,
      escalationGovernance: escFixture("monitor"),
      riskPercentUncapped: 18,
    });
    expect(["suggested", "required"].includes(g.resetReviewRecommendation)).toBe(true);
    expect(g.recommendedActions).toContain("review_reset_requirement");
  });

  it("sparse intake plus discount pressure surfaces margin protection", () => {
    const bd = baseBreakdown({
      scopeCompletenessConfidence: domain("low", ["structured_intake_gaps"]),
      recurringTransitionConfidence: domain("low", ["recurring_price_collapse_vs_prior"]),
    });
    const g = evaluateRecurringEconomicsGovernance({
      serviceType: "maintenance",
      recurringCadenceIntent: "monthly",
      confidenceBreakdown: bd,
      escalationGovernance: escFixture("review", { severityScore: 62 }),
      riskPercentUncapped: 40,
    });
    expect(["monitor", "review", "protect"].includes(g.marginProtectionSignal)).toBe(true);
    expect(g.recommendedActions).toContain("protect_margin_before_discounting");
  });

  it("hard_block escalation floors economic risk at critical", () => {
    const g = evaluateRecurringEconomicsGovernance({
      serviceType: "maintenance",
      recurringCadenceIntent: "weekly",
      confidenceBreakdown: maintenanceWeeklyStable(),
      escalationGovernance: escFixture("hard_block", {
        recommendedActions: ["block_autonomous_discounting"],
      }),
      riskPercentUncapped: 15,
    });
    expect(g.economicRiskLevel).toBe("critical");
    expect(g.recommendedActions).toContain("do_not_autonomously_reduce_price");
  });

  it("pet ambiguity nudges maintenance watch or unstable", () => {
    const bd = baseBreakdown({
      petConfidence: domain("low", ["pet_presence_unknown"]),
    });
    const g = evaluateRecurringEconomicsGovernance({
      serviceType: "maintenance",
      recurringCadenceIntent: "weekly",
      confidenceBreakdown: bd,
      escalationGovernance: escFixture("none"),
      riskPercentUncapped: 5,
    });
    expect(["watch", "unstable"].includes(g.maintenanceViability)).toBe(true);
  });

  it("is deterministic for identical inputs", () => {
    const input = {
      serviceType: "maintenance",
      recurringCadenceIntent: "weekly" as const,
      confidenceBreakdown: maintenanceWeeklyStable(),
      escalationGovernance: escFixture("monitor"),
      riskPercentUncapped: 12,
    };
    const a = JSON.stringify(evaluateRecurringEconomicsGovernance(input));
    const b = JSON.stringify(evaluateRecurringEconomicsGovernance(input));
    expect(a).toBe(b);
  });
});
