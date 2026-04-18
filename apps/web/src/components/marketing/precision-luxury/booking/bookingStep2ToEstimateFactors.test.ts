import { describe, expect, it } from "vitest";
import {
  BOOKING_INTAKE_DEFAULT_ESTIMATE_FACTORS,
  buildIntakeEstimateFactorsFromBookingHomeState,
} from "./bookingStep2ToEstimateFactors";
import type { BookingFlowState } from "./bookingFlowTypes";
import { defaultBookingFlowState } from "./bookingFlowData";

const baseState = (): BookingFlowState => ({
  ...defaultBookingFlowState,
  step: "review",
  serviceId: "recurring-home-cleaning",
  homeSize: "2200",
  bedrooms: "3",
  bathrooms: "2",
  pets: "",
  condition: "standard_lived_in",
  problemAreas: [],
  surfaceComplexity: "average_furnishings",
  scopeIntensity: "full_home_refresh",
  selectedAddOns: [],
  frequency: "Weekly",
  preferredTime: "Friday",
  deepCleanProgram: "",
  deepCleanFocus: "whole_home_reset",
  transitionState: "empty_home",
  appliancePresence: [],
  customerName: "",
  customerEmail: "",
});

describe("buildIntakeEstimateFactorsFromBookingHomeState", () => {
  it("returns a full factor object aligned with server defaults shape", () => {
    const f = buildIntakeEstimateFactorsFromBookingHomeState(baseState());
    expect(f.propertyType).toBe(BOOKING_INTAKE_DEFAULT_ESTIMATE_FACTORS.propertyType);
    expect(Array.isArray(f.addonIds)).toBe(true);
    expect(f.petPresence).toBe("none");
    expect(f.petShedding).toBeUndefined();
  });

  it("does not emit undeclared intake top-level keys (payload contract)", () => {
    const f = buildIntakeEstimateFactorsFromBookingHomeState({
      ...baseState(),
      condition: "heavy_buildup",
      selectedAddOns: ["inside_oven", "cabinets_detail"],
    });
    expect(f.kitchenCondition).toBe("heavy_grease");
    expect(f.addonIds).toContain("inside_oven");
    expect(f.addonIds).toContain("cabinets_exterior_detail");
  });

  it("maps problem areas into kitchen, bath, and pet factors", () => {
    const f = buildIntakeEstimateFactorsFromBookingHomeState({
      ...baseState(),
      problemAreas: ["kitchen_grease", "bathroom_buildup", "pet_hair"],
    });
    expect(f.kitchenCondition).toBe("heavy_grease");
    expect(f.bathroomCondition).toBe("heavy_scale");
    expect(f.petPresence).toBe("one");
    expect(f.petShedding).toBe("high");
  });

  it("changes clutter when condition changes", () => {
    const light = buildIntakeEstimateFactorsFromBookingHomeState({
      ...baseState(),
      condition: "light_upkeep",
    });
    const heavy = buildIntakeEstimateFactorsFromBookingHomeState({
      ...baseState(),
      condition: "heavy_buildup",
    });
    expect(light.clutterLevel).toBe("light");
    expect(heavy.clutterLevel).toBe("heavy");
  });
});
