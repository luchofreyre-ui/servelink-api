import type { BookingFlowState, BookingPreviewConfidenceBand } from "./bookingFlowTypes";
import {
  isBookingMoveTransitionServiceId,
  isDeepCleaningBookingServiceId,
} from "./bookingDeepClean";
import {
  BOOKING_HOME_CONDITION_LABELS,
  BOOKING_PLANNING_NOTE_DETAIL_HEAVY_PREFERENCE,
  BOOKING_PLANNING_NOTE_DENSE_FURNISHINGS,
  BOOKING_PLANNING_NOTE_FOCUS_AREAS_LEAD,
  BOOKING_PLANNING_NOTE_HOME_CONDITION_LEAD,
  BOOKING_PROBLEM_AREA_LABELS,
} from "./bookingPublicSurfaceCopy";
import { normalizeSurfaceDetailTokens } from "./bookingStep2ToEstimateFactors";
import {
  normalizeBookingAddOnsForPayload,
  normalizeBookingAppliancePresenceForPayload,
  normalizeBookingProblemAreasForPayload,
} from "./bookingUrlState";

export type WiredEstimateDriverFlags = {
  heavyCondition: boolean;
  heavyKitchenOrBath: boolean;
  segmentedAccessLayout: boolean;
  resetLevelIntent: boolean;
  hasSurfaceDetailTokens: boolean;
  hasAddOns: boolean;
  deepCleanFocusNonDefault: boolean;
  furnishedTransition: boolean;
  transitionAppliances: boolean;
};

/**
 * Estimate “driver” toggles for review copy — each flag must correspond to a field
 * present in `buildIntakeEstimateFactorsFromBookingHomeState` output (or add-ons path).
 */
export function computeWiredEstimateDriverFlags(
  state: Pick<
    BookingFlowState,
    | "serviceId"
    | "overallLaborCondition"
    | "clutterAccess"
    | "kitchenIntensity"
    | "bathroomComplexity"
    | "layoutType"
    | "primaryIntent"
    | "surfaceDetailTokens"
    | "selectedAddOns"
    | "deepCleanFocus"
    | "transitionState"
    | "appliancePresence"
  >,
): WiredEstimateDriverFlags {
  const heavyCondition =
    state.overallLaborCondition === "major_reset" ||
    state.clutterAccess === "heavy_clutter";

  const heavyKitchenOrBath =
    state.kitchenIntensity === "heavy_use" ||
    state.bathroomComplexity === "heavy_detailing";

  const segmentedAccessLayout =
    state.layoutType === "segmented" && state.clutterAccess !== "mostly_clear";

  const resetLevelIntent = state.primaryIntent === "reset_level";

  const hasSurfaceDetailTokens =
    normalizeSurfaceDetailTokens(state.surfaceDetailTokens).length > 0;

  const hasAddOns =
    normalizeBookingAddOnsForPayload(state.selectedAddOns).length > 0;

  const deepCleanFocusNonDefault =
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.deepCleanFocus !== "whole_home_reset";

  const furnishedTransition =
    isBookingMoveTransitionServiceId(state.serviceId) &&
    (state.transitionState === "lightly_furnished" ||
      state.transitionState === "fully_furnished");

  const transitionAppliances =
    isBookingMoveTransitionServiceId(state.serviceId) &&
    normalizeBookingAppliancePresenceForPayload(state.appliancePresence).length >
      0;

  return {
    heavyCondition,
    heavyKitchenOrBath,
    segmentedAccessLayout,
    resetLevelIntent,
    hasSurfaceDetailTokens,
    hasAddOns,
    deepCleanFocusNonDefault,
    furnishedTransition,
    transitionAppliances,
  };
}

export function buildIntakePlanningNoteLines(state: BookingFlowState): string[] {
  const lines: string[] = [];
  const problems = normalizeBookingProblemAreasForPayload(state.problemAreas);
  if (problems.length > 0) {
    const labels = problems.map((t) => BOOKING_PROBLEM_AREA_LABELS[t]).join(", ");
    lines.push(`${BOOKING_PLANNING_NOTE_FOCUS_AREAS_LEAD} ${labels}.`);
  }

  const wiredDenseDriver =
    state.layoutType === "segmented" && state.clutterAccess !== "mostly_clear";
  if (state.surfaceComplexity === "dense_layout" && !wiredDenseDriver) {
    lines.push(BOOKING_PLANNING_NOTE_DENSE_FURNISHINGS);
  }

  if (
    state.scopeIntensity === "detail_heavy" &&
    state.primaryIntent !== "reset_level"
  ) {
    lines.push(BOOKING_PLANNING_NOTE_DETAIL_HEAVY_PREFERENCE);
  }

  if (
    state.condition === "heavy_buildup" ||
    state.condition === "move_in_out_reset"
  ) {
    lines.push(
      `${BOOKING_PLANNING_NOTE_HOME_CONDITION_LEAD} ${BOOKING_HOME_CONDITION_LABELS[state.condition]}.`,
    );
  }

  return lines;
}

type PreviewConfidenceInputs = {
  isHeavyCondition: boolean;
  problemAreaCount: number;
  isDenseLayout: boolean;
  isDetailHeavyScope: boolean;
  addOnCount: number;
  nonDefaultDeepCleanFocus: boolean;
  furnishedMoveTransition: boolean;
  transitionAppliances: boolean;
};

/** Internal weighting only — never shown. Uses signals aligned with estimator payload. */
export function derivePreviewConfidenceBand(
  input: PreviewConfidenceInputs,
): BookingPreviewConfidenceBand {
  let weight = 0;
  if (input.isHeavyCondition) weight += 2;
  if (input.problemAreaCount >= 1) {
    weight += Math.min(2, input.problemAreaCount);
  }
  if (input.isDenseLayout) weight += 2;
  if (input.isDetailHeavyScope) weight += 2;
  weight += Math.min(3, input.addOnCount);
  if (input.nonDefaultDeepCleanFocus) weight += 1;
  if (input.furnishedMoveTransition) weight += 1;
  if (input.transitionAppliances) weight += 1;

  if (weight <= 1) return "high_clarity";
  if (weight <= 4) return "customized";
  return "special_attention";
}

export function computePreviewConfidenceBandInputs(
  state: BookingFlowState,
): PreviewConfidenceInputs {
  const flags = computeWiredEstimateDriverFlags(state);
  const problemAreaSignals =
    (state.kitchenIntensity === "heavy_use" ? 1 : 0) +
    (state.bathroomComplexity === "heavy_detailing" ? 1 : 0);

  return {
    isHeavyCondition: flags.heavyCondition,
    problemAreaCount: problemAreaSignals,
    isDenseLayout: flags.segmentedAccessLayout,
    isDetailHeavyScope: flags.resetLevelIntent || flags.hasSurfaceDetailTokens,
    addOnCount: normalizeBookingAddOnsForPayload(state.selectedAddOns).length,
    nonDefaultDeepCleanFocus: flags.deepCleanFocusNonDefault,
    furnishedMoveTransition: flags.furnishedTransition,
    transitionAppliances: flags.transitionAppliances,
  };
}
