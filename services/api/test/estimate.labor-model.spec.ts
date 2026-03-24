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
    last_professional_clean: "1_3_months",
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

describe("EstimatorService labor model (unit)", () => {
  const svc = new EstimatorService(mockFoService, mockDeepCleanEstimatorConfig);

  it("returns labor model fields", async () => {
    const res = await svc.estimate(baseInput());

    expect(res.serviceLaborModelVersion).toBe("labor_v1.0.0");
    expect(res.baseLaborMinutes).toBeGreaterThan(0);
    expect(res.adjustedLaborMinutes).toBeGreaterThan(0);
    expect(res.jobComplexityIndex).toBeGreaterThanOrEqual(0);
    expect(res.jobComplexityIndex).toBeLessThanOrEqual(100);
    expect(res.recommendedTeamSize).toBeGreaterThanOrEqual(1);
    expect(res.effectiveTeamSize).toBeGreaterThan(0);
    expect(res.estimatedDurationMinutes).toBeGreaterThan(0);
    expect(res.estimatedPriceCents).toBeGreaterThan(0);
  });

  it("deep clean with add-ons increases labor and price vs maintenance", async () => {
    const maintenance = await svc.estimate(
      baseInput({
        service_type: "maintenance",
        addons: [],
      }),
    );

    const deep = await svc.estimate(
      baseInput({
        service_type: "deep_clean",
        clutter_level: "moderate",
        kitchen_condition: "heavy_grease",
        bathroom_condition: "heavy_scale",
        addons: ["inside_oven", "inside_fridge", "interior_windows"],
      }),
    );

    expect(deep.adjustedLaborMinutes).toBeGreaterThan(maintenance.adjustedLaborMinutes);
    expect(deep.estimatedPriceCents).toBeGreaterThan(maintenance.estimatedPriceCents);
    expect(deep.jobComplexityIndex).toBeGreaterThan(maintenance.jobComplexityIndex);
  });

  it("larger scope recommends a larger team", async () => {
    const small = await svc.estimate(
      baseInput({
        sqft_band: "800_1199",
        bedrooms: "2",
        bathrooms: "1",
        service_type: "maintenance",
      }),
    );

    const large = await svc.estimate(
      baseInput({
        sqft_band: "3500_plus",
        bedrooms: "5_plus",
        bathrooms: "4_plus",
        floors: "3_plus",
        service_type: "deep_clean",
        clutter_level: "heavy",
        pet_presence: "multiple",
        pet_shedding: "high",
        addons: ["inside_oven", "inside_fridge", "interior_windows", "blinds"],
      }),
    );

    expect(large.recommendedTeamSize).toBeGreaterThanOrEqual(small.recommendedTeamSize);
    expect(large.adjustedLaborMinutes).toBeGreaterThan(small.adjustedLaborMinutes);
  });
});
