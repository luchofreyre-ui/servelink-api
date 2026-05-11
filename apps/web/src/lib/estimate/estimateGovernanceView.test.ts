import { describe, expect, it } from "vitest";
import {
  buildEstimateGovernanceViewFromParsedOutput,
  estimateGovernanceRiskBadge,
} from "@/lib/estimate/estimateGovernanceView";

describe("buildEstimateGovernanceViewFromParsedOutput", () => {
  it("returns empty-compatible model for legacy snapshots", () => {
    const view = buildEstimateGovernanceViewFromParsedOutput({
      estimatedDurationMinutes: 140,
      confidence: 0.82,
    });
    expect(view).not.toBeNull();
    expect(view!.hasBreakdown).toBe(false);
    expect(view!.hasGovernance).toBe(false);
    expect(view!.topUncertaintyDrivers).toEqual([]);
  });

  it("reads partial breakdown without governance", () => {
    const view = buildEstimateGovernanceViewFromParsedOutput({
      confidenceBreakdown: {
        schemaVersion: "estimate_confidence_breakdown_v1",
        overallConfidence: 0.72,
        confidenceClassification: "medium",
        conditionConfidence: {
          score: 0.4,
          classification: "low",
          reasoning: [],
          evidenceSignals: [],
          uncertaintyDrivers: ["dust_level_ambiguous"],
        },
      },
    });
    expect(view!.hasBreakdown).toBe(true);
    expect(view!.hasGovernance).toBe(false);
    expect(view!.overallConfidencePct).toBe("72%");
    expect(view!.weakestDomains.length).toBeGreaterThan(0);
    expect(view!.topUncertaintyDrivers).toContain("dust_level_ambiguous");
  });

  it("reads escalation governance and advisory blocking lines", () => {
    const view = buildEstimateGovernanceViewFromParsedOutput({
      confidenceBreakdown: {
        schemaVersion: "estimate_confidence_breakdown_v1",
        overallConfidence: 0.34,
        confidenceClassification: "critical",
      },
      escalationGovernance: {
        schemaVersion: "estimate_escalation_governance_v1",
        escalationLevel: "hard_block",
        severityScore: 94,
        recommendedActions: ["request_more_intake", "block_auto_acceptance"],
        blockingReasons: ["governance_v1_hard_block_manual_confirmation_expected"],
        escalationReasons: ["hard_block_critical_overall_and_scope_completeness"],
      },
    });
    expect(view!.hasGovernance).toBe(true);
    expect(view!.escalationSummary.escalationLevel).toBe("hard_block");
    expect(view!.escalationSummary.severityScore).toBe(94);
    expect(view!.escalationSummary.blockingReasons.length).toBeGreaterThan(0);
    expect(view!.escalationSummary.recommendedActions).toContain("request_more_intake");
  });

  it("surfaces intake stability hits from driver codes", () => {
    const view = buildEstimateGovernanceViewFromParsedOutput({
      confidenceBreakdown: {
        schemaVersion: "estimate_confidence_breakdown_v1",
        scopeCompletenessConfidence: {
          score: 0.42,
          classification: "low",
          reasoning: [],
          evidenceSignals: [],
          uncertaintyDrivers: ["structured_intake_gaps"],
        },
        recurringTransitionConfidence: {
          score: 0.7,
          classification: "medium",
          reasoning: ["Weekly cadence vs long recency gap."],
          evidenceSignals: [],
          uncertaintyDrivers: ["cadence_vs_recency_mismatch"],
        },
      },
    });
    expect(view!.intakeStabilityDriverHits).toContain("structured_intake_gaps");
    expect(view!.intakeStabilityDriverHits).toContain("cadence_vs_recency_mismatch");
    expect(view!.recurringTransitionReasoning.length).toBeGreaterThan(0);
  });

  it("tolerates malformed optional nested fields", () => {
    const view = buildEstimateGovernanceViewFromParsedOutput({
      confidenceBreakdown: "oops" as unknown as Record<string, unknown>,
      escalationGovernance: ["x"] as unknown as Record<string, unknown>,
    });
    expect(view!.hasBreakdown).toBe(false);
    expect(view!.hasGovernance).toBe(false);
  });
});

describe("estimateGovernanceRiskBadge", () => {
  it("flags high pressure for intervention_required", () => {
    const badge = estimateGovernanceRiskBadge({
      hasBreakdown: true,
      hasGovernance: true,
      overallConfidencePct: "40%",
      confidenceClassification: "low",
      escalationSummary: {
        escalationLevel: "intervention_required",
        severityScore: 80,
        recommendedActions: [],
        blockingReasons: [],
        escalationReasons: [],
      },
      weakestDomains: [],
      topUncertaintyDrivers: [],
      intakeStabilityDriverHits: [],
      intakeStabilityLines: [],
      recurringTransitionReasoning: [],
    });
    expect(badge.tone).toBe("danger");
  });
});
