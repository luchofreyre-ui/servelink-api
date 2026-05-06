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

  it("V2.4 heavy deep clean stays materially above standard with service-aware drag (bounded ratio, not V2.3-compressed)", async () => {
    const standard = await svc.estimate(
      baseInput({
        service_type: "deep_clean",
        clutter_level: "light",
        kitchen_condition: "normal",
        bathroom_condition: "normal",
        pet_presence: "none",
        overall_labor_condition: "normal_lived_in",
      }),
    );

    const heavy = await svc.estimate(
      baseInput({
        service_type: "deep_clean",
        clutter_level: "heavy",
        kitchen_condition: "heavy_grease",
        bathroom_condition: "heavy_scale",
        pet_presence: "multiple",
        pet_shedding: "high",
        pet_impact: "heavy",
        overall_labor_condition: "major_reset",
        last_professional_clean: "6_plus_months",
      }),
    );

    expect(heavy.adjustedLaborMinutes).toBeGreaterThan(standard.adjustedLaborMinutes);
    const ratio = heavy.adjustedLaborMinutes / standard.adjustedLaborMinutes;
    expect(ratio).toBeLessThan(2.25);
    // Wider spread than V2.3 universal clamp allowed for deep reset backlog.
    expect(ratio).toBeGreaterThan(1.12);
  });

  it("V2.4 maintenance heavy stays controlled and below deep clean for same heavy stress inputs", async () => {
    const stress = {
      clutter_level: "heavy" as const,
      kitchen_condition: "heavy_grease" as const,
      bathroom_condition: "heavy_scale" as const,
      pet_presence: "multiple" as const,
      pet_shedding: "high" as const,
      pet_impact: "heavy" as const,
      overall_labor_condition: "major_reset" as const,
      last_professional_clean: "6_plus_months" as const,
    };

    const heavyMaint = await svc.estimate(baseInput({ service_type: "maintenance", ...stress }));
    const standardMaint = await svc.estimate(
      baseInput({
        service_type: "maintenance",
        clutter_level: "light",
        kitchen_condition: "normal",
        bathroom_condition: "normal",
        pet_presence: "none",
        overall_labor_condition: "normal_lived_in",
      }),
    );
    const heavyDeep = await svc.estimate(baseInput({ service_type: "deep_clean", ...stress }));

    expect(heavyMaint.adjustedLaborMinutes).toBeGreaterThan(standardMaint.adjustedLaborMinutes);
    expect(heavyMaint.adjustedLaborMinutes / standardMaint.adjustedLaborMinutes).toBeLessThan(1.65);
    expect(heavyDeep.adjustedLaborMinutes).toBeGreaterThan(heavyMaint.adjustedLaborMinutes);
  });

  it("V2.4 deep clean exceeds maintenance for the same home (no add-ons)", async () => {
    const home = {
      clutter_level: "light" as const,
      kitchen_condition: "normal" as const,
      bathroom_condition: "normal" as const,
      pet_presence: "none" as const,
      overall_labor_condition: "normal_lived_in" as const,
    };

    const maintenance = await svc.estimate(baseInput({ service_type: "maintenance", addons: [], ...home }));
    const deep = await svc.estimate(baseInput({ service_type: "deep_clean", addons: [], ...home }));

    expect(deep.adjustedLaborMinutes).toBeGreaterThan(maintenance.adjustedLaborMinutes);
  });

  it("V2.4 move-out heavy beats maintenance and does not eclipse deep-clean stress on comparable scope", async () => {
    const home = {
      sqft_band: "1600_1999" as const,
      bedrooms: "3" as const,
      bathrooms: "2" as const,
      floors: "2" as const,
      stairs_flights: "one" as const,
      first_time_with_servelink: "yes" as const,
      clutter_level: "heavy" as const,
      kitchen_condition: "heavy_grease" as const,
      bathroom_condition: "heavy_scale" as const,
      pet_presence: "multiple" as const,
      pet_impact: "heavy" as const,
      overall_labor_condition: "major_reset" as const,
      last_professional_clean: "6_plus_months" as const,
      addons: [],
    };

    const maint = await svc.estimate(
      baseInput({
        ...home,
        service_type: "maintenance",
        first_time_with_servelink: "no",
      }),
    );

    const moveOut = await svc.estimate(
      baseInput({
        ...home,
        service_type: "move_out",
        occupancy_state: "vacant",
      }),
    );

    const deepStress = await svc.estimate(
      baseInput({
        ...home,
        service_type: "deep_clean",
        occupancy_state: "occupied_cluttered",
        floor_visibility: "some_obstacles",
      }),
    );

    expect(moveOut.adjustedLaborMinutes).toBeGreaterThan(maint.adjustedLaborMinutes);
    expect(deepStress.adjustedLaborMinutes).toBeGreaterThanOrEqual(moveOut.adjustedLaborMinutes);
  });

  it("V2.4 recently maintained easy maintenance lowers labor vs normal lived-in (same structure)", async () => {
    const easy = await svc.estimate(
      baseInput({
        overall_labor_condition: "recently_maintained",
        pet_presence: "none",
        kitchen_condition: "light",
        bathroom_condition: "light",
        clutter_level: "minimal",
      }),
    );

    const normal = await svc.estimate(
      baseInput({
        overall_labor_condition: "normal_lived_in",
        pet_presence: "none",
        kitchen_condition: "normal",
        bathroom_condition: "normal",
        clutter_level: "light",
      }),
    );

    expect(easy.adjustedLaborMinutes).toBeLessThan(normal.adjustedLaborMinutes);
  });

  it("V2.4 worst-case deep clean stays high but below pre–V2.3 stacked-chain reference (~1355 adj labor)", async () => {
    const worst = await svc.estimate(
      baseInput({
        service_type: "deep_clean",
        sqft_band: "3000_3499",
        bedrooms: "4",
        bathrooms: "3",
        half_bathrooms: "1",
        floors: "2",
        stairs_flights: "two_plus",
        first_time_with_servelink: "yes",
        clutter_level: "heavy",
        kitchen_condition: "heavy_grease",
        bathroom_condition: "heavy_scale",
        glass_showers: "multiple",
        pet_presence: "multiple",
        pet_shedding: "high",
        pet_impact: "heavy",
        pet_accidents_or_litter_areas: "yes",
        occupancy_state: "occupied_cluttered",
        floor_visibility: "lots_of_items",
        overall_labor_condition: "major_reset",
        addons: ["inside_oven", "inside_fridge", "interior_windows"],
        last_professional_clean: "6_plus_months",
      }),
    );

    expect(worst.adjustedLaborMinutes).toBeGreaterThan(650);
    expect(worst.adjustedLaborMinutes).toBeLessThan(1355);
  });
});
