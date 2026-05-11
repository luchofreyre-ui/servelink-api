import { EstimatePreviewController } from "../src/modules/estimate/estimate-preview.controller";
import {
  EstimateEngineV2Service,
  estimateV2,
} from "../src/modules/estimate/estimate-engine-v2.service";
import {
  extractEstimateV2ReconciliationFromSnapshot,
  extractEstimateV2FromSnapshot,
  toFoVisibleEstimate,
} from "../src/modules/estimate/estimate-v2-snapshot";
import { calculateEstimateVariance } from "../src/modules/estimate/estimate-variance.types";
import type { EstimateInput, EstimateResult } from "../src/modules/estimate/estimator.service";
import { analyzeEstimateConfidence } from "../src/estimating/confidence/estimate-confidence-analyzer";
import { evaluateEstimateEscalationGovernance } from "../src/estimating/escalation/estimate-escalation-governance";
import { evaluateRecurringEconomicsGovernance } from "../src/estimating/recurring-economics/recurring-economics-governance";
import { createBookingsServiceTestHarness } from "./helpers/createBookingsServiceTestHarness";

function baseInput(overrides: Partial<EstimateInput> = {}): EstimateInput {
  return {
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
    overall_labor_condition: "normal_lived_in",
    kitchen_intensity: "average_use",
    clutter_access: "mostly_clear",
    pet_impact: "none",
    last_pro_clean_recency: "within_30_days",
    primary_cleaning_intent: "maintenance_clean",
    ...overrides,
  };
}

function legacyEstimate(overrides: Partial<EstimateResult> = {}): EstimateResult {
  const base: EstimateResult = {
    estimatorVersion: "estimator_v1",
    mode: "STANDARD",
    serviceLaborModelVersion: "labor_v1",
    baseLaborMinutes: 120,
    adjustedLaborMinutes: 140,
    jobComplexityIndex: 20,
    recommendedTeamSize: 2,
    effectiveTeamSize: 2,
    estimatedDurationMinutes: 70,
    estimatedPriceCents: 14000,
    estimateMinutes: 140,
    lowerBoundMinutes: 120,
    upperBoundMinutes: 170,
    confidence: 0.9,
    confidenceBreakdown: analyzeEstimateConfidence({
      input: baseInput(),
      aggregateConfidence: 0.9,
    }),
    riskPercentUncapped: 0,
    riskPercentCappedForRange: 0,
    riskCapped: false,
    breakdown: { baseline: [], adjustments: [], riskSignals: [] },
    flags: [],
  };
  const merged = { ...base, ...overrides };
  const breakdown =
    overrides.confidenceBreakdown ??
    analyzeEstimateConfidence({
      input: baseInput(),
      aggregateConfidence: merged.confidence,
    });
  const esc =
    overrides.escalationGovernance ??
    evaluateEstimateEscalationGovernance(breakdown, {
      estimatorFlags: merged.flags,
      riskPercentUncapped: merged.riskPercentUncapped,
      estimatorMode: merged.mode,
    });
  const recurringEconomicsGovernance =
    overrides.recurringEconomicsGovernance ??
    evaluateRecurringEconomicsGovernance({
      serviceType: baseInput().service_type,
      recurringCadenceIntent: baseInput().recurring_cadence_intent,
      estimatedMinutes: merged.estimateMinutes,
      pricedMinutes: merged.adjustedLaborMinutes,
      estimatedPriceCents: merged.estimatedPriceCents,
      comparisonHints: null,
      confidenceBreakdown: breakdown,
      escalationGovernance: esc,
      estimatorFlags: merged.flags,
      riskPercentUncapped: merged.riskPercentUncapped,
    });
  return {
    ...merged,
    confidenceBreakdown: breakdown,
    escalationGovernance: esc,
    recurringEconomicsGovernance,
  };
}

function validationInput(
  overrides: Partial<EstimateInput> = {},
): EstimateInput {
  return {
    ...baseInput(),
    ...overrides,
  };
}

