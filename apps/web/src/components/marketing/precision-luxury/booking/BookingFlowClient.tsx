"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ServiceHeader } from "../layout/ServiceHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import { BookingFlowProgress } from "../BookingFlowProgress";
import { bookingSteps } from "./bookingFlowData";
import {
  BOOKING_FLOW_HERO_ACCOUNTABILITY,
  BOOKING_FLOW_HERO_BODY,
  BOOKING_FLOW_HERO_BULLET_ACCURATE_PRICING,
  BOOKING_FLOW_HERO_BULLET_CLEAR_EXPECTATIONS,
  BOOKING_FLOW_HERO_BULLET_EASY_PROCESS,
  BOOKING_FLOW_HERO_CLEAR_NUMBERS_LINE,
  BOOKING_FLOW_HERO_EYEBROW,
  BOOKING_FLOW_HERO_HEADLINE,
  BOOKING_FLOW_HERO_NO_PRESSURE_LINE,
  BOOKING_FLOW_HERO_OPERATIONAL_TRANSPARENCY,
  BOOKING_FLOW_HERO_REALTIME_LINE,
} from "@/seo/bookingCopy";
import {
  BOOKING_REVIEW_PREP_DEEP_KITCHEN_BATH,
  BOOKING_REVIEW_PREP_DENSE_LAYOUT,
  BOOKING_REVIEW_PREP_FRIDGE,
  BOOKING_REVIEW_PREP_INTERIOR_WINDOWS,
  BOOKING_REVIEW_PREP_MOVE_APPLIANCES,
  BOOKING_REVIEW_PREP_MOVE_FURNISHED,
  BOOKING_REVIEW_PREP_OVEN,
  BOOKING_REVIEW_PREP_PETS,
  BOOKING_REVIEW_REC_BASEBOARDS_DETAIL,
  BOOKING_REVIEW_REC_CABINETS_DETAIL,
  BOOKING_REVIEW_REC_INSIDE_FRIDGE,
  BOOKING_REVIEW_REC_INSIDE_OVEN,
  BOOKING_REVIEW_REC_INTERIOR_WINDOWS,
  BOOKING_REVIEW_SUBMIT_ADD_CONTACT_FIRST,
  BOOKING_REVIEW_SUBMIT_AFTER_DETAILS_CHANGE,
  BOOKING_REVIEW_SUBMIT_RECOVERY_HINT,
  BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD,
  BOOKING_REVIEW_SUBMIT_TRY_AGAIN,
  BOOKING_REVIEW_SEE_AVAILABLE_TEAMS_CTA,
  BOOKING_REVIEW_SUBMIT_SAVING,
  BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_NEEDS_ATTENTION,
  BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_REFRESHING,
  BOOKING_SCHEDULE_CONFIRM_FAILED,
  BOOKING_REVIEW_DEPOSIT_CHECK_STATUS_CTA,
  BOOKING_REVIEW_DEPOSIT_CONFIRMING_RECORDED,
  BOOKING_REVIEW_DEPOSIT_EXPECTATION_SUMMARY,
  BOOKING_REVIEW_DEPOSIT_FINALIZING_TIMEOUT,
  BOOKING_REVIEW_DEPOSIT_APPLIED_MESSAGE,
  BOOKING_REVIEW_DEPOSIT_NEXT_STEP_MESSAGE,
  BOOKING_REVIEW_DEPOSIT_PAYMENT_REASSURANCE,
  BOOKING_REVIEW_DEPOSIT_PREPARING_CHECKOUT,
  BOOKING_REVIEW_DEPOSIT_SCHEDULE_GATE_MESSAGE,
  BOOKING_REVIEW_DEPOSIT_SECTION_TITLE,
  BOOKING_REVIEW_PAYMENT_COULD_NOT_START,
  BOOKING_REVIEW_PAYMENT_UNAVAILABLE_ENV,
  BOOKING_SCHEDULE_HOLD_FAILED,
  BOOKING_SCHEDULE_HOLD_REFRESH_FAILED,
  BOOKING_SCHEDULE_HOLD_REFRESHED,
  BOOKING_SERVICE_STEP_RECURRING_CONTINUE_BLOCKED,
  BOOKING_TRUST_RIBBON_ITEMS,
  PUBLIC_BOOKING_ORCHESTRATOR_LOCATION_NOT_RESOLVED_CODE,
} from "./bookingPublicSurfaceCopy";
import {
  appendPublicIntakeContextToSearchParams,
  applyFirstTimePostEstimateVisitChoiceToBookingFlowState,
  applyHomeDetailsFieldChangeToBookingFlowState,
  applyScheduleFieldChangeToBookingFlowState,
  applyServiceChangeToBookingFlowState,
  buildBookingSearchParams,
  clampBookingStepToStructuralMax,
  computeMaxReadyStep,
  clearBookingContinuitySnapshot,
  clearBookingConfirmationPaymentSessionState,
  clearBookingConfirmationSessionSnapshot,
  consumeBookingFlowFreshStartRequested,
  isHomeDetailsComplete,
  isServiceLocationComplete,
  normalizeBookingAddOnsForPayload,
  normalizeBookingAppliancePresenceForPayload,
  normalizeBookingHomeSizeParam,
  normalizeBookingPetsParam,
  normalizeBookingProblemAreasForPayload,
  buildPublicServiceLocationPayload,
  parseBookingSearchParams,
  readBookingContinuitySnapshot,
  readBookingConfirmationSessionSnapshot,
  writeBookingContinuitySnapshot,
  writeBookingConfirmationSessionSnapshot,
} from "./bookingUrlState";
import {
  postPublicBookingDepositPrepare,
  type PublicBookingDepositPrepareResponse,
} from "./bookingPaymentClient";
import type {
  BookingAvailableTeamOption,
  BookingFlowState,
  BookingStepId,
} from "./bookingFlowTypes";
import {
  BookingStepService,
  type PublicBookingServiceCardSelection,
} from "./BookingStepService";
import { BookingStepHomeDetails } from "./BookingStepHomeDetails";
import {
  BookingStepSchedule,
  type BookingScheduleTeamDurationContext,
  type BookingScheduleTeamsEmptyState,
  type DerivedSchedulePreview,
} from "./BookingStepSchedule";
import { BookingStepReview } from "./BookingStepReview";
import { BookingSummaryCard } from "./BookingSummaryCard";
import { BookingServiceHandoffCard } from "./BookingServiceHandoffCard";
import { normalizeBookingUpsellIds } from "./bookingUpsells";
import {
  buildBookingAttributionFromSearchParams,
  postPublicBookingAvailability,
  postPublicBookingConfirm,
  postPublicBookingHold,
  PublicBookingApiError,
  PublicBookingDepositProcessingError,
  PublicBookingPaymentRequiredError,
  submitBookingDirectionIntake,
  type SubmitBookingDirectionIntakePayload,
} from "./bookingDirectionIntakeApi";
import { DepositPaymentElement } from "./DepositPaymentElement";
import { BookingTrustRibbon } from "./BookingTrustRibbon";
import { TrustMetricStrip } from "../ui/NuStandardPremiumPrimitives";
import { getStripePromise } from "@/lib/stripe/stripeClient";
import { buildIntakeEstimateFactorsFromBookingHomeState } from "./bookingStep2ToEstimateFactors";
import {
  buildIntakePlanningNoteLines,
  computePreviewConfidenceBandInputs,
  computeWiredEstimateDriverFlags,
  derivePreviewConfidenceBand,
} from "./bookingIntakeEstimateDrivers";
import {
  buildRecurringInterestPayloadForDirectionIntake,
  buildTeamPlanningDisplayLines,
  BOOKING_TEAM_PLANNING_FIELD_MAX_CHARS,
} from "./bookingTeamPlanningDetails";
import { buildEstimateRequestKey } from "./bookingEstimateKey";
import { useBookingEstimate } from "./useBookingEstimate";
import { mapIntakeDeepCleanSnapshotToCardProgram } from "./bookingIntakePreviewDisplay";
import type { FunnelReviewEstimate } from "./bookingFunnelLocalEstimate";
import {
  isBookingMoveTransitionServiceId,
  isDeepCleaningBookingServiceId,
} from "./bookingDeepClean";
import {
  getPublicBookingMarketingTitle,
  isAnonymousBookingPublicPath,
  PUBLIC_BOOK_INTERNAL_FIRST_TIME,
  PUBLIC_BOOK_INTERNAL_MOVE,
  PUBLIC_BOOK_INTERNAL_RECURRING,
} from "./publicBookingTaxonomy";
import { BOOKING_INTAKE_PREFERRED_TIME_DEFERRED } from "./bookingIntakePreferredTime";
import type { DeepCleanProgramDisplay } from "@/types/deepCleanProgram";
import { isBookingContactValid } from "./bookingContactValidation";
import { emitBookingFunnelEvent } from "./bookingFunnelAnalytics";
import { postPublicBookingFunnelMilestone } from "./bookingFunnelMilestoneClient";

type ReviewPaymentPhase =
  | "idle"
  | "preparing"
  | "ready_for_payment"
  | "confirming"
  | "finalizing"
  | "satisfied"
  | "failed"
  | "finalizing_timeout";

const DEPOSIT_LOCK_KEY = "booking_deposit_in_flight";
const PUBLIC_BOOKING_STALE_SLOT_CODES = new Set([
  "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
  "PUBLIC_BOOKING_INVALID_SLOT_ID",
  "PUBLIC_BOOKING_SLOT_IN_PAST",
]);
const PUBLIC_BOOKING_EXPIRED_SLOT_OR_HOLD_CODES = new Set([
  "PUBLIC_BOOKING_INVALID_SLOT_ID",
  "PUBLIC_BOOKING_HOLD_EXPIRED",
  "BOOKING_SLOT_HOLD_EXPIRED",
]);

function getStepOrder(step: BookingStepId) {
  if (step === "location") return 2;
  return bookingSteps.find((item) => item.id === step)?.order ?? 1;
}

function serializeState(state: BookingFlowState) {
  return buildBookingSearchParams(state).toString();
}

function getPublicBookingOriginServiceHref(s: BookingFlowState): string {
  if (s.bookingPublicPath === "move_transition") {
    return `/services/${PUBLIC_BOOK_INTERNAL_MOVE}`;
  }
  if (s.bookingPublicPath === "recurring_auth_gate") {
    return `/services/${PUBLIC_BOOK_INTERNAL_RECURRING}`;
  }
  if (
    s.bookingPublicPath === "one_time_cleaning" ||
    s.bookingPublicPath === "first_time_with_recurring"
  ) {
    return `/services/${PUBLIC_BOOK_INTERNAL_FIRST_TIME}`;
  }
  return `/services/${PUBLIC_BOOK_INTERNAL_FIRST_TIME}`;
}

type DerivedSchedulePreviewCadence =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "every_10_days";

function resolveSchedulePreviewCadence(
  s: BookingFlowState,
): DerivedSchedulePreviewCadence | null {
  const recurringSelected =
    s.bookingPublicPath === "first_time_with_recurring" ||
    s.recurringInterest?.interested === true ||
    s.recurringCadenceIntent !== "none";
  if (!recurringSelected) return null;

  const intent = s.recurringCadenceIntent;
  if (
    intent === "weekly" ||
    intent === "biweekly" ||
    intent === "monthly" ||
    intent === "every_10_days"
  ) {
    return intent;
  }
  const c = s.recurringInterest?.cadence;
  if (c === "weekly") return "weekly";
  if (c === "biweekly") return "biweekly";
  if (c === "monthly") return "monthly";
  if (c === "every_10_days") return "every_10_days";
  return "weekly";
}

function resolveSchedulePreviewVisitStructure(
  s: BookingFlowState,
): "one_visit" | "two_visit" | "three_visit_reset" {
  if (
    s.firstTimePostEstimateVisitChoice === "three_visit_reset" ||
    s.firstTimeVisitProgram === "three_visit"
  ) {
    return "three_visit_reset";
  }
  if (
    s.firstTimePostEstimateVisitChoice === "two_visit" ||
    s.firstTimeVisitProgram === "two_visit"
  ) {
    return "two_visit";
  }
  return "one_visit";
}

function buildDerivedSchedulePreview(params: {
  selectedStartAt?: string | null;
  cadence: DerivedSchedulePreviewCadence | null;
  visitStructure: "one_visit" | "two_visit" | "three_visit_reset";
}): DerivedSchedulePreview | null {
  const raw = params.selectedStartAt?.trim();
  if (!raw) return null;
  const start = new Date(raw);
  if (!Number.isFinite(start.getTime())) return null;

  const addDays = (d: Date, days: number) => {
    const n = new Date(d);
    n.setDate(n.getDate() + days);
    return n;
  };

  const visit1 = start;
  const visit2 =
    params.visitStructure === "two_visit" ||
    params.visitStructure === "three_visit_reset"
      ? addDays(start, 14)
      : null;
  const visit3 =
    params.visitStructure === "three_visit_reset" ? addDays(start, 28) : null;
  const recurringAnchor = visit3 ?? visit2 ?? visit1;
  const recurringStart = params.cadence
    ? addDays(
        recurringAnchor,
        params.cadence === "weekly"
          ? 7
          : params.cadence === "biweekly"
            ? 14
            : params.cadence === "monthly"
              ? 30
              : 10,
      )
    : null;

  return { visit1, visit2, visit3, recurringStart };
}

function resolveSelectedStartAtForPreview(state: BookingFlowState): string | null {
  if (state.selectedSlotStart.trim()) return state.selectedSlotStart.trim();

  const holdStart =
    (state as any).hold?.startAt ??
    (state as any).hold?.window?.startAt ??
    null;
  if (holdStart) return holdStart;

  const confirmStart =
    (state as any).confirmationState?.startAt ??
    (state as any).confirmationSession?.startAt ??
    null;
  if (confirmStart) return confirmStart;

  try {
    const fromSession =
      readBookingConfirmationSessionSnapshot()?.selectedSlotStart?.trim() ?? "";
    if (fromSession) return fromSession;
  } catch {
    // ignore
  }

  const urlStart =
    (state as any).urlParams?.startAt ??
    (state as any).persisted?.startAt ??
    null;
  if (urlStart) return urlStart;

  return null;
}

function getStepError(state: BookingFlowState): string | null {
  if (state.step === "service") {
    if (state.bookingPublicPath === "recurring_auth_gate") {
      return BOOKING_SERVICE_STEP_RECURRING_CONTINUE_BLOCKED;
    }
    if (!state.serviceId) {
      return "Please choose a service before continuing.";
    }
  }

  if (state.step === "home" || state.step === "location") {
    if (!isHomeDetailsComplete(state)) {
      return "Please complete the required home details so we can prepare an accurate estimate.";
    }
    if (!isServiceLocationComplete(state)) {
      return "Please add the service street address, city, state, and ZIP so we can prepare routing.";
    }
    if (!isBookingContactValid(state.customerName, state.customerEmail)) {
      return "Please add your name and a valid email so we can send the request summary and scheduling follow-up.";
    }
  }

  if (state.step === "schedule") {
    if (!state.schedulingBookingId.trim()) {
      return "Complete the review step to save your request before choosing a time.";
    }
    if (!state.selectedTeamId.trim()) {
      return "Choose a team to see available times.";
    }
    if (!state.selectedSlotStart.trim() || !state.selectedSlotEnd.trim()) {
      return "Pick an arrival window to continue.";
    }
    if (!state.schedulingConfirmed) {
      return "Confirm your arrival to finish scheduling.";
    }
  }

  return null;
}

function pushUniqueCap3(list: string[], line: string) {
  if (list.length >= 3) return;
  if (list.includes(line)) return;
  list.push(line);
}

