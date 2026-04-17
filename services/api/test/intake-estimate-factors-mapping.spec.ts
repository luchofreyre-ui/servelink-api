import { mapIntakeFieldsToEstimateInput } from "../src/modules/booking-direction-intake/intake-to-estimate.mapper";
import { DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS } from "../src/modules/booking-direction-intake/estimate-factors-sanitize";

describe("mapIntakeFieldsToEstimateInput + estimateFactors", () => {
  it("maps addonIds into EstimateInput.addons", () => {
    const out = mapIntakeFieldsToEstimateInput({
      homeSize: "2200",
      bedrooms: "3",
      bathrooms: "2",
      serviceId: "recurring-home-cleaning",
      frequency: "Weekly",
      deepCleanProgram: null,
      estimateFactors: {
        ...DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS,
        addonIds: ["inside_fridge", "inside_oven"],
      },
    });
    expect(out.addons).toEqual(
      expect.arrayContaining(["inside_fridge", "inside_oven"]),
    );
  });

  it("passes kitchen/bathroom/clutter questionnaire into EstimateInput", () => {
    const out = mapIntakeFieldsToEstimateInput({
      homeSize: "2200",
      bedrooms: "3",
      bathrooms: "2",
      serviceId: "recurring-home-cleaning",
      frequency: "Weekly",
      deepCleanProgram: null,
      estimateFactors: {
        ...DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS,
        kitchenCondition: "heavy_grease",
        bathroomCondition: "heavy_scale",
        clutterLevel: "heavy",
      },
    });
    expect(out.kitchen_condition).toBe("heavy_grease");
    expect(out.bathroom_condition).toBe("heavy_scale");
    expect(out.clutter_level).toBe("heavy");
  });
});