describe("Estimate Engine v2 core", () => {
  it("separates expected, buffer, and priced minutes", () => {
    const result = estimateV2(baseInput());
    expect(result.snapshotVersion).toBe("estimate_engine_v2_core_v1");
    expect(result.expectedMinutes).toBeGreaterThan(0);
    expect(result.bufferMinutes).toBeGreaterThan(0);
    expect(result.pricedMinutes).toBe(
      result.expectedMinutes + result.bufferMinutes,
    );
  });

  it("FO visible target equals expected minutes and excludes buffer/priced fields", () => {
    const result = estimateV2(baseInput());
    expect(result.foVisible.targetMinutes).toBe(result.expectedMinutes);
    expect(result.foVisible).not.toHaveProperty("bufferMinutes");
    expect(result.foVisible).not.toHaveProperty("pricedMinutes");
  });

  it("high-risk input gets a higher buffer than low-risk input", () => {
    const low = estimateV2(baseInput());
    const high = estimateV2(
      baseInput({
        service_type: "move_out",
        overall_labor_condition: "major_reset",
        kitchen_intensity: "heavy_use",
        clutter_access: "heavy_clutter",
        pet_impact: "heavy",
        last_pro_clean_recency: "days_90_plus",
      }),
    );
    expect(high.riskLevel).toBe("high");
    expect(high.bufferPercent).toBeGreaterThan(low.bufferPercent);
    expect(high.bufferMinutes).toBeGreaterThan(low.bufferMinutes);
  });

  it("missing and unknown fields lower confidence", () => {
    const known = estimateV2(baseInput());
    const unknown = estimateV2(
      baseInput({
        sqft_band: "not_a_band" as EstimateInput["sqft_band"],
        service_type: "unknown" as EstimateInput["service_type"],
        overall_labor_condition: undefined,
        clutter_access: undefined,
        kitchen_intensity: undefined,
        last_pro_clean_recency: undefined,
      }),
    );
    expect(unknown.confidenceScore).toBeLessThan(known.confidenceScore);
    expect(unknown.riskFlags).toContain("MISSING_SQUARE_FOOTAGE");
    expect(unknown.riskFlags).toContain("UNKNOWN_SERVICE_TYPE");
  });

  it("adds risk flags for heavy/severe inputs", () => {
    const result = estimateV2(
      baseInput({
        overall_labor_condition: "major_reset",
        kitchen_intensity: "heavy_use",
        clutter_access: "heavy_clutter",
        pet_impact: "heavy",
        last_pro_clean_recency: "days_90_plus",
      }),
    );
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        "HEAVY_LABOR_CONDITION",
        "HIGH_CLUTTER_ACCESS",
        "HEAVY_KITCHEN_INTENSITY",
        "PET_COMPLEXITY",
        "LONG_TIME_SINCE_LAST_CLEAN",
      ]),
    );
  });

  it("regresses correlated high-risk deep clean without compounding condition signals", () => {
    const result = estimateV2(
      validationInput({
        sqft_band: "2000_2499",
        bedrooms: "4",
        bathrooms: "3",
        service_type: "deep_clean",
        overall_labor_condition: "major_reset",
        kitchen_intensity: "heavy_use",
        clutter_access: "moderate_clutter",
        pet_impact: "heavy",
        last_pro_clean_recency: "unknown_or_not_recently",
        primary_cleaning_intent: "reset_level",
      }),
    );
    expect(result.expectedMinutes).toBe(700);
    expect(result.expectedMinutes).not.toBe(1175);
    expect(result.riskLevel).toBe("high");
    expect(result.bufferPercent).toBe(22);
    expect(result.bufferMinutes).toBe(155);
    expect(result.pricedMinutes).toBe(855);
    expect(result.pricingFactors.conditionScore).toBeCloseTo(9.2);
    expect(result.pricingFactors.conditionMultiplier).toBe(1.4);
  });

  it("keeps normal deep clean validation profile near current target", () => {
    const result = estimateV2(
      validationInput({
        sqft_band: "1600_1999",
        bedrooms: "3",
        bathrooms: "2",
        service_type: "deep_clean",
        overall_labor_condition: "normal_lived_in",
        kitchen_intensity: "average_use",
        clutter_access: "mostly_clear",
        pet_impact: "none",
        last_pro_clean_recency: "days_30_90",
        primary_cleaning_intent: "reset_level",
      }),
    );
    expect(result.expectedMinutes).toBe(420);
  });

  it("matches move-out validation profile with additive service labor", () => {
    const result = estimateV2(
      validationInput({
        sqft_band: "1200_1599",
        bedrooms: "3",
        bathrooms: "2_5",
        service_type: "move_out",
        overall_labor_condition: "normal_lived_in",
        kitchen_intensity: "average_use",
        clutter_access: "mostly_clear",
        pet_impact: "light",
        last_pro_clean_recency: "days_90_plus",
        primary_cleaning_intent: "detailed_standard",
      }),
    );
    expect(result.expectedMinutes).toBe(450);
  });

  it("matches maintenance validation profile", () => {
    const result = estimateV2(
      validationInput({
        sqft_band: "800_1199",
        bedrooms: "2",
        bathrooms: "2",
        service_type: "maintenance",
        overall_labor_condition: "recently_maintained",
        kitchen_intensity: "light_use",
        clutter_access: "mostly_clear",
        pet_impact: "none",
        last_pro_clean_recency: "within_30_days",
        primary_cleaning_intent: "maintenance_clean",
      }),
    );
    expect(result.expectedMinutes).toBe(175);
  });

  it("matches maintenance validation profile with light pet impact", () => {
    const result = estimateV2(
      validationInput({
        sqft_band: "1600_1999",
        bedrooms: "3",
        bathrooms: "2",
        service_type: "maintenance",
        overall_labor_condition: "normal_lived_in",
        kitchen_intensity: "average_use",
        clutter_access: "mostly_clear",
        pet_impact: "light",
        last_pro_clean_recency: "within_30_days",
        primary_cleaning_intent: "maintenance_clean",
      }),
    );
    expect(result.expectedMinutes).toBe(255);
  });

  it("does not let reset-level expectation change expected minutes", () => {
    const reset = estimateV2(
      validationInput({
        service_type: "deep_clean",
        primary_cleaning_intent: "reset_level",
      }),
    );
    const maintenance = estimateV2(
      validationInput({
        service_type: "deep_clean",
        primary_cleaning_intent: "maintenance_clean",
      }),
    );
    expect(reset.expectedMinutes).toBe(maintenance.expectedMinutes);
    expect(reset.riskFlags).toContain("RESET_EXPECTATION");
  });

  it("collapses condition signals into one weighted condition score", () => {
    const result = estimateV2(
      validationInput({
        overall_labor_condition: "major_reset",
        clutter_access: "heavy_clutter",
        kitchen_intensity: "heavy_use",
        pet_impact: "heavy",
        last_pro_clean_recency: "days_90_plus",
      }),
    );
    expect(result.pricingFactors.conditionScore).toBe(10);
    expect(result.pricingFactors.conditionMultiplier).toBe(1.2);
    expect(result.pricingFactors).not.toHaveProperty("laborConditionMultiplier");
    expect(result.pricingFactors).not.toHaveProperty("clutterAccessMultiplier");
    expect(result.pricingFactors).not.toHaveProperty("kitchenIntensityMultiplier");
    expect(result.pricingFactors).not.toHaveProperty("petMultiplier");
    expect(result.pricingFactors).not.toHaveProperty("recencyMultiplier");
  });

  it("caps expected minutes by service absolute max, sqft band max, and service multiplier", () => {
    const maintenance = estimateV2(
      validationInput({
        sqft_band: "3500_plus",
        bedrooms: "5_plus",
        bathrooms: "4_plus",
        service_type: "maintenance",
        overall_labor_condition: "major_reset",
        kitchen_intensity: "heavy_use",
        clutter_access: "heavy_clutter",
        pet_impact: "heavy",
        last_pro_clean_recency: "days_90_plus",
      }),
    );
    expect(maintenance.expectedMinutes).toBe(330);
    expect(maintenance.pricingFactors.conditionMultiplier).toBe(1.2);

    const moveOut = estimateV2(
      validationInput({
        sqft_band: "1200_1599",
        bedrooms: "5_plus",
        bathrooms: "4_plus",
        service_type: "move_out",
        overall_labor_condition: "major_reset",
        kitchen_intensity: "heavy_use",
        clutter_access: "heavy_clutter",
        pet_impact: "heavy",
        last_pro_clean_recency: "days_90_plus",
      }),
    );
    expect(moveOut.expectedMinutes).toBe(450);
    expect(moveOut.expectedMinutes).toBe(
      Math.ceil(moveOut.pricingFactors.sqftBandMaxMinutesCap / 5) * 5,
    );
    expect(moveOut.pricingFactors.conditionMultiplier).toBe(1.35);
  });

  it("rounds output minutes to nearest five", () => {
    const result = estimateV2(baseInput({ sqft_band: "800_1199" }));
    expect(result.expectedMinutes % 5).toBe(0);
    expect(result.bufferMinutes % 5).toBe(0);
    expect(result.pricedMinutes % 5).toBe(0);
  });

  it("classifies estimate variance using expected minutes", () => {
    expect(
      calculateEstimateVariance({
        bookingId: "b1",
        expectedMinutes: 100,
        actualMinutes: 80,
        snapshotVersion: "estimate_engine_v2_core_v1",
      }).varianceCategory,
    ).toBe("under");
    expect(
      calculateEstimateVariance({
        bookingId: "b1",
        expectedMinutes: 100,
        actualMinutes: 110,
        snapshotVersion: "estimate_engine_v2_core_v1",
      }).varianceCategory,
    ).toBe("on_target");
    expect(
      calculateEstimateVariance({
        bookingId: "b1",
        expectedMinutes: 100,
        actualMinutes: 130,
        snapshotVersion: "estimate_engine_v2_core_v1",
      }).varianceCategory,
    ).toBe("over");
  });

  it("preview endpoint includes estimateVersion and estimateV2 while preserving legacy fields", async () => {
    const estimator = { estimate: jest.fn().mockResolvedValue(legacyEstimate()) };
    const controller = new EstimatePreviewController(
      estimator as never,
      new EstimateEngineV2Service(),
    );
    const response = await controller.preview(baseInput());
    expect(response.kind).toBe("estimate_preview");
    expect(response.estimateVersion).toBe("estimate_engine_v2_core_v1");
    expect(response.estimateV2.expectedMinutes).toBeGreaterThan(0);
    expect(response.estimatedPriceCents).toBe(14000);
    expect(response.estimatedDurationMinutes).toBe(70);
  });

  it("booking estimate snapshot stores estimateV2 under a stable key", () => {
    const estimate = estimateV2(baseInput());
    const snapshot = {
      outputJson: JSON.stringify({
        ...legacyEstimate(),
        estimateVersion: estimate.snapshotVersion,
        estimateV2: estimate,
        rawNormalizedIntake: baseInput(),
      }),
    };
    const parsed = JSON.parse(snapshot.outputJson);
    expect(parsed.estimateVersion).toBe("estimate_engine_v2_core_v1");
    expect(parsed.estimateV2.expectedMinutes).toBe(estimate.expectedMinutes);
    expect(parsed.rawNormalizedIntake.service_type).toBe("maintenance");
  });

  it("snapshot extraction and FO-safe helper return only v2 public target data", () => {
    const estimate = estimateV2(baseInput());
    const snapshot = { outputJson: JSON.stringify({ estimateV2: estimate }) };
    expect(extractEstimateV2FromSnapshot(snapshot)?.expectedMinutes).toBe(
      estimate.expectedMinutes,
    );
    const foVisible = toFoVisibleEstimate(snapshot);
    expect(foVisible).toEqual({
      targetMinutes: estimate.expectedMinutes,
      riskFlags: estimate.riskFlags,
    });
    expect(foVisible).not.toHaveProperty("bufferMinutes");
    expect(foVisible).not.toHaveProperty("pricedMinutes");
  });

  it("calculateReconciliation returns aligned within twenty percent", () => {
    const service = new EstimateEngineV2Service();
    const result = service.calculateReconciliation({
      v1Minutes: 100,
      v1PriceCents: 10000,
      v2ExpectedMinutes: 115,
      v2PricedMinutes: 120,
      v2PriceCents: 11200,
    });
    expect(result.classification).toBe("aligned");
    expect(result.expectedDeltaPercent).toBeCloseTo(0.15);
    expect(result.authority).toEqual({
      pricingAuthority: "legacy_v1",
      durationAuthority: "legacy_v1",
      v2Mode: "shadow",
    });
  });

  it("calculateReconciliation returns v2_higher above twenty percent", () => {
    const result = new EstimateEngineV2Service().calculateReconciliation({
      v1Minutes: 100,
      v1PriceCents: 10000,
      v2ExpectedMinutes: 125,
      v2PricedMinutes: 140,
      v2PriceCents: 13000,
    });
    expect(result.classification).toBe("v2_higher");
    expect(result.flags).toContain("ESTIMATE_V2_PRICE_HIGHER_THAN_V1");
  });

  it("calculateReconciliation returns v2_lower below negative twenty percent", () => {
    const result = new EstimateEngineV2Service().calculateReconciliation({
      v1Minutes: 100,
      v1PriceCents: 10000,
      v2ExpectedMinutes: 75,
      v2PricedMinutes: 80,
      v2PriceCents: 7000,
    });
    expect(result.classification).toBe("v2_lower");
    expect(result.flags).toContain("ESTIMATE_V2_PRICE_LOWER_THAN_V1");
  });

  it("calculateReconciliation flags large minute and price deltas", () => {
    const result = new EstimateEngineV2Service().calculateReconciliation({
      v1Minutes: 100,
      v1PriceCents: 10000,
      v2ExpectedMinutes: 150,
      v2PricedMinutes: 170,
      v2PriceCents: 14000,
    });
    expect(result.flags).toEqual(
      expect.arrayContaining([
        "ESTIMATE_V2_LARGE_MINUTE_DELTA",
        "ESTIMATE_V2_LARGE_PRICE_DELTA",
      ]),
    );
  });

  it("preview-estimate response includes reconciliation and keeps legacy estimate unchanged", async () => {
    const estimator = {
      estimate: jest.fn().mockResolvedValue(
        legacyEstimate({
          estimatedDurationMinutes: 165,
          estimatedPriceCents: 44634,
        }),
      ),
    };
    const controller = new EstimatePreviewController(
      estimator as never,
      new EstimateEngineV2Service(),
    );
    const response = await controller.preview(
      baseInput({
        overall_labor_condition: "major_reset",
        kitchen_intensity: "heavy_use",
        clutter_access: "heavy_clutter",
      }),
    );
    expect(response.estimatedDurationMinutes).toBe(165);
    expect(response.estimatedPriceCents).toBe(44634);
    expect(response.reconciliation.v1Minutes).toBe(165);
    expect(response.reconciliation.classification).toBe("v2_higher");
    expect(response.reconciliation.authority.pricingAuthority).toBe("legacy_v1");
    expect(response.reconciliation.authority.durationAuthority).toBe("legacy_v1");
    expect(response.reconciliation.authority.v2Mode).toBe("shadow");
  });

  it("booking estimate snapshot stores and extracts reconciliation", () => {
    const estimate = estimateV2(baseInput());
    const reconciliation = new EstimateEngineV2Service().calculateReconciliation({
      v1Minutes: 70,
      v1PriceCents: 14000,
      v2ExpectedMinutes: estimate.expectedMinutes,
      v2PricedMinutes: estimate.pricedMinutes,
      v2PriceCents: estimate.customerVisible.estimatedPrice ?? 0,
    });
    const snapshot = {
      outputJson: JSON.stringify({
        ...legacyEstimate(),
        estimateVersion: estimate.snapshotVersion,
        estimateV2: estimate,
        reconciliation,
        legacy: {
          durationMinutes: 70,
          priceCents: 14000,
          confidence: 0.9,
        },
        rawNormalizedIntake: baseInput(),
      }),
    };
    const parsed = JSON.parse(snapshot.outputJson);
    expect(parsed.reconciliation.classification).toBe(reconciliation.classification);
    expect(parsed.legacy).toEqual({
      durationMinutes: 70,
      priceCents: 14000,
      confidence: 0.9,
    });
    expect(extractEstimateV2ReconciliationFromSnapshot(snapshot)).toEqual(
      reconciliation,
    );
  });

  it("large delta anomaly failure does not block booking creation", async () => {
    const tx = {
      booking: {
        create: jest.fn().mockResolvedValue({
          id: "booking_1",
          status: "pending_payment",
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      bookingEvent: { create: jest.fn().mockResolvedValue({}) },
      bookingEstimateSnapshot: { create: jest.fn().mockResolvedValue({}) },
      bookingDeepCleanProgram: { create: jest.fn().mockResolvedValue({}) },
    };
    const paymentAnomalyCreate = jest
      .fn()
      .mockRejectedValue(new Error("anomaly db unavailable"));
    const db = {
      $transaction: jest.fn(async (fn: (inner: typeof tx) => unknown) => fn(tx)),
      booking: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({ id: "booking_1" }),
      },
      paymentAnomaly: { create: paymentAnomalyCreate },
    };
    const estimator = {
      estimate: jest.fn().mockResolvedValue(
        legacyEstimate({
          estimatedDurationMinutes: 60,
          estimatedPriceCents: 6000,
          estimateMinutes: 60,
        }),
      ),
    };
    const { service } = createBookingsServiceTestHarness({
      db: db as never,
      estimator: estimator as never,
    });
    await expect(
      service.createBooking({
        customerId: "customer_1",
        tenantId: "tenant_1",
        estimateInput: baseInput({
          overall_labor_condition: "major_reset",
          kitchen_intensity: "heavy_use",
          clutter_access: "heavy_clutter",
        }),
      }),
    ).resolves.toEqual({
      booking: { id: "booking_1" },
      estimate: expect.objectContaining({ estimatedDurationMinutes: 60 }),
    });
    expect(paymentAnomalyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: "estimate_v2_large_delta",
          bookingId: "booking_1",
          details: expect.objectContaining({
            bookingId: "booking_1",
            classification: "v2_higher",
          }),
        }),
      }),
    );
  });
});