function derivePrepGuidanceItems(state: BookingFlowState): string[] {
  const items: string[] = [];
  const addOns = new Set(
    normalizeBookingAddOnsForPayload(state.selectedAddOns),
  );

  if (addOns.has("inside_fridge")) pushUniqueCap3(items, BOOKING_REVIEW_PREP_FRIDGE);
  if (addOns.has("inside_oven")) pushUniqueCap3(items, BOOKING_REVIEW_PREP_OVEN);
  if (addOns.has("interior_windows"))
    pushUniqueCap3(items, BOOKING_REVIEW_PREP_INTERIOR_WINDOWS);

  if (isBookingMoveTransitionServiceId(state.serviceId)) {
    if (state.transitionState === "fully_furnished") {
      pushUniqueCap3(items, BOOKING_REVIEW_PREP_MOVE_FURNISHED);
    }
    if (
      normalizeBookingAppliancePresenceForPayload(state.appliancePresence)
        .length > 0
    ) {
      pushUniqueCap3(items, BOOKING_REVIEW_PREP_MOVE_APPLIANCES);
    }
  }

  if (
    isDeepCleaningBookingServiceId(state.serviceId) &&
    state.deepCleanFocus === "kitchen_bath_priority"
  ) {
    pushUniqueCap3(items, BOOKING_REVIEW_PREP_DEEP_KITCHEN_BATH);
  }

  if (
    normalizeBookingPetsParam(state.pets) ||
    state.petImpactLevel !== "none"
  ) {
    pushUniqueCap3(items, BOOKING_REVIEW_PREP_PETS);
  }

  if (
    state.surfaceComplexity === "dense_layout" ||
    state.layoutType === "segmented"
  ) {
    pushUniqueCap3(items, BOOKING_REVIEW_PREP_DENSE_LAYOUT);
  }

  return items;
}

function deriveRecommendedAttentionItems(state: BookingFlowState): string[] {
  const items: string[] = [];
  const addOns = new Set(
    normalizeBookingAddOnsForPayload(state.selectedAddOns),
  );
  const problems = new Set(
    normalizeBookingProblemAreasForPayload(state.problemAreas),
  );
  if (state.kitchenIntensity === "heavy_use") problems.add("kitchen_grease");
  if (state.bathroomComplexity === "heavy_detailing") {
    problems.add("bathroom_buildup");
  }
  const heavyCondition =
    state.overallLaborCondition === "major_reset" ||
    state.clutterAccess === "heavy_clutter" ||
    state.condition === "heavy_buildup" ||
    state.condition === "move_in_out_reset";

  const candidates: { ok: boolean; line: string }[] = [
    {
      ok: problems.has("kitchen_grease") && !addOns.has("inside_fridge"),
      line: BOOKING_REVIEW_REC_INSIDE_FRIDGE,
    },
    {
      ok: problems.has("bathroom_buildup") && !addOns.has("baseboards_detail"),
      line: BOOKING_REVIEW_REC_BASEBOARDS_DETAIL,
    },
    {
      ok:
        isDeepCleaningBookingServiceId(state.serviceId) &&
        state.deepCleanFocus === "high_touch_detail" &&
        !addOns.has("cabinets_detail"),
      line: BOOKING_REVIEW_REC_CABINETS_DETAIL,
    },
    {
      ok:
        isBookingMoveTransitionServiceId(state.serviceId) &&
        !addOns.has("interior_windows"),
      line: BOOKING_REVIEW_REC_INTERIOR_WINDOWS,
    },
    {
      ok: heavyCondition && !addOns.has("inside_oven"),
      line: BOOKING_REVIEW_REC_INSIDE_OVEN,
    },
  ];

  for (const c of candidates) {
    if (!c.ok) continue;
    pushUniqueCap3(items, c.line);
    if (items.length >= 3) break;
  }

  return items;
}

