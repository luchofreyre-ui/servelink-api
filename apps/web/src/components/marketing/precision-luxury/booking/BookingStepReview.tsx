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
} from "./bookingFlowTypes";
import {
  formatEstimateConfidence,
  formatEstimateDurationMinutes,
  formatEstimateUsdFromCents,
} from "./bookingIntakePreviewDisplay";
import type { FunnelReviewEstimate } from "./bookingFunnelLocalEstimate";
import { emitBookingFunnelEvent } from "./bookingFunnelAnalytics";
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
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DENSE_LAYOUT,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DEEP_CLEAN_FOCUS,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DETAIL_HEAVY_SCOPE,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_FURNISHED_TRANSITION,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_HEAVY_CONDITION,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_PROBLEM_AREAS,
  BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_TRANSITION_APPLIANCES,
  BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE,
  BOOKING_REVIEW_ESTIMATE_NONE_AFTER_FETCH,
  BOOKING_REVIEW_ESTIMATE_REFRESHING_BODY,
  BOOKING_REVIEW_ESTIMATE_REFRESHING_TITLE,
  BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_HINT,
  BOOKING_REVIEW_ESTIMATE_UNAVAILABLE_LEAD,
  BOOKING_REVIEW_PLANNING_CONFIDENCE_TITLE,
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
  BOOKING_REVIEW_PREP_SECTION_TITLE,
  BOOKING_REVIEW_RECOMMEND_SECTION_TITLE,
  BOOKING_REVIEW_SCHEDULE_NOTE,
  BOOKING_REVIEW_STEP_BODY,
  BOOKING_REVIEW_STEP_TITLE,
  BOOKING_REVIEW_SELECTED_ARRIVAL_LABEL,
  BOOKING_REVIEW_SELECTED_TEAM_LABEL,
  BOOKING_TRANSITION_STATE_LABELS,
  BOOKING_POST_ESTIMATE_FIRST_TIME_BODY,
  BOOKING_POST_ESTIMATE_FIRST_TIME_TITLE,
  BOOKING_POST_ESTIMATE_VISIT_ONE,
  BOOKING_POST_ESTIMATE_VISIT_THREE,
  BOOKING_REVIEW_SCHEDULE_AFTER_TEAM_NOTE,
  BOOKING_REVIEW_VISIT_STRUCTURE_LABEL,
} from "./bookingPublicSurfaceCopy";
import { getPublicBookingMarketingTitle } from "./publicBookingTaxonomy";

