import type {
  ConfidenceDomainSignals,
  EstimateConfidenceBreakdown,
} from "../src/estimating/confidence/estimate-confidence-breakdown.types";
import type { EstimateEscalationGovernance } from "../src/estimating/escalation/estimate-escalation-governance.types";
import { analyzeEstimateConfidence } from "../src/estimating/confidence/estimate-confidence-analyzer";
import { evaluateEstimateEscalationGovernance } from "../src/estimating/escalation/estimate-escalation-governance";
import type { EstimateInput } from "../src/modules/estimate/estimator.service";

function stable(g: EstimateEscalationGovernance): string {
  return JSON.stringify(g);
}

function neutral(score = 0.93): ConfidenceDomainSignals {
  return {
    score,
    classification: "high",
    reasoning: [],
    evidenceSignals: [],
    uncertaintyDrivers: [],
  };
}

function breakdownTemplate(options: {
  overallConfidence: number;
  confidenceClassification: EstimateConfidenceBreakdown["confidenceClassification"];
  overrides?: Partial<
    Omit<
      EstimateConfidenceBreakdown,
      | "schemaVersion"
      | "overallConfidence"
      | "confidenceClassification"
    >
  >;
}): EstimateConfidenceBreakdown {
  return {
    schemaVersion: "estimate_confidence_breakdown_v1",
    overallConfidence: options.overallConfidence,
    confidenceClassification: options.confidenceClassification,
    conditionConfidence: neutral(),
    clutterConfidence: neutral(),
    kitchenConfidence: neutral(),
    bathroomConfidence: neutral(),
    petConfidence: neutral(),
    recencyConfidence: neutral(),
    recurringTransitionConfidence: neutral(),
    customerConsistencyConfidence: neutral(),
    scopeCompletenessConfidence: neutral(),
    ...options.overrides,
  };
}

function highConfidenceRecurringInput(): EstimateInput {
  return {
    property_type: "house",
    sqft_band: "1600_1999",
    bedrooms: "3",
    bathrooms: "2",
    floors: "1",
    service_type: "maintenance",
    first_time_with_servelink: "no",
    last_professional_clean: "2_4_weeks",
    clutter_level: "light",
    kitchen_condition: "normal",
    bathroom_condition: "normal",
    glass_showers: "one",
    dust_level: "low",
    pet_presence: "none",
    addons: [],
    overall_labor_condition: "normal_lived_in",
    kitchen_intensity: "average_use",
    bathroom_complexity: "standard",
    clutter_access: "mostly_clear",
    pet_impact: "none",
    last_pro_clean_recency: "within_30_days",
    primary_cleaning_intent: "maintenance_clean",
    recurring_cadence_intent: "biweekly",
    layout_type: "mixed",
  };
}

