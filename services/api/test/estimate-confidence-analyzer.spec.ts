import type { EstimateInput } from "../src/modules/estimate/estimator.service";
import { analyzeEstimateConfidence } from "../src/estimating/confidence/estimate-confidence-analyzer";

function stableSnapshot<T>(value: T): string {
  return JSON.stringify(value);
}

/** Representative recurring-maintenance intake with structured questionnaire filled. */
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

describe("analyzeEstimateConfidence", () => {
  it("returns identical breakdown for identical input (deterministic)", () => {
    const input = highConfidenceRecurringInput();
    const aggregate = 0.81;
    const a = analyzeEstimateConfidence({ input, aggregateConfidence: aggregate });
    const b = analyzeEstimateConfidence({ input, aggregateConfidence: aggregate });
    expect(stableSnapshot(a)).toBe(stableSnapshot(b));
  });

  it("echoes aggregate confidence on breakdown.overallConfidence", () => {
    const input = highConfidenceRecurringInput();
    const breakdown = analyzeEstimateConfidence({
      input,
      aggregateConfidence: 0.624,
    });
    expect(breakdown.overallConfidence).toBe(0.62);
    expect(breakdown.schemaVersion).toBe("estimate_confidence_breakdown_v1");
  });

  it("high-confidence recurring estimate keeps transition domain strong", () => {
    const breakdown = analyzeEstimateConfidence({
      input: highConfidenceRecurringInput(),
      aggregateConfidence: 0.85,
    });
    expect(breakdown.recurringTransitionConfidence.score).toBeGreaterThanOrEqual(0.85);
    expect(breakdown.scopeCompletenessConfidence.score).toBeGreaterThanOrEqual(0.9);
  });

  it("flags recurring instability on weekly cadence with long recency gap", () => {
    const breakdown = analyzeEstimateConfidence({
      input: {
        ...highConfidenceRecurringInput(),
        recurring_cadence_intent: "weekly",
        last_pro_clean_recency: "days_90_plus",
      },
      aggregateConfidence: 0.55,
    });
    expect(breakdown.recurringTransitionConfidence.uncertaintyDrivers).toContain(
      "cadence_vs_recency_mismatch",
    );
    expect(breakdown.recurringTransitionConfidence.score).toBeLessThan(0.9);
  });

  it("reduces kitchen confidence when intensity is missing", () => {
    const input = { ...highConfidenceRecurringInput() };
    delete (input as Partial<EstimateInput>).kitchen_intensity;

    const breakdown = analyzeEstimateConfidence({
      input,
      aggregateConfidence: 0.7,
    });
    expect(breakdown.kitchenConfidence.uncertaintyDrivers).toContain(
      "kitchen_intensity_missing",
    );
    expect(breakdown.scopeCompletenessConfidence.uncertaintyDrivers).toContain(
      "structured_intake_gaps",
    );
  });

  it("detects contradictory condition signals", () => {
    const breakdown = analyzeEstimateConfidence({
      input: {
        ...highConfidenceRecurringInput(),
        overall_labor_condition: "recently_maintained",
        kitchen_condition: "heavy_grease",
      },
      aggregateConfidence: 0.66,
    });
    expect(breakdown.conditionConfidence.uncertaintyDrivers).toContain(
      "condition_cross_signal_conflict",
    );
  });

  it("penalizes sparse structured questionnaire", () => {
    const breakdown = analyzeEstimateConfidence({
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
      aggregateConfidence: 0.5,
    });
    expect(breakdown.scopeCompletenessConfidence.score).toBeLessThan(0.75);
    expect(breakdown.scopeCompletenessConfidence.reasoning.some((r) =>
      r.includes("sparse"),
    )).toBe(true);
  });

  it("elevates pet ambiguity when presence is unsure", () => {
    const breakdown = analyzeEstimateConfidence({
      input: {
        ...highConfidenceRecurringInput(),
        pet_presence: "not_sure",
      },
      aggregateConfidence: 0.48,
    });
    expect(breakdown.petConfidence.uncertaintyDrivers).toContain("pet_presence_unknown");
  });

  it("captures recency ambiguity when legacy unsure and structured missing", () => {
    const breakdown = analyzeEstimateConfidence({
      input: {
        ...highConfidenceRecurringInput(),
        last_professional_clean: "not_sure",
        last_pro_clean_recency: undefined,
      },
      aggregateConfidence: 0.44,
    });
    expect(breakdown.recencyConfidence.uncertaintyDrivers).toContain(
      "recency_unknown_dual_channel",
    );
  });

  it("applies recurring price-collapse hint conservatively", () => {
    const base = highConfidenceRecurringInput();
    const without = analyzeEstimateConfidence({
      input: base,
      aggregateConfidence: 0.8,
    });
    const withHint = analyzeEstimateConfidence({
      input: base,
      aggregateConfidence: 0.8,
      comparisonHints: {
        priorEstimatedPriceCents: 20000,
        currentEstimatedPriceCents: 12000,
      },
    });
    expect(withHint.recurringTransitionConfidence.score).toBeLessThan(
      without.recurringTransitionConfidence.score,
    );
    expect(withHint.recurringTransitionConfidence.uncertaintyDrivers).toContain(
      "recurring_price_collapse_vs_prior",
    );
  });
});
