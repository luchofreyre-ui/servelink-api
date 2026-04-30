import { EstimatePreviewController } from "../src/modules/estimate/estimate-preview.controller";
import {
  EstimateEngineV2Service,
  estimateV2,
} from "../src/modules/estimate/estimate-engine-v2.service";
import {
  extractEstimateV2FromSnapshot,
  toFoVisibleEstimate,
} from "../src/modules/estimate/estimate-v2-snapshot";
import { calculateEstimateVariance } from "../src/modules/estimate/estimate-variance.types";
import type { EstimateInput, EstimateResult } from "../src/modules/estimate/estimator.service";

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
  return {
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
    riskPercentUncapped: 0,
    riskPercentCappedForRange: 0,
    riskCapped: false,
    breakdown: { baseline: [], adjustments: [], riskSignals: [] },
    flags: [],
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
});
