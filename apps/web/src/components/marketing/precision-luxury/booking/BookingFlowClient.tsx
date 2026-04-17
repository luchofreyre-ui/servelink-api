"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ServiceHeader } from "../layout/ServiceHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import { BookingFlowProgress } from "../BookingFlowProgress";
import { bookingSteps } from "./bookingFlowData";
import {
  BOOKING_FLOW_HERO_BODY,
  BOOKING_FLOW_HERO_EYEBROW,
  BOOKING_FLOW_HERO_HEADLINE,
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
  BOOKING_SCHEDULE_HOLD_FAILED,
} from "./bookingPublicSurfaceCopy";
import {
  appendPublicIntakeContextToSearchParams,
  applyContactFieldChangeToBookingFlowState,
  applyHomeDetailsFieldChangeToBookingFlowState,
  applyScheduleFieldChangeToBookingFlowState,
  applyServiceChangeToBookingFlowState,
  buildBookingSearchParams,
  clampBookingStepToStructuralMax,
  clearBookingConfirmationSessionSnapshot,
  consumeBookingFlowFreshStartRequested,
  isCadenceComplete,
  isHomeDetailsComplete,
  normalizeBookingAddOnsForPayload,
  normalizeBookingAppliancePresenceForPayload,
  normalizeBookingHomeSizeParam,
  normalizeBookingPetsParam,
  normalizeBookingProblemAreasForPayload,
  parseBookingSearchParams,
  writeBookingConfirmationSessionSnapshot,
} from "./bookingUrlState";
import type {
  BookingAvailableTeamOption,
  BookingFlowState,
  BookingFrequencyOption,
  BookingPreviewConfidenceBand,
  BookingStepId,
  BookingTimeOption,
} from "./bookingFlowTypes";
import { BookingStepService } from "./BookingStepService";
import { BookingStepHomeDetails } from "./BookingStepHomeDetails";
import {
  BookingStepSchedule,
  type BookingScheduleTeamsEmptyState,
} from "./BookingStepSchedule";
import { BookingStepReview } from "./BookingStepReview";
import { BookingSummaryCard } from "./BookingSummaryCard";
import { BookingServiceHandoffCard } from "./BookingServiceHandoffCard";
import {
  buildBookingAttributionFromSearchParams,
  postPublicBookingAvailability,
  postPublicBookingConfirm,
  postPublicBookingHold,
  submitBookingDirectionIntake,
  type SubmitBookingDirectionIntakePayload,
} from "./bookingDirectionIntakeApi";
import { buildIntakeEstimateFactorsFromBookingHomeState } from "./bookingStep2ToEstimateFactors";
import { getBookingServiceCatalogItem } from "./bookingServiceCatalog";
import { buildEstimateRequestKey } from "./bookingEstimateKey";
import { useBookingEstimate } from "./useBookingEstimate";
import { mapIntakeDeepCleanSnapshotToCardProgram } from "./bookingIntakePreviewDisplay";
import type { FunnelReviewEstimate } from "./bookingFunnelLocalEstimate";
import {
  isBookingMoveTransitionServiceId,
  isDeepCleaningBookingServiceId,
} from "./bookingDeepClean";
import type { DeepCleanProgramDisplay } from "@/types/deepCleanProgram";
import { isBookingContactValid } from "./bookingContactValidation";
import { emitBookingFunnelEvent } from "./bookingFunnelAnalytics";

function getStepOrder(step: BookingStepId) {
  return bookingSteps.find((item) => item.id === step)?.order ?? 1;
}

function serializeState(state: BookingFlowState) {
  return buildBookingSearchParams(state).toString();
}

