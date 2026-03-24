import { EstimatorService, EstimateInput } from "../src/modules/estimate/estimator.service";
import { FoService } from "../src/modules/fo/fo.service";
import type { DeepCleanEstimatorConfigService } from "../src/modules/bookings/deep-clean-estimator-config.service";

const mockFoService = {
  matchFOs: jest.fn().mockResolvedValue([]),
} as unknown as FoService;

const mockDeepCleanEstimatorConfig = {
  getActiveForEstimate: jest.fn().mockResolvedValue(null),
} as unknown as DeepCleanEstimatorConfigService;

function baseInput(overrides: Partial<EstimateInput> = {}): EstimateInput {
  return {
    property_type: "house",
    sqft_band: "1600_1999",
    bedrooms: "3",
    bathrooms: "2",
    floors: "2",

    service_type: "maintenance",

    first_time_with_servelink: "no",
    clutter_level: "light",
    kitchen_condition: "normal",
    stovetop_type: "flat_glass",
    bathroom_condition: "normal",
    glass_showers: "none",

    pet_presence: "none",

    occupancy_state: "occupied_normal",
    floor_visibility: "mostly_clear",

    carpet_percent: "0_25",
    stairs_flights: "one",

    addons: [],

    ...overrides,
  };
}

describe("EstimatorService (unit)", () => {
  const svc = new EstimatorService(mockFoService, mockDeepCleanEstimatorConfig);

  it("STANDARD: returns real-time estimate with anchored asymmetric range (maintenance, low risk)", async () => {
    const input = baseInput({
      service_type: "maintenance",
      first_time_with_servelink: "no",
      clutter_level: "light",
      kitchen_condition: "normal",
      bathroom_condition: "normal",
      pet_presence: "none",
      occupancy_state: "occupied_normal",
      floor_visibility: "mostly_clear",
    });

    const res = await svc.estimate(input);

    expect(res.mode).toBe("STANDARD");
    expect(res.estimateMinutes).toBeGreaterThan(0);
    expect(res.lowerBoundMinutes).toBeGreaterThan(0);
    expect(res.upperBoundMinutes).toBeGreaterThanOrEqual(res.estimateMinutes);

    // Maintenance upside cap is +15%, downside cap is -5%
    const maxUpper = Math.round(res.estimateMinutes * 1.15);
    const minLower = Math.round(res.estimateMinutes * 0.95);

    expect(res.upperBoundMinutes).toBeLessThanOrEqual(maxUpper);
    expect(res.lowerBoundMinutes).toBeGreaterThanOrEqual(minLower);

    expect(res.riskPercentUncapped).toBeGreaterThanOrEqual(0);
    expect(res.riskPercentCappedForRange).toBeLessThanOrEqual(15);

    expect(res.uncappedMinutes).toBeUndefined();
    expect(res.stagedPlan).toBeUndefined();

    // Confidence should be healthy
    expect(res.confidence).toBeGreaterThanOrEqual(0.65);
  });

  it("CAPPED: for risk 26–34%, mode is CAPPED; range uses service cap (deep clean cap=25%) and no staged plan", async () => {
    const input = baseInput({
      service_type: "deep_clean",

      // Build risk signals to exceed 26 but not reach 35:
      // unknowns (15 cap): clutter not_sure (5), kitchen not_sure (5), bathroom not_sure (5) => 15
      clutter_level: "not_sure",
      kitchen_condition: "not_sure",
      bathroom_condition: "not_sure",

      // confirmed multipliers: first-time yes (5), pets multiple (5) => 10
      first_time_with_servelink: "yes",
      pet_presence: "multiple",

      // occupancy/access: occupied_normal (3) => +3 (cap 5)
      occupancy_state: "occupied_normal",

      // Total uncapped risk should be ~28 (15+10+3)
    });

    const res = await svc.estimate(input);

    expect(res.mode).toBe("CAPPED");

    // Risk uncapped should be at least 26 but less than 35 (our constructed case)
    expect(res.riskPercentUncapped).toBeGreaterThanOrEqual(26);
    expect(res.riskPercentUncapped).toBeLessThan(35);

    // Deep clean upside cap is 25%, so range risk should be capped at <=25
    expect(res.riskPercentCappedForRange).toBeLessThanOrEqual(25);
    expect(res.riskCapped).toBe(true);

    expect(res.uncappedMinutes).toBeUndefined();
    expect(res.stagedPlan).toBeUndefined();

    // Still always returns a real-time estimate
    expect(res.estimateMinutes).toBeGreaterThan(0);
    expect(res.upperBoundMinutes).toBeGreaterThanOrEqual(res.estimateMinutes);

    // Flags should indicate ops visibility post-booking (non-blocking)
    expect(res.flags).toEqual(
      expect.arrayContaining(["OPS_VISIBILITY_HIGH", "POST_BOOKING_REVIEW_ELIGIBLE"]),
    );
  });

  it("STAGED: for uncapped risk >= 35%, mode is STAGED; returns uncappedMinutes and a 4-visit plan that sums correctly", async () => {
    const input = baseInput({
      service_type: "deep_clean",

      // Push risk to >=35:
      // unknowns cap 15: clutter not_sure (5), kitchen not_sure (5), bathroom not_sure (5) => 15
      clutter_level: "not_sure",
      kitchen_condition: "not_sure",
      bathroom_condition: "not_sure",

      // confirmed multipliers cap 20:
      first_time_with_servelink: "yes", // +5
      pet_presence: "multiple", // +5
      pet_shedding: "high", // +5
      pet_accidents_or_litter_areas: "yes", // +5
      // confirmed subtotal => 20 (cap reached)

      // occupancy/access cap 5:
      occupancy_state: "occupied_cluttered", // +5

      // kitchen complexity cap 10: heavy_grease would add +5 but kitchen is not_sure here; leave as is (not counted)
      // bathroom complexity cap 10: glass multiple adds +5
      glass_showers: "multiple",
      // Now total risk = 15 + 20 + 5 + 5 = 45 (>=35)
    });

    const res = await svc.estimate(input);

    expect(res.mode).toBe("STAGED");
    expect(res.riskPercentUncapped).toBeGreaterThanOrEqual(35);

    expect(res.uncappedMinutes).toBeDefined();
    expect(typeof res.uncappedMinutes).toBe("number");
    expect(res.uncappedMinutes as number).toBeGreaterThan(res.estimateMinutes);

    expect(res.stagedPlan).toBeDefined();
    expect(res.stagedPlan?.visits).toHaveLength(4);

    const sum = (res.stagedPlan?.visits ?? []).reduce((acc, v) => acc + v.minutes, 0);
    expect(sum).toBe(res.uncappedMinutes);

    // Must always show real-time estimate too
    expect(res.estimateMinutes).toBeGreaterThan(0);

    // Flags should include staged plan presented + ops visibility
    expect(res.flags).toEqual(
      expect.arrayContaining(["STAGED_PLAN_PRESENTED", "OPS_VISIBILITY_HIGH", "POST_BOOKING_REVIEW_ELIGIBLE"]),
    );
  });

  it("deep clean: includes single_visit_deep_clean program by default", async () => {
    const input = baseInput({ service_type: "deep_clean" });
    const res = await svc.estimate(input);

    expect(res.deepCleanProgram).toBeDefined();
    expect(res.deepCleanProgram?.programType).toBe("single_visit_deep_clean");
    expect(res.deepCleanProgram?.visitCount).toBe(1);
    expect(res.deepCleanProgram?.visits).toHaveLength(1);
    expect(res.deepCleanProgram?.visits[0].estimatedLaborMinutes).toBe(res.adjustedLaborMinutes);
  });

  it("deep clean: phased_3_visit splits labor across 3 visits; visit prices sum to aggregate quote", async () => {
    const input = baseInput({
      service_type: "deep_clean",
      deep_clean_program: "phased_3_visit",
    });
    const res = await svc.estimate(input);

    expect(res.deepCleanProgram?.programType).toBe("phased_deep_clean_program");
    expect(res.deepCleanProgram?.visitCount).toBe(3);
    expect(res.deepCleanProgram?.visits).toHaveLength(3);

    const sumLabor = res.deepCleanProgram!.visits.reduce(
      (s, v) => s + v.estimatedLaborMinutes,
      0,
    );
    expect(sumLabor).toBe(res.adjustedLaborMinutes);

    const sumPrice = res.deepCleanProgram!.visits.reduce(
      (s, v) => s + v.estimatedPriceCents,
      0,
    );
    expect(sumPrice).toBe(res.estimatedPriceCents);
  });

  it("maintenance: omits deepCleanProgram", async () => {
    const res = await svc.estimate(baseInput({ service_type: "maintenance" }));
    expect(res.deepCleanProgram).toBeUndefined();
  });

  it("Category caps: unknowns should cap at 15%, occupancy/access at 5%", async () => {
    const input = baseInput({
      service_type: "maintenance",

      // pile on unknowns beyond cap
      clutter_level: "not_sure",
      kitchen_condition: "not_sure",
      bathroom_condition: "not_sure",
      pet_presence: "not_sure",
      first_time_with_servelink: "not_sure",
      occupancy_state: "not_sure",
      floor_visibility: "not_sure",
      carpet_percent: "not_sure",
      stairs_flights: "not_sure",
    });

    const res = await svc.estimate(input);

    // Find unknown signals
    const unknownSignals = res.breakdown.riskSignals.filter((s) => s.category === "unknowns");
    const unknownTotal = unknownSignals.reduce((acc, s) => acc + s.percent, 0);

    expect(unknownTotal).toBeLessThanOrEqual(15);

    // occupancy/access should cap at 5
    const occSignals = res.breakdown.riskSignals.filter((s) => s.category === "occupancy_access");
    const occTotal = occSignals.reduce((acc, s) => acc + s.percent, 0);
    expect(occTotal).toBeLessThanOrEqual(5);
  });

  it("Confidence floor: never below 0.30", async () => {
    const input = baseInput({
      service_type: "move_out",

      // max out confidence deductions with lots of risk and unknowns
      clutter_level: "heavy",
      first_time_with_servelink: "yes",

      kitchen_condition: "heavy_grease",
      bathroom_condition: "heavy_scale",
      glass_showers: "multiple",

      pet_presence: "multiple",
      pet_shedding: "high",
      pet_accidents_or_litter_areas: "yes",

      occupancy_state: "occupied_cluttered",
      floor_visibility: "lots_of_items",

      carpet_percent: "76_100",
      stairs_flights: "two_plus",
    });

    const res = await svc.estimate(input);

    expect(res.confidence).toBeGreaterThanOrEqual(0.30);
  });
});
