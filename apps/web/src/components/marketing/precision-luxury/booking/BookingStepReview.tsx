import { useEffect, useRef, type LegacyRef, type ReactNode, type RefObject } from "react";
import { DeepCleanProgramCard } from "@/components/booking/deep-clean/DeepCleanProgramCard";
import type { DeepCleanProgramDisplay } from "@/types/deepCleanProgram";
import { BookingSectionCard } from "../BookingSectionCard";
import { BookingTextField } from "./BookingTextField";
import { getBookingHomeSizeRangeLabel } from "./bookingHomeSizeRanges";
import {
  isBookingMoveTransitionServiceId,
  isDeepCleaningBookingServiceId,
} from "./bookingDeepClean";
import type {
  BookingFirstTimePostEstimateVisitChoice,
  BookingFlowState,
  BookingHomeCondition,
  BookingPreviewConfidenceBand,
  BookingProblemAreaToken,
  BookingSurfaceComplexity,
  BookingTeamPlanningDetails,
} from "./bookingFlowTypes";
import {
  formatEstimateDurationMinutes,
  formatEstimateUsdFromCents,
  formatScopePredictabilitySummary,
} from "./bookingIntakePreviewDisplay";
import type { FunnelReviewEstimate } from "./bookingFunnelLocalEstimate";
import { emitBookingFunnelEvent } from "./bookingFunnelAnalytics";
import { postPublicBookingFunnelMilestone } from "./bookingFunnelMilestoneClient";
import {
  getBookingCustomerEmailError,
  getBookingCustomerNameError,
  isBookingContactValid,
} from "./bookingContactValidation";
import {
  formatBookingBathroomsForDisplay,
  formatBookingBedroomsForDisplay,
  normalizeBookingBathroomsParam,
  normalizeBookingBedroomsParam,
} from "./bookingEstimateFactorFields";
import {
  isHomeDetailsComplete,
  isServiceLocationComplete,
  normalizeBookingAddOnsForPayload,
  normalizeBookingAppliancePresenceForPayload,
  normalizeBookingHomeSizeParam,
  normalizeBookingPetsParam,
  normalizeBookingProblemAreasForPayload,
} from "./bookingUrlState";
import {
  BOOKING_ADD_ON_LABELS,
  BOOKING_APPLIANCE_PRESENCE_LABELS,
  BOOKING_DEEP_CLEAN_FOCUS_LABELS,
  BOOKING_PROBLEM_AREA_LABELS,
  BOOKING_REVIEW_ADD_ONS_LABEL,
  BOOKING_REVIEW_DEEP_CLEAN_FOCUS_LABEL,
  BOOKING_REVIEW_ESTIMATOR_FOCUS_AREAS_LABEL,
  BOOKING_REVIEW_TRANSITION_APPLIANCES_LABEL,
  BOOKING_REVIEW_TRANSITION_SETUP_LABEL,
  BOOKING_REVIEW_BANNER_AFTER_SEND_DID_NOT_FINISH,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_ADD_ONS,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DEEP_CLEAN_FOCUS,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_FURNISHED_TRANSITION,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_HEAVY_CONDITION,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_HEAVY_KITCHEN_BATH,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_RESET_INTENT,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_SEGMENTED_ACCESS_LAYOUT,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_SURFACE_DETAILS,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_TRANSITION_APPLIANCES,
  BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE,
  BOOKING_REVIEW_ESTIMATE_NONE_AFTER_FETCH,
  BOOKING_REVIEW_ESTIMATE_REFRESHING_BODY,
  BOOKING_REVIEW_ESTIMATE_REFRESHING_TITLE,
  BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_HINT,
  BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_LEAD,
  BOOKING_REVIEW_PLANNING_CONFIDENCE_TITLE,
  BOOKING_REVIEW_PLANNING_NOTES_TITLE,
  BOOKING_REVIEW_TEAM_PLANNING_DETAILS_LEAD,
  BOOKING_REVIEW_TEAM_PLANNING_DETAILS_SUMMARY,
  BOOKING_REVIEW_TEAM_PLANNING_DETAILS_TITLE,
  BOOKING_REVIEW_PRE_CONF_CUSTOM_BODY,
  BOOKING_REVIEW_PRE_CONF_CUSTOM_HEADLINE,
  BOOKING_REVIEW_PRE_CONF_CUSTOM_SUPPORTING,
  BOOKING_REVIEW_PRE_CONF_HIGH_BODY,
  BOOKING_REVIEW_PRE_CONF_HIGH_HEADLINE,
  BOOKING_REVIEW_PRE_CONF_HIGH_SUPPORTING,
  BOOKING_REVIEW_PRE_CONF_SPECIAL_BODY,
  BOOKING_REVIEW_PRE_CONF_SPECIAL_HEADLINE,
  BOOKING_REVIEW_PRE_CONF_SPECIAL_SUPPORTING,
  BOOKING_REVIEW_BANNER_READY_NEXT_STEP,
  BOOKING_REVIEW_NEXT_SCHEDULE_BODY,
  BOOKING_REVIEW_NEXT_SCHEDULE_TITLE,
  BOOKING_REVIEW_LABOR_EFFORT_GLOSS,
  BOOKING_REVIEW_PREVIEW_OPENING_PRICE_LABEL,
  BOOKING_REVIEW_PREVIEW_SINGLE_VISIT_PRICE_LABEL,
  BOOKING_REVIEW_PREP_SECTION_TITLE,
  BOOKING_REVIEW_RECOMMEND_SECTION_TITLE,
  BOOKING_REVIEW_RECURRING_CADENCE_SUBHEAD,
  BOOKING_REVIEW_RECURRING_LABOR_LABEL,
  BOOKING_REVIEW_RECURRING_MAINTENANCE_SUBHEAD,
  BOOKING_REVIEW_RECURRING_PER_VISIT_DELTA_LABEL,
  BOOKING_REVIEW_RECURRING_PRICE_LABEL,
  BOOKING_REVIEW_RECURRING_SECTION_LEAD,
  BOOKING_REVIEW_RECURRING_SECTION_TITLE,
  BOOKING_REVIEW_RECURRING_VS_OPENING_LEAD,
  BOOKING_REVIEW_OPENING_VISIT_ESTIMATE_SECTION_TITLE,
  BOOKING_REVIEW_SECTION_FIRST_CLEANING_BODY,
  BOOKING_REVIEW_SECTION_FIRST_CLEANING_TITLE,
  BOOKING_REVIEW_RECOMMENDED_SCHEDULE_LEAD,
  BOOKING_REVIEW_RECOMMENDED_SCHEDULE_TITLE,
  BOOKING_REVIEW_CADENCE_HELPER_BIWEEKLY,
  BOOKING_REVIEW_CADENCE_HELPER_EVERY_10_DAYS,
  BOOKING_REVIEW_CADENCE_HELPER_MONTHLY,
  BOOKING_REVIEW_CADENCE_HELPER_WEEKLY,
  BOOKING_REVIEW_WHAT_CHANGES_BODY,
  BOOKING_REVIEW_WHAT_CHANGES_TITLE,
  BOOKING_REVIEW_SCHEDULE_NOTE,
  BOOKING_REVIEW_SCOPE_PREDICTABILITY_FOOTNOTE,
  BOOKING_REVIEW_SCOPE_PREDICTABILITY_LABEL,
  BOOKING_REVIEW_ESTIMATED_TOTAL_HEADLINE,
  BOOKING_REVIEW_PRICE_UPDATES_LINE,
  BOOKING_REVIEW_STEP_BODY,
  BOOKING_REVIEW_STEP_TITLE,
  BOOKING_REVIEW_VIEW_FULL_BREAKDOWN,
  BOOKING_REVIEW_SELECTED_ARRIVAL_LABEL,
  BOOKING_REVIEW_SELECTED_TEAM_LABEL,
  BOOKING_TRANSITION_STATE_LABELS,
  BOOKING_POST_ESTIMATE_FIRST_TIME_BODY,
  BOOKING_POST_ESTIMATE_FIRST_TIME_TITLE,
  BOOKING_POST_ESTIMATE_VISIT_ONE,
  BOOKING_POST_ESTIMATE_VISIT_THREE,
  BOOKING_POST_ESTIMATE_VISIT_TWO,
  BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE,
  BOOKING_PLAN_SUMMARY_LABEL,
  BOOKING_REVIEW_VISIT_STRUCTURE_LABEL,
  bookingPlanClassificationSummary,
} from "./bookingPublicSurfaceCopy";
import {
  BOOKING_TEAM_PLANNING_FIELD_MAX_CHARS,
  BOOKING_TEAM_PLANNING_FIELD_SPECS,
} from "./bookingTeamPlanningDetails";
import { getBookingUpsellOptionsByIds } from "./bookingUpsells";
import { getPublicBookingMarketingTitle } from "./publicBookingTaxonomy";
import type { DerivedSchedulePreview } from "./BookingStepSchedule";
import { BookingTrustRibbon } from "./BookingTrustRibbon";