function getStepError(state: BookingFlowState): string | null {
  if (state.step === "service" && !state.serviceId) {
    return "Please choose a service before continuing.";
  }

  if (state.step === "home" && (!isHomeDetailsComplete(state) || !isCadenceComplete(state))) {
    return "Please complete your home details and service cadence before continuing.";
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

/** Internal weighting only — never shown. Maps canonical complexity signals to a band. */
function derivePreviewConfidenceBand(input: {
  isHeavyCondition: boolean;
  problemAreaCount: number;
  isDenseLayout: boolean;
  isDetailHeavyScope: boolean;
  addOnCount: number;
  nonDefaultDeepCleanFocus: boolean;
  furnishedMoveTransition: boolean;
  transitionAppliances: boolean;
}): BookingPreviewConfidenceBand {
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

  if (normalizeBookingPetsParam(state.pets)) {
    pushUniqueCap3(items, BOOKING_REVIEW_PREP_PETS);
  }

  if (state.surfaceComplexity === "dense_layout") {
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
  const heavyCondition =
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
  const [scheduleCommitError, setScheduleCommitError] = useState<string | null>(null);
  const [scheduleCommitPhase, setScheduleCommitPhase] = useState<
    "none" | "hold_failed" | "confirm_failed"
  >("none");
  const [pendingConfirmHoldId, setPendingConfirmHoldId] = useState<string | null>(
    null,
  );
  const [confirmScheduleLoading, setConfirmScheduleLoading] = useState(false);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [attemptedConfirm, setAttemptedConfirm] = useState(false);
  const [submitRecoverableFailure, setSubmitRecoverableFailure] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const submitInFlightRef = useRef(false);
  /** After an explicit fresh start, one URL sync must not re-merge contact from prior React state. */
  const skipContactMergeFromUrlOnceRef = useRef(false);
  const scheduleSnapshotForAbandonRef = useRef({
    step: initialState.step,
    schedulingConfirmed: initialState.schedulingConfirmed,
    bookingId: initialState.schedulingBookingId,
    teamId: initialState.selectedTeamId,
  });

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
        const teams = (res.teams ?? []).slice(0, 2).map((t, i) => ({
          id: t.id,
          displayName: t.displayName,
          isRecommended: t.isRecommended ?? i === 0,
        }));
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
          setTeamsEmptyState("zero");
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
        const windows = (res.windows ?? []).map((w) => ({
          startAt: w.startAt,
          endAt: w.endAt,
        }));
        setState((prev) => ({
          ...prev,
          availableWindows: windows,
          selectedSlotStart: "",
          selectedSlotEnd: "",
          schedulingConfirmed: false,
          publicHoldId: "",
        }));
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
    };
  }, [
    state.step,
    state.schedulingConfirmed,
    state.schedulingBookingId,
    state.selectedTeamId,
  ]);

  useEffect(() => {
    const onPageHide = () => {
      const snap = scheduleSnapshotForAbandonRef.current;
      if (snap.step !== "schedule" || snap.schedulingConfirmed) return;
      if (!snap.bookingId.trim()) return;
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
  const isCadenceCompleteState = isCadenceComplete(state);
  const isBookingReady =
    !!state.serviceId && isHomeComplete && isCadenceCompleteState;
  const isContactReady = isBookingContactValid(
    state.customerName,
    state.customerEmail,
  );
  const canConfirmDirection = isBookingReady && isContactReady;

  const contactPayloadKey = useMemo(() => {
    if (!isContactReady) return "";
    return `${state.customerName.trim()}|${state.customerEmail.trim()}`;
  }, [isContactReady, state.customerName, state.customerEmail]);

  const problemAreasPayloadKey = useMemo(
    () =>
      normalizeBookingProblemAreasForPayload(state.problemAreas).join(","),
    [state.problemAreas],
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

  const isHeavyCondition = useMemo(
    () =>
      state.condition === "heavy_buildup" ||
      state.condition === "move_in_out_reset",
    [state.condition],
  );

  const hasProblemAreas = useMemo(
    () =>
      normalizeBookingProblemAreasForPayload(state.problemAreas).length > 0,
    [state.problemAreas],
  );

  const isDenseLayout = useMemo(
    () => state.surfaceComplexity === "dense_layout",
    [state.surfaceComplexity],
  );

  const estimateDriverDetailHeavyScope = useMemo(
    () => state.scopeIntensity === "detail_heavy",
    [state.scopeIntensity],
  );

  const estimateDriverHasAddOns = useMemo(
    () => normalizeBookingAddOnsForPayload(state.selectedAddOns).length > 0,
    [state.selectedAddOns],
  );

  const estimateDriverDeepCleanFocus = useMemo(
    () =>
      isDeepCleaningBookingServiceId(state.serviceId) &&
      state.deepCleanFocus !== "whole_home_reset",
    [state.serviceId, state.deepCleanFocus],
  );

  const estimateDriverFurnishedTransition = useMemo(
    () =>
      isBookingMoveTransitionServiceId(state.serviceId) &&
      (state.transitionState === "lightly_furnished" ||
        state.transitionState === "fully_furnished"),
    [state.serviceId, state.transitionState],
  );

  const estimateDriverTransitionAppliances = useMemo(
    () =>
      isBookingMoveTransitionServiceId(state.serviceId) &&
      normalizeBookingAppliancePresenceForPayload(state.appliancePresence)
        .length > 0,
    [state.serviceId, state.appliancePresence],
  );

  const previewConfidenceBand = useMemo((): BookingPreviewConfidenceBand => {
    const problemAreaCount = normalizeBookingProblemAreasForPayload(
      state.problemAreas,
    ).length;
    const addOnCount = normalizeBookingAddOnsForPayload(
      state.selectedAddOns,
    ).length;
    return derivePreviewConfidenceBand({
      isHeavyCondition,
      problemAreaCount,
      isDenseLayout,
      isDetailHeavyScope: estimateDriverDetailHeavyScope,
      addOnCount,
      nonDefaultDeepCleanFocus: estimateDriverDeepCleanFocus,
      furnishedMoveTransition: estimateDriverFurnishedTransition,
      transitionAppliances: estimateDriverTransitionAppliances,
    });
  }, [
    isHeavyCondition,
    problemAreasPayloadKey,
    isDenseLayout,
    estimateDriverDetailHeavyScope,
    selectedAddOnsPayloadKey,
    estimateDriverDeepCleanFocus,
    estimateDriverFurnishedTransition,
    estimateDriverTransitionAppliances,
  ]);

  const prepGuidanceItems = useMemo(
    () => derivePrepGuidanceItems(state),
    [
      state.serviceId,
      state.surfaceComplexity,
      state.deepCleanFocus,
      state.transitionState,
      selectedAddOnsPayloadKey,
      appliancePresencePayloadKey,
      state.pets,
    ],
  );

  const recommendedAttentionItems = useMemo(
    () => deriveRecommendedAttentionItems(state),
    [
      state.serviceId,
      state.condition,
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
      frequency: String(state.frequency).trim() as BookingFrequencyOption,
      preferredTime: String(state.preferredTime).trim() as BookingTimeOption,
      ...normalizedAttribution,
    };

    if (
      isDeepCleaningBookingServiceId(state.serviceId) &&
      state.deepCleanProgram
    ) {
      return {
        ...core,
        deepCleanProgram:
          state.deepCleanProgram === "phased_3_visit"
            ? "phased_3_visit"
            : "single_visit",
      };
    }
    return core;
  }, [
    isBookingReady,
    state.serviceId,
    state.homeSize,
    state.bedrooms,
    state.bathrooms,
    state.pets,
    state.condition,
    problemAreasPayloadKey,
    state.surfaceComplexity,
    state.scopeIntensity,
    selectedAddOnsPayloadKey,
    state.deepCleanFocus,
    state.transitionState,
    appliancePresencePayloadKey,
    state.frequency,
    state.preferredTime,
    state.deepCleanProgram,
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
    return BOOKING_REVIEW_SEE_AVAILABLE_TEAMS_CTA;
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

  const disableNext =
    state.step === "review" &&
    (isSubmitting ||
      !canConfirmDirection ||
      estimate.status === "loading" ||
      estimate.status === "error" ||
      !estimatePreviewReady);

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
    };
  }, [estimate.status, estimate.data, estimate.requestKey, estimateInput]);

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

  useEffect(() => {
    if (
      (attemptedNext && stepError) ||
      (attemptedConfirm && !canConfirmDirection) ||
      submitRecoverableFailure ||
      Boolean(previewError)
    ) {
      errorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }
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

  // STATE → URL (ONLY runs when state changes)
  useEffect(() => {
    const desired = serializeState(state);
    const current = new URLSearchParams(searchParams?.toString() ?? "").toString();

    if (desired !== current) {
      router.replace(`${pathname}?${desired}`, { scroll: false });
    }
    // Omit searchParams from deps to avoid replace/router feedback loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pathname, router]);

  function goToStep(step: BookingStepId) {
    setState((prev) =>
      clampBookingStepToStructuralMax({ ...prev, step }),
    );
  }

  function goNext() {
    setAttemptedNext(true);

    if (stepError) return;

    setAttemptedNext(false);

    if (state.step === "service") return goToStep("home");
    if (state.step === "home") return goToStep("review");
  }

  async function confirmBookingDirection() {
    if (submitInFlightRef.current) return;
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
      });

      if (
        result.bookingCreated &&
        result.bookingId &&
        result.estimate
      ) {
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
            selectedSlotStart: "",
            selectedSlotEnd: "",
            publicHoldId: "",
            schedulingConfirmed: false,
            step: "schedule",
          }),
        );
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

  async function confirmScheduleHoldAndFinish() {
    if (
      !state.schedulingBookingId.trim() ||
      !state.selectedTeamId.trim() ||
      !state.selectedSlotStart.trim() ||
      !state.selectedSlotEnd.trim()
    ) {
      return;
    }
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
        foId: state.selectedTeamId,
        startAt: state.selectedSlotStart,
        endAt: state.selectedSlotEnd,
      });
      try {
        await postPublicBookingConfirm(
          {
            bookingId: state.schedulingBookingId,
            holdId: hold.holdId,
          },
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : null,
        );
      } catch (confirmErr) {
        console.error("public booking confirm failed", confirmErr);
        emitBookingFunnelEvent("confirm_failed", {
          bookingId: state.schedulingBookingId,
          teamId: state.selectedTeamId,
          holdId: hold.holdId,
        });
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
      setScheduleCommitError(BOOKING_SCHEDULE_HOLD_FAILED);
      setScheduleCommitPhase("hold_failed");
      setWindowsRefreshKey((k) => k + 1);
    } finally {
      setConfirmScheduleLoading(false);
    }
  }

  async function retryScheduleConfirm() {
    if (!state.schedulingBookingId.trim() || !pendingConfirmHoldId?.trim()) return;
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
        },
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : null,
      );
      emitBookingFunnelEvent("booking_confirmed", {
        bookingId: state.schedulingBookingId,
        teamId: state.selectedTeamId,
        holdId: pendingConfirmHoldId.trim(),
        retry: true,
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
      setScheduleCommitError(BOOKING_SCHEDULE_CONFIRM_FAILED);
      setScheduleCommitPhase("confirm_failed");
    } finally {
      setConfirmScheduleLoading(false);
    }
  }

  function chooseDifferentTimeAfterConfirmFail() {
    setPendingConfirmHoldId(null);
    setScheduleCommitError(null);
    setScheduleCommitPhase("none");
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        selectedSlotStart: "",
        selectedSlotEnd: "",
        publicHoldId: "",
        schedulingConfirmed: false,
      }),
    );
  }

  function exitScheduleToAdjustDetails() {
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
        if (state.selectedTeamId.trim()) {
          emitBookingFunnelEvent("abandoned_after_team_select", {
            bookingId: state.schedulingBookingId,
            teamId: state.selectedTeamId,
          });
        }
      }
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
          selectedSlotStart: "",
          selectedSlotEnd: "",
          publicHoldId: "",
          schedulingConfirmed: false,
        }),
      );
      return;
    }
    if (state.step === "home") return goToStep("service");
    return;
  }

  function patchState(patch: Partial<BookingFlowState>) {
    setAttemptedNext(false);
    setAttemptedConfirm(false);
    setSubmitRecoverableFailure(false);
    setState((prev) =>
      clampBookingStepToStructuralMax({ ...prev, ...patch }),
    );
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
      }
      return clampBookingStepToStructuralMax(next);
    });
  }

  function handleSelectTeam(team: BookingAvailableTeamOption) {
    setScheduleSurfaceError(null);
    setScheduleCommitError(null);
    setScheduleCommitPhase("none");
    setPendingConfirmHoldId(null);
    const teams = state.availableTeams.slice(0, 2);
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
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        selectedTeamId: team.id,
        selectedTeamDisplayName: team.displayName,
        selectedSlotStart: "",
        selectedSlotEnd: "",
        availableWindows: [],
        schedulingConfirmed: false,
        publicHoldId: "",
      }),
    );
  }

  function handleSelectSlot(startAt: string, endAt: string) {
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
    setState((prev) =>
      clampBookingStepToStructuralMax({
        ...prev,
        selectedSlotStart: startAt,
        selectedSlotEnd: endAt,
        schedulingConfirmed: false,
        publicHoldId: "",
      }),
    );
  }

  function switchToAlternateTeam() {
    const teams = state.availableTeams.slice(0, 2);
    const other = teams.find((t) => t.id !== state.selectedTeamId.trim());
    if (other) handleSelectTeam(other);
  }

  function patchContactState(
    patch: Partial<Pick<BookingFlowState, "customerName" | "customerEmail">>,
  ) {
    setAttemptedNext(false);
    setAttemptedConfirm(false);
    setSubmitRecoverableFailure(false);
    // Keep isSubmitting + submitInFlightRef while a review submit is in flight so the same-step
    // contact editor cannot open a second overlapping intake; only readiness/certainty flags reset.
    setState((prev) =>
      clampBookingStepToStructuralMax(
        applyContactFieldChangeToBookingFlowState(prev, patch),
      ),
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <ServiceHeader />

      <main>
        <section className="border-b border-[#C9B27C]/14">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:py-20">
            <div className="max-w-4xl">
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                {BOOKING_FLOW_HERO_EYEBROW}
              </p>
              <h1 className="mt-4 font-[var(--font-poppins)] text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#0F172A] md:text-6xl">
                {BOOKING_FLOW_HERO_HEADLINE}
              </h1>
              <p className="mt-6 max-w-3xl font-[var(--font-manrope)] text-lg leading-8 text-[#475569] md:text-xl">
                {BOOKING_FLOW_HERO_BODY}
              </p>
            </div>

            <div className="mt-10">
              <BookingFlowProgress
                currentStep={currentStepOrder}
                steps={bookingSteps.map((step) => ({
                  id: step.order,
                  label: step.label,
                }))}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:py-20">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-8">
              <BookingServiceHandoffCard serviceId={state.serviceId} />

              {state.step === "service" ? (
                <BookingStepService
                  serviceId={state.serviceId}
                  onSelect={(serviceId) => {
                    setAttemptedNext(false);
                    setAttemptedConfirm(false);
                    setSubmitRecoverableFailure(false);
                    setIsSubmitting(false);
                    submitInFlightRef.current = false;
                    setState((prev) =>
                      clampBookingStepToStructuralMax(
                        applyServiceChangeToBookingFlowState(prev, serviceId),
                      ),
                    );
                  }}
                  deepCleanProgram={
                    state.deepCleanProgram === "phased_3_visit"
                      ? "phased_3_visit"
                      : "single_visit"
                  }
                  onDeepCleanProgramChange={(value) =>
                    patchState({ deepCleanProgram: value })
                  }
                />
              ) : null}

              {state.step === "home" ? (
                <BookingStepHomeDetails
                  state={state}
                  onChange={(patch) => patchHomeStepState(patch)}
                  selectedServiceTitle={
                    getBookingServiceCatalogItem(state.serviceId).title
                  }
                  deepCleanPlanLabel={
                    isDeepCleaningBookingServiceId(state.serviceId)
                      ? state.deepCleanProgram === "phased_3_visit"
                        ? "Three-visit deep clean"
                        : "One-visit deep clean"
                      : null
                  }
                />
              ) : null}

              {state.step === "review" ? (
                <BookingStepReview
                  state={state}
                  condition={state.condition}
                  problemAreas={state.problemAreas}
                  surfaceComplexity={state.surfaceComplexity}
                  estimateDriverHeavyCondition={isHeavyCondition}
                  estimateDriverHasProblemAreas={hasProblemAreas}
                  estimateDriverDenseLayout={isDenseLayout}
                  estimateDriverDetailHeavyScope={estimateDriverDetailHeavyScope}
                  estimateDriverHasAddOns={estimateDriverHasAddOns}
                  estimateDriverDeepCleanFocus={estimateDriverDeepCleanFocus}
                  estimateDriverFurnishedTransition={
                    estimateDriverFurnishedTransition
                  }
                  estimateDriverTransitionAppliances={
                    estimateDriverTransitionAppliances
                  }
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
                />
              ) : null}

              {state.step === "schedule" ? (
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
                />
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                {state.step !== "service" ? (
                  <button
                    type="button"
                    disabled={
                      (isSubmitting && state.step !== "review") ||
                      confirmScheduleLoading
                    }
                    onClick={goBack}
                    className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Back
                  </button>
                ) : (
                  <Link
                    href={`/services/${state.serviceId}`}
                    aria-disabled={isSubmitting}
                    onClick={(e) => {
                      if (isSubmitting) e.preventDefault();
                    }}
                    className={`inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-white ${
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
                    className={`inline-flex items-center justify-center rounded-full px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white transition ${
                      canContinue
                        ? "bg-[#0D9488] shadow-[0_14px_40px_rgba(13,148,136,0.22)] hover:-translate-y-0.5 hover:bg-[#0b7f76]"
                        : "bg-[#94A3B8] shadow-none"
                    }`}
                  >
                    Continue
                  </button>
                ) : state.step === "review" ? (
                  <button
                    type="button"
                    data-testid="booking-direction-send"
                    disabled={disableNext}
                    onClick={() => void confirmBookingDirection()}
                    className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {reviewSubmitLabel}
                  </button>
                ) : null}
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
                    Please complete home details and service cadence before
                    saving.
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

            <aside className="space-y-6">
              <BookingSummaryCard
                state={state}
                step={state.step}
                previewEstimate={previewEstimate}
                previewLoading={previewLoading}
                previewError={previewError}
              />

              <section className="rounded-[32px] border border-[#C9B27C]/16 bg-[#0F172A] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                  Why we ask
                </p>
                <h2 className="mt-4 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-white">
                  Clear details mean a clearer quote.
                </h2>
                <p className="mt-4 font-[var(--font-manrope)] text-base leading-8 text-white/75">
                  Home size, rooms, and timing help us scope time and pricing honestly—so the
                  first visit reflects what you expected, not a rough guess.
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