export function BookingFlowClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialState = useMemo(
    () =>
      parseBookingSearchParams(
        new URLSearchParams(searchParams?.toString() ?? ""),
      ),
    [searchParams],
  );

  const [state, setState] = useState<BookingFlowState>(initialState);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [windowsLoading, setWindowsLoading] = useState(false);
  const [scheduleSurfaceError, setScheduleSurfaceError] = useState<string | null>(
    null,
  );
  const [teamsEmptyState, setTeamsEmptyState] =
    useState<BookingScheduleTeamsEmptyState>("none");
  const [slotsEmptyForTeam, setSlotsEmptyForTeam] = useState(false);
  const [windowsRefreshKey, setWindowsRefreshKey] = useState(0);
  const [teamsLoadSlowHint, setTeamsLoadSlowHint] = useState(false);
  const [windowsLoadSlowHint, setWindowsLoadSlowHint] = useState(false);
  const [scheduleTeamDurationContext, setScheduleTeamDurationContext] =
    useState<BookingScheduleTeamDurationContext | null>(null);
  const [scheduleCommitError, setScheduleCommitError] = useState<string | null>(null);
  const [scheduleCommitPhase, setScheduleCommitPhase] = useState<
    "none" | "hold_failed" | "confirm_failed"
  >("none");
  const [pendingConfirmHoldId, setPendingConfirmHoldId] = useState<string | null>(
    null,
  );
  const [confirmScheduleLoading, setConfirmScheduleLoading] = useState(false);
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositClientSecret, setDepositClientSecret] = useState<string | null>(
    null,
  );
  const [depositPaymentIntentId, setDepositPaymentIntentId] = useState<
    string | null
  >(null);
  const [depositAmountCents, setDepositAmountCents] = useState<number | null>(
    null,
  );
  const [depositProcessing, setDepositProcessing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositBackendProcessing, setDepositBackendProcessing] =
    useState(false);
  const [reviewPaymentPhase, setReviewPaymentPhase] =
    useState<ReviewPaymentPhase>("idle");
  const [requiresDepositResolution, setRequiresDepositResolution] =
    useState(false);
  const [reviewDepositGateMessage, setReviewDepositGateMessage] = useState<
    string | null
  >(null);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [attemptedConfirm, setAttemptedConfirm] = useState(false);
  const [submitRecoverableFailure, setSubmitRecoverableFailure] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const submitInFlightRef = useRef(false);
  const depositPrepareInFlightRef = useRef(false);
  const pendingConfirmHoldIdRef = useRef<string | null>(null);
  const scheduleConfirmIdempotencyKeyRef = useRef<string | null>(null);
  const paymentResumeAttemptedRef = useRef(false);
  const lastDepositFinalizationErrorRef = useRef<string | null>(null);
  const isDepositInFlightRef = useRef(false);
  const depositFinalizeInFlightRef = useRef(false);
  /** After an explicit fresh start, one URL sync must not re-merge contact from prior React state. */
  const skipContactMergeFromUrlOnceRef = useRef(false);
  const scheduleSnapshotForAbandonRef = useRef({
    step: initialState.step,
    schedulingConfirmed: initialState.schedulingConfirmed,
    bookingId: initialState.schedulingBookingId,
    teamId: initialState.selectedTeamId,
    intakeId: initialState.schedulingIntakeId,
  });

  /** Latest booking state when committing the URL at step boundaries. */
  const stateRefForBookingUrl = useRef(state);
  stateRefForBookingUrl.current = state;

  function teamPlanningSnapshotForSession():
    | { teamPlanningLines: string[] }
    | Record<string, never> {
    const lines = buildTeamPlanningDisplayLines(
      stateRefForBookingUrl.current.teamPlanningDetails,
    );
    return lines.length ? { teamPlanningLines: lines } : {};
  }

  useEffect(() => {
    if (state.step !== "schedule") {
      setScheduleTeamDurationContext(null);
    }
  }, [state.step]);

  useEffect(() => {
    const handler = () => {
      try {
        const snapshot = readBookingConfirmationSessionSnapshot();
        if (snapshot?.selectedSlotStart) {
          setState((prev) => ({ ...prev }));
        }
      } catch {}
    };

    window.addEventListener("bookingSessionUpdated", handler);

    return () => {
      window.removeEventListener("bookingSessionUpdated", handler);
    };
  }, []);

  const stripePromise = useMemo(() => getStripePromise(), []);

  useEffect(() => {
    pendingConfirmHoldIdRef.current = pendingConfirmHoldId;
  }, [pendingConfirmHoldId]);

  useEffect(() => {
    restoreDepositLock();
    if (
      isDepositInFlightRef.current &&
      stateRefForBookingUrl.current.step === "schedule"
    ) {
      console.warn("BLOCKED: schedule step during restored deposit payment");
      setState((prev) =>
        clampBookingStepToStructuralMax({ ...prev, step: "review" }),
      );
    }
    // Restore once on mount; subsequent state transitions are guarded separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearDepositUi() {
    setDepositRequired(false);
    setDepositClientSecret(null);
    setDepositPaymentIntentId(null);
    setDepositAmountCents(null);
    setDepositError(null);
    setDepositProcessing(false);
    setDepositBackendProcessing(false);
    setReviewPaymentPhase("idle");
    setRequiresDepositResolution(false);
    setReviewDepositGateMessage(null);
  }

  function clearDepositPaymentCredentialsOnly() {
    setDepositClientSecret(null);
    setDepositPaymentIntentId(null);
    setDepositAmountCents(null);
    setDepositRequired(false);
    setDepositError(null);
    setDepositProcessing(false);
    setDepositBackendProcessing(false);
  }

  function currentPaymentSessionKey(bookingId: string, holdId?: string | null) {
    const hold = holdId?.trim();
    return hold
      ? `public-booking:${bookingId.trim()}:hold:${hold}`
      : `public-booking:${bookingId.trim()}:deposit`;
  }

  function setDepositLock() {
    isDepositInFlightRef.current = true;
    try {
      window.sessionStorage.setItem(DEPOSIT_LOCK_KEY, "1");
    } catch {
      // private mode / quota
    }
  }

  function clearDepositLock() {
    isDepositInFlightRef.current = false;
    try {
      window.sessionStorage.removeItem(DEPOSIT_LOCK_KEY);
    } catch {
      // private mode / quota
    }
  }

  function restoreDepositLock() {
    try {
      if (window.sessionStorage.getItem(DEPOSIT_LOCK_KEY) === "1") {
        isDepositInFlightRef.current = true;
      }
    } catch {
      // private mode / quota
    }
  }

  function isDepositPaymentLocked() {
    return (
      isDepositInFlightRef.current ||
      depositRequired ||
      requiresDepositResolution ||
      reviewPaymentPhase === "preparing" ||
      reviewPaymentPhase === "ready_for_payment" ||
      reviewPaymentPhase === "confirming" ||
      reviewPaymentPhase === "finalizing" ||
      reviewPaymentPhase === "finalizing_timeout"
    );
  }

  function writeDurablePublicBookingPaymentSession(args: {
    bookingId: string;
    holdId?: string | null;
    paymentIntentId?: string | null;
    expiresAt?: string | null;
    canonicalState?:
      | "deposit_required"
      | "deposit_succeeded"
      | "booking_confirmed"
      | "finalization_pending";
  }) {
    const bookingId = args.bookingId.trim();
    const holdId = args.holdId?.trim() || "";
    if (!bookingId) return;
    const s = stateRefForBookingUrl.current;
    const payload: Parameters<typeof writeBookingConfirmationSessionSnapshot>[0] = {
      intakeId: s.schedulingIntakeId.trim() || "public-booking-payment",
      bookingId,
      priceCents: null,
      durationMinutes: null,
      confidence: null,
      bookingErrorCode: "",
      publicDepositStatus: "deposit_required",
      publicDepositHoldId: holdId || undefined,
      paymentSessionKey: currentPaymentSessionKey(bookingId, holdId),
      paymentSessionCreatedAt: new Date().toISOString(),
    };
    const paymentIntentId = args.paymentIntentId?.trim();
    if (paymentIntentId) payload.publicDepositPaymentIntentId = paymentIntentId;
    if (s.selectedTeamId.trim()) payload.selectedTeamId = s.selectedTeamId.trim();
    if (s.selectedTeamDisplayName.trim()) {
      payload.selectedTeamDisplayName = s.selectedTeamDisplayName.trim();
    }
    if (s.selectedSlotStart.trim()) payload.selectedSlotStart = s.selectedSlotStart.trim();
    if (s.selectedSlotEnd.trim()) payload.selectedSlotEnd = s.selectedSlotEnd.trim();
    const expiresAt = args.expiresAt?.trim();
    if (expiresAt) payload.paymentSessionExpiresAt = expiresAt;
    writeBookingConfirmationSessionSnapshot({
      ...payload,
      ...teamPlanningSnapshotForSession(),
    });
    writeBookingContinuitySnapshot({
      ...payload,
      ...teamPlanningSnapshotForSession(),
      lastKnownCanonicalState: args.canonicalState ?? "deposit_required",
    });
  }
  /**
   * Last `state.step` written to the location bar. Same-step edits stay in React only
   * (no `router.replace`) to avoid App Router remount/scroll reset loops.
   */
  const bookingUrlCommittedStepRef = useRef<BookingStepId | null>(null);
  const lastErrorScrollSignatureRef = useRef<string | null>(null);

  function invalidateSelectedSlot(message = BOOKING_SCHEDULE_HOLD_FAILED) {
    setScheduleCommitError(message);
    setScheduleCommitPhase("hold_failed");
    setState((prev) => ({
      ...prev,
      selectedSlotId: "",
      selectedSlotStart: "",
      selectedSlotEnd: "",
      schedulingConfirmed: false,
      publicHoldId: "",
    }));
  }

  function isStaleSlotApiError(err: unknown): boolean {
    return err instanceof PublicBookingApiError && PUBLIC_BOOKING_STALE_SLOT_CODES.has(err.code);
  }

  function isExpiredSlotOrHoldError(err: unknown): boolean {
    if (
      err instanceof PublicBookingApiError &&
      PUBLIC_BOOKING_EXPIRED_SLOT_OR_HOLD_CODES.has(err.code)
    ) {
      return true;
    }
    const message = err instanceof Error ? err.message : String(err ?? "");
    return [...PUBLIC_BOOKING_EXPIRED_SLOT_OR_HOLD_CODES].some((code) =>
      message.includes(code),
    );
  }

  function sameSlotTime(aStart: string, aEnd: string, bStart: string, bEnd: string) {
    const as = new Date(aStart);
    const ae = new Date(aEnd);
    const bs = new Date(bStart);
    const be = new Date(bEnd);
    return (
      Number.isFinite(as.getTime()) &&
      Number.isFinite(ae.getTime()) &&
      as.getTime() === bs.getTime() &&
      ae.getTime() === be.getTime()
    );
  }

  async function refreshSelectedSlotForExpiredHoldRecovery(
    snapshot: BookingFlowState,
  ): Promise<
    | {
        status: "available";
        slot: {
          slotId: string;
          startAt: string;
          endAt: string;
          durationMinutes?: number;
        };
      }
    | { status: "unavailable" }
    | { status: "failed" }
  > {
    const bookingId = snapshot.schedulingBookingId.trim();
    const teamId = snapshot.selectedTeamId.trim();
    const selectedStart = snapshot.selectedSlotStart.trim();
    const selectedEnd = snapshot.selectedSlotEnd.trim();
    if (!bookingId || !teamId || !selectedStart || !selectedEnd) {
      return { status: "failed" };
    }

    setWindowsLoading(true);
    try {
      const res = await postPublicBookingAvailability({ bookingId, foId: teamId });
      if (res.kind !== "public_booking_team_availability") {
        return { status: "failed" };
      }

      const st = res.selectedTeam;
      if (st?.id?.trim() === teamId) {
        setScheduleTeamDurationContext({
          teamId,
          assignedCrewSize:
            typeof st.assignedCrewSize === "number" &&
            Number.isFinite(st.assignedCrewSize)
              ? st.assignedCrewSize
              : null,
          estimatedInHomeMinutes:
            typeof st.estimatedDurationMinutes === "number" &&
            Number.isFinite(st.estimatedDurationMinutes)
              ? st.estimatedDurationMinutes
              : null,
        });
      }

      const windows = (res.windows ?? []).map((w) => ({
        slotId: w.slotId,
        startAt: w.startAt,
        endAt: w.endAt,
        durationMinutes: w.durationMinutes,
      }));
      const match = windows.find((w) =>
        sameSlotTime(selectedStart, selectedEnd, w.startAt, w.endAt),
      );

      setState((prev) => ({
        ...prev,
        availableWindows: windows,
        ...(match
          ? {
              selectedSlotId: match.slotId?.trim() || "",
              selectedSlotStart: match.startAt,
              selectedSlotEnd: match.endAt,
              schedulingConfirmed: false,
              publicHoldId: "",
            }
          : {
              selectedSlotId: "",
              selectedSlotStart: "",
              selectedSlotEnd: "",
              schedulingConfirmed: false,
              publicHoldId: "",
            }),
      }));
      setSlotsEmptyForTeam(windows.length === 0);

      if (!match?.slotId?.trim()) {
        setScheduleCommitError(BOOKING_SCHEDULE_HOLD_FAILED);
        setScheduleCommitPhase("hold_failed");
        return { status: "unavailable" };
      }
      return { status: "available", slot: match };
    } catch {
      return { status: "failed" };
    } finally {
      setWindowsLoading(false);
      setWindowsLoadSlowHint(false);
    }
  }

  useEffect(() => {
    if (state.step !== "schedule" || !state.schedulingBookingId.trim()) {
      setTeamsEmptyState("none");
      setTeamsLoadSlowHint(false);
      return;
    }
    let cancelled = false;
    const slowTimer = window.setTimeout(() => {
      if (!cancelled) setTeamsLoadSlowHint(true);
    }, 3500);
    setTeamsLoading(true);
    setTeamsEmptyState("none");
    setScheduleSurfaceError(null);
    void postPublicBookingAvailability({ bookingId: state.schedulingBookingId })
      .then((res) => {
        if (cancelled) return;
        if (res.kind !== "public_booking_team_options") {
          setScheduleSurfaceError(
            "We couldn’t load team options. Try again in a moment.",
          );
          setTeamsEmptyState("load_error");
          setState((prev) => ({ ...prev, availableTeams: [] }));
          emitBookingFunnelEvent("teams_loaded", {
            count: 0,
            teamIds: [],
            bookingId: state.schedulingBookingId,
            ok: false,
          });
          return;
        }
        const teams = (res.teams ?? []).map((t, i) => {
          const option: BookingAvailableTeamOption = {
            id: t.id,
            displayName: t.displayName,
            isRecommended: t.isRecommended ?? i === 0,
          };
          if (
            typeof t.assignedCrewSize === "number" &&
            Number.isFinite(t.assignedCrewSize)
          ) {
            option.assignedCrewSize = t.assignedCrewSize;
          }
          if (
            typeof t.estimatedDurationMinutes === "number" &&
            Number.isFinite(t.estimatedDurationMinutes)
          ) {
            option.estimatedDurationMinutes = t.estimatedDurationMinutes;
          }
          if (
            t.crewCapacityMeta &&
            typeof t.crewCapacityMeta.requiredLaborMinutes === "number" &&
            Number.isFinite(t.crewCapacityMeta.requiredLaborMinutes)
          ) {
            option.crewCapacityMeta = {
              requiredLaborMinutes: t.crewCapacityMeta.requiredLaborMinutes,
            };
          }
          return option;
        });
        const teamIds = teams.map((t) => t.id);
        const recommendedTeamId =
          teams.find((t) => t.isRecommended)?.id ?? teamIds[0] ?? null;
        setState((prev) => ({ ...prev, availableTeams: teams }));
        emitBookingFunnelEvent("teams_loaded", {
          count: teams.length,
          teamIds,
          recommendedTeamId,
          bookingId: state.schedulingBookingId,
          ok: true,
        });
        if (teams.length === 0) {
          setTeamsEmptyState(
            res.unavailableReason?.code ===
              PUBLIC_BOOKING_ORCHESTRATOR_LOCATION_NOT_RESOLVED_CODE
              ? "location_unresolved"
              : "zero",
          );
          emitBookingFunnelEvent("no_teams_available", {
            bookingId: state.schedulingBookingId,
            unavailableCode: res.unavailableReason?.code ?? null,
          });
        } else {
          setTeamsEmptyState("none");
        }
        if (res.unavailableReason?.message && teams.length > 0) {
          setScheduleSurfaceError(res.unavailableReason.message);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setScheduleSurfaceError(
            "We couldn’t load team options. Check your connection and try again.",
          );
          setTeamsEmptyState("load_error");
          setState((prev) => ({ ...prev, availableTeams: [] }));
          emitBookingFunnelEvent("teams_loaded", {
            count: 0,
            teamIds: [],
            bookingId: state.schedulingBookingId,
            ok: false,
          });
        }
      })
      .finally(() => {
        window.clearTimeout(slowTimer);
        if (!cancelled) {
          setTeamsLoading(false);
          setTeamsLoadSlowHint(false);
        }
      });
    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
    };
  }, [state.step, state.schedulingBookingId]);

  useEffect(() => {
    if (
      state.step !== "schedule" ||
      !state.schedulingBookingId.trim() ||
      !state.selectedTeamId.trim()
    ) {
      setSlotsEmptyForTeam(false);
      setWindowsLoadSlowHint(false);
      setScheduleTeamDurationContext(null);
      return;
    }
    let cancelled = false;
    const slowTimer = window.setTimeout(() => {
      if (!cancelled) setWindowsLoadSlowHint(true);
    }, 3500);
    setWindowsLoading(true);
    setSlotsEmptyForTeam(false);
    void postPublicBookingAvailability({
      bookingId: state.schedulingBookingId,
      foId: state.selectedTeamId,
    })
      .then((res) => {
        if (cancelled) return;
        if (res.kind !== "public_booking_team_availability") {
          setScheduleTeamDurationContext(null);
          setScheduleSurfaceError(
            "We couldn’t load times for that team. Try another team or refresh.",
          );
          setState((prev) => ({ ...prev, availableWindows: [] }));
          emitBookingFunnelEvent("slots_loaded", {
            count: 0,
            teamId: state.selectedTeamId,
            bookingId: state.schedulingBookingId,
            ok: false,
          });
          return;
        }
        const st = res.selectedTeam;
        const currentTeamId = stateRefForBookingUrl.current.selectedTeamId.trim();
        if (currentTeamId && st?.id?.trim() === currentTeamId) {
          setScheduleTeamDurationContext({
            teamId: currentTeamId,
            assignedCrewSize:
              typeof st.assignedCrewSize === "number" &&
              Number.isFinite(st.assignedCrewSize)
                ? st.assignedCrewSize
                : null,
            estimatedInHomeMinutes:
              typeof st.estimatedDurationMinutes === "number" &&
              Number.isFinite(st.estimatedDurationMinutes)
                ? st.estimatedDurationMinutes
                : null,
          });
        } else {
          setScheduleTeamDurationContext(null);
        }
        const windows = (res.windows ?? []).map((w) => ({
          slotId: w.slotId,
          startAt: w.startAt,
          endAt: w.endAt,
          durationMinutes: w.durationMinutes,
        }));
        const currentSlotIds = new Set(
          windows.map((w) => w.slotId?.trim()).filter(Boolean),
        );
        const currentState = stateRefForBookingUrl.current;
        const selectedSlotId = currentState.selectedSlotId.trim();
        const hasCurrentSelectedSlot =
          Boolean(selectedSlotId) && currentSlotIds.has(selectedSlotId);
        const hasRestoredSelection =
          Boolean(selectedSlotId) ||
          Boolean(currentState.selectedSlotStart.trim()) ||
          Boolean(currentState.selectedSlotEnd.trim());
        if (hasRestoredSelection && !hasCurrentSelectedSlot) {
          setScheduleCommitError(BOOKING_SCHEDULE_HOLD_FAILED);
          setScheduleCommitPhase("hold_failed");
        }
        setState((prev) => {
          return {
            ...prev,
            availableWindows: windows,
            ...(hasCurrentSelectedSlot
              ? {}
              : {
                  selectedSlotId: "",
                  selectedSlotStart: "",
                  selectedSlotEnd: "",
                  schedulingConfirmed: false,
                  publicHoldId: "",
                }),
          };
        });
        const count = windows.length;
        setSlotsEmptyForTeam(count === 0);
        emitBookingFunnelEvent("slots_loaded", {
          count,
          teamId: state.selectedTeamId,
          bookingId: state.schedulingBookingId,
          ok: true,
        });
        if (count === 0) {
          emitBookingFunnelEvent("no_slots_available", {
            teamId: state.selectedTeamId,
            bookingId: state.schedulingBookingId,
          });
        }
        if (res.unavailableReason?.message) {
          setScheduleSurfaceError(res.unavailableReason.message);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setScheduleTeamDurationContext(null);
          setScheduleSurfaceError(
            "We couldn’t load open times. Try again in a moment.",
          );
          setState((prev) => ({ ...prev, availableWindows: [] }));
          emitBookingFunnelEvent("slots_loaded", {
            count: 0,
            teamId: state.selectedTeamId,
            bookingId: state.schedulingBookingId,
            ok: false,
          });
        }
      })
      .finally(() => {
        window.clearTimeout(slowTimer);
        if (!cancelled) {
          setWindowsLoading(false);
          setWindowsLoadSlowHint(false);
        }
      });
    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
    };
  }, [state.step, state.schedulingBookingId, state.selectedTeamId, windowsRefreshKey]);

  useEffect(() => {
    scheduleSnapshotForAbandonRef.current = {
      step: state.step,
      schedulingConfirmed: state.schedulingConfirmed,
      bookingId: state.schedulingBookingId,
      teamId: state.selectedTeamId,
      intakeId: state.schedulingIntakeId,
    };
  }, [
    state.step,
    state.schedulingConfirmed,
    state.schedulingBookingId,
    state.selectedTeamId,
    state.schedulingIntakeId,
  ]);

  useEffect(() => {
    const onPageHide = () => {
      const snap = scheduleSnapshotForAbandonRef.current;
      if (snap.step === "review" && !snap.schedulingConfirmed) {
        const bid = snap.bookingId.trim();
        const iid = snap.intakeId.trim();
        if (bid || iid) {
          postPublicBookingFunnelMilestone({
            milestone: "REVIEW_ABANDONED",
            ...(bid ? { bookingId: bid } : {}),
            ...(iid ? { intakeId: iid } : {}),
            payload: { surface: "review_pagehide" },
          });
        }
      }
      if (snap.step !== "schedule" || snap.schedulingConfirmed) return;
      if (!snap.bookingId.trim()) return;
      postPublicBookingFunnelMilestone({
        milestone: "REVIEW_ABANDONED",
        bookingId: snap.bookingId.trim(),
        ...(snap.intakeId.trim() ? { intakeId: snap.intakeId.trim() } : {}),
        payload: { surface: "schedule_pagehide" },
      });
      emitBookingFunnelEvent("booking_unfinished_after_review", {
        bookingId: snap.bookingId,
      });
      emitBookingFunnelEvent("abandoned_after_review", { bookingId: snap.bookingId });
      if (snap.teamId.trim()) {
        emitBookingFunnelEvent("abandoned_after_team_select", {
          bookingId: snap.bookingId,
          teamId: snap.teamId,
        });
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  useLayoutEffect(() => {
    if (pathname !== "/book") return;
    if (!consumeBookingFlowFreshStartRequested()) return;

    clearBookingConfirmationSessionSnapshot();
    bookingUrlCommittedStepRef.current = null;
    skipContactMergeFromUrlOnceRef.current = true;
    setAttemptedNext(false);
    setAttemptedConfirm(false);
    setSubmitRecoverableFailure(false);
    setIsSubmitting(false);
    submitInFlightRef.current = false;
    setState(
      clampBookingStepToStructuralMax(
        parseBookingSearchParams(new URLSearchParams()),
      ),
    );
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const attributionQueryKey = searchParams?.toString() ?? "";

  const currentStepOrder = useMemo(() => getStepOrder(state.step), [state.step]);

  const stepError = useMemo(() => getStepError(state), [state]);
  const canContinue = !stepError;

  const isHomeComplete = isHomeDetailsComplete(state);
  const isLocationComplete = isServiceLocationComplete(state);
  const isBookingReady =
    isAnonymousBookingPublicPath(state.bookingPublicPath) &&
    !!state.serviceId &&
    isHomeComplete &&
    isLocationComplete;
  const isContactReady = isBookingContactValid(
    state.customerName,
    state.customerEmail,
  );

  const contactPayloadKey = useMemo(() => {
    if (!isContactReady) return "";
    return `${state.customerName.trim()}|${state.customerEmail.trim()}`;
  }, [isContactReady, state.customerName, state.customerEmail]);

  const problemAreasPayloadKey = useMemo(
    () =>
      [
        normalizeBookingProblemAreasForPayload(state.problemAreas).join(","),
        state.kitchenIntensity,
        state.bathroomComplexity,
      ].join("|"),
    [state.problemAreas, state.kitchenIntensity, state.bathroomComplexity],
  );

  const selectedAddOnsPayloadKey = useMemo(
    () => normalizeBookingAddOnsForPayload(state.selectedAddOns).join(","),
    [state.selectedAddOns],
  );

  const appliancePresencePayloadKey = useMemo(
    () =>
      normalizeBookingAppliancePresenceForPayload(state.appliancePresence).join(
        ",",
      ),
    [state.appliancePresence],
  );

  const requestedEnhancementIds = useMemo(
    () => normalizeBookingUpsellIds(state.selectedUpsellIds, state.intent),
    [state.selectedUpsellIds, state.intent],
  );

  const requestedEnhancementIdsPayloadKey = useMemo(
    () => requestedEnhancementIds.join(","),
    [requestedEnhancementIds],
  );

  const recurringInterestPayload = useMemo(
    () => buildRecurringInterestPayloadForDirectionIntake(state),
    [
      state.recurringInterest?.interested,
      state.recurringInterest?.cadence,
      state.recurringInterest?.note,
      state.teamPlanningDetails,
      state.intent,
    ],
  );

  const recurringInterestPayloadKey = useMemo(
    () => JSON.stringify(recurringInterestPayload ?? null),
    [recurringInterestPayload],
  );

  const selectedStartAtForPreview = useMemo(
    () => resolveSelectedStartAtForPreview(state),
    [state],
  );

  const resolvedSchedulePreviewCadence = useMemo(
    () => resolveSchedulePreviewCadence(state),
    [
      state.bookingPublicPath,
      state.recurringCadenceIntent,
      state.recurringInterest?.cadence,
      state.recurringInterest?.interested,
    ],
  );

  const resolvedSchedulePreviewVisitStructure = useMemo(
    () => resolveSchedulePreviewVisitStructure(state),
    [
      state.firstTimePostEstimateVisitChoice,
      state.firstTimeVisitProgram,
    ],
  );

  const schedulePreview = useMemo(() => {
    return buildDerivedSchedulePreview({
      selectedStartAt: selectedStartAtForPreview,
      cadence: resolvedSchedulePreviewCadence,
      visitStructure: resolvedSchedulePreviewVisitStructure,
    });
  }, [
    selectedStartAtForPreview,
    resolvedSchedulePreviewCadence,
    resolvedSchedulePreviewVisitStructure,
  ]);

  const wiredEstimateDriverFlags = useMemo(
    () => computeWiredEstimateDriverFlags(state),
    [
      state.serviceId,
      state.overallLaborCondition,
      state.clutterAccess,
      state.kitchenIntensity,
      state.bathroomComplexity,
      state.layoutType,
      state.primaryIntent,
      state.surfaceDetailTokens,
      selectedAddOnsPayloadKey,
      state.deepCleanFocus,
      state.transitionState,
      appliancePresencePayloadKey,
    ],
  );

  const intakePlanningNoteLines = useMemo(
    () => buildIntakePlanningNoteLines(state),
    [
      problemAreasPayloadKey,
      state.surfaceComplexity,
      state.layoutType,
      state.clutterAccess,
      state.scopeIntensity,
      state.primaryIntent,
      state.condition,
    ],
  );

  const previewConfidenceBand = useMemo(
    () =>
      derivePreviewConfidenceBand(computePreviewConfidenceBandInputs(state)),
    [
      state.serviceId,
      state.overallLaborCondition,
      state.clutterAccess,
      state.kitchenIntensity,
      state.bathroomComplexity,
      state.layoutType,
      state.primaryIntent,
      state.surfaceDetailTokens,
      selectedAddOnsPayloadKey,
      state.deepCleanFocus,
      state.transitionState,
      appliancePresencePayloadKey,
    ],
  );

  const estimateDriverHasAddOns = wiredEstimateDriverFlags.hasAddOns;

  const estimateDriverDeepCleanFocus = wiredEstimateDriverFlags.deepCleanFocusNonDefault;

  const estimateDriverFurnishedTransition = wiredEstimateDriverFlags.furnishedTransition;

  const estimateDriverTransitionAppliances =
    wiredEstimateDriverFlags.transitionAppliances;

  const prepGuidanceItems = useMemo(
    () => derivePrepGuidanceItems(state),
    [
      state.serviceId,
      state.surfaceComplexity,
      state.layoutType,
      state.deepCleanFocus,
      state.transitionState,
      selectedAddOnsPayloadKey,
      appliancePresencePayloadKey,
      state.pets,
      state.petImpactLevel,
    ],
  );

  const recommendedAttentionItems = useMemo(
    () => deriveRecommendedAttentionItems(state),
    [
      state.serviceId,
      state.condition,
      state.overallLaborCondition,
      state.clutterAccess,
      state.kitchenIntensity,
      state.bathroomComplexity,
      state.deepCleanFocus,
      problemAreasPayloadKey,
      selectedAddOnsPayloadKey,
    ],
  );

  const normalizedAttribution = useMemo(
    () =>
      buildBookingAttributionFromSearchParams(
        new URLSearchParams(attributionQueryKey),
      ),
    [attributionQueryKey],
  );

  /** Single normalized intake body (preview + submit) without contact fields. */
  const normalizedIntakeCore = useMemo((): Omit<
    SubmitBookingDirectionIntakePayload,
    "customerName" | "customerEmail"
  > | null => {
    if (!isBookingReady) return null;
    const serviceLocation = buildPublicServiceLocationPayload(state);
    if (!serviceLocation) return null;
    const estimateFactors =
      buildIntakeEstimateFactorsFromBookingHomeState(state);
    const core: Omit<
      SubmitBookingDirectionIntakePayload,
      "customerName" | "customerEmail"
    > = {
      serviceId: state.serviceId.trim(),
      homeSize: normalizeBookingHomeSizeParam(state.homeSize),
      bedrooms: state.bedrooms.trim(),
      bathrooms: state.bathrooms.trim(),
      pets: (state.pets ?? "").trim(),
      estimateFactors,
      serviceLocation,
      frequency: "One-Time",
      preferredTime: BOOKING_INTAKE_PREFERRED_TIME_DEFERRED,
      requestedEnhancementIds,
      ...(recurringInterestPayload
        ? { recurringInterest: recurringInterestPayload }
        : {}),
      ...normalizedAttribution,
    };

    if (isDeepCleaningBookingServiceId(state.serviceId)) {
      const deepProgram =
        state.firstTimeVisitProgram === "three_visit" ||
        state.deepCleanProgram === "phased_3_visit"
          ? "phased_3_visit"
          : "single_visit";
      return { ...core, deepCleanProgram: deepProgram };
    }
    return core;
  }, [
    isBookingReady,
    state.serviceId,
    state.homeSize,
    state.bedrooms,
    state.bathrooms,
    state.pets,
    state.serviceLocationZip,
    state.serviceLocationStreet,
    state.serviceLocationCity,
    state.serviceLocationState,
    state.serviceLocationUnit,
    state.serviceLocationAddressLine,
    state.halfBathrooms,
    state.intakeFloors,
    state.intakeStairsFlights,
    state.floorMix,
    state.layoutType,
    state.occupancyLevel,
    state.childrenInHome,
    state.petImpactLevel,
    state.overallLaborCondition,
    state.kitchenIntensity,
    state.bathroomComplexity,
    state.clutterAccess,
    state.surfaceDetailTokens,
    state.primaryIntent,
    state.lastProCleanRecency,
    state.firstTimeVisitProgram,
    state.recurringCadenceIntent,
    selectedAddOnsPayloadKey,
    state.deepCleanFocus,
    state.transitionState,
    appliancePresencePayloadKey,
    requestedEnhancementIdsPayloadKey,
    recurringInterestPayloadKey,
    state.deepCleanProgram,
    state.firstTimePostEstimateVisitChoice,
    normalizedAttribution,
  ]);

  const estimateInput = useMemo((): Record<string, unknown> | null => {
    if (state.step !== "review" || !normalizedIntakeCore) return null;
    return {
      ...normalizedIntakeCore,
      ...(isContactReady
        ? {
            customerName: state.customerName.trim(),
            customerEmail: state.customerEmail.trim(),
          }
        : {}),
    };
  }, [
    state.step,
    normalizedIntakeCore,
    isContactReady,
    state.customerName,
    state.customerEmail,
  ]);

  const estimate = useBookingEstimate(estimateInput);
  const canRenderReview = state.step === "review" && estimateInput != null;

  function isEstimateValidForReview() {
    if (estimateInput == null) return false;
    if (estimate.status !== "success") return false;
    if (!estimate.data) return false;
    if (estimate.requestKey !== buildEstimateRequestKey(estimateInput)) {
      return false;
    }
    return true;
  }

  const estimatePreviewReady = isEstimateValidForReview();

  const needsDeepVisitPlanAfterEstimate =
    isDeepCleaningBookingServiceId(state.serviceId) &&
    (state.bookingPublicPath === "one_time_cleaning" ||
      state.bookingPublicPath === "first_time_with_recurring");

  const firstTimePostEstimateSelectionOk =
    !needsDeepVisitPlanAfterEstimate ||
    !estimatePreviewReady ||
    !!state.firstTimePostEstimateVisitChoice;
  const canConfirmDirection =
    isBookingReady &&
    isContactReady &&
    firstTimePostEstimateSelectionOk;

  const reviewSubmitLabel = useMemo(() => {
    if (state.step !== "review") return BOOKING_REVIEW_SEE_AVAILABLE_TEAMS_CTA;
    if (isSubmitting) return BOOKING_REVIEW_SUBMIT_SAVING;
    if (!canConfirmDirection) {
      if (isBookingReady && !isContactReady) {
        return BOOKING_REVIEW_SUBMIT_ADD_CONTACT_FIRST;
      }
      return BOOKING_REVIEW_SEE_AVAILABLE_TEAMS_CTA;
    }
    if (estimate.status === "loading") {
      return BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_REFRESHING;
    }
    if (estimate.status === "error") {
      return BOOKING_REVIEW_SUBMIT_WHILE_QUOTE_NEEDS_ATTENTION;
    }
    if (!estimatePreviewReady) {
      return BOOKING_REVIEW_SUBMIT_AFTER_DETAILS_CHANGE;
    }
    if (submitRecoverableFailure) {
      return BOOKING_REVIEW_SUBMIT_TRY_AGAIN;
    }
    return "Confirm Booking";
  }, [
    state.step,
    isSubmitting,
    canConfirmDirection,
    isBookingReady,
    isContactReady,
    estimate.status,
    estimatePreviewReady,
    submitRecoverableFailure,
  ]);

  const reviewAwaitingDepositPayment =
    state.step === "review" &&
    Boolean(state.schedulingBookingId.trim()) &&
    (depositRequired ||
      requiresDepositResolution ||
      reviewPaymentPhase === "preparing" ||
      reviewPaymentPhase === "ready_for_payment" ||
      reviewPaymentPhase === "confirming" ||
      reviewPaymentPhase === "finalizing" ||
      reviewPaymentPhase === "finalizing_timeout");

  useEffect(() => {
    if (state.step !== "review" || estimateInput != null) return;

    const maxStep = computeMaxReadyStep(state);

    if (maxStep === state.step) return;

    setAttemptedConfirm(false);
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        step: maxStep,
      }),
    );
  }, [state, estimateInput]);

  useEffect(() => {
    if (state.step !== "schedule") return;
    if (!isDepositPaymentLocked()) return;
    console.warn("BLOCKED: schedule step during deposit payment");
    setState((prev) =>
      clampBookingStepToStructuralMax({ ...prev, step: "review" }),
    );
    // `isDepositInFlightRef` intentionally stays out of deps; state changes above are
    // enough to rerun this guard, and the ref is checked synchronously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, depositRequired, requiresDepositResolution, reviewPaymentPhase]);

  const previewEstimate = useMemo((): FunnelReviewEstimate | null => {
    if (estimate.status !== "success" || !estimate.data || !estimateInput) {
      return null;
    }
    if (estimate.requestKey !== buildEstimateRequestKey(estimateInput)) {
      return null;
    }
    return {
      priceCents: estimate.data.estimate.priceCents,
      durationMinutes: estimate.data.estimate.durationMinutes,
      confidence: estimate.data.estimate.confidence,
      source: "server",
      recurringQuoteOptions: estimate.data.recurringQuoteOptions,
    };
  }, [estimate.status, estimate.data, estimate.requestKey, estimateInput]);

  const lastPreviewLaborMinutesRef = useRef<number | null>(null);
  useEffect(() => {
    if (
      previewEstimate &&
      typeof previewEstimate.durationMinutes === "number" &&
      Number.isFinite(previewEstimate.durationMinutes)
    ) {
      lastPreviewLaborMinutesRef.current = previewEstimate.durationMinutes;
    }
  }, [previewEstimate]);

  /** Labor minutes from the confirmed intake snapshot — schedule step has no live preview input. */
  const scheduleLaborEffortMinutes = useMemo((): number | null => {
    if (state.step !== "schedule") return null;
    const bookingId = state.schedulingBookingId.trim();
    if (!bookingId) return null;
    try {
      const snap = readBookingConfirmationSessionSnapshot();
      if (snap?.bookingId?.trim() === bookingId) {
        const dm = snap.durationMinutes;
        if (typeof dm === "number" && Number.isFinite(dm)) return dm;
      }
    } catch {
      /* sessionStorage may be unavailable */
    }
    const sticky = lastPreviewLaborMinutesRef.current;
    if (typeof sticky === "number" && Number.isFinite(sticky)) return sticky;
    return null;
  }, [state.step, state.schedulingBookingId]);

  const previewDeepCleanCard = useMemo((): DeepCleanProgramDisplay | null => {
    if (
      estimate.status !== "success" ||
      !estimate.data?.deepCleanProgram ||
      !estimateInput
    ) {
      return null;
    }
    if (estimate.requestKey !== buildEstimateRequestKey(estimateInput)) {
      return null;
    }
    return mapIntakeDeepCleanSnapshotToCardProgram(estimate.data.deepCleanProgram);
  }, [estimate.status, estimate.data, estimate.requestKey, estimateInput]);

  const previewLoading = estimate.status === "loading";
  const previewError =
    estimate.status === "error" ? estimate.errorMessage ?? null : null;
  const previewFetchCompleted =
    estimate.status === "success" || estimate.status === "error";
  const recurringContractSelected =
    state.bookingPublicPath === "first_time_with_recurring" ||
    state.recurringInterest?.interested === true;
  const recurringQuoteOptionsReady =
    !recurringContractSelected ||
    Boolean(previewEstimate?.recurringQuoteOptions?.length);
  const disableNext =
    state.step === "review" &&
    (isSubmitting ||
      !canConfirmDirection ||
      !canRenderReview ||
      estimate.status === "loading" ||
      estimate.status === "error" ||
      !estimatePreviewReady ||
      !recurringQuoteOptionsReady ||
      reviewAwaitingDepositPayment);

  useEffect(() => {
    const signature = [
      attemptedNext && stepError ? `next:${stepError}` : "",
      attemptedConfirm && !canConfirmDirection ? "contact" : "",
      submitRecoverableFailure ? "recover" : "",
      previewError ? `preview:${previewError}` : "",
    ]
      .filter(Boolean)
      .join("|");

    if (!signature) {
      lastErrorScrollSignatureRef.current = null;
      return;
    }
    if (signature === lastErrorScrollSignatureRef.current) return;
    lastErrorScrollSignatureRef.current = signature;

    errorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [
    attemptedNext,
    stepError,
    attemptedConfirm,
    canConfirmDirection,
    submitRecoverableFailure,
    previewError,
  ]);

  /** Clear stale advance attempts once the current step boundary is satisfied (stepError derives from it). */
  useEffect(() => {
    if (stepError == null && attemptedNext) {
      setAttemptedNext(false);
    }
  }, [stepError, attemptedNext]);

  // URL → STATE (ONLY runs when searchParams change)
  useEffect(() => {
    const parsed = parseBookingSearchParams(
      new URLSearchParams(searchParams?.toString() ?? ""),
    );

    setState((prev) => {
      if (skipContactMergeFromUrlOnceRef.current) {
        skipContactMergeFromUrlOnceRef.current = false;
        // Ignore possibly stale searchParams in the same tick as fresh-start `replace`.
        const cold = clampBookingStepToStructuralMax(
          parseBookingSearchParams(new URLSearchParams()),
        );
        const parsedSerialized = serializeState(cold);
        const currentSerialized = serializeState(prev);
        if (parsedSerialized === currentSerialized) {
          return prev;
        }
        return cold;
      }
      const merged = clampBookingStepToStructuralMax({
        ...parsed,
        customerName: prev.customerName,
        customerEmail: prev.customerEmail,
      });
      const parsedSerialized = serializeState(merged);
      const currentSerialized = serializeState(prev);
      if (parsedSerialized === currentSerialized) {
        return prev;
      }
      return merged;
    });
  }, [searchParams]);

  useEffect(() => {
    if (state.step !== "review") {
      setAttemptedConfirm(false);
    }
  }, [state.step]);

  // STATE → URL: commit only when `state.step` changes (Continue/Back/clamp/submit) plus one
  // initial normalize on mount. Intake fields are not mirrored live — same-step edits avoid
  // `router.replace` entirely so the questionnaire does not re-navigate on each interaction.
  useEffect(() => {
    const step = state.step;
    const desired = serializeState(stateRefForBookingUrl.current);
    const current = new URLSearchParams(searchParams?.toString() ?? "").toString();

    if (bookingUrlCommittedStepRef.current === null) {
      bookingUrlCommittedStepRef.current = step;
      if (desired !== current) {
        router.replace(`${pathname}?${desired}`, { scroll: false });
      }
      return;
    }

    if (bookingUrlCommittedStepRef.current === step) {
      return;
    }

    bookingUrlCommittedStepRef.current = step;
    if (desired !== current) {
      router.replace(`${pathname}?${desired}`, { scroll: false });
    }
    // Intentionally omit `searchParams` from deps: commits are driven by `state.step` only
    // (plus mount). `searchParams` is read when this effect runs after step transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, pathname, router]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [state.step]);

  function goToStep(step: BookingStepId) {
    if (step === "schedule" && isDepositPaymentLocked()) {
      console.warn("BLOCKED: schedule step during deposit payment");
      setState((prev) =>
        clampBookingStepToStructuralMax({ ...prev, step: "review" }),
      );
      return;
    }
    setState((prev) =>
      clampBookingStepToStructuralMax({ ...prev, step }),
    );
  }

  function goNext() {
    setAttemptedNext(true);

    if (stepError) {
      window.setTimeout(() => {
        const firstInvalid = document.querySelector<HTMLElement>(
          "[aria-invalid='true'], #booking-step-continue-error",
        );
        firstInvalid?.scrollIntoView?.({ behavior: "smooth", block: "center" });
        if (
          firstInvalid instanceof HTMLInputElement ||
          firstInvalid instanceof HTMLSelectElement ||
          firstInvalid instanceof HTMLTextAreaElement
        ) {
          firstInvalid.focus({ preventScroll: true });
        }
      }, 0);
      return;
    }

    setAttemptedNext(false);

    if (state.step === "service") return goToStep("home");
    if (state.step === "home" || state.step === "location") {
      return goToStep("review");
    }
  }

  async function finalizeHeldBookingAfterDepositPaid(
    bookingId: string,
    holdIdOverride?: string | null,
  ) {
    const holdId = holdIdOverride?.trim() || pendingConfirmHoldIdRef.current?.trim();
    if (!holdId) return false;
    const idemKey = scheduleConfirmIdempotencyKeyRef.current;
    const maxAttempts = 5;
    lastDepositFinalizationErrorRef.current = null;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }
      try {
        const s = stateRefForBookingUrl.current;
        await postPublicBookingConfirm(
          {
            bookingId,
            holdId,
            requestedEnhancementIds: normalizeBookingUpsellIds(
              s.selectedUpsellIds,
              s.intent,
            ),
          },
          idemKey,
        );
        clearDepositLock();
        emitBookingFunnelEvent("booking_confirmed", {
          bookingId,
          teamId: s.selectedTeamId,
          holdId,
        });
        postPublicBookingFunnelMilestone({
          milestone: "BOOKING_CONFIRMED",
          bookingId,
          ...(s.schedulingIntakeId.trim()
            ? { intakeId: s.schedulingIntakeId.trim() }
            : {}),
          payload: {
            holdId,
            teamId: s.selectedTeamId,
            phase: "deposit_finalize",
          },
        });
        clearDepositUi();
        clearBookingConfirmationPaymentSessionState(bookingId);
        clearBookingContinuitySnapshot(bookingId);
        setScheduleCommitError(null);
        setScheduleCommitPhase("none");
        setPendingConfirmHoldId(null);
        setState((prev) => ({
          ...prev,
          schedulingConfirmed: true,
          publicHoldId: holdId,
        }));
        const q = new URLSearchParams();
        q.set("intakeId", s.schedulingIntakeId.trim());
        q.set("bookingId", bookingId);
        appendPublicIntakeContextToSearchParams(q, s);
        router.push(`/book/confirmation?${q.toString()}`);
        return true;
      } catch (e) {
        if (e instanceof PublicBookingDepositProcessingError) {
          if (attempt === maxAttempts - 1) {
            setScheduleCommitError(
              "Payment is still processing. Please wait a moment and try again.",
            );
            setScheduleCommitPhase("confirm_failed");
            return false;
          }
          continue;
        }
        if (
          e instanceof PublicBookingPaymentRequiredError &&
          e.code === "PAYMENT_REQUIRED"
        ) {
          setScheduleCommitError(
            e.details.message ||
              "Deposit is still required before we can confirm.",
          );
          setScheduleCommitPhase("confirm_failed");
          return false;
        }
        const message =
          e instanceof Error
            ? e.message
            : "We couldn’t confirm your booking. Please try again.";
        lastDepositFinalizationErrorRef.current = message;
        setReviewPaymentPhase("finalizing_timeout");
        setDepositError(message);
        setScheduleCommitError(null);
        setScheduleCommitPhase("none");
        return false;
      }
    }
    return false;
  }

  async function advanceAfterPublicDepositSatisfied(
    prep: PublicBookingDepositPrepareResponse,
  ) {
    const bookingId = prep.bookingId.trim();
    if (!bookingId) return;
    const prior = readBookingConfirmationSessionSnapshot();
    const intakeId =
      stateRefForBookingUrl.current.schedulingIntakeId.trim() ||
      prior?.intakeId?.trim() ||
      "";
    const holdId = pendingConfirmHoldIdRef.current?.trim();
    const priorMatchesBooking =
      prior != null && prior.bookingId.trim() === bookingId;
    writeBookingConfirmationSessionSnapshot({
      intakeId,
      bookingId,
      priceCents: priorMatchesBooking ? prior.priceCents : null,
      durationMinutes: priorMatchesBooking ? prior.durationMinutes : null,
      confidence: priorMatchesBooking ? prior.confidence : null,
      bookingErrorCode: priorMatchesBooking ? prior.bookingErrorCode : "",
      publicDepositPaymentIntentId: prep.paymentIntentId?.trim() || undefined,
      publicDepositStatus:
        prep.publicDepositStatus?.trim() || "deposit_succeeded",
      publicDepositHoldId: holdId || undefined,
      paymentSessionKey: currentPaymentSessionKey(bookingId, holdId),
      ...teamPlanningSnapshotForSession(),
    });
    writeBookingContinuitySnapshot({
      intakeId,
      bookingId,
      priceCents: priorMatchesBooking ? prior.priceCents : null,
      durationMinutes: priorMatchesBooking ? prior.durationMinutes : null,
      confidence: priorMatchesBooking ? prior.confidence : null,
      bookingErrorCode: priorMatchesBooking ? prior.bookingErrorCode : "",
      publicDepositPaymentIntentId: prep.paymentIntentId?.trim() || undefined,
      publicDepositStatus:
        prep.publicDepositStatus?.trim() || "deposit_succeeded",
      publicDepositHoldId: holdId || undefined,
      paymentSessionKey: currentPaymentSessionKey(bookingId, holdId),
      lastKnownCanonicalState: holdId ? "finalization_pending" : "deposit_succeeded",
      ...teamPlanningSnapshotForSession(),
    });
    clearDepositUi();
    if (holdId) {
      setConfirmScheduleLoading(true);
      try {
        const finalized = await finalizeHeldBookingAfterDepositPaid(bookingId, holdId);
        if (!finalized) {
          setReviewPaymentPhase("finalizing_timeout");
          if (!lastDepositFinalizationErrorRef.current) {
            setDepositError(
              "Your deposit was received, but we could not finish booking confirmation automatically. Please retry finalization or contact support.",
            );
          }
        }
      } finally {
        setConfirmScheduleLoading(false);
      }
      return;
    }
    clearDepositLock();
    setScheduleSurfaceError(null);
    setScheduleCommitError(null);
    setScheduleCommitPhase("none");
    postPublicBookingFunnelMilestone({
      milestone: "SCHEDULE_REACHED",
      bookingId,
      ...(intakeId ? { intakeId } : {}),
      payload: { surface: "deposit_satisfied" },
    });
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        schedulingBookingId: bookingId,
        schedulingIntakeId: intakeId || prev.schedulingIntakeId,
        selectedTeamId: "",
        selectedTeamDisplayName: "",
        availableTeams: [],
        availableWindows: [],
        selectedSlotId: "",
        selectedSlotStart: "",
        selectedSlotEnd: "",
        publicHoldId: "",
        schedulingConfirmed: false,
        step: "schedule",
      }),
    );
  }

  async function followDepositPrepareNextAction(
    prep: PublicBookingDepositPrepareResponse,
    opts?: { postStripeResume?: boolean },
  ) {
    writeDurablePublicBookingPaymentSession({
      bookingId: prep.bookingId,
      holdId: pendingConfirmHoldIdRef.current?.trim() || null,
      paymentIntentId: prep.paymentIntentId,
      canonicalState:
        prep.nextAction === "finalize_booking"
          ? "deposit_succeeded"
          : "deposit_required",
    });
    setDepositBackendProcessing(
      prep.paymentMode === "deposit" && prep.classification === "processing",
    );
    if (prep.nextAction === "finalize_booking") {
      setRequiresDepositResolution(false);
      setReviewDepositGateMessage(null);
      setReviewPaymentPhase("satisfied");
      await advanceAfterPublicDepositSatisfied(prep);
      return;
    }
    if (prep.nextAction === "confirm_deposit" && prep.clientSecret?.trim()) {
      if (opts?.postStripeResume) {
        setReviewPaymentPhase("failed");
        setDepositError(
          "Payment succeeded, but we could not safely resume the booking. Please contact support before retrying.",
        );
        return;
      }
      setDepositRequired(true);
      setDepositClientSecret(prep.clientSecret.trim());
      setDepositPaymentIntentId(prep.paymentIntentId?.trim() || null);
      setDepositAmountCents(
        typeof prep.amountCents === "number" ? prep.amountCents : null,
      );
      setReviewPaymentPhase("ready_for_payment");
      return;
    }
    setReviewPaymentPhase("failed");
    setDepositError(
      prep.errorMessage?.trim() ||
        "We couldn’t start card payment. Please try again shortly.",
    );
  }

  useEffect(() => {
    if (pathname !== "/book") return;
    if (paymentResumeAttemptedRef.current) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const isPaymentReturn =
      params.get("publicBookingPayment") === "1" ||
      params.get("redirect_status") === "succeeded";
    if (!isPaymentReturn) return;
    paymentResumeAttemptedRef.current = true;

    const session =
      readBookingConfirmationSessionSnapshot() ?? readBookingContinuitySnapshot();
    const bookingId =
      params.get("bookingId")?.trim() ||
      stateRefForBookingUrl.current.schedulingBookingId.trim() ||
      session?.bookingId?.trim() ||
      "";
    const holdId =
      params.get("holdId")?.trim() ||
      pendingConfirmHoldIdRef.current?.trim() ||
      session?.publicDepositHoldId?.trim() ||
      "";

    if (!bookingId) {
      setRequiresDepositResolution(true);
      setReviewPaymentPhase("finalizing_timeout");
      setDepositError(
        "Payment returned, but the booking session could not be restored. Please contact support before paying again.",
      );
      setState((prev) =>
        clampBookingStepToStructuralMax({
          ...prev,
          schedulingBookingId: bookingId || prev.schedulingBookingId,
          step: "review",
        }),
      );
      return;
    }

    postPublicBookingFunnelMilestone({
      milestone: "BOOKING_REENTRY",
      bookingId,
      ...(session?.intakeId?.trim()
        ? { intakeId: session.intakeId.trim() }
        : {}),
      payload: { surface: "stripe_payment_return" },
    });

    const paymentIntentId =
      params.get("paymentIntentId")?.trim() ||
      session?.publicDepositPaymentIntentId?.trim() ||
      null;
    setPendingConfirmHoldId(holdId || null);
    pendingConfirmHoldIdRef.current = holdId || null;
    setDepositLock();
    setRequiresDepositResolution(true);
    setReviewPaymentPhase("finalizing");
    setDepositProcessing(true);
    setDepositError(null);
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        schedulingBookingId: bookingId,
        schedulingIntakeId: session?.intakeId?.trim() || prev.schedulingIntakeId,
        selectedTeamId: session?.selectedTeamId?.trim() || prev.selectedTeamId,
        selectedTeamDisplayName:
          session?.selectedTeamDisplayName?.trim() || prev.selectedTeamDisplayName,
        selectedSlotStart: session?.selectedSlotStart?.trim() || prev.selectedSlotStart,
        selectedSlotEnd: session?.selectedSlotEnd?.trim() || prev.selectedSlotEnd,
        step: "review",
      }),
    );
    writeDurablePublicBookingPaymentSession({
      bookingId,
      holdId: holdId || null,
      paymentIntentId,
      expiresAt: session?.paymentSessionExpiresAt ?? null,
      canonicalState: "finalization_pending",
    });

    void (async () => {
      try {
        if (holdId) {
          const finalized = await finalizeHeldBookingAfterDepositPaid(bookingId, holdId);
          if (!finalized) {
            setReviewPaymentPhase("finalizing_timeout");
            if (!lastDepositFinalizationErrorRef.current) {
              setDepositError(
                "Your deposit was received, but booking confirmation did not finish automatically. Please retry or contact support.",
              );
            }
          }
          return;
        }
        await runPostStripeDepositFinalizePoll(bookingId, null);
        if (lastDepositFinalizationErrorRef.current) {
          setReviewPaymentPhase("finalizing_timeout");
        }
      } finally {
        setDepositProcessing(false);
      }
    })();
  }, [pathname, searchParams]);

  async function bootstrapReviewDepositPayment(
    bookingId: string,
    holdId?: string | null,
  ) {
    const hold = holdId?.trim() || "";
    if (!bookingId.trim() || depositPrepareInFlightRef.current) return;
    depositPrepareInFlightRef.current = true;
    setDepositLock();
    setRequiresDepositResolution(true);
    setReviewDepositGateMessage(BOOKING_REVIEW_DEPOSIT_SCHEDULE_GATE_MESSAGE);
    setReviewPaymentPhase("preparing");
    setDepositError(null);
    try {
      const prep = await postPublicBookingDepositPrepare({
        bookingId,
        ...(hold ? { holdId: hold } : {}),
      });
      await followDepositPrepareNextAction(prep);
    } catch (e) {
      setReviewPaymentPhase("failed");
      setDepositError(
        e instanceof Error
          ? e.message
          : "We couldn’t start card payment. Please try again.",
      );
    } finally {
      depositPrepareInFlightRef.current = false;
      setDepositBackendProcessing(false);
    }
  }

  async function runPostStripeDepositFinalizePoll(
    bookingIdOverride?: string | null,
    holdIdOverride?: string | null,
  ) {
    if (!isDepositInFlightRef.current) {
      console.warn("BLOCKED: finalize poll outside deposit context");
      return;
    }
    if (depositFinalizeInFlightRef.current) return;
    const bookingId =
      bookingIdOverride?.trim() ||
      stateRefForBookingUrl.current.schedulingBookingId.trim();
    const holdId = holdIdOverride?.trim() || pendingConfirmHoldIdRef.current?.trim() || "";
    if (!bookingId) return;
    depositFinalizeInFlightRef.current = true;
    setDepositProcessing(true);
    setDepositError(null);
    setReviewPaymentPhase("finalizing");
    setDepositBackendProcessing(false);
    try {
      if (holdId) {
        const finalized = await finalizeHeldBookingAfterDepositPaid(bookingId, holdId);
        if (!finalized && !lastDepositFinalizationErrorRef.current) {
          setReviewPaymentPhase("finalizing_timeout");
          setDepositError(
            "Your deposit was received, but booking confirmation did not finish automatically. Please retry or contact support.",
          );
        }
        return;
      }
      const prep = await postPublicBookingDepositPrepare({ bookingId });
      await followDepositPrepareNextAction(prep, { postStripeResume: true });
    } finally {
      depositFinalizeInFlightRef.current = false;
      setDepositProcessing(false);
      setDepositBackendProcessing(false);
    }
  }

  async function checkDepositPaymentStatusAgain() {
    const bookingId = stateRefForBookingUrl.current.schedulingBookingId.trim();
    const holdId = pendingConfirmHoldIdRef.current?.trim() || "";
    if (!bookingId || depositPrepareInFlightRef.current) return;
    depositPrepareInFlightRef.current = true;
    setDepositProcessing(true);
    setReviewPaymentPhase("preparing");
    setDepositError(null);
    try {
      const prep = await postPublicBookingDepositPrepare({
        bookingId,
        ...(holdId ? { holdId } : {}),
      });
      await followDepositPrepareNextAction(prep);
    } catch (e) {
      setReviewPaymentPhase("finalizing_timeout");
      setDepositError(
        e instanceof Error
          ? e.message
          : "Could not check payment status. Try again.",
      );
    } finally {
      depositPrepareInFlightRef.current = false;
      setDepositBackendProcessing(false);
      setDepositProcessing(false);
    }
  }

  async function confirmBookingDirection() {
    if (submitInFlightRef.current) return;
    if (
      state.schedulingBookingId.trim() &&
      state.step === "review" &&
      (depositRequired ||
        reviewPaymentPhase === "preparing" ||
        reviewPaymentPhase === "ready_for_payment" ||
        reviewPaymentPhase === "confirming" ||
        reviewPaymentPhase === "finalizing")
    ) {
      return;
    }
    submitInFlightRef.current = true;
    setSubmitRecoverableFailure(false);
    setAttemptedConfirm(true);
    try {
      if (!isBookingReady || !isContactReady) return;
      if (!isEstimateValidForReview()) return;

      setIsSubmitting(true);
      if (!normalizedIntakeCore) return;

      emitBookingFunnelEvent("review_continue_clicked", {
        serviceId: state.serviceId,
      });

      const result = await submitBookingDirectionIntake({
        ...normalizedIntakeCore,
        customerName: state.customerName.trim(),
        customerEmail: state.customerEmail.trim(),
      });

      writeBookingConfirmationSessionSnapshot({
        intakeId: result.intakeId,
        bookingId: result.bookingId ?? "",
        priceCents: result.estimate?.priceCents ?? null,
        durationMinutes: result.estimate?.durationMinutes ?? null,
        confidence: result.estimate?.confidence ?? null,
        bookingErrorCode: result.bookingError?.code ?? "",
        ...teamPlanningSnapshotForSession(),
      });

      if (
        result.bookingCreated &&
        result.bookingId &&
        result.estimate
      ) {
        postPublicBookingFunnelMilestone({
          milestone: "REVIEW_SUBMITTED",
          bookingId: result.bookingId,
          intakeId: result.intakeId,
          payload: { surface: "review_submit" },
        });
        writeBookingConfirmationSessionSnapshot({
          intakeId: result.intakeId,
          bookingId: result.bookingId ?? "",
          priceCents: result.estimate?.priceCents ?? null,
          durationMinutes: result.estimate?.durationMinutes ?? null,
          confidence: result.estimate?.confidence ?? null,
          bookingErrorCode: result.bookingError?.code ?? "",
          ...teamPlanningSnapshotForSession(),
        });

        setScheduleSurfaceError(null);
        setState((prev) =>
          clampBookingStepToStructuralMax({
            ...prev,
            schedulingBookingId: result.bookingId ?? "",
            schedulingIntakeId: result.intakeId,
            selectedTeamId: "",
            selectedTeamDisplayName: "",
            availableTeams: [],
            availableWindows: [],
            selectedSlotId: "",
            selectedSlotStart: "",
            selectedSlotEnd: "",
            publicHoldId: "",
            schedulingConfirmed: false,
            step: "review",
          }),
        );
        void bootstrapReviewDepositPayment(result.bookingId);
        return;
      }

      const q = new URLSearchParams();
      q.set("intakeId", result.intakeId);
      if (result.bookingError?.code) {
        q.set("bookingError", result.bookingError.code);
      }
      appendPublicIntakeContextToSearchParams(q, state);
      router.push(`/book/confirmation?${q.toString()}`);
    } catch (err) {
      console.error("booking direction intake failed", err);
      setSubmitRecoverableFailure(true);
    } finally {
      setIsSubmitting(false);
      submitInFlightRef.current = false;
    }
  }

  async function completeReviewDepositAfterPayment(
    paymentIntentId?: string | null,
  ) {
    const bookingId = stateRefForBookingUrl.current.schedulingBookingId.trim();
    if (!bookingId) return;
    if (paymentIntentId?.trim()) {
      writeDurablePublicBookingPaymentSession({
        bookingId,
        holdId: pendingConfirmHoldIdRef.current?.trim() || null,
        paymentIntentId: paymentIntentId.trim(),
      });
    }
    setReviewPaymentPhase("confirming");
    await runPostStripeDepositFinalizePoll();
  }

  function handlePublicBookingPaymentRequiredFromConfirm(args: {
    error: PublicBookingPaymentRequiredError;
    bookingId: string;
    holdId: string;
    expiresAt?: string | null;
  }) {
    const bookingId =
      args.error.details.bookingId?.trim() || args.bookingId.trim();
    const holdId = args.error.details.holdId?.trim() || args.holdId.trim();
    if (!bookingId || !holdId) return;

    const clientSecret = args.error.details.clientSecret?.trim() || "";
    const paymentIntentId = args.error.details.paymentIntentId?.trim() || "";

    setDepositLock();
    writeDurablePublicBookingPaymentSession({
      bookingId,
      holdId,
      paymentIntentId,
      expiresAt: args.expiresAt ?? null,
    });
    setPendingConfirmHoldId(holdId);
    setScheduleCommitError(null);
    setScheduleCommitPhase("none");
    clearDepositPaymentCredentialsOnly();
    setRequiresDepositResolution(true);
    setReviewDepositGateMessage(BOOKING_REVIEW_DEPOSIT_SCHEDULE_GATE_MESSAGE);
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        schedulingBookingId: bookingId,
        step: "review",
      }),
    );

    if (clientSecret && paymentIntentId) {
      setDepositRequired(true);
      setDepositClientSecret(clientSecret);
      setDepositPaymentIntentId(paymentIntentId);
      setDepositAmountCents(
        Number.isFinite(args.error.details.amountCents)
          ? args.error.details.amountCents
          : 10_000,
      );
      setReviewPaymentPhase("ready_for_payment");
      return;
    }

    setReviewPaymentPhase("idle");
    void bootstrapReviewDepositPayment(bookingId, holdId);
  }

  async function recoverExpiredSelectedSlotAndConfirm(): Promise<boolean> {
    const snapshot = stateRefForBookingUrl.current;
    const bookingId = snapshot.schedulingBookingId.trim();
    const teamId = snapshot.selectedTeamId.trim();
    const selectedStart = snapshot.selectedSlotStart.trim();
    const selectedEnd = snapshot.selectedSlotEnd.trim();
    if (!bookingId || !teamId || !selectedStart || !selectedEnd) {
      setScheduleCommitError(BOOKING_SCHEDULE_HOLD_REFRESH_FAILED);
      setScheduleCommitPhase("hold_failed");
      return true;
    }

    const refreshed = await refreshSelectedSlotForExpiredHoldRecovery(snapshot);
    if (refreshed.status === "unavailable") {
      setPendingConfirmHoldId(null);
      setWindowsRefreshKey((k) => k + 1);
      return true;
    }
    if (refreshed.status === "failed") {
      setScheduleCommitError(BOOKING_SCHEDULE_HOLD_REFRESH_FAILED);
      setScheduleCommitPhase("hold_failed");
      setWindowsRefreshKey((k) => k + 1);
      return true;
    }

    setScheduleCommitError(BOOKING_SCHEDULE_HOLD_REFRESHED);
    setScheduleCommitPhase("none");
    let hold: Awaited<ReturnType<typeof postPublicBookingHold>>;
    try {
      hold = await postPublicBookingHold({
        bookingId,
        slotId: refreshed.slot.slotId.trim(),
        foId: teamId,
        startAt: refreshed.slot.startAt,
        endAt: refreshed.slot.endAt,
      });
    } catch {
      setPendingConfirmHoldId(null);
      setScheduleCommitError(BOOKING_SCHEDULE_HOLD_REFRESH_FAILED);
      setScheduleCommitPhase("hold_failed");
      setWindowsRefreshKey((k) => k + 1);
      return true;
    }

    postPublicBookingFunnelMilestone({
      milestone: "HOLD_CREATED",
      bookingId,
      ...(snapshot.schedulingIntakeId.trim()
        ? { intakeId: snapshot.schedulingIntakeId.trim() }
        : {}),
      payload: {
        holdId: hold.holdId,
        teamId,
        slotId: refreshed.slot.slotId.trim(),
        phase: "expired_hold_recovery",
      },
    });

    try {
      await postPublicBookingConfirm(
        {
          bookingId,
          holdId: hold.holdId,
          requestedEnhancementIds,
        },
        scheduleConfirmIdempotencyKeyRef.current,
      );
    } catch (confirmErr) {
      if (
        confirmErr instanceof PublicBookingPaymentRequiredError &&
        confirmErr.code === "PAYMENT_REQUIRED"
      ) {
        handlePublicBookingPaymentRequiredFromConfirm({
          error: confirmErr,
          bookingId,
          holdId: hold.holdId,
          expiresAt: hold.expiresAt,
        });
        return true;
      }
      setPendingConfirmHoldId(hold.holdId);
      setScheduleCommitError(BOOKING_SCHEDULE_CONFIRM_FAILED);
      setScheduleCommitPhase("confirm_failed");
      return true;
    }

    emitBookingFunnelEvent("booking_confirmed", {
      bookingId,
      teamId,
      holdId: hold.holdId,
      phase: "expired_hold_recovery",
    });
    postPublicBookingFunnelMilestone({
      milestone: "BOOKING_CONFIRMED",
      bookingId,
      ...(snapshot.schedulingIntakeId.trim()
        ? { intakeId: snapshot.schedulingIntakeId.trim() }
        : {}),
      payload: {
        holdId: hold.holdId,
        teamId,
        phase: "expired_hold_recovery",
      },
    });
    setState((prev) => ({
      ...prev,
      selectedSlotId: refreshed.slot.slotId.trim(),
      selectedSlotStart: refreshed.slot.startAt,
      selectedSlotEnd: refreshed.slot.endAt,
      schedulingConfirmed: true,
      publicHoldId: hold.holdId,
    }));
    const q = new URLSearchParams();
    q.set("intakeId", snapshot.schedulingIntakeId.trim());
    q.set("bookingId", bookingId);
    appendPublicIntakeContextToSearchParams(q, snapshot);
    router.push(`/book/confirmation?${q.toString()}`);
    return true;
  }

  async function confirmScheduleHoldAndFinish() {
    if (isDepositInFlightRef.current) {
      console.warn("BLOCKED: confirmScheduleHoldAndFinish during deposit");
      return;
    }
    if (
      !state.schedulingBookingId.trim() ||
      !state.selectedTeamId.trim() ||
      !state.selectedSlotId.trim() ||
      !state.selectedSlotStart.trim() ||
      !state.selectedSlotEnd.trim()
    ) {
      return;
    }
    const selectedSlotIsCurrent = state.availableWindows.some(
      (w) => w.slotId?.trim() === state.selectedSlotId.trim(),
    );
    if (!selectedSlotIsCurrent) {
      invalidateSelectedSlot();
      setWindowsRefreshKey((k) => k + 1);
      return;
    }
    scheduleConfirmIdempotencyKeyRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `bk-confirm-${Date.now()}`;
    clearDepositUi();
    emitBookingFunnelEvent("confirm_clicked", {
      bookingId: state.schedulingBookingId,
      teamId: state.selectedTeamId,
      startAt: state.selectedSlotStart,
      endAt: state.selectedSlotEnd,
    });
    setConfirmScheduleLoading(true);
    setScheduleCommitError(null);
    setScheduleCommitPhase("none");
    setPendingConfirmHoldId(null);
    try {
      const hold = await postPublicBookingHold({
        bookingId: state.schedulingBookingId,
        slotId: state.selectedSlotId.trim() || undefined,
        foId: state.selectedTeamId,
        startAt: state.selectedSlotStart,
        endAt: state.selectedSlotEnd,
      });
      postPublicBookingFunnelMilestone({
        milestone: "HOLD_CREATED",
        bookingId: state.schedulingBookingId,
        ...(state.schedulingIntakeId.trim()
          ? { intakeId: state.schedulingIntakeId.trim() }
          : {}),
        payload: {
          holdId: hold.holdId,
          teamId: state.selectedTeamId,
          slotId: state.selectedSlotId.trim(),
        },
      });
      try {
        await postPublicBookingConfirm(
          {
            bookingId: state.schedulingBookingId,
            holdId: hold.holdId,
            requestedEnhancementIds,
          },
          scheduleConfirmIdempotencyKeyRef.current,
        );
      } catch (confirmErr) {
        console.error("public booking confirm failed", confirmErr);
        emitBookingFunnelEvent("confirm_failed", {
          bookingId: state.schedulingBookingId,
          teamId: state.selectedTeamId,
          holdId: hold.holdId,
        });
        postPublicBookingFunnelMilestone({
          milestone: "CONFIRM_FAILED",
          bookingId: state.schedulingBookingId,
          ...(state.schedulingIntakeId.trim()
            ? { intakeId: state.schedulingIntakeId.trim() }
            : {}),
          payload: {
            holdId: hold.holdId,
            teamId: state.selectedTeamId,
            phase:
              confirmErr instanceof PublicBookingPaymentRequiredError
                ? "payment_required"
                : "confirm_hold",
            reasonCode:
              confirmErr instanceof PublicBookingPaymentRequiredError
                ? confirmErr.code
                : undefined,
          },
        });
        if (isExpiredSlotOrHoldError(confirmErr)) {
          await recoverExpiredSelectedSlotAndConfirm();
          return;
        }
        if (
          confirmErr instanceof PublicBookingPaymentRequiredError &&
          confirmErr.code === "PAYMENT_REQUIRED"
        ) {
          handlePublicBookingPaymentRequiredFromConfirm({
            error: confirmErr,
            bookingId: state.schedulingBookingId,
            holdId: hold.holdId,
            expiresAt: hold.expiresAt,
          });
          return;
        }
        setScheduleCommitError(BOOKING_SCHEDULE_CONFIRM_FAILED);
        setScheduleCommitPhase("confirm_failed");
        setPendingConfirmHoldId(hold.holdId);
        return;
      }
      emitBookingFunnelEvent("booking_confirmed", {
        bookingId: state.schedulingBookingId,
        teamId: state.selectedTeamId,
        holdId: hold.holdId,
      });
      postPublicBookingFunnelMilestone({
        milestone: "BOOKING_CONFIRMED",
        bookingId: state.schedulingBookingId,
        ...(state.schedulingIntakeId.trim()
          ? { intakeId: state.schedulingIntakeId.trim() }
          : {}),
        payload: {
          holdId: hold.holdId,
          teamId: state.selectedTeamId,
          phase: "schedule_confirm",
        },
      });
      setState((prev) => ({
        ...prev,
        schedulingConfirmed: true,
        publicHoldId: hold.holdId,
      }));
      const q = new URLSearchParams();
      q.set("intakeId", state.schedulingIntakeId.trim());
      q.set("bookingId", state.schedulingBookingId.trim());
      appendPublicIntakeContextToSearchParams(q, state);
      router.push(`/book/confirmation?${q.toString()}`);
    } catch (holdErr) {
      console.error("public booking hold failed", holdErr);
      emitBookingFunnelEvent("hold_failed", {
        bookingId: state.schedulingBookingId,
        teamId: state.selectedTeamId,
        startAt: state.selectedSlotStart,
        endAt: state.selectedSlotEnd,
      });
      postPublicBookingFunnelMilestone({
        milestone: "HOLD_FAILED",
        bookingId: state.schedulingBookingId,
        ...(state.schedulingIntakeId.trim()
          ? { intakeId: state.schedulingIntakeId.trim() }
          : {}),
        payload: {
          teamId: state.selectedTeamId,
          slotId: state.selectedSlotId.trim(),
          phase: isStaleSlotApiError(holdErr) ? "stale_slot" : "hold",
          reasonCode:
            holdErr instanceof PublicBookingApiError ? holdErr.code : undefined,
        },
      });
      if (isExpiredSlotOrHoldError(holdErr)) {
        await recoverExpiredSelectedSlotAndConfirm();
        return;
      } else if (isStaleSlotApiError(holdErr)) {
        invalidateSelectedSlot();
      } else {
        setScheduleCommitError(BOOKING_SCHEDULE_HOLD_FAILED);
        setScheduleCommitPhase("hold_failed");
      }
      setWindowsRefreshKey((k) => k + 1);
    } finally {
      setConfirmScheduleLoading(false);
    }
  }

  async function retryScheduleConfirm() {
    if (isDepositInFlightRef.current) {
      console.warn("BLOCKED: retryScheduleConfirm during deposit");
      return;
    }
    if (!state.schedulingBookingId.trim() || !pendingConfirmHoldId?.trim()) return;
    if (!scheduleConfirmIdempotencyKeyRef.current) {
      scheduleConfirmIdempotencyKeyRef.current =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `bk-confirm-${Date.now()}`;
    }
    emitBookingFunnelEvent("confirm_clicked", {
      bookingId: state.schedulingBookingId,
      teamId: state.selectedTeamId,
      retry: true,
      holdId: pendingConfirmHoldId.trim(),
    });
    setConfirmScheduleLoading(true);
    try {
      await postPublicBookingConfirm(
        {
          bookingId: state.schedulingBookingId,
          holdId: pendingConfirmHoldId.trim(),
          requestedEnhancementIds,
        },
        scheduleConfirmIdempotencyKeyRef.current,
      );
      emitBookingFunnelEvent("booking_confirmed", {
        bookingId: state.schedulingBookingId,
        teamId: state.selectedTeamId,
        holdId: pendingConfirmHoldId.trim(),
        retry: true,
      });
      postPublicBookingFunnelMilestone({
        milestone: "BOOKING_CONFIRMED",
        bookingId: state.schedulingBookingId,
        ...(state.schedulingIntakeId.trim()
          ? { intakeId: state.schedulingIntakeId.trim() }
          : {}),
        payload: {
          holdId: pendingConfirmHoldId.trim(),
          teamId: state.selectedTeamId,
          phase: "schedule_confirm_retry",
        },
      });
      setScheduleCommitError(null);
      setScheduleCommitPhase("none");
      const holdId = pendingConfirmHoldId.trim();
      setPendingConfirmHoldId(null);
      setState((prev) => ({
        ...prev,
        schedulingConfirmed: true,
        publicHoldId: holdId,
      }));
      const q = new URLSearchParams();
      q.set("intakeId", state.schedulingIntakeId.trim());
      q.set("bookingId", state.schedulingBookingId.trim());
      appendPublicIntakeContextToSearchParams(q, state);
      router.push(`/book/confirmation?${q.toString()}`);
    } catch (err) {
      console.error("public booking confirm retry failed", err);
      emitBookingFunnelEvent("confirm_failed", {
        bookingId: state.schedulingBookingId,
        retry: true,
      });
      postPublicBookingFunnelMilestone({
        milestone: "CONFIRM_FAILED",
        bookingId: state.schedulingBookingId,
        ...(state.schedulingIntakeId.trim()
          ? { intakeId: state.schedulingIntakeId.trim() }
          : {}),
        payload: {
          holdId: pendingConfirmHoldId.trim(),
          teamId: state.selectedTeamId,
          phase:
            err instanceof PublicBookingPaymentRequiredError
              ? "payment_required_retry"
              : "confirm_retry",
          reasonCode:
            err instanceof PublicBookingPaymentRequiredError ? err.code : undefined,
        },
      });
      if (isExpiredSlotOrHoldError(err)) {
        await recoverExpiredSelectedSlotAndConfirm();
        return;
      }
      if (
        err instanceof PublicBookingPaymentRequiredError &&
        err.code === "PAYMENT_REQUIRED"
      ) {
        handlePublicBookingPaymentRequiredFromConfirm({
          error: err,
          bookingId: state.schedulingBookingId,
          holdId: pendingConfirmHoldId.trim(),
        });
        return;
      }
      setScheduleCommitError(BOOKING_SCHEDULE_CONFIRM_FAILED);
      setScheduleCommitPhase("confirm_failed");
    } finally {
      setConfirmScheduleLoading(false);
    }
  }

  function chooseDifferentTimeAfterConfirmFail() {
    clearDepositUi();
    setPendingConfirmHoldId(null);
    setScheduleCommitError(null);
    setScheduleCommitPhase("none");
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        selectedSlotId: "",
        selectedSlotStart: "",
        selectedSlotEnd: "",
        publicHoldId: "",
        schedulingConfirmed: false,
      }),
    );
  }

  function exitScheduleToAdjustDetails() {
    clearDepositUi();
    setScheduleSurfaceError(null);
    setScheduleCommitError(null);
    setScheduleCommitPhase("none");
    setPendingConfirmHoldId(null);
    setTeamsEmptyState("none");
    setSlotsEmptyForTeam(false);
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        step: "home",
        schedulingBookingId: "",
        schedulingIntakeId: "",
        selectedTeamId: "",
        selectedTeamDisplayName: "",
        availableTeams: [],
        availableWindows: [],
        selectedSlotId: "",
        selectedSlotStart: "",
        selectedSlotEnd: "",
        publicHoldId: "",
        schedulingConfirmed: false,
      }),
    );
  }

  function continueManualFollowUpFromZeroTeams() {
    const q = new URLSearchParams();
    q.set("intakeId", state.schedulingIntakeId.trim());
    q.set("bookingId", state.schedulingBookingId.trim());
    appendPublicIntakeContextToSearchParams(q, state);
    router.push(`/book/confirmation?${q.toString()}`);
  }

  function goBack() {
    setAttemptedNext(false);

    if (state.step === "review") {
      setAttemptedConfirm(false);
      setSubmitRecoverableFailure(false);
      setIsSubmitting(false);
      submitInFlightRef.current = false;
      return goToStep("home");
    }
    if (state.step === "schedule") {
      if (!state.schedulingConfirmed && state.schedulingBookingId.trim()) {
        emitBookingFunnelEvent("booking_unfinished_after_review", {
          bookingId: state.schedulingBookingId,
        });
        emitBookingFunnelEvent("abandoned_after_review", {
          bookingId: state.schedulingBookingId,
        });
        postPublicBookingFunnelMilestone({
          milestone: "REVIEW_ABANDONED",
          bookingId: state.schedulingBookingId.trim(),
          ...(state.schedulingIntakeId.trim()
            ? { intakeId: state.schedulingIntakeId.trim() }
            : {}),
          payload: { surface: "schedule_go_back" },
        });
        if (state.selectedTeamId.trim()) {
          emitBookingFunnelEvent("abandoned_after_team_select", {
            bookingId: state.schedulingBookingId,
            teamId: state.selectedTeamId,
          });
        }
      }
      clearDepositUi();
      setScheduleSurfaceError(null);
      setScheduleCommitError(null);
      setScheduleCommitPhase("none");
      setPendingConfirmHoldId(null);
      setState((prev) =>
        clampBookingStepToStructuralMax({
          ...prev,
          step: "review",
          selectedTeamId: "",
          selectedTeamDisplayName: "",
          availableTeams: [],
          availableWindows: [],
          selectedSlotId: "",
          selectedSlotStart: "",
          selectedSlotEnd: "",
          publicHoldId: "",
          schedulingConfirmed: false,
        }),
      );
      return;
    }
    if (state.step === "location") return goToStep("home");
    if (state.step === "home") return goToStep("service");
    return;
  }

  function patchState(patch: Partial<BookingFlowState>) {
    setAttemptedNext(false);
    setAttemptedConfirm(false);
    setSubmitRecoverableFailure(false);
    setState((prev) => {
      const nextIntent = patch.intent !== undefined ? patch.intent : prev.intent;
      return clampBookingStepToStructuralMax({
        ...prev,
        ...patch,
        selectedUpsellIds: normalizeBookingUpsellIds(
          patch.selectedUpsellIds ?? prev.selectedUpsellIds,
          nextIntent,
        ),
      });
    });
  }

  function patchHomeStepState(patch: Partial<BookingFlowState>) {
    setAttemptedNext(false);
    setAttemptedConfirm(false);
    setSubmitRecoverableFailure(false);
    setIsSubmitting(false);
    submitInFlightRef.current = false;
    setState((prev) => {
      const { frequency, preferredTime, ...homeOnly } = patch;
      let next = prev;
      if (frequency !== undefined || preferredTime !== undefined) {
        next = applyScheduleFieldChangeToBookingFlowState(next, {
          ...(frequency !== undefined ? { frequency } : {}),
          ...(preferredTime !== undefined ? { preferredTime } : {}),
        });
      }
      const homeKeys = Object.keys(homeOnly);
      if (homeKeys.length > 0) {
        next = applyHomeDetailsFieldChangeToBookingFlowState(
          next,
          homeOnly as Parameters<
            typeof applyHomeDetailsFieldChangeToBookingFlowState
          >[1],
        );
        next = {
          ...next,
          ...(patch.serviceLocationStreet !== undefined
            ? { serviceLocationStreet: patch.serviceLocationStreet }
            : {}),
          ...(patch.serviceLocationUnit !== undefined
            ? { serviceLocationUnit: patch.serviceLocationUnit }
            : {}),
          ...(patch.serviceLocationCity !== undefined
            ? { serviceLocationCity: patch.serviceLocationCity }
            : {}),
          ...(patch.serviceLocationState !== undefined
            ? { serviceLocationState: patch.serviceLocationState }
            : {}),
          ...(patch.serviceLocationZip !== undefined
            ? { serviceLocationZip: patch.serviceLocationZip }
            : {}),
          ...(patch.serviceLocationAddressLine !== undefined
            ? { serviceLocationAddressLine: patch.serviceLocationAddressLine }
            : {}),
          ...(patch.customerName !== undefined
            ? { customerName: patch.customerName }
            : {}),
          ...(patch.customerEmail !== undefined
            ? { customerEmail: patch.customerEmail }
            : {}),
        };
      }
      return clampBookingStepToStructuralMax(next);
    });
  }

  function handleSelectTeam(team: BookingAvailableTeamOption) {
    clearDepositUi();
    setScheduleSurfaceError(null);
    setScheduleCommitError(null);
    setScheduleCommitPhase("none");
    setPendingConfirmHoldId(null);
    setScheduleTeamDurationContext(null);
    const teams = state.availableTeams;
    const idx = Math.max(
      0,
      teams.findIndex((t) => t.id === team.id),
    );
    emitBookingFunnelEvent("team_selected", {
      teamId: team.id,
      index: idx,
      pickedSecondOption: idx === 1,
      recommendedTeamId:
        teams.find((t) => t.isRecommended)?.id ?? teams[0]?.id ?? null,
      bookingId: state.schedulingBookingId,
    });
    postPublicBookingFunnelMilestone({
      milestone: "TEAM_SELECTED",
      bookingId: state.schedulingBookingId,
      ...(state.schedulingIntakeId.trim()
        ? { intakeId: state.schedulingIntakeId.trim() }
        : {}),
      payload: { teamId: team.id },
    });
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        selectedTeamId: team.id,
        selectedTeamDisplayName: team.displayName,
        selectedSlotId: "",
        selectedSlotStart: "",
        selectedSlotEnd: "",
        availableWindows: [],
        schedulingConfirmed: false,
        publicHoldId: "",
      }),
    );
  }

  function handleSelectSlot(slotId: string | undefined, startAt: string, endAt: string) {
    clearDepositUi();
    setScheduleSurfaceError(null);
    setScheduleCommitError(null);
    setScheduleCommitPhase("none");
    setPendingConfirmHoldId(null);
    emitBookingFunnelEvent("slot_selected", {
      startAt,
      endAt,
      teamId: state.selectedTeamId,
      bookingId: state.schedulingBookingId,
    });
    postPublicBookingFunnelMilestone({
      milestone: "SLOT_SELECTED",
      bookingId: state.schedulingBookingId,
      ...(state.schedulingIntakeId.trim()
        ? { intakeId: state.schedulingIntakeId.trim() }
        : {}),
      payload: {
        teamId: state.selectedTeamId,
        slotId: slotId?.trim() || "",
      },
    });
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        selectedSlotId: slotId?.trim() ?? "",
        selectedSlotStart: startAt,
        selectedSlotEnd: endAt,
        schedulingConfirmed: false,
        publicHoldId: "",
      }),
    );
  }

  function switchToAlternateTeam() {
    const teams = state.availableTeams;
    const other = teams.find((t) => t.id !== state.selectedTeamId.trim());
    if (other) handleSelectTeam(other);
  }

  function patchTeamPlanningDetails(
    patch: Partial<NonNullable<BookingFlowState["teamPlanningDetails"]>>,
  ) {
    setSubmitRecoverableFailure(false);
    setState((prev) => {
      const base: NonNullable<BookingFlowState["teamPlanningDetails"]> = {
        ...(prev.teamPlanningDetails ?? {}),
      };
      for (const [rawKey, rawVal] of Object.entries(patch)) {
        const key = rawKey as keyof NonNullable<
          BookingFlowState["teamPlanningDetails"]
        >;
        const s =
          typeof rawVal === "string"
            ? rawVal.slice(0, BOOKING_TEAM_PLANNING_FIELD_MAX_CHARS)
            : "";
        if (!s.trim()) {
          delete base[key];
        } else {
          base[key] = s;
        }
      }
      const teamPlanningDetails =
        Object.keys(base).length > 0 ? base : undefined;
      return clampBookingStepToStructuralMax({
        ...prev,
        teamPlanningDetails,
      });
    });
  }

  function patchContactState(
    patch: Partial<Pick<BookingFlowState, "customerName" | "customerEmail">>,
  ) {
    setAttemptedNext(false);
    setAttemptedConfirm(false);
    setSubmitRecoverableFailure(false);
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        ...(patch.customerName !== undefined
          ? { customerName: patch.customerName }
          : {}),
        ...(patch.customerEmail !== undefined
          ? { customerEmail: patch.customerEmail }
          : {}),
      }),
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <ServiceHeader />

      <main>
        <section className="mx-auto max-w-7xl px-6 py-6 md:px-8 md:py-9">
          <div className="overflow-hidden rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-5 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-7 lg:p-8">
            <div className="grid gap-7 xl:grid-cols-[minmax(0,0.98fr)_minmax(280px,360px)] xl:items-start">
              <div className="min-w-0 space-y-5 rounded-[28px] border border-[#E8DFD0]/80 bg-white/76 p-6 sm:p-8">
                <div>
                  <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                    {BOOKING_FLOW_HERO_EYEBROW}
                  </p>
                  <h1
                    className={
                      state.step === "service"
                        ? "mt-3 font-[var(--font-poppins)] text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.05rem]"
                        : "mt-3 font-[var(--font-poppins)] text-3xl font-semibold leading-tight tracking-[-0.045em] text-[#0F172A] sm:text-4xl"
                    }
                  >
                    {state.step === "service"
                      ? BOOKING_FLOW_HERO_HEADLINE
                      : state.step === "home"
                        ? "Share the details that prepare the visit."
                        : state.step === "review"
                          ? "Review the estimate before choosing a team."
                          : "Choose the team and arrival window."}
                  </h1>
                  <p className="mt-4 max-w-xl font-[var(--font-manrope)] text-base leading-relaxed text-[#475569] md:text-lg md:leading-relaxed">
                    {state.step === "service"
                      ? BOOKING_FLOW_HERO_BODY
                      : state.step === "home"
                        ? "Home facts, arrival context, and follow-up details stay together so the estimate has the right operational context."
                        : state.step === "review"
                          ? "Keep pricing, cadence, and visit structure in view before we save the request and show availability."
                          : "Select from available teams and times, then confirm the arrival details."}
                  </p>
                  {state.step === "service" ? (
                    <>
                      <ul className="mt-5 space-y-2 font-[var(--font-manrope)] text-sm font-medium text-[#334155] md:text-[15px]">
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9B27C]" aria-hidden />
                          {BOOKING_FLOW_HERO_BULLET_ACCURATE_PRICING}
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9B27C]" aria-hidden />
                          {BOOKING_FLOW_HERO_BULLET_CLEAR_EXPECTATIONS}
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9B27C]" aria-hidden />
                          {BOOKING_FLOW_HERO_BULLET_EASY_PROCESS}
                        </li>
                      </ul>
                      <div className="mt-5 space-y-2 font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B] md:text-[15px]">
                        <p>{BOOKING_FLOW_HERO_REALTIME_LINE}</p>
                        <p>{BOOKING_FLOW_HERO_CLEAR_NUMBERS_LINE}</p>
                        <p>{BOOKING_FLOW_HERO_NO_PRESSURE_LINE}</p>
                      </div>
                      <p className="mt-5 max-w-2xl border-l-2 border-[#0D9488]/35 pl-4 font-[var(--font-manrope)] text-base leading-relaxed text-[#334155] md:text-lg">
                        {BOOKING_FLOW_HERO_ACCOUNTABILITY}
                      </p>
                      <p className="mt-3 max-w-2xl font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B] md:text-[15px]">
                        {BOOKING_FLOW_HERO_OPERATIONAL_TRANSPARENCY}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="min-w-0 space-y-4 xl:sticky xl:top-24">
                <div className="rounded-[24px] border border-[#C9B27C]/18 bg-white/92 p-5 shadow-[0_22px_62px_-46px_rgba(15,23,42,0.46)]">
                  <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                    Guidance
                  </p>
                  <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                    {state.step === "service"
                      ? "Choose the path that best matches the visit."
                      : state.step === "home"
                        ? "Add home, arrival, and contact details once."
                        : state.step === "review"
                          ? "Review estimate, cadence, and visit pacing together."
                          : "Choose team and arrival timing."}
                  </p>
                </div>
                <BookingFlowProgress
                  currentStep={currentStepOrder}
                  steps={bookingSteps.map((step) => ({
                    id: step.order,
                    label: step.label,
                  }))}
                />
                {state.step === "service" ? (
                  <TrustMetricStrip items={BOOKING_TRUST_RIBBON_ITEMS} />
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:py-20">
          <div
            className={
              state.step === "review"
                ? "flex min-w-0 flex-col-reverse gap-6 xl:grid xl:grid-cols-[1.15fr_0.85fr] xl:gap-8"
                : "grid gap-8 xl:grid-cols-[1.15fr_0.85fr]"
            }
          >
            <div className="min-w-0 space-y-8 pb-28 md:pb-0">
              {state.step === "review" || state.step === "schedule" ? (
                <BookingServiceHandoffCard
                  serviceId={state.serviceId}
                  bookingPublicPath={state.bookingPublicPath}
                />
              ) : null}

              {state.step === "service" ? (
                <BookingStepService
                  bookingPublicPath={state.bookingPublicPath}
                  serviceId={state.serviceId}
                  onSelectPublicService={(selection: PublicBookingServiceCardSelection) => {
                    setAttemptedNext(false);
                    setAttemptedConfirm(false);
                    setSubmitRecoverableFailure(false);
                    setIsSubmitting(false);
                    submitInFlightRef.current = false;
                    if (selection.kind === "recurring_auth_gate") {
                      setState((prev) =>
                        clampBookingStepToStructuralMax({
                          ...applyServiceChangeToBookingFlowState(
                            prev,
                            PUBLIC_BOOK_INTERNAL_FIRST_TIME,
                          ),
                          bookingPublicPath: "recurring_auth_gate",
                          step: "service",
                        }),
                      );
                      return;
                    }
                    if (selection.kind === "move_transition") {
                      setState((prev) =>
                        clampBookingStepToStructuralMax(
                          applyServiceChangeToBookingFlowState(
                            prev,
                            PUBLIC_BOOK_INTERNAL_MOVE,
                          ),
                        ),
                      );
                      return;
                    }
                    if (selection.kind === "first_time_with_recurring") {
                      setState((prev) =>
                        clampBookingStepToStructuralMax({
                          ...applyServiceChangeToBookingFlowState(
                            prev,
                            PUBLIC_BOOK_INTERNAL_FIRST_TIME,
                          ),
                          bookingPublicPath: "first_time_with_recurring",
                        }),
                      );
                      return;
                    }
                    setState((prev) =>
                      clampBookingStepToStructuralMax(
                        applyServiceChangeToBookingFlowState(
                          prev,
                          PUBLIC_BOOK_INTERNAL_FIRST_TIME,
                        ),
                      ),
                    );
                  }}
                />
              ) : null}

              {state.step === "home" ? (
                <BookingStepHomeDetails
                  state={state}
                  onChange={(patch) => patchHomeStepState(patch)}
                  selectedServiceTitle={getPublicBookingMarketingTitle(
                    state.bookingPublicPath,
                  )}
                  deepCleanPlanLabel={null}
                  showFieldErrors={attemptedNext}
                />
              ) : null}

              {canRenderReview ? (
                <BookingStepReview
                  state={state}
                  condition={state.condition}
                  problemAreas={state.problemAreas}
                  surfaceComplexity={state.surfaceComplexity}
                  estimateDriverHeavyCondition={
                    wiredEstimateDriverFlags.heavyCondition
                  }
                  estimateDriverHeavyKitchenBath={
                    wiredEstimateDriverFlags.heavyKitchenOrBath
                  }
                  estimateDriverSegmentedAccessLayout={
                    wiredEstimateDriverFlags.segmentedAccessLayout
                  }
                  estimateDriverResetLevelIntent={
                    wiredEstimateDriverFlags.resetLevelIntent
                  }
                  estimateDriverSurfaceDetailTokens={
                    wiredEstimateDriverFlags.hasSurfaceDetailTokens
                  }
                  estimateDriverHasAddOns={estimateDriverHasAddOns}
                  estimateDriverDeepCleanFocus={estimateDriverDeepCleanFocus}
                  estimateDriverFurnishedTransition={
                    estimateDriverFurnishedTransition
                  }
                  estimateDriverTransitionAppliances={
                    estimateDriverTransitionAppliances
                  }
                  intakePlanningNoteLines={intakePlanningNoteLines}
                  previewConfidenceBand={previewConfidenceBand}
                  hasSubmitRecoverableFailure={submitRecoverableFailure}
                  estimatePreviewReady={estimatePreviewReady}
                  previewEstimate={previewEstimate}
                  previewDeepCleanCard={previewDeepCleanCard}
                  previewLoading={previewLoading}
                  previewError={previewError}
                  previewFetchCompleted={previewFetchCompleted}
                  previewErrorRef={errorRef}
                  showContactFieldErrors={
                    attemptedConfirm && isBookingReady && !isContactReady
                  }
                  onContactChange={patchContactState}
                  prepGuidanceItems={prepGuidanceItems}
                  recommendedAttentionItems={recommendedAttentionItems}
                  onFirstTimePostEstimateVisitChoiceChange={(choice) => {
                    setSubmitRecoverableFailure(false);
                    setState((prev) =>
                      clampBookingStepToStructuralMax(
                        applyFirstTimePostEstimateVisitChoiceToBookingFlowState(
                          prev,
                          choice,
                        ),
                      ),
                    );
                  }}
                  onRecurringInterestChange={(recurringInterest) => {
                    setState((prev) =>
                      clampBookingStepToStructuralMax({
                        ...prev,
                        recurringInterest,
                      }),
                    );
                  }}
                  onTeamPlanningDetailsChange={patchTeamPlanningDetails}
                  onRecurringCadenceIntentChange={(recurringCadenceIntent) => {
                    setState((prev) => {
                      const bid = prev.schedulingBookingId.trim();
                      const iid = prev.schedulingIntakeId.trim();
                      if (bid || iid) {
                        postPublicBookingFunnelMilestone({
                          milestone: "RECURRING_CADENCE_SELECTED",
                          ...(bid ? { bookingId: bid } : {}),
                          ...(iid ? { intakeId: iid } : {}),
                          payload: { cadence: recurringCadenceIntent },
                        });
                      }
                      return clampBookingStepToStructuralMax({
                        ...prev,
                        recurringCadenceIntent,
                      });
                    });
                  }}
                  schedulePreview={schedulePreview}
                  depositResolutionActive={reviewAwaitingDepositPayment}
                  funnelBookingId={state.schedulingBookingId}
                  funnelIntakeId={state.schedulingIntakeId}
                />
              ) : null}

              {state.step === "review" &&
              Boolean(state.schedulingBookingId.trim()) &&
              (requiresDepositResolution ||
                depositRequired ||
                reviewPaymentPhase === "preparing" ||
                reviewPaymentPhase === "ready_for_payment" ||
                reviewPaymentPhase === "confirming" ||
                reviewPaymentPhase === "finalizing" ||
                reviewPaymentPhase === "finalizing_timeout" ||
                reviewPaymentPhase === "failed" ||
                reviewPaymentPhase === "satisfied") ? (
                <div className="rounded-[32px] border border-[#C9B27C]/16 bg-white p-5 shadow-sm ring-1 ring-[#C9B27C]/10 sm:p-8">
                  <div className="mb-6">
                    <BookingTrustRibbon />
                  </div>
                  <h2 className="font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">
                    {BOOKING_REVIEW_DEPOSIT_SECTION_TITLE}
                  </h2>
                  {reviewDepositGateMessage ? (
                    <p
                      data-testid="booking-review-deposit-gate-message"
                      className="mt-3 max-w-2xl font-[var(--font-manrope)] text-sm font-medium leading-6 text-[#0F172A]"
                    >
                      {reviewDepositGateMessage}
                    </p>
                  ) : null}
                  <div className="mt-5 max-w-2xl rounded-2xl border border-[#C9B27C]/14 bg-[#FFF9F3]/90 px-4 py-4 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                    <p>{BOOKING_REVIEW_DEPOSIT_EXPECTATION_SUMMARY}</p>
                  </div>
                  <p className="mt-4 max-w-2xl font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                    {BOOKING_REVIEW_DEPOSIT_NEXT_STEP_MESSAGE}
                  </p>
                  <p className="mt-2 max-w-2xl font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                    {BOOKING_REVIEW_DEPOSIT_APPLIED_MESSAGE}
                  </p>
                  {reviewPaymentPhase === "preparing" && !depositClientSecret ? (
                    <p className="mt-4 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                      {BOOKING_REVIEW_DEPOSIT_PREPARING_CHECKOUT}
                    </p>
                  ) : null}
                  {depositBackendProcessing ? (
                    <p className="mt-4 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                      {BOOKING_REVIEW_DEPOSIT_CONFIRMING_RECORDED}
                    </p>
                  ) : null}
                  {reviewPaymentPhase === "finalizing_timeout" ? (
                    <p
                      data-testid="booking-deposit-finalizing-timeout"
                      className="mt-4 font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]"
                    >
                      {BOOKING_REVIEW_DEPOSIT_FINALIZING_TIMEOUT}
                    </p>
                  ) : null}
                  {depositError ? (
                    <p className="mt-4 font-[var(--font-manrope)] text-sm text-[#B91C1C]">
                      {depositError}
                    </p>
                  ) : null}
                  {reviewPaymentPhase === "finalizing_timeout" ? (
                    <button
                      type="button"
                      data-testid="booking-deposit-check-status"
                      disabled={depositProcessing}
                      onClick={() => void checkDepositPaymentStatusAgain()}
                      className="mt-4 inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 bg-white px-5 py-3 font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A] transition hover:bg-[#FFF9F3] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {BOOKING_REVIEW_DEPOSIT_CHECK_STATUS_CTA}
                    </button>
                  ) : null}
                  {stripePromise && depositClientSecret ? (
                    <div className="mt-6 max-w-xl">
                      <p className="mb-3 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">
                        {BOOKING_REVIEW_DEPOSIT_PAYMENT_REASSURANCE}
                      </p>
                      <DepositPaymentElement
                        key={depositPaymentIntentId ?? "deposit-pi"}
                        stripePromise={stripePromise}
                        clientSecret={depositClientSecret}
                        amountCents={depositAmountCents ?? 10_000}
                        disabled={depositProcessing}
                        bookingId={state.schedulingBookingId}
                        holdId={pendingConfirmHoldId ?? undefined}
                        paymentIntentId={depositPaymentIntentId}
                        paymentSessionKey={
                          state.schedulingBookingId.trim()
                            ? currentPaymentSessionKey(
                                state.schedulingBookingId,
                                pendingConfirmHoldId,
                              )
                            : null
                        }
                        onSuccess={(paymentIntentId) =>
                          void completeReviewDepositAfterPayment(paymentIntentId)
                        }
                        onError={(msg) => {
                          setReviewPaymentPhase("failed");
                          setDepositError(msg);
                        }}
                        onSubmitInitiated={() => {
                          const s = stateRefForBookingUrl.current;
                          const bid = s.schedulingBookingId.trim();
                          const iid = s.schedulingIntakeId.trim();
                          const hold =
                            pendingConfirmHoldIdRef.current?.trim() || "";
                          if (!bid) return;
                          const sk = currentPaymentSessionKey(
                            bid,
                            hold || null,
                          );
                          postPublicBookingFunnelMilestone({
                            milestone: "DEPOSIT_SUBMIT_INITIATED",
                            bookingId: bid,
                            ...(iid ? { intakeId: iid } : {}),
                            payload: { paymentSessionKey: sk },
                          });
                        }}
                      />
                    </div>
                  ) : reviewPaymentPhase === "ready_for_payment" ||
                    reviewPaymentPhase === "confirming" ||
                    reviewPaymentPhase === "failed" ? (
                    <p className="mt-6 font-[var(--font-manrope)] text-sm text-[#B91C1C]">
                      {depositClientSecret
                        ? BOOKING_REVIEW_PAYMENT_UNAVAILABLE_ENV
                        : BOOKING_REVIEW_PAYMENT_COULD_NOT_START}
                    </p>
                  ) : null}
                </div>
              ) : state.step === "schedule" ? (
                <BookingStepSchedule
                  state={state}
                  serviceId={state.serviceId}
                  teamsLoading={teamsLoading}
                  windowsLoading={windowsLoading}
                  confirmLoading={confirmScheduleLoading}
                  surfaceError={scheduleSurfaceError}
                  teamsEmptyState={teamsEmptyState}
                  teamsLoadSlowHint={teamsLoadSlowHint}
                  windowsLoadSlowHint={windowsLoadSlowHint}
                  slotsEmptyForSelectedTeam={slotsEmptyForTeam}
                  scheduleCommitError={scheduleCommitError}
                  scheduleCommitPhase={scheduleCommitPhase}
                  hasAlternateTeamToSwitchTo={
                    state.availableTeams.slice(0, 2).length === 2 &&
                    Boolean(state.selectedTeamId.trim()) &&
                    slotsEmptyForTeam
                  }
                  onSelectTeam={handleSelectTeam}
                  onSelectSlot={handleSelectSlot}
                  onConfirmArrival={() => void confirmScheduleHoldAndFinish()}
                  onAdjustScheduleDetails={() => exitScheduleToAdjustDetails()}
                  onContinueManualFollowUp={() => continueManualFollowUpFromZeroTeams()}
                  onBackToReviewFromSchedule={() => goBack()}
                  onSwitchToAlternateTeam={() => switchToAlternateTeam()}
                  onRetryConfirmBooking={() => void retryScheduleConfirm()}
                  onChooseDifferentTimeAfterConfirmFail={() =>
                    chooseDifferentTimeAfterConfirmFail()
                  }
                  schedulePreview={schedulePreview}
                  laborEffortMinutes={scheduleLaborEffortMinutes}
                  scheduleTeamDurationContext={scheduleTeamDurationContext}
                />
              ) : null}

              <div className="fixed bottom-0 left-0 right-0 z-40 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto">
                <div className="border-t border-[#C9B27C]/14 bg-[#FFF9F3]/96 px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(15,23,42,0.07)] backdrop-blur-md md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none md:backdrop-blur-none">
                  <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:flex-wrap md:max-w-none">
                {state.step !== "service" ? (
                  <button
                    type="button"
                    disabled={
                      (isSubmitting && state.step !== "review") ||
                      confirmScheduleLoading ||
                      (state.step === "review" && reviewAwaitingDepositPayment)
                    }
                    onClick={goBack}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-[#C9B27C]/25 px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    Back
                  </button>
                ) : (
                  <Link
                    href={getPublicBookingOriginServiceHref(state)}
                    aria-disabled={isSubmitting}
                    onClick={(e) => {
                      if (isSubmitting) e.preventDefault();
                    }}
                    className={`inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-[#C9B27C]/25 px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-white sm:flex-none ${
                      isSubmitting ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    Back to Service
                  </Link>
                )}

                {state.step !== "review" && state.step !== "schedule" ? (
                  <button
                    type="button"
                    onClick={goNext}
                    aria-invalid={Boolean(attemptedNext && stepError)}
                    aria-describedby={
                      attemptedNext && stepError
                        ? "booking-step-continue-error"
                        : undefined
                    }
                    className={`inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white transition sm:flex-none ${
                      canContinue
                        ? "bg-[#0D9488] shadow-[0_14px_40px_rgba(13,148,136,0.22)] hover:-translate-y-0.5 hover:bg-[#0b7f76]"
                        : "bg-[#94A3B8] shadow-none"
                    }`}
                  >
                    Continue
                  </button>
                ) : canRenderReview && !reviewAwaitingDepositPayment ? (
                  <button
                    type="button"
                    data-testid="booking-direction-send"
                    disabled={disableNext}
                    onClick={() => void confirmBookingDirection()}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-[#0D9488] px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76] disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
                  >
                    {reviewSubmitLabel}
                  </button>
                ) : null}
                  </div>
                </div>
              </div>

              {state.step === "review" ? (
                submitRecoverableFailure ? (
                  <p
                    ref={errorRef}
                    className="block rounded-2xl border border-amber-200/90 bg-amber-50/90 px-5 py-4 font-[var(--font-manrope)] text-sm leading-6 text-amber-950"
                  >
                    <span className="block font-semibold text-amber-950">
                      {BOOKING_REVIEW_SUBMIT_RECOVERY_LEAD}
                    </span>
                    <span className="mt-2 block text-amber-950/95">
                      {BOOKING_REVIEW_SUBMIT_RECOVERY_HINT}
                    </span>
                  </p>
                ) : attemptedConfirm && !isBookingReady ? (
                  <p
                    ref={errorRef}
                    className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                  >
                    Please finish your home profile, visit address, and review section before continuing.
                  </p>
                ) : attemptedConfirm && isBookingReady && !isContactReady ? (
                  <p
                    ref={errorRef}
                    className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                  >
                    Please add your name and a valid email before continuing.
                  </p>
                ) : null
              ) : attemptedNext && stepError ? (
                <p
                  id="booking-step-continue-error"
                  ref={errorRef}
                  className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                >
                  {stepError}
                </p>
              ) : null}
            </div>

            <aside className="min-w-0 space-y-6">
              {state.step === "review" || state.step === "schedule" ? (
                <BookingSummaryCard
                  state={state}
                  step={state.step}
                  previewEstimate={previewEstimate}
                  previewLoading={previewLoading}
                  previewError={previewError}
                />
              ) : state.step === "service" ? (
                <section className="rounded-[32px] border border-[#C9B27C]/16 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-8">
                  <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                    Before you begin
                  </p>
                  <h2 className="mt-4 font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.03em] text-[#0F172A] sm:text-2xl">
                    Start with the service that best matches the visit.
                  </h2>
                  <p className="mt-4 font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">
                    The summary appears after you choose a path. Until then, the corridor stays focused on helping you make the right first choice.
                  </p>
                </section>
              ) : null}

              <section className="rounded-[32px] border border-[#C9B27C]/16 bg-[#0F172A] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
                <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                  Support
                </p>
                <h2 className="mt-4 font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
                  Clear details help the team arrive prepared.
                </h2>
                <p className="mt-4 font-[var(--font-manrope)] text-base leading-8 text-white/75">
                  Home facts, arrival details, and contact information help us prepare the estimate, coordinate the visit, and keep expectations clear before anyone arrives.
                </p>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