function formatSchedulePreviewDateForReview(d: Date): string {
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type BookingStepReviewProps = {
  state: BookingFlowState;
  condition: BookingHomeCondition;
  problemAreas: readonly BookingProblemAreaToken[];
  surfaceComplexity: BookingSurfaceComplexity;
  estimateDriverHeavyCondition: boolean;
  estimateDriverHeavyKitchenBath: boolean;
  estimateDriverSegmentedAccessLayout: boolean;
  estimateDriverResetLevelIntent: boolean;
  estimateDriverSurfaceDetailTokens: boolean;
  estimateDriverHasAddOns: boolean;
  estimateDriverDeepCleanFocus: boolean;
  estimateDriverFurnishedTransition: boolean;
  estimateDriverTransitionAppliances: boolean;
  intakePlanningNoteLines: readonly string[];
  previewConfidenceBand: BookingPreviewConfidenceBand;
  hasSubmitRecoverableFailure?: boolean;
  estimatePreviewReady: boolean;
  previewEstimate: FunnelReviewEstimate | null;
  previewDeepCleanCard: DeepCleanProgramDisplay | null;
  previewLoading: boolean;
  previewError: string | null;
  previewFetchCompleted: boolean;
  previewErrorRef?: RefObject<HTMLParagraphElement | null>;
  showContactFieldErrors: boolean;
  onContactChange: (
    patch: Partial<Pick<BookingFlowState, "customerName" | "customerEmail">>,
  ) => void;
  prepGuidanceItems: string[];
  recommendedAttentionItems: string[];
  onFirstTimePostEstimateVisitChoiceChange: (
    choice: BookingFirstTimePostEstimateVisitChoice,
  ) => void;
  onRecurringInterestChange: (
    value: BookingFlowState["recurringInterest"],
  ) => void;
  onTeamPlanningDetailsChange: (
    patch: Partial<BookingTeamPlanningDetails>,
  ) => void;
  onRecurringCadenceIntentChange: (
    value: BookingFlowState["recurringCadenceIntent"],
  ) => void;
  schedulePreview: DerivedSchedulePreview | null;
  depositResolutionActive?: boolean;
  funnelBookingId?: string;
  funnelIntakeId?: string;
};

function isBookingReady(state: BookingFlowState) {
  return (
    !!state.serviceId &&
    state.bookingPublicPath !== "recurring_auth_gate" &&
    (state.bookingPublicPath === "one_time_cleaning" ||
      state.bookingPublicPath === "first_time_with_recurring" ||
      state.bookingPublicPath === "move_transition") &&
    isHomeDetailsComplete(state) &&
    isServiceLocationComplete(state)
  );
}

function formatSlotForReview(isoStart: string): string {
  const d = new Date(isoStart);
  if (!Number.isFinite(d.getTime())) return isoStart;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const isEstimateSection =
    title === BOOKING_REVIEW_ESTIMATED_TOTAL_HEADLINE ||
    title === BOOKING_REVIEW_OPENING_VISIT_ESTIMATE_SECTION_TITLE;

  return (
    <div
      className={`rounded-2xl border px-5 py-4 shadow-[0_12px_34px_-28px_rgba(15,23,42,0.28)] ring-1 ${
        isEstimateSection
          ? "border-[#C9B27C]/24 bg-white ring-[#C9B27C]/12 sm:px-6 sm:py-6"
          : "border-[#E8DFD0]/95 bg-[#FFFCF7] ring-[#C9B27C]/8"
      }`}
    >
      <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
        {title}
      </p>
      <div className="mt-3 font-[var(--font-manrope)] text-base text-[#0F172A]">
        {children}
      </div>
    </div>
  );
}

function deepProgramFallbackLabel(state: BookingFlowState) {
  if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    (state.bookingPublicPath === "one_time_cleaning" ||
      state.bookingPublicPath === "first_time_with_recurring") &&
    state.firstTimePostEstimateVisitChoice
  ) {
    switch (state.firstTimePostEstimateVisitChoice) {
      case "three_visit_reset":
        return "3-visit program";
      case "two_visit":
        return "2-visit program";
      case "one_visit":
      default:
        return "One visit";
    }
  }
  return state.deepCleanProgram === "phased_3_visit"
    ? "3-visit program"
    : "One visit";
}

function planningConfidenceCopy(band: BookingPreviewConfidenceBand): {
  headline: string;
  body: string;
  supporting: string;
} {
  switch (band) {
    case "high_clarity":
      return {
        headline: BOOKING_REVIEW_PRE_CONF_HIGH_HEADLINE,
        body: BOOKING_REVIEW_PRE_CONF_HIGH_BODY,
        supporting: BOOKING_REVIEW_PRE_CONF_HIGH_SUPPORTING,
      };
    case "customized":
      return {
        headline: BOOKING_REVIEW_PRE_CONF_CUSTOM_HEADLINE,
        body: BOOKING_REVIEW_PRE_CONF_CUSTOM_BODY,
        supporting: BOOKING_REVIEW_PRE_CONF_CUSTOM_SUPPORTING,
      };
    case "special_attention":
      return {
        headline: BOOKING_REVIEW_PRE_CONF_SPECIAL_HEADLINE,
        body: BOOKING_REVIEW_PRE_CONF_SPECIAL_BODY,
        supporting: BOOKING_REVIEW_PRE_CONF_SPECIAL_SUPPORTING,
      };
  }
}

