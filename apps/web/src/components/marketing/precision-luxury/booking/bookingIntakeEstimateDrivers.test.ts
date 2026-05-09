import { describe, expect, it } from "vitest";
import {
  buildIntakePlanningNoteLines,
  computePreviewConfidenceBandInputs,
  computeWiredEstimateDriverFlags,
  derivePreviewConfidenceBand,
} from "./bookingIntakeEstimateDrivers";
import { bookingHomeLayer1BaselineComplete, defaultBookingFlowState } from "./bookingFlowData";
import type { BookingFlowState } from "./bookingFlowTypes";
import { buildIntakeEstimateFactorsFromBookingHomeState } from "./bookingStep2ToEstimateFactors";

function baseReviewState(): BookingFlowState {
  return {
    ...defaultBookingFlowState,
    ...bookingHomeLayer1BaselineComplete,
    step: "review",
    homeSize: "2000",
    bedrooms: "2",
    bathrooms: "2",
    bookingPublicPath: "one_time_cleaning",
    frequency: "Weekly",
    preferredTime: "Friday",
    customerName: "A",
    customerEmail: "a@b.c",
  };
}

describe("computeWiredEstimateDriverFlags", () => {
  it("does not treat URL-only home condition as a heavy-condition driver", () => {
    const flags = computeWiredEstimateDriverFlags({
      ...baseReviewState(),
      condition: "heavy_buildup",
      overallLaborCondition: "normal_lived_in",
      clutterAccess: "mostly_clear",
    });
    expect(flags.heavyCondition).toBe(false);
  });

  it("treats layered kitchen/bath severity as the kitchen/bath driver (not problem-area chips)", () => {
    const s = {
      ...baseReviewState(),
      problemAreas: ["pet_hair"] as BookingFlowState["problemAreas"],
      kitchenIntensity: "average_use" as const,
      bathroomComplexity: "standard" as const,
    };
    expect(computeWiredEstimateDriverFlags(s).heavyKitchenOrBath).toBe(false);

    const t = {
      ...baseReviewState(),
      problemAreas: [],
      kitchenIntensity: "heavy_use" as const,
    };
    expect(computeWiredEstimateDriverFlags(t).heavyKitchenOrBath).toBe(true);
    const f = buildIntakeEstimateFactorsFromBookingHomeState(t);
    expect(f.kitchenIntensity).toBe("heavy_use");
  });

  it("treats segmented layout + access limits as the layout driver (not surface furnishings density alone)", () => {
    const denseOnly = {
      ...baseReviewState(),
      surfaceComplexity: "dense_layout",
      layoutType: "mixed",
      clutterAccess: "mostly_clear",
    };
    expect(
      computeWiredEstimateDriverFlags(denseOnly).segmentedAccessLayout,
    ).toBe(false);

    const segmented = {
      ...baseReviewState(),
      surfaceComplexity: "average_furnishings",
      layoutType: "segmented",
      clutterAccess: "moderate_clutter",
    };
    expect(
      computeWiredEstimateDriverFlags(segmented).segmentedAccessLayout,
    ).toBe(true);
    const factors = buildIntakeEstimateFactorsFromBookingHomeState(segmented);
    expect(factors.layoutType).toBe("segmented");
    expect(factors.clutterAccess).toBe("moderate_clutter");
  });

  it("treats reset intent as detail scope driver but not scopeIntensity alone", () => {
    const scopeOnly = {
      ...baseReviewState(),
      scopeIntensity: "detail_heavy",
      primaryIntent: "detailed_standard",
    };
    expect(computeWiredEstimateDriverFlags(scopeOnly).resetLevelIntent).toBe(
      false,
    );

    const reset = { ...baseReviewState(), primaryIntent: "reset_level" };
    expect(computeWiredEstimateDriverFlags(reset).resetLevelIntent).toBe(true);
  });

  it("aligns surface-detail driver with non-empty normalized estimateFactors.surfaceDetailTokens", () => {
    const s = {
      ...baseReviewState(),
      surfaceDetailTokens: ["built_ins", "invalid_token"] as BookingFlowState["surfaceDetailTokens"],
    };
    expect(computeWiredEstimateDriverFlags(s).hasSurfaceDetailTokens).toBe(true);
    const f = buildIntakeEstimateFactorsFromBookingHomeState(s);
    expect(f.surfaceDetailTokens).toEqual(["built_ins"]);
  });
});

describe("buildIntakePlanningNoteLines", () => {
  it("lists problem chips under planning notes, not as estimator flags", () => {
    const lines = buildIntakePlanningNoteLines({
      ...baseReviewState(),
      problemAreas: ["pet_hair"],
    });
    expect(lines.some((l) => l.includes("Pet hair"))).toBe(true);
    expect(computeWiredEstimateDriverFlags({
      ...baseReviewState(),
      problemAreas: ["pet_hair"],
    }).heavyKitchenOrBath).toBe(false);
  });
});

describe("preview confidence inputs", () => {
  it("does not count problem-area chips toward problemArea weight", () => {
    const withChips = computePreviewConfidenceBandInputs({
      ...baseReviewState(),
      problemAreas: ["kitchen_grease", "pet_hair"],
      kitchenIntensity: "average_use",
      bathroomComplexity: "standard",
    });
    const baseline = computePreviewConfidenceBandInputs(baseReviewState());
    expect(withChips.problemAreaCount).toBe(baseline.problemAreaCount);
  });

  it("counts surface detail tokens toward the same band bucket as reset intent", () => {
    const tokens = computePreviewConfidenceBandInputs({
      ...baseReviewState(),
      surfaceDetailTokens: ["interior_glass"],
      primaryIntent: "detailed_standard",
    });
    const reset = computePreviewConfidenceBandInputs({
      ...baseReviewState(),
      primaryIntent: "reset_level",
    });
    expect(tokens.isDetailHeavyScope).toBe(true);
    expect(reset.isDetailHeavyScope).toBe(true);
    expect(
      derivePreviewConfidenceBand({
        ...tokens,
        problemAreaCount: 0,
        isHeavyCondition: false,
        isDenseLayout: false,
        addOnCount: 0,
        nonDefaultDeepCleanFocus: false,
        furnishedMoveTransition: false,
        transitionAppliances: false,
      }),
    ).toBe("customized");
  });
});
