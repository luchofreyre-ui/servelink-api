import {
  resolveEstimateFactorsForPublicIntake,
  sanitizePublicIntakeEstimateFactors,
} from "../src/modules/booking-direction-intake/estimate-factors-sanitize";
import type { EstimateFactorsDto } from "../src/modules/booking-direction-intake/dto/estimate-factors.dto";

describe("sanitizePublicIntakeEstimateFactors", () => {
  it("replaces invalid enum strings with defaults", () => {
    const dirty = {
      propertyType: "castle",
      floors: "99",
      firstTimeWithServelink: "maybe",
      lastProfessionalClean: "1_3_months",
      clutterLevel: "light",
      kitchenCondition: "normal",
      stovetopType: "not_sure",
      bathroomCondition: "normal",
      glassShowers: "none",
      petPresence: "none",
      petAccidentsOrLitterAreas: "no",
      occupancyState: "occupied_normal",
      floorVisibility: "mostly_clear",
      carpetPercent: "26_50",
      stairsFlights: "none",
      addonIds: ["not_a_real_addon", "inside_oven"],
    } as unknown as EstimateFactorsDto;

    const out = sanitizePublicIntakeEstimateFactors(dirty);
    expect(out.propertyType).toBe("house");
    expect(out.floors).toBe("1");
    expect(out.firstTimeWithServelink).toBe("no");
    expect(out.addonIds).toEqual(["inside_oven"]);
  });
});

describe("resolveEstimateFactorsForPublicIntake", () => {
  it("sanitizes partial merged payloads", () => {
    const out = resolveEstimateFactorsForPublicIntake({
      propertyType: "condo",
      petPresence: "multiple",
    } as EstimateFactorsDto);
    expect(out.propertyType).toBe("condo");
    expect(out.petShedding).toBe("medium");
    expect(out.kitchenCondition).toBe("normal");
  });
});
