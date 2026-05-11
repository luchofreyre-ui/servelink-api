import { buildEstimateGovernanceSummaryFromSnapshotOutputJson } from "../src/modules/estimate/estimate-snapshot-metadata.read";

function domain(cls: string, drivers: string[] = []) {
  return {
    score: cls === "critical" ? 0.15 : cls === "low" ? 0.35 : 0.85,
    classification: cls,
    reasoning: [] as string[],
    evidenceSignals: [] as string[],
    uncertaintyDrivers: drivers,
  };
}

function baseConfidenceBreakdown(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    schemaVersion: "estimate_confidence_breakdown_v1",
    overallConfidence: 0.55,
    confidenceClassification: "medium",
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

function escalationGovernanceFixture(
  escalationLevel: string,
  extras: Partial<Record<string, unknown>> = {},
) {
  return {
    schemaVersion: "estimate_escalation_governance_v1",
    sourceConfidenceSchemaVersion: "estimate_confidence_breakdown_v1",
    escalationLevel,
    escalationReasons: [],
    recommendedActions:
      escalationLevel === "intervention_required"
        ? ["flag_for_fo_attention", "admin_review_required"]
        : ["admin_review_required"],
    blockingReasons:
      escalationLevel === "hard_block"
        ? ["governance_v1_hard_block_manual_confirmation_expected"]
        : [],
    affectedDomains: [],
    severityScore: escalationLevel === "hard_block" ? 92 : 61,
    customerSafeSummary: [],
    adminSummary: [],
    confidenceInputs: {
      overallConfidence: 0.55,
      confidenceClassification: "medium",
      domainScores: {},
      domainClassifications: {},
      distinctUncertaintyDriverCount: 2,
    },
    auditSignals: [],
    ...extras,
  };
}

function snapshotPayload(root: Record<string, unknown>) {
  return JSON.stringify(root);
}

describe("buildEstimateGovernanceSummaryFromSnapshotOutputJson", () => {
  it("returns null for legacy snapshots without escalation governance", () => {
    expect(
      buildEstimateGovernanceSummaryFromSnapshotOutputJson(
        snapshotPayload({
          confidenceBreakdown: baseConfidenceBreakdown(),
          estimatedPriceCents: 12000,
        }),
      ),
    ).toBeNull();
  });

  it("returns null when escalation governance schema mismatches", () => {
    expect(
      buildEstimateGovernanceSummaryFromSnapshotOutputJson(
        snapshotPayload({
          escalationGovernance: {
            schemaVersion: "legacy",
            escalationLevel: "review",
          },
        }),
      ),
    ).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(
      buildEstimateGovernanceSummaryFromSnapshotOutputJson("{not-json"),
    ).toBeNull();
  });

  it("summarizes modern review escalation", () => {
    const s = buildEstimateGovernanceSummaryFromSnapshotOutputJson(
      snapshotPayload({
        confidenceBreakdown: baseConfidenceBreakdown({
          confidenceClassification: "low",
          conditionConfidence: domain("critical"),
          clutterConfidence: domain("low"),
        }),
        escalationGovernance: escalationGovernanceFixture("review"),
      }),
    );
    expect(s).not.toBeNull();
    expect(s!.escalationLevel).toBe("review");
    expect(s!.severityScore).toBe(61);
    expect(s!.criticalDomainCount).toBe(1);
    expect(s!.lowDomainCount).toBe(1);
    expect(s!.weakestDomainCount).toBe(2);
    expect(s!.bookingDetailAnchor).toBe("#estimate-governance");
  });

  it("reflects intervention_required with elevated recommended actions", () => {
    const s = buildEstimateGovernanceSummaryFromSnapshotOutputJson(
      snapshotPayload({
        confidenceBreakdown: baseConfidenceBreakdown(),
        escalationGovernance: escalationGovernanceFixture("intervention_required"),
      }),
    );
    expect(s?.escalationLevel).toBe("intervention_required");
    expect(s?.recommendedActionCount).toBe(2);
  });

  it("surfaces hard_block level without throwing", () => {
    const s = buildEstimateGovernanceSummaryFromSnapshotOutputJson(
      snapshotPayload({
        confidenceBreakdown: baseConfidenceBreakdown(),
        escalationGovernance: escalationGovernanceFixture("hard_block"),
      }),
    );
    expect(s?.escalationLevel).toBe("hard_block");
    expect(s?.severityScore).toBe(92);
  });

  it("detects recurring instability from drivers", () => {
    const s = buildEstimateGovernanceSummaryFromSnapshotOutputJson(
      snapshotPayload({
        confidenceBreakdown: baseConfidenceBreakdown({
          recurringTransitionConfidence: domain("high", [
            "cadence_vs_recency_mismatch",
          ]),
        }),
        escalationGovernance: escalationGovernanceFixture("monitor"),
      }),
    );
    expect(s?.hasRecurringInstability).toBe(true);
  });

  it("detects sparse intake and price collapse signals", () => {
    const s = buildEstimateGovernanceSummaryFromSnapshotOutputJson(
      snapshotPayload({
        confidenceBreakdown: baseConfidenceBreakdown({
          scopeCompletenessConfidence: domain("low", [
            "structured_intake_gaps",
            "recurring_price_collapse_vs_prior",
          ]),
        }),
        escalationGovernance: escalationGovernanceFixture("monitor"),
      }),
    );
    expect(s?.hasSparseIntakeSignal).toBe(true);
    expect(s?.hasPriceCollapseSignal).toBe(true);
  });
});
