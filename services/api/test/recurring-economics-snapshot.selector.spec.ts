import {
  buildGovernanceLaneSummariesFromSnapshotOutputJson,
  buildRecurringEconomicsSummaryFromSnapshotOutputJson,
} from "../src/modules/estimate/estimate-snapshot-metadata.read";

function escalationGov(level: string) {
  return {
    schemaVersion: "estimate_escalation_governance_v1",
    sourceConfidenceSchemaVersion: "estimate_confidence_breakdown_v1",
    escalationLevel: level,
    escalationReasons: [],
    recommendedActions: ["admin_review_required"],
    blockingReasons: [],
    affectedDomains: [],
    severityScore: 55,
    customerSafeSummary: [],
    adminSummary: [],
    confidenceInputs: {
      overallConfidence: 0.7,
      confidenceClassification: "medium",
      domainScores: {},
      domainClassifications: {},
      distinctUncertaintyDriverCount: 1,
    },
    auditSignals: [],
  };
}

function recurringGov() {
  return {
    schemaVersion: "recurring_economics_governance_v1",
    economicRiskLevel: "medium",
    maintenanceViability: "watch",
    recurringDiscountRisk: "medium",
    resetReviewRecommendation: "suggested",
    marginProtectionSignal: "monitor",
    riskScore: 51,
    economicReasons: ["recurring_discount_pressure"],
    maintenanceReasons: ["maintenance_lane_watch"],
    recommendedActions: ["monitor_recurring_account", "review_recurring_discount"],
    affectedSignals: [],
    adminSummary: [],
    customerSafeSummary: [],
    sourceSignals: {
      appliesRecurringLane: true,
      serviceType: "maintenance",
      recurringCadenceIntent: "weekly",
      hasPriceCollapseDriver: false,
      hasSparseIntakeDriver: false,
      recurringTransitionClassification: "high",
      scopeCompletenessClassification: "high",
      escalationLevel: "review",
      escalationSeverityScore: 55,
      lowOrCriticalDomainCount: 0,
      hasCadenceRecencyMismatch: false,
      hasLegacyRecencyInstability: false,
    },
  };
}

describe("recurring economics snapshot selectors", () => {
  it("returns compact summary for modern recurring economics blob", () => {
    const json = JSON.stringify({
      estimatedPriceCents: 12000,
      escalationGovernance: escalationGov("review"),
      recurringEconomicsGovernance: recurringGov(),
    });
    const s = buildRecurringEconomicsSummaryFromSnapshotOutputJson(json);
    expect(s).not.toBeNull();
    expect(s!.economicRiskLevel).toBe("medium");
    expect(s!.hasResetRisk).toBe(true);
    expect(s!.recommendedActionCount).toBe(2);
    expect(Object.keys(s!).length).toBeLessThanOrEqual(10);
  });

  it("legacy snapshot without recurring economics returns null summary", () => {
    expect(
      buildRecurringEconomicsSummaryFromSnapshotOutputJson(
        JSON.stringify({
          escalationGovernance: escalationGov("monitor"),
          estimatedPriceCents: 1,
        }),
      ),
    ).toBeNull();
  });

  it("malformed json returns null", () => {
    expect(buildRecurringEconomicsSummaryFromSnapshotOutputJson("{")).toBeNull();
  });

  it("buildGovernanceLaneSummaries single-parse returns both summaries", () => {
    const json = JSON.stringify({
      escalationGovernance: escalationGov("review"),
      confidenceBreakdown: {
        schemaVersion: "estimate_confidence_breakdown_v1",
        overallConfidence: 0.72,
        confidenceClassification: "medium",
      },
      recurringEconomicsGovernance: recurringGov(),
    });
    const lanes = buildGovernanceLaneSummariesFromSnapshotOutputJson(json);
    expect(lanes.governanceSummary).not.toBeNull();
    expect(lanes.recurringEconomicsSummary).not.toBeNull();
    expect(lanes.recurringEconomicsSummary!.riskScore).toBe(51);
  });
});
