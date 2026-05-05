import { describe, expect, it } from "vitest";
import {
  BOOKING_INTAKE_DEFAULT_ESTIMATE_FACTORS,
  buildIntakeEstimateFactorsFromBookingHomeState,
} from "./bookingStep2ToEstimateFactors";
import type { BookingFlowState } from "./bookingFlowTypes";
import { defaultBookingFlowState, bookingHomeLayer1BaselineComplete } from "./bookingFlowData";

const baseState = (): BookingFlowState => ({
  ...defaultBookingFlowState,
  ...bookingHomeLayer1BaselineComplete,
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
  it("includes three-layer intake fields expected by the API DTO", () => {
    const f = buildIntakeEstimateFactorsFromBookingHomeState(baseState());
    expect(f.halfBathrooms).toBeDefined();
    expect(f.floorMix).toBeDefined();
    expect(f.layoutType).toBeDefined();
    expect(f.occupancyLevel).toBeDefined();
    expect(f.childrenInHome).toBeDefined();
    expect(f.petImpact).toBeDefined();
    expect(f.overallLaborCondition).toBeDefined();
    expect(f.kitchenIntensity).toBeDefined();
    expect(f.bathroomComplexity).toBeDefined();
    expect(f.clutterAccess).toBeDefined();
    expect(Array.isArray(f.surfaceDetailTokens)).toBe(true);
    expect(f.primaryIntent).toBeDefined();
    expect(f.lastProCleanRecency).toBeDefined();
    expect(f.firstTimeVisitProgram).toBeDefined();
    expect(f.recurringCadenceIntent).toBeDefined();
    expect(f.propertyType).toBe(BOOKING_INTAKE_DEFAULT_ESTIMATE_FACTORS.propertyType);
    expect(Array.isArray(f.addonIds)).toBe(true);
  });

  it("maps add-on tokens into addonIds", () => {
    const f = buildIntakeEstimateFactorsFromBookingHomeState({
      ...baseState(),
      selectedAddOns: ["inside_oven", "cabinets_detail"],
    });
    expect(f.addonIds).toContain("inside_oven");
    expect(f.addonIds).toContain("cabinets_exterior_detail");
  });

  it("reflects layered kitchen and clutter selections", () => {
    const f = buildIntakeEstimateFactorsFromBookingHomeState({
      ...baseState(),
      kitchenIntensity: "heavy_use",
      clutterAccess: "heavy_clutter",
    });
    expect(f.kitchenIntensity).toBe("heavy_use");
    expect(f.clutterAccess).toBe("heavy_clutter");
  });

  it("normalizes surface detail tokens", () => {
    const f = buildIntakeEstimateFactorsFromBookingHomeState({
      ...baseState(),
      surfaceDetailTokens: ["built_ins", "interior_glass", "built_ins"],
    });
    expect(f.surfaceDetailTokens).toEqual(["built_ins", "interior_glass"]);
  });
});