export function BookingStepReview({
  state,
  condition,
  problemAreas,
  surfaceComplexity,
  estimateDriverHeavyCondition,
  estimateDriverHeavyKitchenBath,
  estimateDriverSegmentedAccessLayout,
  estimateDriverResetLevelIntent,
  estimateDriverSurfaceDetailTokens,
  estimateDriverHasAddOns,
  estimateDriverDeepCleanFocus,
  estimateDriverFurnishedTransition,
  estimateDriverTransitionAppliances,
  intakePlanningNoteLines,
  previewConfidenceBand,
  hasSubmitRecoverableFailure = false,
  estimatePreviewReady,
  previewEstimate,
  previewDeepCleanCard,
  previewLoading,
  previewError,
  previewFetchCompleted,
  previewErrorRef,
  showContactFieldErrors,
  onContactChange,
  prepGuidanceItems,
  recommendedAttentionItems,
  onFirstTimePostEstimateVisitChoiceChange,
  onRecurringInterestChange,
  onTeamPlanningDetailsChange,
  onRecurringCadenceIntentChange,
  schedulePreview,
  depositResolutionActive = false,
  funnelBookingId = "",
  funnelIntakeId = "",
}: BookingStepReviewProps) {
  const reviewFunnelOnceRef = useRef(false);
  useEffect(() => {
    if (reviewFunnelOnceRef.current) return;
    reviewFunnelOnceRef.current = true;
    emitBookingFunnelEvent("review_viewed", { serviceId: state.serviceId });
    const bid = funnelBookingId.trim();
    const iid = funnelIntakeId.trim();
    if (bid || iid) {
      postPublicBookingFunnelMilestone({
        milestone: "REVIEW_VIEWED",
        ...(bid ? { bookingId: bid } : {}),
        ...(iid ? { intakeId: iid } : {}),
      });
    }
  }, [state.serviceId, funnelBookingId, funnelIntakeId]);

  const homeOk = isHomeDetailsComplete(state);
  const cadenceOk = isServiceLocationComplete(state);
  const ready = isBookingReady(state);
  const contactOk = isBookingContactValid(
    state.customerName,
    state.customerEmail,
  );
  const firstTimeFollowUpOk =
    !isDeepCleaningBookingServiceId(state.serviceId) ||
    (state.bookingPublicPath !== "one_time_cleaning" &&
      state.bookingPublicPath !== "first_time_with_recurring") ||
    !estimatePreviewReady ||
    Boolean(state.firstTimePostEstimateVisitChoice);

  const bannerFullyReady =
    ready &&
    contactOk &&
    estimatePreviewReady &&
    firstTimeFollowUpOk &&
    !previewLoading &&
    !previewError &&
    !hasSubmitRecoverableFailure;
  const deep = isDeepCleaningBookingServiceId(state.serviceId);

  const bedToken = normalizeBookingBedroomsParam(state.bedrooms);
  const bathToken = normalizeBookingBathroomsParam(state.bathrooms);
  const bedroomsSummary =
    formatBookingBedroomsForDisplay(bedToken) ||
    (state.bedrooms.trim() || "—");
  const bathroomsSummary =
    formatBookingBathroomsForDisplay(bathToken) ||
    (state.bathrooms.trim() || "—");

  const petsNormalized = normalizeBookingPetsParam(state.pets);
  const petsDisplay = petsNormalized ? petsNormalized : "Not specified";

  const problemAreasNormalized = normalizeBookingProblemAreasForPayload(
    state.problemAreas,
  );
  const layeredLaborHints: string[] = [];
  if (state.kitchenIntensity === "heavy_use") {
    layeredLaborHints.push("Kitchen (heavy use)");
  }
  if (state.bathroomComplexity === "heavy_detailing") {
    layeredLaborHints.push("Bathrooms (heavy detailing)");
  }
  const problemAreasDisplay =
    problemAreasNormalized.length > 0 || layeredLaborHints.length > 0
      ? [
          ...problemAreasNormalized.map((t) => BOOKING_PROBLEM_AREA_LABELS[t]),
          ...layeredLaborHints,
        ].join(", ")
      : "Not specified";

  const overallLaborDisplay: Record<string, string> = {
    recently_maintained: "Recently maintained",
    normal_lived_in: "Normal lived-in",
    behind_weeks: "Behind several weeks",
    major_reset: "Major reset needed",
  };

  const floorMixDisplay: Record<string, string> = {
    mostly_hard: "Mostly hard floors",
    mixed: "Mixed floors",
    mostly_carpet: "Mostly carpet",
  };

  const layoutDisplay: Record<string, string> = {
    open_plan: "Mostly open plan",
    mixed: "Mixed layout",
    segmented: "Many segmented rooms",
  };

  const primaryIntentDisplay: Record<string, string> = {
    maintenance_clean: "Maintenance clean",
    detailed_standard: "Detailed standard clean",
    reset_level: "Reset-level clean",
  };

  const petImpactDisplay: Record<string, string> = {
    none: "None",
    light: "Light pet impact",
    heavy: "Heavy pet impact",
  };
  type ReviewRecurringCadence = "weekly" | "every_10_days" | "biweekly" | "monthly";
  type ReviewVisitStructure = "one_visit" | "two_visit" | "three_visit_reset";
  const recurringCadenceDisplay: Record<ReviewRecurringCadence, string> = {
    weekly: "Weekly",
    every_10_days: "Every 10 days",
    biweekly: "Biweekly",
    monthly: "Monthly",
  };
  const recurringCadenceReviewHelpers: Record<ReviewRecurringCadence, string> = {
    weekly: BOOKING_REVIEW_CADENCE_HELPER_WEEKLY,
    every_10_days: BOOKING_REVIEW_CADENCE_HELPER_EVERY_10_DAYS,
    biweekly: BOOKING_REVIEW_CADENCE_HELPER_BIWEEKLY,
    monthly: BOOKING_REVIEW_CADENCE_HELPER_MONTHLY,
  };
  const selectedRecurringCadence =
    state.recurringInterest?.interested === true &&
    (state.recurringInterest.cadence === "weekly" ||
      state.recurringInterest.cadence === "every_10_days" ||
      state.recurringInterest.cadence === "biweekly" ||
      state.recurringInterest.cadence === "monthly")
      ? (state.recurringInterest.cadence as ReviewRecurringCadence)
      : state.recurringCadenceIntent === "weekly" ||
          state.recurringCadenceIntent === "every_10_days" ||
          state.recurringCadenceIntent === "biweekly" ||
          state.recurringCadenceIntent === "monthly"
        ? (state.recurringCadenceIntent as ReviewRecurringCadence)
        : null;
  const isRecurringContract =
    state.bookingPublicPath === "first_time_with_recurring" ||
    state.recurringInterest?.interested === true;
  const reviewRecurringCadence =
    selectedRecurringCadence ?? (isRecurringContract ? "weekly" : null);
  const recurringQuoteOptions = previewEstimate?.recurringQuoteOptions ?? [];
  const recurringQuote =
    reviewRecurringCadence && recurringQuoteOptions.length > 0
      ? (recurringQuoteOptions.find(
          (quote) => quote.cadence === reviewRecurringCadence,
        ) ?? null)
      : null;
  const hasRecurringQuoteOptions = recurringQuoteOptions.length > 0;
  const selectedVisitStructure: ReviewVisitStructure =
    state.firstTimePostEstimateVisitChoice === "three_visit_reset" ||
    state.firstTimeVisitProgram === "three_visit"
      ? "three_visit_reset"
      : state.firstTimePostEstimateVisitChoice === "two_visit" ||
          state.firstTimeVisitProgram === "two_visit"
        ? "two_visit"
      : "one_visit";
  const showTwoVisitStructure =
    Boolean(previewEstimate) && (previewEstimate?.priceCents ?? 0) >= 40_000;
  const showThreeVisitStructure =
    Boolean(previewEstimate) && (previewEstimate?.priceCents ?? 0) >= 70_000;
  const visitStructureOptions: {
    value: ReviewVisitStructure;
    label: string;
    helper: string;
  }[] = [
    {
      value: "one_visit",
      label: BOOKING_POST_ESTIMATE_VISIT_ONE,
      helper:
        "Best when the scope can be completed comfortably in a single appointment.",
    },
    ...(showTwoVisitStructure
      ? [
          {
            value: "two_visit" as const,
            label: BOOKING_POST_ESTIMATE_VISIT_TWO,
            helper:
              "Useful when the opening reset is substantial enough to benefit from a second focused visit.",
          },
        ]
      : []),
    ...(showThreeVisitStructure
      ? [
          {
            value: "three_visit_reset" as const,
            label: BOOKING_POST_ESTIMATE_VISIT_THREE,
            helper:
              "Reserved for large reset scopes where spreading work protects quality and pacing.",
          },
        ]
      : []),
  ];
  const visitBreakdown = previewEstimate
    ? (() => {
        if (selectedVisitStructure === "three_visit_reset") {
          const visit1 = Math.round(previewEstimate.priceCents * 0.45);
          const visit2 = Math.round(previewEstimate.priceCents * 0.35);
          const visit3 = Math.max(0, previewEstimate.priceCents - visit1 - visit2);
          return { title: "Three-visit reset breakdown", visit1, visit2, visit3 };
        }
        if (selectedVisitStructure === "two_visit") {
          const visit1 = Math.round(previewEstimate.priceCents * 0.6);
          const visit2 = Math.max(0, previewEstimate.priceCents - visit1);
          return { title: "Two-visit reset breakdown", visit1, visit2, visit3: null };
        }
        return null;
      })()
    : null;
  const recurringTimingText =
    reviewRecurringCadence && selectedVisitStructure === "three_visit_reset"
      ? `Reset visits are spaced 14 days apart. After Visit 3, recurring visits follow your ${recurringCadenceDisplay[reviewRecurringCadence]} cadence—the recurring line is priced separately from these opening visits.`
      : reviewRecurringCadence && selectedVisitStructure === "two_visit"
        ? `Opening reset visits are spaced 14 days apart. After Visit 2, recurring visits follow your ${recurringCadenceDisplay[reviewRecurringCadence]} cadence—the recurring line is priced separately from these opening visits.`
      : reviewRecurringCadence
        ? `The preview above is your first visit. Recurring visits on a ${recurringCadenceDisplay[reviewRecurringCadence]} cadence are quoted separately and typically begin after that visit—changing cadence mainly affects the recurring line, not necessarily this opening price.`
        : null;

  useEffect(() => {
    if (!isRecurringContract) return;
    if (selectedRecurringCadence) return;
    onRecurringInterestChange({
      interested: true,
      cadence: "weekly",
      note: state.recurringInterest?.note,
    });
    onRecurringCadenceIntentChange("weekly");
  }, [
    isRecurringContract,
    onRecurringCadenceIntentChange,
    onRecurringInterestChange,
    selectedRecurringCadence,
    state.recurringInterest?.note,
  ]);

  useEffect(() => {
    if (!isRecurringContract) return;
    if (state.firstTimePostEstimateVisitChoice) return;
    onFirstTimePostEstimateVisitChoiceChange("one_visit");
  }, [
    isRecurringContract,
    onFirstTimePostEstimateVisitChoiceChange,
    state.firstTimePostEstimateVisitChoice,
  ]);

  useEffect(() => {
    if (!estimatePreviewReady) return;
    if (selectedVisitStructure === "three_visit_reset" && !showThreeVisitStructure) {
      onFirstTimePostEstimateVisitChoiceChange(
        showTwoVisitStructure ? "two_visit" : "one_visit",
      );
    }
    if (selectedVisitStructure === "two_visit" && !showTwoVisitStructure) {
      onFirstTimePostEstimateVisitChoiceChange("one_visit");
    }
  }, [
    estimatePreviewReady,
    onFirstTimePostEstimateVisitChoiceChange,
    selectedVisitStructure,
    showThreeVisitStructure,
    showTwoVisitStructure,
  ]);

  function changeRecurringCadence(cadence: ReviewRecurringCadence) {
    onRecurringInterestChange({
      interested: true,
      cadence,
      note: state.recurringInterest?.note,
    } as BookingFlowState["recurringInterest"]);
    onRecurringCadenceIntentChange(cadence);
  }

  function changeVisitStructure(visitStructure: ReviewVisitStructure) {
    onFirstTimePostEstimateVisitChoiceChange(visitStructure);
  }

  const addOnsNormalized = normalizeBookingAddOnsForPayload(state.selectedAddOns);
  const addOnsDisplay =
    addOnsNormalized.length > 0
      ? addOnsNormalized.map((t) => BOOKING_ADD_ON_LABELS[t]).join(", ")
      : "Not specified";
  const selectedUpsells = getBookingUpsellOptionsByIds(state.selectedUpsellIds);

  const appliancesNormalized = normalizeBookingAppliancePresenceForPayload(
    state.appliancePresence,
  );
  const appliancesDisplay =
    appliancesNormalized.length > 0
      ? appliancesNormalized
          .map((t) => BOOKING_APPLIANCE_PRESENCE_LABELS[t])
          .join(", ")
      : "Not specified";

  const moveTransition = isBookingMoveTransitionServiceId(state.serviceId);

  const nameError =
    showContactFieldErrors && !contactOk
      ? getBookingCustomerNameError(state.customerName)
      : null;
  const emailError =
    showContactFieldErrors && !contactOk
      ? getBookingCustomerEmailError(state.customerEmail)
      : null;

  const estimateDriverCandidates = [
    {
      on: estimateDriverDeepCleanFocus,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DEEP_CLEAN_FOCUS,
      key: "dcf",
    },
    {
      on: estimateDriverFurnishedTransition,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_FURNISHED_TRANSITION,
      key: "mvt",
    },
    {
      on: estimateDriverTransitionAppliances,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_TRANSITION_APPLIANCES,
      key: "mva",
    },
    {
      on: estimateDriverResetLevelIntent,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_RESET_INTENT,
      key: "reset",
    },
    {
      on: estimateDriverSurfaceDetailTokens,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_SURFACE_DETAILS,
      key: "surfaces",
    },
    {
      on: estimateDriverHasAddOns,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_ADD_ONS,
      key: "addons",
    },
    {
      on: estimateDriverHeavyCondition,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_HEAVY_CONDITION,
      key: "heavy",
    },
    {
      on: estimateDriverHeavyKitchenBath,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_HEAVY_KITCHEN_BATH,
      key: "kitchenbath",
    },
    {
      on: estimateDriverSegmentedAccessLayout,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_SEGMENTED_ACCESS_LAYOUT,
      key: "dense",
    },
  ] as const;

  const activeEstimateDrivers = estimateDriverCandidates.filter((d) => d.on);
  const estimateDriverBullets = activeEstimateDrivers.slice(0, 4);
  const showEstimateDriverBlock = activeEstimateDrivers.length > 0;

  const estimateDriverBlockKey = [
    state.serviceId,
    state.overallLaborCondition,
    state.clutterAccess,
    state.kitchenIntensity,
    state.bathroomComplexity,
    state.layoutType,
    state.floorMix,
    state.primaryIntent,
    state.surfaceDetailTokens.join(","),
    normalizeBookingProblemAreasForPayload([...problemAreas]).join(","),
    surfaceComplexity,
    state.scopeIntensity,
    addOnsNormalized.join(","),
    state.deepCleanFocus,
    state.transitionState,
    appliancesNormalized.join(","),
    intakePlanningNoteLines.join("|"),
  ].join(":");

  const showPlanningConfidenceBlock =
    estimatePreviewReady &&
    !previewLoading &&
    !previewError &&
    previewEstimate != null;

  const planningConfidence = planningConfidenceCopy(previewConfidenceBand);

  const bannerMessage = (() => {
    if (!ready) {
      return "Complete the missing details before you continue.";
    }
    if (!contactOk) {
      return "Add your contact details so we can follow up.";
    }
    if (hasSubmitRecoverableFailure) {
      return BOOKING_REVIEW_BANNER_AFTER_SEND_DID_NOT_FINISH;
    }
    if (previewLoading) {
      return BOOKING_REVIEW_ESTIMATE_REFRESHING_BODY;
    }
    if (previewError) {
      return `${BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_LEAD} ${BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_HINT}`;
    }
    if (previewFetchCompleted && !estimatePreviewReady) {
      return BOOKING_REVIEW_ESTIMATE_NONE_AFTER_FETCH;
    }
    if (estimatePreviewReady) {
      return BOOKING_REVIEW_BANNER_READY_NEXT_STEP;
    }
    return BOOKING_REVIEW_ESTIMATE_REFRESHING_BODY;
  })();

  return (
    <BookingSectionCard
      eyebrow="Step 4"
      title={BOOKING_REVIEW_STEP_TITLE}
      body={BOOKING_REVIEW_STEP_BODY}
    >
      <div className="mb-6 rounded-2xl border border-[#0D9488]/18 bg-[rgba(13,148,136,0.06)] px-5 py-4">
        <p className="font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">
          You’re almost done
        </p>
        <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
          Review service, home details, location readiness, and estimate timing
          before we show available teams.
        </p>
        <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
          Why we need this: confirming the details here helps us avoid surprises
          before schedule and deposit.
        </p>
      </div>

      <div
        className={`mb-6 rounded-2xl border px-5 py-4 ${
          bannerFullyReady
            ? "border-[#0D9488]/25 bg-[rgba(13,148,136,0.08)]"
            : "border-[#C9B27C]/20 bg-white"
        }`}
      >
        <p
          className={`font-[var(--font-manrope)] text-sm font-medium leading-6 ${
            bannerFullyReady ? "text-[#0F766E]" : "text-[#92400E]"
          }`}
        >
          {bannerMessage}
        </p>
      </div>

      <div className="mb-8">
        <BookingTrustRibbon />
      </div>

      {depositResolutionActive ? (
        <div
          data-testid="booking-review-deposit-compact-summary"
          className="rounded-2xl border border-[#C9B27C]/18 bg-white px-5 py-4 shadow-sm"
        >
          <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
            Review locked for deposit
          </p>
          <div className="mt-3 space-y-2 font-[var(--font-manrope)] text-sm leading-6 text-[#334155]">
            <p>
              <span className="font-semibold text-[#0F172A]">Service: </span>
              {getPublicBookingMarketingTitle(state.bookingPublicPath)}
            </p>
            <p>
              <span className="font-semibold text-[#0F172A]">Contact: </span>
              {contactOk
                ? `${state.customerName.trim()} · ${state.customerEmail.trim()}`
                : "Contact details are already attached to this booking request."}
            </p>
            {state.schedulingBookingId.trim() ? (
              <p>
                <span className="font-semibold text-[#0F172A]">Reference: </span>
                <span className="font-mono">{state.schedulingBookingId.trim()}</span>
              </p>
            ) : null}
          </div>
          <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
            Continue with the secure deposit below. Your saved review details stay attached without repeating the full contact form.
          </p>
        </div>
      ) : (
      <div className="grid gap-4">
        <ReviewSection title="Service">
          <p className="font-medium">{getPublicBookingMarketingTitle(state.bookingPublicPath)}</p>
          {deep ? (
            <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#0F172A]">
              <span className="font-medium text-[#475569]">
                {BOOKING_REVIEW_VISIT_STRUCTURE_LABEL}
              </span>{" "}
              {deepProgramFallbackLabel(state)}
            </p>
          ) : null}
          {deep ? (
            <div className="mt-3 border-t border-[#C9B27C]/14 pt-3">
              {previewLoading && ready && contactOk ? (
                <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                  <span className="font-semibold text-[#0F172A]">
                    {BOOKING_REVIEW_ESTIMATE_REFRESHING_TITLE}
                  </span>
                  {" — "}
                  {BOOKING_REVIEW_ESTIMATE_REFRESHING_BODY}
                </p>
              ) : previewDeepCleanCard ? (
                <DeepCleanProgramCard
                  program={previewDeepCleanCard}
                  className="text-[#0F172A]"
                />
              ) : previewLoading ? (
                <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
                  Loading visit plan…
                </p>
              ) : previewError ? null : (
                <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
                  {deepProgramFallbackLabel(state)}
                </p>
              )}
            </div>
          ) : null}
        </ReviewSection>

        <ReviewSection
          title={
            isRecurringContract
              ? BOOKING_REVIEW_OPENING_VISIT_ESTIMATE_SECTION_TITLE
              : BOOKING_REVIEW_ESTIMATED_TOTAL_HEADLINE
          }
        >
          {isRecurringContract ? (
            <div
              className="mb-4 rounded-2xl border border-[#C9B27C]/22 bg-white px-4 py-3 shadow-sm ring-1 ring-[#C9B27C]/10"
              data-testid="booking-review-section-first-cleaning"
            >
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                {BOOKING_REVIEW_SECTION_FIRST_CLEANING_TITLE}
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#334155]">
                {BOOKING_REVIEW_SECTION_FIRST_CLEANING_BODY}
              </p>
            </div>
          ) : null}
          <div id="booking-estimate-breakdown" className="scroll-mt-28">
          <p className="mb-2 font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B]">
            {BOOKING_REVIEW_PRICE_UPDATES_LINE}{" "}
            <a
              href="#booking-estimate-breakdown"
              className="font-semibold text-[#0F766E] underline decoration-[#0F766E]/30 underline-offset-4 transition hover:decoration-[#0F766E]"
            >
              {BOOKING_REVIEW_VIEW_FULL_BREAKDOWN}
            </a>
          </p>
          <p className="mb-4 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
            {isRecurringContract
              ? "Figures below are your opening visit preview. Final scope is confirmed before service."
              : "Based on your home details and selected preferences. Final scope is confirmed before service."}
          </p>
          {previewLoading && ready && contactOk ? (
            <div className="mb-4 rounded-2xl border border-[#C9B27C]/18 bg-white px-4 py-3 shadow-sm">
              <p className="font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">
                {BOOKING_REVIEW_ESTIMATE_REFRESHING_TITLE}
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                {BOOKING_REVIEW_ESTIMATE_REFRESHING_BODY}
              </p>
            </div>
          ) : null}
          {previewLoading && !(ready && contactOk) ? (
            <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
              Getting your estimate…
            </p>
          ) : null}
          {!previewLoading && previewEstimate?.source === "server" ? (
            <p className="font-[var(--font-manrope)] text-xs text-[#64748B]">
              Live preview uses the same intake fields we store and run through
              the estimator when you send your request.
            </p>
          ) : null}
          {!previewLoading && previewEstimate?.source === "local" ? (
            <p className="font-[var(--font-manrope)] text-xs text-[#64748B]">
              Approximate range from your home size and service type. We
              couldn’t reach the live preview; send your request and we’ll return
              a firm quote.
            </p>
          ) : null}
          {previewError ? (
            <div className="space-y-2">
              <p
                ref={previewErrorRef as LegacyRef<HTMLParagraphElement>}
                className="font-[var(--font-manrope)] text-sm font-medium text-[#B45309]"
              >
                {BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_LEAD}
              </p>
              <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#92400E]">
                {BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_HINT}
              </p>
              {previewError.length > 0 && previewError.length < 220 ? (
                <p className="font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                  {previewError}
                </p>
              ) : null}
            </div>
          ) : null}
          {showPlanningConfidenceBlock ? (
            <div
              data-testid="booking-review-planning-confidence"
              className="mb-4 rounded-2xl border border-[#C9B27C]/18 bg-white px-4 py-3 shadow-sm ring-1 ring-[#C9B27C]/8"
            >
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                {BOOKING_REVIEW_PLANNING_CONFIDENCE_TITLE}
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-sm font-medium leading-6 text-[#0F172A]">
                {planningConfidence.headline}
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#334155]">
                {planningConfidence.body}
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                {planningConfidence.supporting}
              </p>
            </div>
          ) : null}
          {previewEstimate ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="rounded-[28px] border border-[#0D9488]/18 bg-[#0D9488] p-6 text-white shadow-[0_18px_46px_rgba(13,148,136,0.16)]">
                  <p className="font-[var(--font-manrope)] text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    {isRecurringContract
                      ? BOOKING_REVIEW_PREVIEW_OPENING_PRICE_LABEL
                      : BOOKING_REVIEW_PREVIEW_SINGLE_VISIT_PRICE_LABEL}
                  </p>
                  <p className="mt-3 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                    {formatEstimateUsdFromCents(previewEstimate.priceCents)}
                  </p>
                  <p className="mt-4 font-[var(--font-manrope)] text-sm leading-6 text-white/80">
                    The estimate reflects the details you’ve shared so far, and the key drivers remain nearby while you review.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-[#E8DFD0]/95 bg-[#FFFCF7] px-4 py-3">
                    <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                      Estimated labor effort:
                    </p>
                    <p className="mt-2 font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">
                      {formatEstimateDurationMinutes(previewEstimate.durationMinutes)}
                    </p>
                    <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                      {BOOKING_REVIEW_LABOR_EFFORT_GLOSS}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#E8DFD0]/95 bg-[#FFFCF7] px-4 py-3">
                    <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                      {BOOKING_REVIEW_SCOPE_PREDICTABILITY_LABEL}:
                    </p>
                    <p className="mt-2 font-[var(--font-manrope)] text-sm font-semibold leading-6 text-[#0F172A]">
                      {formatScopePredictabilitySummary(previewEstimate.confidence)}
                    </p>
                    <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                      {BOOKING_REVIEW_SCOPE_PREDICTABILITY_FOOTNOTE}
                    </p>
                  </div>
                </div>
              </div>
              <p className="font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                {previewEstimate.source === "server"
                  ? "We’ll confirm final scope before we begin — no surprises."
                  : "Final details confirmed before service."}
              </p>
              {isDeepCleaningBookingServiceId(state.serviceId) &&
              (state.bookingPublicPath === "one_time_cleaning" ||
                state.bookingPublicPath === "first_time_with_recurring") &&
              estimatePreviewReady ? (
                <div
                  className="mt-6 rounded-2xl border border-[#C9B27C]/18 bg-[#FFF9F3] px-4 py-4 ring-1 ring-[#C9B27C]/10"
                  data-testid="booking-first-time-post-estimate-options"
                >
                  <p
                    className="font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]"
                  >
                    {BOOKING_POST_ESTIMATE_FIRST_TIME_TITLE}
                  </p>
                  <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                    {BOOKING_POST_ESTIMATE_FIRST_TIME_BODY}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {visitStructureOptions.map(({ value, label, helper }) => {
                      const selected = selectedVisitStructure === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          data-testid={`booking-post-estimate-${value}`}
                          onClick={() => changeVisitStructure(value)}
                          className={`rounded-2xl border px-4 py-3 text-left font-[var(--font-manrope)] text-sm transition ${
                            selected
                              ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                              : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                          }`}
                        >
                          <span className="font-semibold text-[#0F172A]">{label}</span>
                          <span className="mt-2 block text-xs leading-5 text-[#64748B]">
                            {helper}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {visitBreakdown ? (
                    <div
                      className="mt-4 rounded-2xl border border-[#C9B27C]/18 bg-white px-4 py-3"
                      data-testid={
                        selectedVisitStructure === "two_visit"
                          ? "booking-two-visit-breakdown"
                          : "booking-three-visit-breakdown"
                      }
                    >
                      <p className="font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">
                        {visitBreakdown.title}
                      </p>
                      <div className="mt-3 grid gap-2 font-[var(--font-manrope)] text-sm text-[#0F172A] sm:grid-cols-2">
                        <p>
                          <span className="text-[#64748B]">Visit 1 price:</span>{" "}
                          {formatEstimateUsdFromCents(visitBreakdown.visit1)}
                        </p>
                        <p>
                          <span className="text-[#64748B]">Visit 2 price:</span>{" "}
                          {formatEstimateUsdFromCents(visitBreakdown.visit2)}
                        </p>
                        {visitBreakdown.visit3 != null ? (
                          <p>
                            <span className="text-[#64748B]">Visit 3 price:</span>{" "}
                            {formatEstimateUsdFromCents(visitBreakdown.visit3)}
                          </p>
                        ) : null}
                        <p>
                          <span className="text-[#64748B]">Program total:</span>{" "}
                          {formatEstimateUsdFromCents(previewEstimate.priceCents)}
                        </p>
                      </div>
                      <p className="mt-3 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                        Reset visits are spaced 14 days apart. Recurring service begins after the opening reset is complete.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : previewFetchCompleted && !previewLoading && !previewError ? (
            <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
              No estimate to show for these selections yet.
            </p>
          ) : null}
          </div>
        </ReviewSection>

        {isRecurringContract ? (
          <ReviewSection title={BOOKING_REVIEW_RECURRING_SECTION_TITLE}>
            <div className="space-y-3">
              <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                {BOOKING_REVIEW_RECURRING_SECTION_LEAD}
              </p>
              {previewEstimate ? (
                <div
                  data-testid="booking-review-recurring-maintenance"
                  className="rounded-2xl border border-[#0D9488]/20 bg-[rgba(13,148,136,0.06)] px-4 py-3 ring-1 ring-[#0D9488]/12"
                >
                  <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                    {BOOKING_REVIEW_RECURRING_MAINTENANCE_SUBHEAD}
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <p className="font-medium">
                      <span className="text-[#64748B]">
                        {BOOKING_REVIEW_RECURRING_PRICE_LABEL}:
                      </span>{" "}
                      {recurringQuote
                        ? formatEstimateUsdFromCents(
                            recurringQuote.recurringPriceCents,
                          )
                        : "Unavailable"}
                    </p>
                    <p className="font-medium">
                      <span className="text-[#64748B]">
                        {BOOKING_REVIEW_RECURRING_LABOR_LABEL}:
                      </span>{" "}
                      {recurringQuote
                        ? formatEstimateDurationMinutes(
                            recurringQuote.estimatedMinutes,
                          )
                        : "Unavailable"}
                    </p>
                  </div>
                  {recurringQuote && recurringQuote.savingsCents > 0 ? (
                    <div className="mt-4 space-y-2 border-t border-[#0D9488]/16 pt-3">
                      <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                        {BOOKING_REVIEW_RECURRING_VS_OPENING_LEAD}
                      </p>
                      <p className="font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                        <span className="text-[#64748B]">
                          {BOOKING_REVIEW_RECURRING_PER_VISIT_DELTA_LABEL}:
                        </span>{" "}
                        {formatEstimateUsdFromCents(recurringQuote.savingsCents)}{" "}
                        less scheduled labor than the opening visit under the same
                        model.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="font-[var(--font-manrope)] text-sm font-medium text-[#B45309]">
                  Recurring pricing could not be loaded. Please refresh before
                  continuing.
                </p>
              )}
              {previewEstimate && !hasRecurringQuoteOptions ? (
                <p className="font-[var(--font-manrope)] text-sm font-medium text-[#B45309]">
                  Recurring pricing could not be loaded. Please refresh before
                  continuing.
                </p>
              ) : null}

              <details className="group rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm open:pb-4">
                <summary className="cursor-pointer list-none font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A] marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-2">
                    <span>{BOOKING_REVIEW_WHAT_CHANGES_TITLE}</span>
                    <span className="shrink-0 pt-0.5 text-xs font-normal text-[#94A3B8] group-open:hidden">
                      Tap to read
                    </span>
                  </span>
                </summary>
                <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                  {BOOKING_REVIEW_WHAT_CHANGES_BODY}
                </p>
              </details>

              <div className="rounded-2xl border border-[#C9B27C]/14 bg-[#FFFCF8] px-4 py-3">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                  <div>
                    <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                      {BOOKING_REVIEW_RECOMMENDED_SCHEDULE_TITLE}
                    </p>
                    <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                      {BOOKING_REVIEW_RECOMMENDED_SCHEDULE_LEAD}
                    </p>
                    {recurringQuote ? (
                      <div className="mt-4 rounded-2xl border border-[#0D9488]/18 bg-white px-4 py-3">
                        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                          Selected cadence economics
                        </p>
                        <p className="mt-2 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.04em] text-[#0F172A]">
                          {formatEstimateUsdFromCents(recurringQuote.recurringPriceCents)}
                        </p>
                        <p className="mt-1 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                          {formatEstimateDurationMinutes(recurringQuote.estimatedMinutes)} per maintenance visit
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                      {BOOKING_REVIEW_RECURRING_CADENCE_SUBHEAD}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(
                        ["weekly", "every_10_days", "biweekly", "monthly"] as const
                      ).map((cadence) => {
                        const selected = reviewRecurringCadence === cadence;
                        const quote = recurringQuoteOptions.find(
                          (option) => option.cadence === cadence,
                        );
                        return (
                          <button
                            key={cadence}
                            type="button"
                            onClick={() => changeRecurringCadence(cadence)}
                            className={`rounded-2xl border px-4 py-3 text-left font-[var(--font-manrope)] text-sm transition ${
                              selected
                                ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                                : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                            }`}
                          >
                            <span className="font-semibold text-[#0F172A]">
                              {recurringCadenceDisplay[cadence]}
                            </span>
                            {quote ? (
                              <span className="mt-1 block text-xs font-semibold leading-5 text-[#0F766E]">
                                {formatEstimateUsdFromCents(quote.recurringPriceCents)}
                              </span>
                            ) : null}
                            <span className="mt-1 block text-xs leading-5 text-[#64748B]">
                              {recurringCadenceReviewHelpers[cadence]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {recurringTimingText ? (
                <p className="rounded-2xl border border-[#0D9488]/18 bg-[rgba(13,148,136,0.06)] px-4 py-3 font-[var(--font-manrope)] text-sm leading-6 text-[#0F766E]">
                  {recurringTimingText}
                </p>
              ) : null}
            </div>
          </ReviewSection>
        ) : null}

        <ReviewSection title="Your clean includes">
          <ul className="list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A] marker:text-[#94A3B8]">
            <li>{getPublicBookingMarketingTitle(state.bookingPublicPath)}</li>
            {selectedUpsells.length > 0 ? (
              <li>
                Requested enhancements:{" "}
                {selectedUpsells.map((option) => option.label).join(", ")}
              </li>
            ) : null}
          </ul>
          <div className="mt-4 rounded-2xl border border-[#C9B27C]/18 bg-[#FFF9F3] px-4 py-3">
            <p className="font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A]">
              Want more done in the same visit?
            </p>
            <p className="mt-1 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
              Add optional enhancements above when they fit your goals. We’ll
              confirm scope before service.
            </p>
          </div>
        </ReviewSection>

        {showEstimateDriverBlock ? (
          <div key={estimateDriverBlockKey}>
            <ReviewSection title={BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE}>
              <p className="mb-3 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                These selections are included in the live estimator preview for
                this path.
              </p>
              <ul className="list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A] marker:text-[#94A3B8]">
                {estimateDriverBullets.map((b) => (
                  <li key={b.key}>{b.text}</li>
                ))}
              </ul>
            </ReviewSection>
          </div>
        ) : null}

        <details
          data-testid="booking-review-team-planning-details"
          className="group mt-2 rounded-2xl border border-[#C9B27C]/16 bg-[#FFFCF8] px-5 py-4 open:pb-5"
        >
          <summary className="cursor-pointer list-none font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A] marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-3">
              <span>
                {BOOKING_REVIEW_TEAM_PLANNING_DETAILS_TITLE}
                <span className="mt-1 block font-[var(--font-manrope)] text-xs font-normal leading-5 text-[#64748B]">
                  {BOOKING_REVIEW_TEAM_PLANNING_DETAILS_LEAD}
                </span>
              </span>
              <span className="shrink-0 pt-0.5 text-xs font-normal text-[#94A3B8] group-open:hidden">
                Tap to add (optional)
              </span>
            </span>
          </summary>
          <div className="mt-4 space-y-4">
            {BOOKING_TEAM_PLANNING_FIELD_SPECS.map(({ key, label }) => (
              <label key={key} className="block space-y-1.5">
                <span className="font-[var(--font-manrope)] text-xs font-medium text-[#64748B]">
                  {label}
                </span>
                <textarea
                  value={state.teamPlanningDetails?.[key] ?? ""}
                  maxLength={BOOKING_TEAM_PLANNING_FIELD_MAX_CHARS}
                  rows={2}
                  onChange={(e) =>
                    onTeamPlanningDetailsChange({
                      [key]: e.target.value,
                    } as Partial<BookingTeamPlanningDetails>)
                  }
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 font-[var(--font-manrope)] text-sm text-[#0F172A] outline-none ring-[#C9B27C]/25 focus:ring-2"
                />
              </label>
            ))}
            <p className="font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
              {BOOKING_REVIEW_TEAM_PLANNING_DETAILS_SUMMARY}
            </p>
          </div>
        </details>

        {intakePlanningNoteLines.length > 0 ? (
          <div data-testid="booking-review-planning-notes">
            <ReviewSection title={BOOKING_REVIEW_PLANNING_NOTES_TITLE}>
              <ul className="list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A] marker:text-[#94A3B8]">
                {intakePlanningNoteLines.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </ReviewSection>
          </div>
        ) : null}

        {prepGuidanceItems.length > 0 ? (
          <div data-testid="booking-review-prep-guidance">
            <ReviewSection title={BOOKING_REVIEW_PREP_SECTION_TITLE}>
              <ul className="list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A] marker:text-[#94A3B8]">
                {prepGuidanceItems.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </ReviewSection>
          </div>
        ) : null}

        {recommendedAttentionItems.length > 0 ? (
          <div data-testid="booking-review-recommendations">
            <ReviewSection title={BOOKING_REVIEW_RECOMMEND_SECTION_TITLE}>
              <ul className="list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A] marker:text-[#94A3B8]">
                {recommendedAttentionItems.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </ReviewSection>
          </div>
        ) : null}

        <ReviewSection title="Enhancements">
          {selectedUpsells.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A] marker:text-[#94A3B8]">
              {selectedUpsells.map((option) => (
                <li key={option.id}>{option.label}</li>
              ))}
            </ul>
          ) : (
            <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              No enhancements selected yet. You can continue without adding any.
            </p>
          )}
        </ReviewSection>

        <ReviewSection title="Home details">
          {homeOk ? (
            <div className="space-y-2 font-[var(--font-manrope)] text-sm">
              <p>
                <span className="font-medium text-[#64748B]">Home size:</span>{" "}
                <span className="text-[#0F172A]">
                  {normalizeBookingHomeSizeParam(state.homeSize)
                    ? getBookingHomeSizeRangeLabel(state.homeSize)
                    : "—"}
                </span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">Bedrooms:</span>{" "}
                <span className="text-[#0F172A]">{bedroomsSummary}</span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">Bathrooms:</span>{" "}
                <span className="text-[#0F172A]">{bathroomsSummary}</span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">Half baths:</span>{" "}
                <span className="text-[#0F172A]">
                  {!state.halfBathrooms
                    ? "—"
                    : state.halfBathrooms === "0"
                      ? "None"
                      : state.halfBathrooms === "1"
                        ? "One"
                        : "Two or more"}
                </span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">Pet impact:</span>{" "}
                <span className="text-[#0F172A]">
                  {petImpactDisplay[state.petImpactLevel] ?? "—"}
                </span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">Pets (notes):</span>{" "}
                <span className="text-[#0F172A]">{petsDisplay}</span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">
                  Overall condition (labor):
                </span>{" "}
                <span className="text-[#0F172A]">
                  {overallLaborDisplay[state.overallLaborCondition] ?? "—"}
                </span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">
                  {BOOKING_REVIEW_ESTIMATOR_FOCUS_AREAS_LABEL}:
                </span>{" "}
                <span className="text-[#0F172A]">{problemAreasDisplay}</span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">
                  Floor mix and layout:
                </span>{" "}
                <span className="text-[#0F172A]">
                  {floorMixDisplay[state.floorMix] ?? "—"} ·{" "}
                  {layoutDisplay[state.layoutType] ?? "—"}
                </span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">
                  Primary intent:
                </span>{" "}
                <span className="text-[#0F172A]">
                  {primaryIntentDisplay[state.primaryIntent]}
                </span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">
                  {BOOKING_REVIEW_ADD_ONS_LABEL}:
                </span>{" "}
                <span className="text-[#0F172A]">{addOnsDisplay}</span>
              </p>
              {deep ? (
                <p>
                  <span className="font-medium text-[#64748B]">
                    {BOOKING_REVIEW_DEEP_CLEAN_FOCUS_LABEL}:
                  </span>{" "}
                  <span className="text-[#0F172A]">
                    {BOOKING_DEEP_CLEAN_FOCUS_LABELS[state.deepCleanFocus]}
                  </span>
                </p>
              ) : null}
              {moveTransition ? (
                <p>
                  <span className="font-medium text-[#64748B]">
                    {BOOKING_REVIEW_TRANSITION_SETUP_LABEL}:
                  </span>{" "}
                  <span className="text-[#0F172A]">
                    {BOOKING_TRANSITION_STATE_LABELS[state.transitionState]}
                  </span>
                </p>
              ) : null}
              {moveTransition ? (
                <p>
                  <span className="font-medium text-[#64748B]">
                    {BOOKING_REVIEW_TRANSITION_APPLIANCES_LABEL}:
                  </span>{" "}
                  <span className="text-[#0F172A]">{appliancesDisplay}</span>
                </p>
              ) : null}
            </div>
          ) : (
            <p className="font-semibold text-[#B91C1C]">Incomplete</p>
          )}
        </ReviewSection>

        <ReviewSection title="Schedule">
          {cadenceOk ? (
            <div className="space-y-1">
              <p className="font-medium">
                <span className="text-[#64748B]">{BOOKING_PLAN_SUMMARY_LABEL}:</span>{" "}
                {bookingPlanClassificationSummary(state)}
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                {BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE}
              </p>
              {state.selectedTeamId.trim() &&
              state.selectedTeamDisplayName.trim() ? (
                <p className="mt-3 font-medium">
                  <span className="text-[#64748B]">
                    {BOOKING_REVIEW_SELECTED_TEAM_LABEL}:
                  </span>{" "}
                  {state.selectedTeamDisplayName.trim()}
                </p>
              ) : (
                <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                  {BOOKING_REVIEW_SCHEDULE_NOTE}
                </p>
              )}
              {state.selectedSlotStart.trim() && state.selectedSlotEnd.trim() ? (
                <p className="font-medium">
                  <span className="text-[#64748B]">
                    {BOOKING_REVIEW_SELECTED_ARRIVAL_LABEL}:
                  </span>{" "}
                  {formatSlotForReview(state.selectedSlotStart.trim())}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="font-semibold text-[#B91C1C]">Incomplete</p>
          )}
        </ReviewSection>

        <ReviewSection title="Contact">
          <p className="mb-4 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
            Confirm where we should send the request summary and scheduling follow-up.
          </p>
          <div className="space-y-4">
            <BookingTextField
              id="booking-customer-name"
              label="Full name"
              value={state.customerName}
              onChange={(value) => onContactChange({ customerName: value })}
              placeholder="Alex Rivera"
              autoComplete="name"
              invalid={Boolean(nameError)}
              helper={nameError ?? undefined}
            />
            <BookingTextField
              id="booking-customer-email"
              label="Email"
              type="email"
              value={state.customerEmail}
              onChange={(value) => onContactChange({ customerEmail: value })}
              placeholder="you@example.com"
              autoComplete="email"
              invalid={Boolean(emailError)}
              helper={emailError ?? undefined}
            />
          </div>
          {contactOk ? (
            <p className="mt-4 rounded-2xl border border-[#0D9488]/18 bg-[rgba(13,148,136,0.06)] px-4 py-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
              Contact is ready for follow-up.
            </p>
          ) : null}
        </ReviewSection>

        {schedulePreview ? (
          <div data-testid="review-schedule-preview" className="mb-6 rounded-2xl border p-4">
            <p className="mb-2 font-semibold">Your scheduled visits</p>
            <ul className="space-y-1 text-sm">
              <li>Visit 1: {formatSchedulePreviewDateForReview(schedulePreview.visit1)}</li>
              {schedulePreview.visit2 ? (
                <li>Visit 2: {formatSchedulePreviewDateForReview(schedulePreview.visit2)}</li>
              ) : null}
              {schedulePreview.visit3 ? (
                <li>Visit 3: {formatSchedulePreviewDateForReview(schedulePreview.visit3)}</li>
              ) : null}
              {schedulePreview.recurringStart ? (
                <li className="mt-2 font-medium">
                  Recurring begins:{" "}
                  {formatSchedulePreviewDateForReview(schedulePreview.recurringStart)}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <div
          className="mt-10 rounded-2xl border border-[#0D9488]/20 bg-[rgba(13,148,136,0.06)] px-6 py-6"
          data-testid="booking-review-next-schedule"
        >
          <p className="font-[var(--font-poppins)] text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">
            {BOOKING_REVIEW_NEXT_SCHEDULE_TITLE}
          </p>
          <p className="mt-3 max-w-2xl font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">
            {BOOKING_REVIEW_NEXT_SCHEDULE_BODY}
          </p>
        </div>
      </div>
      )}
    </BookingSectionCard>
  );
}