describe("evaluateEstimateEscalationGovernance", () => {
  it("is deterministic for identical breakdown inputs", () => {
    const b = breakdownTemplate({
      overallConfidence: 0.82,
      confidenceClassification: "high",
    });
    const ctx = {
      estimatorFlags: ["LOW_CONFIDENCE"] as const,
      riskPercentUncapped: 26,
      estimatorMode: "CAPPED" as const,
    };
    expect(stable(evaluateEstimateEscalationGovernance(b, ctx))).toBe(
      stable(evaluateEstimateEscalationGovernance(b, ctx)),
    );
  });

  it("high overall without material weaknesses → none", () => {
    const g = evaluateEstimateEscalationGovernance(
      breakdownTemplate({
        overallConfidence: 0.88,
        confidenceClassification: "high",
      }),
    );
    expect(g.escalationLevel).toBe("none");
    expect(g.recommendedActions).toContain("no_action");
  });

  it("medium overall with isolated low domain → monitor", () => {
    const g = evaluateEstimateEscalationGovernance(
      breakdownTemplate({
        overallConfidence: 0.68,
        confidenceClassification: "medium",
        overrides: {
          kitchenConfidence: {
            score: 0.38,
            classification: "low",
            reasoning: [],
            evidenceSignals: [],
            uncertaintyDrivers: ["kitchen_condition_unknown"],
          },
        },
      }),
    );
    expect(g.escalationLevel).toBe("monitor");
  });

  it("low overall → review", () => {
    const g = evaluateEstimateEscalationGovernance(
      breakdownTemplate({
        overallConfidence: 0.52,
        confidenceClassification: "low",
      }),
    );
    expect(g.escalationLevel).toBe("review");
    expect(g.recommendedActions).toContain("admin_review_required");
  });

  it("recurring transition instability drivers → review", () => {
    const g = evaluateEstimateEscalationGovernance(
      breakdownTemplate({
        overallConfidence: 0.82,
        confidenceClassification: "high",
        overrides: {
          recurringTransitionConfidence: {
            score: 0.74,
            classification: "medium",
            reasoning: [],
            evidenceSignals: [],
            uncertaintyDrivers: ["cadence_vs_recency_mismatch"],
          },
        },
      }),
    );
    expect(g.escalationLevel).toBe("review");
    expect(g.recommendedActions).toContain("recommend_recurring_reset_review");
    expect(g.escalationReasons).toContain("recurring_transition_instability");
  });

  it("price collapse hint with weak overall confidence → intervention_required", () => {
    const bd = analyzeEstimateConfidence({
      input: highConfidenceRecurringInput(),
      aggregateConfidence: 0.55,
      comparisonHints: {
        priorEstimatedPriceCents: 20000,
        currentEstimatedPriceCents: 12000,
      },
    });
    const g = evaluateEstimateEscalationGovernance(bd, {});
    expect(g.escalationLevel).toBe("intervention_required");
    expect(g.recommendedActions).toContain("recommend_manual_price_review");
    expect(g.recommendedActions).toContain("block_auto_acceptance");
  });

  it("price collapse with confident overall → review", () => {
    const bd = analyzeEstimateConfidence({
      input: highConfidenceRecurringInput(),
      aggregateConfidence: 0.82,
      comparisonHints: {
        priorEstimatedPriceCents: 20000,
        currentEstimatedPriceCents: 12000,
      },
    });
    const g = evaluateEstimateEscalationGovernance(bd, {});
    expect(g.escalationLevel).toBe("review");
  });

  it("multiple critical domains → intervention_required", () => {
    const g = evaluateEstimateEscalationGovernance(
      breakdownTemplate({
        overallConfidence: 0.7,
        confidenceClassification: "medium",
        overrides: {
          kitchenConfidence: {
            score: 0.33,
            classification: "critical",
            reasoning: [],
            evidenceSignals: [],
            uncertaintyDrivers: [],
          },
          petConfidence: {
            score: 0.35,
            classification: "critical",
            reasoning: [],
            evidenceSignals: [],
            uncertaintyDrivers: [],
          },
        },
      }),
    );
    expect(g.escalationLevel).toBe("intervention_required");
    expect(g.escalationReasons).toContain("multiple_domains_critical");
  });

  it("critical overall + critical scope completeness → hard_block", () => {
    const g = evaluateEstimateEscalationGovernance(
      breakdownTemplate({
        overallConfidence: 0.32,
        confidenceClassification: "critical",
        overrides: {
          scopeCompletenessConfidence: {
            score: 0.38,
            classification: "critical",
            reasoning: [],
            evidenceSignals: [],
            uncertaintyDrivers: ["structured_intake_gaps"],
          },
        },
      }),
    );
    expect(g.escalationLevel).toBe("hard_block");
    expect(g.blockingReasons.length).toBeGreaterThan(0);
    expect(g.recommendedActions).toContain("request_more_intake");
    expect(g.recommendedActions).toContain("block_autonomous_discounting");
  });

  it("sparse intake surfaces request_more_intake", () => {
    const bd = analyzeEstimateConfidence({
      input: {
        property_type: "house",
        sqft_band: "1600_1999",
        bedrooms: "3",
        bathrooms: "2",
        floors: "1",
        service_type: "maintenance",
        first_time_with_servelink: "no",
        last_professional_clean: "1_3_months",
        clutter_level: "light",
        kitchen_condition: "normal",
        bathroom_condition: "normal",
        pet_presence: "none",
        addons: [],
      },
      aggregateConfidence: 0.62,
    });
    const g = evaluateEstimateEscalationGovernance(bd, {});
    expect(g.recommendedActions).toContain("request_more_intake");
    expect(bd.scopeCompletenessConfidence.uncertaintyDrivers).toContain("structured_intake_gaps");
  });

  it("pet ambiguity → flag_for_fo_attention", () => {
    const bd = analyzeEstimateConfidence({
      input: {
        ...highConfidenceRecurringInput(),
        pet_presence: "not_sure",
      },
      aggregateConfidence: 0.76,
    });
    const g = evaluateEstimateEscalationGovernance(bd, {});
    expect(g.recommendedActions).toContain("flag_for_fo_attention");
  });

  it("recency ambiguity → recommend_recurring_reset_review", () => {
    const bd = analyzeEstimateConfidence({
      input: {
        ...highConfidenceRecurringInput(),
        last_professional_clean: "not_sure",
        last_pro_clean_recency: undefined,
      },
      aggregateConfidence: 0.74,
    });
    const g = evaluateEstimateEscalationGovernance(bd, {});
    expect(bd.recencyConfidence.uncertaintyDrivers).toContain("recency_unknown_dual_channel");
    expect(g.recommendedActions).toContain("recommend_recurring_reset_review");
  });

  it("integration: analyzer output maps to governance for stable recurring baseline", () => {
    const bd = analyzeEstimateConfidence({
      input: highConfidenceRecurringInput(),
      aggregateConfidence: 0.85,
    });
    const g = evaluateEstimateEscalationGovernance(bd, {
      estimatorFlags: [],
      riskPercentUncapped: 12,
      estimatorMode: "STANDARD",
    });
    expect(g.sourceConfidenceSchemaVersion).toBe("estimate_confidence_breakdown_v1");
    expect(g.schemaVersion).toBe("estimate_escalation_governance_v1");
    expect(["none", "monitor"]).toContain(g.escalationLevel);
  });
});