type BookingStepReviewProps = {
  state: BookingFlowState;
  condition: BookingHomeCondition;
  problemAreas: readonly BookingProblemAreaToken[];
  surfaceComplexity: BookingSurfaceComplexity;
  estimateDriverHeavyCondition: boolean;
  estimateDriverHasProblemAreas: boolean;
  estimateDriverDenseLayout: boolean;
  estimateDriverDetailHeavyScope: boolean;
  estimateDriverHasAddOns: boolean;
  estimateDriverDeepCleanFocus: boolean;
  estimateDriverFurnishedTransition: boolean;
  estimateDriverTransitionAppliances: boolean;
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
  onRecurringInterestChange?: (
    value: BookingFlowState["recurringInterest"],
  ) => void;
  onRecurringCadenceIntentChange?: (
    value: BookingFlowState["recurringCadenceIntent"],
  ) => void;
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
  return (
    <div className="rounded-2xl border border-[#C9B27C]/16 bg-[#FFF9F3] px-5 py-4 ring-1 ring-[#C9B27C]/10">
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
  estimateDriverHasProblemAreas,
  estimateDriverDenseLayout,
  estimateDriverDetailHeavyScope,
  estimateDriverHasAddOns,
  estimateDriverDeepCleanFocus,
  estimateDriverFurnishedTransition,
  estimateDriverTransitionAppliances,
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
  onRecurringCadenceIntentChange,
}: BookingStepReviewProps) {
  const reviewFunnelOnceRef = useRef(false);
  useEffect(() => {
    if (reviewFunnelOnceRef.current) return;
    reviewFunnelOnceRef.current = true;
    emitBookingFunnelEvent("review_viewed", { serviceId: state.serviceId });
  }, [state.serviceId]);

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
  const recurringCadenceDisplay: Record<string, string> = {
    weekly: "Weekly",
    every_10_days: "Every 10 days",
    biweekly: "Biweekly",
    monthly: "Monthly",
  };
  const recurringCadenceDays: Record<string, number> = {
    weekly: 7,
    every_10_days: 10,
    biweekly: 14,
    monthly: 30,
  };
  const recurringCadenceMultiplier: Record<string, number> = {
    weekly: 0.6,
    every_10_days: 0.66,
    biweekly: 0.7,
    monthly: 0.8,
  };
  const selectedRecurringCadence =
    state.recurringInterest?.interested === true &&
    state.recurringInterest.cadence &&
    state.recurringInterest.cadence !== "not_sure"
      ? state.recurringInterest.cadence
      : state.recurringCadenceIntent !== "none"
        ? state.recurringCadenceIntent
        : null;
  const isRecurringContract =
    state.bookingPublicPath === "first_time_with_recurring" ||
    state.recurringInterest?.interested === true;
  const reviewRecurringCadence =
    selectedRecurringCadence ?? (isRecurringContract ? "weekly" : null);
  const maintenanceLoadMultiplier = Math.min(
    1.25,
    1 +
      (state.kitchenIntensity === "heavy_use" ? 0.1 : 0) +
      (state.clutterAccess === "heavy_clutter"
        ? 0.08
        : state.clutterAccess === "moderate_clutter"
          ? 0.04
          : 0) +
      (state.petImpactLevel === "light" || state.petImpactLevel === "heavy"
        ? 0.1
        : 0) +
      (state.petImpactLevel === "heavy" ? 0.1 : 0) +
      (state.occupancyLevel === "ppl_5_plus"
        ? 0.1
        : state.occupancyLevel === "ppl_3_4"
          ? 0.05
          : 0),
  );
  const recurringQuote =
    reviewRecurringCadence && previewEstimate
      ? (() => {
          const recurringMinutes = Math.round(
            previewEstimate.durationMinutes *
              recurringCadenceMultiplier[reviewRecurringCadence] *
              maintenanceLoadMultiplier,
          );
          const recurringPriceCents = Math.round(
            previewEstimate.durationMinutes > 0
              ? (recurringMinutes / previewEstimate.durationMinutes) *
                  previewEstimate.priceCents
              : 0,
          );
          const savingsCents = Math.max(
            0,
            previewEstimate.priceCents - recurringPriceCents,
          );
          const discountPercent =
            previewEstimate.priceCents > 0
              ? Math.round((savingsCents / previewEstimate.priceCents) * 100)
              : 0;
          return {
            recurringMinutes,
            recurringPriceCents,
            savingsCents,
            discountPercent,
          };
        })()
      : null;
  const selectedVisitStructure =
    state.firstTimePostEstimateVisitChoice === "three_visit_reset" ||
    state.firstTimeVisitProgram === "three_visit"
      ? "three_visit_reset"
      : "one_visit";
  const threeVisitBreakdown = previewEstimate
    ? (() => {
        const visit1 = Math.round(previewEstimate.priceCents * 0.45);
        const visit2 = Math.round(previewEstimate.priceCents * 0.35);
        const visit3 = Math.max(0, previewEstimate.priceCents - visit1 - visit2);
        return { visit1, visit2, visit3 };
      })()
    : null;
  const recurringTimingText =
    reviewRecurringCadence && selectedVisitStructure === "three_visit_reset"
      ? `Reset visits are spaced 14 days apart. ${recurringCadenceDisplay[reviewRecurringCadence]} recurring service begins ${recurringCadenceDays[reviewRecurringCadence]} days after Visit 3.`
      : reviewRecurringCadence
        ? `Recurring service begins ${recurringCadenceDays[reviewRecurringCadence]} days after your first visit.`
        : null;

  useEffect(() => {
    if (!isRecurringContract) return;
    if (state.recurringCadenceIntent !== "none") return;
    onRecurringCadenceIntentChange?.("weekly");
  }, [
    isRecurringContract,
    onRecurringCadenceIntentChange,
    state.recurringCadenceIntent,
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

  function changeRecurringCadence(
    cadence: Exclude<BookingFlowState["recurringCadenceIntent"], "none">,
  ) {
    onRecurringCadenceIntentChange?.(cadence);
    onRecurringInterestChange?.({
      interested: true,
      cadence,
      note: state.recurringInterest?.note,
    });
  }

  const addOnsNormalized = normalizeBookingAddOnsForPayload(state.selectedAddOns);
  const addOnsDisplay =
    addOnsNormalized.length > 0
      ? addOnsNormalized.map((t) => BOOKING_ADD_ON_LABELS[t]).join(", ")
      : "Not specified";

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
      on: estimateDriverDetailHeavyScope,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DETAIL_HEAVY_SCOPE,
      key: "scope",
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
      on: estimateDriverHasProblemAreas,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_PROBLEM_AREAS,
      key: "problems",
    },
    {
      on: estimateDriverDenseLayout,
      text: BOOKING_REVIEW_ESTIMATE_DRIVER_BULLET_DENSE_LAYOUT,
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
    if (!previewLoading && !previewError && !previewFetchCompleted) {
      return "Almost ready…";
    }
    if (previewFetchCompleted && !estimatePreviewReady) {
      return BOOKING_REVIEW_ESTIMATE_NONE_AFTER_FETCH;
    }
    if (estimatePreviewReady) {
      return BOOKING_REVIEW_BANNER_READY_NEXT_STEP;
    }
    return "Almost ready…";
  })();

  return (
    <BookingSectionCard
      eyebrow="Step 4"
      title={BOOKING_REVIEW_STEP_TITLE}
      body={BOOKING_REVIEW_STEP_BODY}
    >
      <div
        className={`mb-8 rounded-2xl border px-5 py-4 ${
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

        {reviewRecurringCadence ? (
          <ReviewSection title="Recurring plan">
            <p className="font-medium">
              Your selected cadence:{" "}
              {recurringCadenceDisplay[reviewRecurringCadence]}.
            </p>
            <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
              Your first clean resets the home. Your recurring visits keep it
              maintained.
            </p>
            <div className="mt-4">
              <p className="font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">
                Opening clean structure
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      value: "one_visit",
                      label: "One visit",
                      body: "One visit completes the opening reset. Recurring begins after the first visit.",
                    },
                    {
                      value: "three_visit_reset",
                      label: "Three-visit reset program",
                      body: "Three visits spread the reset over time. Visit 1: Deep reset. Visit 2: Continuation. Visit 3: Finalization. 14 days between reset visits.",
                    },
                  ] as const
                ).map((option) => {
                  const selected = selectedVisitStructure === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-testid={`booking-post-estimate-${option.value}`}
                      onClick={() =>
                        onFirstTimePostEstimateVisitChoiceChange(option.value)
                      }
                      className={`rounded-2xl border px-4 py-3 text-left font-[var(--font-manrope)] text-sm transition ${
                        selected
                          ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                          : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                      }`}
                    >
                      <span className="block font-semibold text-[#0F172A]">
                        {option.label}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-[#64748B]">
                        {option.body}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {(["weekly", "every_10_days", "biweekly", "monthly"] as const).map(
                (cadence) => {
                  const selected = reviewRecurringCadence === cadence;
                  return (
                    <button
                      key={cadence}
                      type="button"
                      onClick={() => changeRecurringCadence(cadence)}
                      className={`rounded-2xl border px-3 py-3 text-left font-[var(--font-manrope)] text-sm transition ${
                        selected
                          ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                          : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                      }`}
                    >
                      <span className="font-semibold text-[#0F172A]">
                        {recurringCadenceDisplay[cadence]}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
            {recurringQuote && previewEstimate ? (
              <dl className="mt-4 grid gap-3 font-[var(--font-manrope)] text-sm text-[#0F172A] sm:grid-cols-2">
                <div>
                  <dt className="text-[#64748B]">First visit price</dt>
                  <dd className="font-semibold">
                    {formatEstimateUsdFromCents(
                      selectedVisitStructure === "three_visit_reset" &&
                        threeVisitBreakdown
                        ? threeVisitBreakdown.visit1
                        : previewEstimate.priceCents,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#64748B]">Recurring visit price</dt>
                  <dd className="font-semibold">
                    {formatEstimateUsdFromCents(recurringQuote.recurringPriceCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#64748B]">
                    Estimated recurring duration
                  </dt>
                  <dd className="font-semibold">
                    {formatEstimateDurationMinutes(
                      recurringQuote.recurringMinutes,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#64748B]">Next recurring visit</dt>
                  <dd className="font-semibold">
                    {recurringTimingText}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#64748B]">Savings</dt>
                  <dd className="font-semibold">
                    {formatEstimateUsdFromCents(recurringQuote.savingsCents)} /{" "}
                    {recurringQuote.discountPercent}%
                  </dd>
                </div>
              </dl>
            ) : previewError ? (
              <p className="mt-3 font-[var(--font-manrope)] text-sm font-semibold leading-6 text-[#B45309]">
                Recurring pricing could not be loaded. Please refresh before
                continuing.
              </p>
            ) : (
              <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                Loading recurring pricing…
              </p>
            )}
            {selectedVisitStructure === "three_visit_reset" &&
            threeVisitBreakdown &&
            previewEstimate ? (
              <div className="mt-4 rounded-2xl border border-[#C9B27C]/18 bg-white px-4 py-4">
                <p className="font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">
                  Three-visit reset breakdown
                </p>
                <dl className="mt-3 grid gap-3 font-[var(--font-manrope)] text-sm text-[#0F172A] sm:grid-cols-4">
                  <div>
                    <dt className="text-[#64748B]">Visit 1: Deep reset</dt>
                    <dd className="font-semibold">
                      {formatEstimateUsdFromCents(threeVisitBreakdown.visit1)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#64748B]">Visit 2: Continuation</dt>
                    <dd className="font-semibold">
                      {formatEstimateUsdFromCents(threeVisitBreakdown.visit2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#64748B]">Visit 3: Finalization</dt>
                    <dd className="font-semibold">
                      {formatEstimateUsdFromCents(threeVisitBreakdown.visit3)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#64748B]">Program total</dt>
                    <dd className="font-semibold">
                      {formatEstimateUsdFromCents(previewEstimate.priceCents)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </ReviewSection>
        ) : null}

        <ReviewSection title="Estimate preview">
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
          {!previewLoading && !previewError && !previewEstimate && !previewFetchCompleted ? (
            <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
              Almost ready…
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
            <div className="space-y-2">
              <p className="font-medium">
                <span className="text-[#64748B]">Price:</span>{" "}
                {formatEstimateUsdFromCents(previewEstimate.priceCents)}
              </p>
              <p className="font-medium">
                <span className="text-[#64748B]">Duration:</span>{" "}
                {formatEstimateDurationMinutes(previewEstimate.durationMinutes)}
              </p>
              <p className="font-medium">
                <span className="text-[#64748B]">How sure we are:</span>{" "}
                {formatEstimateConfidence(previewEstimate.confidence)}
              </p>
              <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                {previewEstimate.source === "server"
                  ? "Final numbers may adjust slightly once we confirm details with you."
                  : "Figures are approximate; continuing lets us return a firm quote after you save."}
              </p>
              {isDeepCleaningBookingServiceId(state.serviceId) &&
              state.bookingPublicPath === "one_time_cleaning" &&
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
                    {(
                      [
                        ["one_visit", BOOKING_POST_ESTIMATE_VISIT_ONE],
                        ["three_visit_reset", BOOKING_POST_ESTIMATE_VISIT_THREE],
                      ] satisfies ReadonlyArray<
                        readonly [BookingFirstTimePostEstimateVisitChoice, string]
                      >
                    ).map(([value, label]) => {
                      const selected = state.firstTimePostEstimateVisitChoice === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          data-testid={`booking-post-estimate-${value}`}
                          onClick={() => onFirstTimePostEstimateVisitChoiceChange(value)}
                          className={`rounded-2xl border px-4 py-3 text-left font-[var(--font-manrope)] text-sm transition ${
                            selected
                              ? "border-[#0D9488] bg-white ring-2 ring-[#0D9488]/25"
                              : "border-[#C9B27C]/18 bg-white hover:border-[#C9B27C]/40"
                          }`}
                        >
                          <span className="font-semibold text-[#0F172A]">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : previewFetchCompleted && !previewLoading && !previewError ? (
            <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
              No estimate to show for these selections yet.
            </p>
          ) : null}
        </ReviewSection>

        {showEstimateDriverBlock ? (
          <div key={estimateDriverBlockKey}>
            <ReviewSection title={BOOKING_REVIEW_ESTIMATE_DRIVERS_TITLE}>
              <ul className="list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-6 text-[#0F172A] marker:text-[#94A3B8]">
                {estimateDriverBullets.map((b) => (
                  <li key={b.key}>{b.text}</li>
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
                  {state.halfBathrooms === "0"
                    ? "None"
                    : state.halfBathrooms === "1"
                      ? "One"
                      : "Two or more"}
                </span>
              </p>
              <p>
                <span className="font-medium text-[#64748B]">Pet impact:</span>{" "}
                <span className="text-[#0F172A]">
                  {petImpactDisplay[state.petImpactLevel]}
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
                  {floorMixDisplay[state.floorMix]} ·{" "}
                  {layoutDisplay[state.layoutType]}
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
                <span className="text-[#64748B]">Visit type:</span>{" "}
                One-time (public booking)
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

        <ReviewSection title="Your contact">
          <p className="mb-4 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
            We will use this to confirm your direction and reach you with next
            steps.
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
          {contactOk &&
          estimatePreviewReady &&
          !previewLoading &&
          !previewError ? (
            <div className="mt-4 border-t border-[#C9B27C]/14 pt-4">
              <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.16em] text-[#475569]">
                Contact on file
              </p>
              <p className="mt-2 font-medium">
                <span className="text-[#64748B]">Name:</span>{" "}
                {state.customerName.trim()}
              </p>
              <p className="mt-1 font-medium">
                <span className="text-[#64748B]">Email:</span>{" "}
                {state.customerEmail.trim()}
              </p>
            </div>
          ) : null}
        </ReviewSection>

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
    </BookingSectionCard>
  );
}
