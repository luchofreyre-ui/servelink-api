"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ServiceHeader } from "../layout/ServiceHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import { BookingFlowProgress } from "../BookingFlowProgress";
import { bookingSteps } from "./bookingFlowData";
import { BOOKING_PAGE_DESCRIPTION } from "./bookingSeo";
import {
  buildBookingPreviewRequestKey,
  buildBookingEstimateDrivingSignature,
  buildBookingSearchParams,
  parseBookingSearchParams,
} from "./bookingUrlState";
import type {
  BookingFlowState,
  BookingFrequencyOption,
  BookingStepId,
  BookingTimeOption,
  RecurringCadence,
  RecurringSetupState,
  RecurringTimePreference,
} from "./bookingFlowTypes";
import { BookingStepService } from "./BookingStepService";
import { BookingStepHomeDetails } from "./BookingStepHomeDetails";
import { BookingStepEstimateFactors } from "./BookingStepEstimateFactors";
import { BookingStepSchedule } from "./BookingStepSchedule";
import { BookingStepReview } from "./BookingStepReview";
import BookingStepDecision from "./BookingStepDecision";
import BookingStepRecurringSetup from "./BookingStepRecurringSetup";
import { BookingStepConfirm } from "./BookingStepConfirm";
import { BookingSummaryCard } from "./BookingSummaryCard";
import { BookingServiceHandoffCard } from "./BookingServiceHandoffCard";
import {
  buildBookingAttributionFromSearchParams,
  previewBookingDirectionEstimate,
  submitBookingDirectionIntake,
} from "./bookingDirectionIntakeApi";
import { mapIntakeDeepCleanSnapshotToCardProgram } from "./bookingIntakePreviewDisplay";
import { isDeepCleaningBookingServiceId } from "./bookingDeepClean";
import type { DeepCleanProgramDisplay } from "@/types/deepCleanProgram";
import { isBookingContactValid } from "./bookingContactValidation";
import type { FunnelReviewEstimate } from "./bookingFlowTypes";
import {
  ESTIMATE_ADDON_OPTIONS,
  homeSizeHasValidSqftForEstimate,
  isBookingEstimateFactorsComplete,
} from "./bookingEstimateFactors";
import { buildSubmitBookingDirectionPayload } from "./bookingIntakePayload";
import {
  buildCreateRecurringPlanRequest,
  createRecurringPlan,
} from "./bookingRecurringApi";
import { hasRole } from "@/lib/auth/authClient";
import {
  BookingFlowDebugPanel,
  type BookingFlowDebugState,
  type BookingHomeRequirementDebugRow,
} from "./BookingFlowDebugPanel";

const BOOKING_FLOW_SESSION_KEY = "booking_flow_state";

/** Field ids rendered by `BookingStepHomeDetails` (must match that component). */
const HOME_STEP_RENDERED_FIELD_IDS = [
  "homeSize",
  "bedrooms",
  "bathrooms",
  "pets",
] as const;

function getDebugStepLabel(step: unknown): string {
  if (typeof step === "string" && step.trim()) return step;
  if (typeof step === "number") return String(step);
  if (step && typeof step === "object" && "id" in (step as Record<string, unknown>)) {
    const id = (step as { id?: unknown }).id;
    if (typeof id === "string" && id.trim()) return id;
  }
  return "unknown";
}

function safeJsonLike(
  value: unknown,
): NonNullable<BookingFlowDebugState["pricePreview"]> {
  return value as NonNullable<BookingFlowDebugState["pricePreview"]>;
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return false;
}

function normalizeHomeRequirement(
  field: string,
  required: boolean,
  rendered: boolean,
  value: unknown,
  note?: string | null,
): BookingHomeRequirementDebugRow {
  const hasValue = hasMeaningfulValue(value);

  const status: BookingHomeRequirementDebugRow["status"] = required
    ? rendered && hasValue
      ? "pass"
      : "fail"
    : "unknown";

  return {
    field,
    required,
    rendered,
    hasValue,
    value: safeJsonLike(value ?? null),
    status,
    note: note ?? null,
  };
}

function hasAuthenticatedCustomerSession() {
  if (typeof window === "undefined") return false;
  return hasRole("customer");
}

function createDefaultRecurringSetup(
  existingAddonIds: string[] = [],
): RecurringSetupState {
  return {
    nextAnchorDate: "",
    timePreference: "anytime",
    preferredFoId: undefined,
    bookingNotes: undefined,
    addonIds: [...existingAddonIds],
  };
}

function isRecurringSetupComplete(
  value: RecurringSetupState | undefined,
): boolean {
  if (!value) return false;
  if (!value.nextAnchorDate) return false;
  if (!value.timePreference) return false;
  return true;
}

function toNextAnchorIso(
  dateOnly: string,
  timePreference: RecurringTimePreference,
): string {
  const hour =
    timePreference === "morning"
      ? 9
      : timePreference === "midday"
        ? 12
        : timePreference === "afternoon"
          ? 15
          : 12;
  const local = new Date(`${dateOnly}T00:00:00`);
  local.setHours(hour, 0, 0, 0);
  return local.toISOString();
}

const BOOKING_SNAPSHOT_TOUCH_KEYS: (keyof BookingFlowState)[] = [
  "serviceId",
  "homeSize",
  "bedrooms",
  "bathrooms",
  "pets",
  "estimateFactors",
  "frequency",
  "preferredTime",
  "deepCleanProgram",
];

function patchTouchesEstimateSnapshot(patch: Partial<BookingFlowState>) {
  return BOOKING_SNAPSHOT_TOUCH_KEYS.some((k) => k in patch);
}

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

  if (state.step === "home") {
    if (!state.homeSize || !state.bedrooms || !state.bathrooms) {
      return "Please complete your home details before continuing.";
    }
    if (!homeSizeHasValidSqftForEstimate(state.homeSize)) {
      return "Enter explicit square footage (300–20,000) as a number in your home size, e.g. 2200 or 2,200 sq ft.";
    }
  }

  if (
    state.step === "factors" &&
    !isBookingEstimateFactorsComplete(state.estimateFactors)
  ) {
    return "Please answer every job-detail question (including pet shedding when you have pets) before continuing.";
  }

  if (
    state.step === "schedule" &&
    (!state.frequency || !state.preferredTime)
  ) {
    return "Please choose your preferred frequency and timing before continuing.";
  }

  if (
    state.step === "review" &&
    !isBookingContactValid(state.customerName, state.customerEmail)
  ) {
    return "Please add your name and a valid email before continuing.";
  }

  if (
    state.step === "recurring_setup" &&
    state.recurringIntent?.type === "recurring" &&
    !isRecurringSetupComplete(state.recurringSetup)
  ) {
    return "Choose your first visit date and preferred arrival window before continuing.";
  }

  return null;
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
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [attemptedConfirm, setAttemptedConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewEstimate, setPreviewEstimate] = useState<FunnelReviewEstimate | null>(
    null,
  );
  const [previewDeepCleanCard, setPreviewDeepCleanCard] =
    useState<DeepCleanProgramDisplay | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewFetchCompleted, setPreviewFetchCompleted] = useState(false);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const skipUrlSearchParamsHydration = useRef(0);

  const attributionQueryKey = searchParams?.toString() ?? "";

  const previewRequestKey = useMemo(
    () => buildBookingPreviewRequestKey(state, attributionQueryKey),
    [
      state.serviceId,
      state.homeSize,
      state.bedrooms,
      state.bathrooms,
      state.pets,
      state.estimateFactors,
      state.frequency,
      state.preferredTime,
      state.deepCleanProgram,
      state.customerName,
      state.customerEmail,
      attributionQueryKey,
    ],
  );

  const estimateForDisplay = useMemo((): FunnelReviewEstimate | null => {
    if (state.estimateSnapshot) {
      return {
        priceCents: state.estimateSnapshot.priceCents,
        durationMinutes: state.estimateSnapshot.durationMinutes,
        confidence: state.estimateSnapshot.confidence,
        source: "server",
      };
    }
    return previewEstimate;
  }, [state.estimateSnapshot, previewEstimate]);

  const deepCleanCardForDisplay =
    state.estimateSnapshot?.deepCleanProgramCard ?? previewDeepCleanCard;

  const currentStepOrder = useMemo(() => getStepOrder(state.step), [state.step]);

  const stepError = useMemo(() => getStepError(state), [state]);
  const canContinue = !stepError;

  const isHomeComplete =
    !!state.homeSize &&
    !!state.bedrooms &&
    !!state.bathrooms &&
    homeSizeHasValidSqftForEstimate(state.homeSize);
  const isFactorsComplete = isBookingEstimateFactorsComplete(
    state.estimateFactors,
  );
  const isScheduleComplete = !!state.frequency && !!state.preferredTime;
  const isBookingReady =
    !!state.serviceId &&
    isHomeComplete &&
    isFactorsComplete &&
    isScheduleComplete;
  const isContactReady = isBookingContactValid(
    state.customerName,
    state.customerEmail,
  );
  const canConfirmDirection = isBookingReady && isContactReady;

  const orderedStepIds = useMemo(() => bookingSteps.map((s) => s.id), []);

  const currentStepIndex = orderedStepIds.indexOf(state.step);

  const previousStepCandidate =
    currentStepIndex > 0 ? orderedStepIds[currentStepIndex - 1]! : null;

  const nextStepCandidate =
    currentStepIndex >= 0 && currentStepIndex < orderedStepIds.length - 1
      ? orderedStepIds[currentStepIndex + 1]!
      : null;

  const reviewReady =
    state.step === "review"
      ? Boolean(estimateForDisplay) && !previewLoading && !previewError
      : null;

  const decisionEligible =
    orderedStepIds.includes("decision") &&
    Boolean(estimateForDisplay) &&
    !previewLoading &&
    !previewError;

  const recurringEligible =
    orderedStepIds.includes("recurring_setup") &&
    state.recurringIntent?.type === "recurring";

  const estimateReady =
    state.step === "review"
      ? Boolean(estimateForDisplay) && !previewLoading && !previewError
      : Boolean(estimateForDisplay);

  const estimateStale =
    state.step === "review"
      ? Boolean(
          previewFetchCompleted &&
            previewRequestKey &&
            state.estimateSnapshot &&
            state.estimateSnapshot.previewRequestKey !== previewRequestKey,
        )
      : false;

  const reachableSteps = useMemo(
    () =>
      orderedStepIds.filter((stepId) => {
        if (stepId === "decision") return decisionEligible;
        if (stepId === "recurring_setup") return recurringEligible;
        if (stepId === "review") return true;
        return true;
      }),
    [orderedStepIds, decisionEligible, recurringEligible],
  );

  const homeRenderedFieldIds = useMemo(
    () => [...HOME_STEP_RENDERED_FIELD_IDS],
    [],
  );

  const homeValidationFailure =
    state.step === "home" && stepError ? String(stepError) : null;

  const homeRequirements = useMemo((): BookingHomeRequirementDebugRow[] => {
    if (state.step !== "home") return [];

    const ids = homeRenderedFieldIds;
    const basicsComplete = Boolean(
      state.homeSize && state.bedrooms && state.bathrooms,
    );
    const sqftOk = homeSizeHasValidSqftForEstimate(state.homeSize);
    const homeSizeRendered = ids.includes("homeSize");

    const homeSizeExplicitSqft: BookingHomeRequirementDebugRow = {
      field: "homeSizeExplicitSqft",
      required: true,
      rendered: homeSizeRendered,
      hasValue: sqftOk,
      value: safeJsonLike(state.homeSize ?? null),
      status: basicsComplete
        ? homeSizeRendered && sqftOk
          ? "pass"
          : "fail"
        : "unknown",
      note: basicsComplete
        ? "getStepError: homeSizeHasValidSqftForEstimate (300–20,000 sq ft from digits in home size text)."
        : "Only evaluated after homeSize, bedrooms, and bathrooms are all non-empty per getStepError.",
    };

    return [
      normalizeHomeRequirement(
        "bedrooms",
        true,
        ids.includes("bedrooms"),
        state.bedrooms,
        "getStepError(home): bedrooms must be selected (non-empty).",
      ),
      normalizeHomeRequirement(
        "bathrooms",
        true,
        ids.includes("bathrooms"),
        state.bathrooms,
        "getStepError(home): bathrooms must be selected (non-empty).",
      ),
      normalizeHomeRequirement(
        "homeSize",
        true,
        ids.includes("homeSize"),
        state.homeSize,
        "getStepError(home): home size text must be non-empty before sqft parse.",
      ),
      homeSizeExplicitSqft,
      normalizeHomeRequirement(
        "pets",
        false,
        ids.includes("pets"),
        state.pets,
        "Optional in UI; not required by getStepError on home.",
      ),
    ];
  }, [
    state.step,
    state.homeSize,
    state.bedrooms,
    state.bathrooms,
    state.pets,
    homeRenderedFieldIds,
  ]);

  const bookingDebugState = useMemo<BookingFlowDebugState>(() => {
    const recurringIntent = state.recurringIntent;
    let selectedDecisionLabel: string | null = null;
    if (recurringIntent?.type === "recurring") {
      selectedDecisionLabel = `recurring:${recurringIntent.cadence}`;
    } else if (recurringIntent?.type === "one_time") {
      selectedDecisionLabel = "one_time";
    }

    const intakePayloadSnapshot = (() => {
      try {
        const attribution = buildBookingAttributionFromSearchParams(
          new URLSearchParams(attributionQueryKey),
        );
        const extras = {
          ...attribution,
          ...(isContactReady
            ? {
                customerName: state.customerName.trim(),
                customerEmail: state.customerEmail.trim(),
              }
            : {}),
        };

        return buildSubmitBookingDirectionPayload(state, extras);
      } catch (error) {
        return {
          payloadBuildError:
            error instanceof Error ? error.message : "Unknown payload build error",
        };
      }
    })();

    const snapshotKey =
      state.estimateSnapshot &&
      typeof state.estimateSnapshot.previewRequestKey === "string"
        ? state.estimateSnapshot.previewRequestKey
        : null;

    return {
      flowVersion: "NEW_FLOW_V1",
      pathname,
      currentStep: getDebugStepLabel(state.step),

      orderedSteps: orderedStepIds,
      reachableSteps,
      nextStepCandidate,
      previousStepCandidate,

      canContinue: Boolean(canContinue),
      stepError: stepError == null ? null : String(stepError),

      isLoadingEstimate: Boolean(previewLoading),
      estimateError: previewError == null ? null : String(previewError),
      estimateReady,
      estimateStale,
      previewFetchCompleted: Boolean(previewFetchCompleted),
      previewRequestKey:
        typeof previewRequestKey === "string" ? previewRequestKey : null,
      snapshotRequestKey: snapshotKey,

      decisionEligible,
      recurringEligible,
      reviewReady,

      selectedFrequency:
        typeof state.frequency === "string" ? state.frequency : null,
      selectedDecision: selectedDecisionLabel,
      selectedProgram:
        typeof state.deepCleanProgram === "string" ? state.deepCleanProgram : null,
      zip: null,
      homeSize:
        typeof state.homeSize === "string" ? state.homeSize : null,
      bedrooms: state.bedrooms ?? null,
      bathrooms: state.bathrooms ?? null,

      pricePreview: safeJsonLike(estimateForDisplay ?? null),
      estimatePipeline: safeJsonLike({
        previewLoading,
        previewError,
        previewFetchCompleted,
        previewRequestKey,
        snapshotRequestKey: snapshotKey,
        step: state.step,
        estimateSnapshot: state.estimateSnapshot ?? null,
      }),
      formSnapshot: safeJsonLike(state),
      payloadSnapshot: safeJsonLike(intakePayloadSnapshot),

      homeRequirements,
      homeRenderedFieldIds,
      homeValidationFailure,
    };
  }, [
    pathname,
    state,
    canContinue,
    stepError,
    previewLoading,
    previewError,
    previewFetchCompleted,
    previewRequestKey,
    estimateForDisplay,
    orderedStepIds,
    reachableSteps,
    nextStepCandidate,
    previousStepCandidate,
    reviewReady,
    decisionEligible,
    recurringEligible,
    estimateReady,
    estimateStale,
    attributionQueryKey,
    isContactReady,
    homeRequirements,
    homeRenderedFieldIds,
    homeValidationFailure,
  ]);

  useEffect(() => {
    console.log("BOOKING_DEBUG_STATE", bookingDebugState);
  }, [bookingDebugState]);

  useEffect(() => {
    console.log("BOOKING_DEBUG_STEP_TRANSITION", {
      currentStep: bookingDebugState.currentStep,
      previousStepCandidate: bookingDebugState.previousStepCandidate,
      nextStepCandidate: bookingDebugState.nextStepCandidate,
      reachableSteps: bookingDebugState.reachableSteps,
    });
  }, [
    bookingDebugState.currentStep,
    bookingDebugState.previousStepCandidate,
    bookingDebugState.nextStepCandidate,
    bookingDebugState.reachableSteps,
  ]);

  useEffect(() => {
    console.log("BOOKING_DEBUG_ESTIMATE_STATUS", {
      currentStep: bookingDebugState.currentStep,
      isLoadingEstimate: bookingDebugState.isLoadingEstimate,
      estimateError: bookingDebugState.estimateError,
      estimateReady: bookingDebugState.estimateReady,
      estimateStale: bookingDebugState.estimateStale,
      previewFetchCompleted: bookingDebugState.previewFetchCompleted,
      previewRequestKey: bookingDebugState.previewRequestKey,
      snapshotRequestKey: bookingDebugState.snapshotRequestKey,
    });
  }, [
    bookingDebugState.currentStep,
    bookingDebugState.isLoadingEstimate,
    bookingDebugState.estimateError,
    bookingDebugState.estimateReady,
    bookingDebugState.estimateStale,
    bookingDebugState.previewFetchCompleted,
    bookingDebugState.previewRequestKey,
    bookingDebugState.snapshotRequestKey,
  ]);

  useEffect(() => {
    console.log("BOOKING_DEBUG_ELIGIBILITY", {
      currentStep: bookingDebugState.currentStep,
      canContinue: bookingDebugState.canContinue,
      stepError: bookingDebugState.stepError,
      decisionEligible: bookingDebugState.decisionEligible,
      recurringEligible: bookingDebugState.recurringEligible,
      reviewReady: bookingDebugState.reviewReady,
    });
  }, [
    bookingDebugState.currentStep,
    bookingDebugState.canContinue,
    bookingDebugState.stepError,
    bookingDebugState.decisionEligible,
    bookingDebugState.recurringEligible,
    bookingDebugState.reviewReady,
  ]);

  useEffect(() => {
    if (bookingDebugState.currentStep !== "home") return;

    console.log("BOOKING_DEBUG_HOME_TRUTH", {
      currentStep: bookingDebugState.currentStep,
      homeValidationFailure: bookingDebugState.homeValidationFailure,
      homeRenderedFieldIds: bookingDebugState.homeRenderedFieldIds,
      homeRequirements: bookingDebugState.homeRequirements,
      formSnapshot: bookingDebugState.formSnapshot,
    });
  }, [
    bookingDebugState.currentStep,
    bookingDebugState.homeValidationFailure,
    bookingDebugState.homeRenderedFieldIds,
    bookingDebugState.homeRequirements,
    bookingDebugState.formSnapshot,
  ]);

  const contactPayloadKey = useMemo(() => {
    if (!isContactReady) return "";
    return `${state.customerName.trim()}|${state.customerEmail.trim()}`;
  }, [isContactReady, state.customerName, state.customerEmail]);

  const restoreBookingFlowState = (): BookingFlowState | null => {
    if (typeof window === "undefined") return null;
    const saved = window.sessionStorage.getItem(BOOKING_FLOW_SESSION_KEY);
    if (!saved) return null;

    try {
      return JSON.parse(saved) as BookingFlowState;
    } catch {
      return null;
    }
  };

  const clearPersistedBookingFlowState = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(BOOKING_FLOW_SESSION_KEY);
  };

  useEffect(() => {
    const restored = restoreBookingFlowState();
    if (!restored) return;

    setState(restored);
    clearPersistedBookingFlowState();
    skipUrlSearchParamsHydration.current = 1;
    const qs = buildBookingSearchParams(restored).toString();
    router.replace(`${pathname}?${qs}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- session restore runs once on mount
  }, []);

  useEffect(() => {
    if (
      (attemptedNext && stepError) ||
      (attemptedConfirm && !canConfirmDirection) ||
      Boolean(submitError) ||
      Boolean(previewError)
    ) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [
    attemptedNext,
    stepError,
    attemptedConfirm,
    canConfirmDirection,
    submitError,
    previewError,
  ]);

  useEffect(() => {
    if (state.step !== "review") {
      return;
    }

    if (!isBookingReady) {
      setPreviewEstimate(null);
      setPreviewDeepCleanCard(null);
      setPreviewLoading(false);
      setPreviewError(null);
      setPreviewFetchCompleted(false);
      setState((prev) =>
        prev.estimateSnapshot ? { ...prev, estimateSnapshot: null } : prev,
      );
      return;
    }

    if (state.estimateSnapshot?.previewRequestKey === previewRequestKey) {
      setPreviewEstimate({
        priceCents: state.estimateSnapshot.priceCents,
        durationMinutes: state.estimateSnapshot.durationMinutes,
        confidence: state.estimateSnapshot.confidence,
        source: "server",
      });
      setPreviewDeepCleanCard(state.estimateSnapshot.deepCleanProgramCard);
      setPreviewLoading(false);
      setPreviewError(null);
      setPreviewFetchCompleted(true);
      return;
    }

    const ac = new AbortController();
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewFetchCompleted(false);

    const attribution = buildBookingAttributionFromSearchParams(
      new URLSearchParams(attributionQueryKey),
    );

    const payload = buildSubmitBookingDirectionPayload(state, {
      ...attribution,
      ...(isContactReady
        ? {
            customerName: state.customerName.trim(),
            customerEmail: state.customerEmail.trim(),
          }
        : {}),
    });

    void previewBookingDirectionEstimate(payload, { signal: ac.signal })
      .then((r) => {
        if (ac.signal.aborted) return;
        const card = r.deepCleanProgram
          ? mapIntakeDeepCleanSnapshotToCardProgram(r.deepCleanProgram)
          : null;
        setPreviewEstimate({
          priceCents: r.estimate.priceCents,
          durationMinutes: r.estimate.durationMinutes,
          confidence: r.estimate.confidence,
          source: "server",
        });
        setPreviewDeepCleanCard(card);
        setState((prev) => ({
          ...prev,
          estimateSnapshot: {
            previewRequestKey,
            priceCents: r.estimate.priceCents,
            durationMinutes: r.estimate.durationMinutes,
            confidence: r.estimate.confidence,
            source: "server",
            deepCleanProgramCard: card,
          },
        }));
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setPreviewEstimate(null);
        setPreviewDeepCleanCard(null);
        setState((prev) =>
          prev.estimateSnapshot ? { ...prev, estimateSnapshot: null } : prev,
        );
        setPreviewError(
          e instanceof Error
            ? e.message
            : "We couldn’t load an estimate from the server. Fix any issues above or try again.",
        );
      })
      .finally(() => {
        if (ac.signal.aborted) return;
        setPreviewLoading(false);
        setPreviewFetchCompleted(true);
      });

    return () => ac.abort();
  }, [
    state.step,
    isBookingReady,
    previewRequestKey,
    state.estimateSnapshot?.previewRequestKey,
    state.serviceId,
    state.homeSize,
    state.bedrooms,
    state.bathrooms,
    state.pets,
    state.frequency,
    state.preferredTime,
    state.deepCleanProgram,
    state.estimateFactors,
    isContactReady,
    state.customerName,
    state.customerEmail,
    attributionQueryKey,
  ]);

  useEffect(() => {
    if (state.step === "home" && isHomeComplete) {
      setAttemptedNext(false);
    }

    if (state.step === "factors" && isFactorsComplete) {
      setAttemptedNext(false);
    }

    if (state.step === "schedule" && isScheduleComplete) {
      setAttemptedNext(false);
    }
  }, [state.step, isHomeComplete, isFactorsComplete, isScheduleComplete]);

  // URL → STATE (ONLY runs when searchParams change)
  useEffect(() => {
    setState((prev) => {
      if (skipUrlSearchParamsHydration.current > 0) {
        skipUrlSearchParamsHydration.current -= 1;
        return prev;
      }

      const parsed = parseBookingSearchParams(
        new URLSearchParams(searchParams?.toString() ?? ""),
      );

      const mergedBase: BookingFlowState = {
        ...parsed,
        customerName: prev.customerName,
        customerEmail: prev.customerEmail,
      };

      const sameDriving =
        buildBookingEstimateDrivingSignature(mergedBase) ===
        buildBookingEstimateDrivingSignature(prev);

      const merged: BookingFlowState = {
        ...mergedBase,
        recurringIntent: sameDriving ? prev.recurringIntent : undefined,
        recurringSetup: sameDriving ? prev.recurringSetup : undefined,
        estimateSnapshot: sameDriving ? prev.estimateSnapshot : null,
      };

      if (serializeState(merged) === serializeState(prev)) {
        return prev;
      }

      return merged;
    });
  }, [searchParams]);

  // STATE → URL (ONLY runs when state changes)
  useEffect(() => {
    const desired = serializeState(state);
    const current = new URLSearchParams(searchParams?.toString() ?? "").toString();

    if (desired !== current) {
      router.replace(`${pathname}?${desired}`, { scroll: false });
    }
    // ❗️REMOVE searchParams from deps to prevent loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pathname, router]);

  function goToStep(step: BookingStepId) {
    setState((prev) => ({ ...prev, step }));
  }

  function goNext() {
    setAttemptedNext(true);

    console.log("BOOKING_DEBUG_NEXT", {
      currentStep: bookingDebugState.currentStep,
      canContinue: bookingDebugState.canContinue,
      stepError: bookingDebugState.stepError,
      estimateReady: bookingDebugState.estimateReady,
      estimateStale: bookingDebugState.estimateStale,
      decisionEligible: bookingDebugState.decisionEligible,
      recurringEligible: bookingDebugState.recurringEligible,
      formSnapshot: bookingDebugState.formSnapshot,
      payloadSnapshot: bookingDebugState.payloadSnapshot,
    });

    if (stepError) return;

    setAttemptedNext(false);

    if (state.step === "service") return goToStep("home");
    if (state.step === "home") return goToStep("factors");
    if (state.step === "factors") return goToStep("schedule");
    if (state.step === "schedule") return goToStep("review");
    if (state.step === "review") return goToStep("decision");
    if (state.step === "recurring_setup") return goToStep("confirm");
  }

  async function confirmBookingDirection() {
    setSubmitError(null);
    setAttemptedConfirm(true);
    if (!isBookingReady || !isContactReady) return;
    if (!state.estimateSnapshot) {
      setSubmitError(
        "Your estimate snapshot is missing. Go back to review and wait for the estimate to load.",
      );
      return;
    }

    const attribution = buildBookingAttributionFromSearchParams(
      new URLSearchParams(searchParams?.toString() ?? ""),
    );
    const contactExtras = {
      customerName: state.customerName.trim(),
      customerEmail: state.customerEmail.trim(),
      ...attribution,
    };

    if (state.recurringIntent?.type === "recurring") {
      if (!hasRole("customer")) {
        setSubmitError(
          "Please sign in with your customer account to create a recurring plan.",
        );
        return;
      }
      const setupResolved = state.recurringSetup;
      if (!setupResolved || !isRecurringSetupComplete(setupResolved)) {
        setSubmitError(
          "Complete recurring setup: first visit date and arrival window.",
        );
        return;
      }
      const nextAnchorAt = toNextAnchorIso(
        setupResolved.nextAnchorDate,
        setupResolved.timePreference,
      );

      setIsSubmitting(true);
      try {
        const recurringResult = await createRecurringPlan(
          buildCreateRecurringPlanRequest(
            state,
            contactExtras,
            state.recurringIntent.cadence,
            {
              nextAnchorAt,
              preferredTimeWindow: setupResolved.timePreference,
              defaultAddonIds: setupResolved.addonIds,
              preferredFoId: setupResolved.preferredFoId,
              bookingNotes: setupResolved.bookingNotes,
            },
          ),
        );

        const q = new URLSearchParams();
        q.set("recurringPlanId", String(recurringResult.recurringPlan.id));
        q.set(
          "occurrenceStatus",
          String(recurringResult.firstOccurrenceGenerationResult.status),
        );
        const bid = recurringResult.firstOccurrenceGenerationResult.bookingId;
        if (bid) {
          q.set("bookingId", bid);
          q.set("priceCents", String(state.estimateSnapshot.priceCents));
          q.set("durationMinutes", String(state.estimateSnapshot.durationMinutes));
          q.set("confidence", String(state.estimateSnapshot.confidence));
        }
        const genErr =
          recurringResult.firstOccurrenceGenerationResult.generationError;
        if (genErr) {
          q.set("recurringGenError", genErr);
        }
        if (
          isDeepCleaningBookingServiceId(state.serviceId) &&
          state.deepCleanProgram
        ) {
          q.set("dcProgram", state.deepCleanProgram);
        }

        router.push(`/book/confirmation?${q.toString()}`);
      } catch (err) {
        console.error("recurring plan create failed", err);
        setSubmitError(
          err instanceof Error
            ? err.message
            : "We couldn’t create your recurring plan. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitBookingDirectionIntake(
        buildSubmitBookingDirectionPayload(state, contactExtras),
      );

      const q = new URLSearchParams();
      q.set("intakeId", result.intakeId);
      if (
        result.bookingCreated &&
        result.bookingId &&
        result.estimate
      ) {
        q.set("bookingId", result.bookingId);
        q.set("priceCents", String(result.estimate.priceCents));
        q.set("durationMinutes", String(result.estimate.durationMinutes));
        q.set("confidence", String(result.estimate.confidence));
      } else if (result.bookingError?.code) {
        q.set("bookingError", result.bookingError.code);
      }
      if (
        isDeepCleaningBookingServiceId(state.serviceId) &&
        state.deepCleanProgram
      ) {
        q.set("dcProgram", state.deepCleanProgram);
      }

      router.push(`/book/confirmation?${q.toString()}`);
    } catch (err) {
      console.error("booking direction intake failed", err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "We couldn’t save your booking direction. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    console.log("BOOKING_DEBUG_BACK", {
      currentStep: bookingDebugState.currentStep,
      orderedSteps: bookingDebugState.orderedSteps,
      reachableSteps: bookingDebugState.reachableSteps,
    });

    setAttemptedNext(false);

    if (state.step === "confirm") {
      setAttemptedConfirm(false);
      setSubmitError(null);
      if (state.recurringIntent?.type === "recurring") {
        return goToStep("recurring_setup");
      }
      return goToStep("decision");
    }
    if (state.step === "recurring_setup") {
      return goToStep("decision");
    }
    if (state.step === "decision") {
      return goToStep("review");
    }
    if (state.step === "review") {
      setAttemptedConfirm(false);
      setSubmitError(null);
      return goToStep("schedule");
    }
    if (state.step === "schedule") return goToStep("factors");
    if (state.step === "factors") return goToStep("home");
    if (state.step === "home") return goToStep("service");
    return;
  }

  function patchState(patch: Partial<BookingFlowState>) {
    setAttemptedNext(false);
    setAttemptedConfirm(false);
    setSubmitError(null);
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (patchTouchesEstimateSnapshot(patch)) {
        next.estimateSnapshot = null;
        next.recurringSetup = undefined;
      }
      return next;
    });
  }

  function patchContactState(
    patch: Partial<Pick<BookingFlowState, "customerName" | "customerEmail">>,
  ) {
    setSubmitError(null);
    setState((prev) => ({
      ...prev,
      ...patch,
      estimateSnapshot: null,
    }));
  }

  const handleOneTimeDecision = () => {
    setState((current) => ({
      ...current,
      recurringIntent: { type: "one_time" },
      recurringSetup: undefined,
      step: "confirm",
    }));
  };

  const handleRecurringDecision = (cadence: RecurringCadence) => {
    setState((prev) => {
      const next: BookingFlowState = {
        ...prev,
        recurringIntent: { type: "recurring", cadence },
      };

      if (!hasAuthenticatedCustomerSession()) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            BOOKING_FLOW_SESSION_KEY,
            JSON.stringify(next),
          );
        }
        void Promise.resolve().then(() =>
          router.push("/auth/login?redirect=/book"),
        );
        return next;
      }

      return {
        ...next,
        step: "recurring_setup",
        recurringSetup: createDefaultRecurringSetup(
          next.estimateFactors.addonIds ?? [],
        ),
      };
    });
  };

  const recurringAddonOptions = useMemo(
    () =>
      ESTIMATE_ADDON_OPTIONS.map((row) => ({
        id: row.id,
        label: row.label,
      })),
    [],
  );

  useEffect(() => {
    if (
      state.step !== "recurring_setup" ||
      state.recurringIntent?.type !== "recurring" ||
      state.recurringSetup
    ) {
      return;
    }
    setState((prev) => ({
      ...prev,
      recurringSetup: createDefaultRecurringSetup(
        prev.estimateFactors.addonIds ?? [],
      ),
    }));
  }, [state.step, state.recurringIntent, state.recurringSetup]);

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <ServiceHeader />

      <main>
        <section className="border-b border-[#C9B27C]/14">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:py-20">
            <div className="max-w-4xl">
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                Booking flow
              </p>
              <h1 className="mt-4 font-[var(--font-poppins)] text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#0F172A] md:text-6xl">
                A premium booking experience should feel guided, calm, and easy to complete.
              </h1>
              <p className="mt-6 max-w-3xl font-[var(--font-manrope)] text-lg leading-8 text-[#475569] md:text-xl">
                {BOOKING_PAGE_DESCRIPTION}
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
              <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-900">
                <div>
                  <strong>Booking Debug:</strong> {bookingDebugState.currentStep}
                </div>
                <div>canContinue: {String(bookingDebugState.canContinue)}</div>
                <div>stepError: {bookingDebugState.stepError ?? "null"}</div>
                <div>estimateReady: {String(bookingDebugState.estimateReady)}</div>
                <div>estimateStale: {String(bookingDebugState.estimateStale)}</div>
                <div>decisionEligible: {String(bookingDebugState.decisionEligible)}</div>
                <div>recurringEligible: {String(bookingDebugState.recurringEligible)}</div>
              </div>

              {bookingDebugState.currentStep === "home" ? (
                <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                  <div className="mb-1 font-semibold">Home Step Truth</div>
                  <div>
                    homeValidationFailure:{" "}
                    {bookingDebugState.homeValidationFailure ?? "null"}
                  </div>
                  <div>
                    homeRenderedFieldIds:{" "}
                    {(bookingDebugState.homeRenderedFieldIds ?? []).join(", ")}
                  </div>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(bookingDebugState.homeRequirements, null, 2)}
                  </pre>
                </div>
              ) : null}

              <BookingServiceHandoffCard serviceId={state.serviceId} />

              {state.step === "service" ? (
                <BookingStepService
                  serviceId={state.serviceId}
                  onSelect={(serviceId) => {
                    setAttemptedNext(false);
                    setAttemptedConfirm(false);
                    setSubmitError(null);
                    setState((prev) => ({
                      ...prev,
                      serviceId,
                      estimateSnapshot: null,
                      recurringSetup: undefined,
                      deepCleanProgram: isDeepCleaningBookingServiceId(
                        serviceId,
                      )
                        ? prev.deepCleanProgram === "phased_3_visit" ||
                          prev.deepCleanProgram === "single_visit"
                          ? prev.deepCleanProgram
                          : "single_visit"
                        : "",
                    }));
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
                  onChange={(patch) => patchState(patch)}
                />
              ) : null}

              {state.step === "factors" ? (
                <BookingStepEstimateFactors
                  state={state}
                  onChange={(patch) => patchState(patch)}
                />
              ) : null}

              {state.step === "schedule" ? (
                <BookingStepSchedule
                  state={state}
                  onFrequencySelect={(value: BookingFrequencyOption) =>
                    patchState({ frequency: value })
                  }
                  onTimeSelect={(value: BookingTimeOption) =>
                    patchState({ preferredTime: value })
                  }
                />
              ) : null}

              {state.step === "review" ? (
                <BookingStepReview
                  state={state}
                  previewEstimate={estimateForDisplay}
                  previewDeepCleanCard={deepCleanCardForDisplay}
                  previewLoading={previewLoading}
                  previewError={previewError}
                  previewFetchCompleted={previewFetchCompleted}
                  previewErrorRef={errorRef}
                  showContactFieldErrors={
                    (attemptedNext || attemptedConfirm) &&
                    isBookingReady &&
                    !isContactReady
                  }
                  onContactChange={patchContactState}
                />
              ) : null}

              {state.step === "decision" ? (
                <BookingStepDecision
                  onOneTime={handleOneTimeDecision}
                  onRecurring={handleRecurringDecision}
                />
              ) : null}

              {state.step === "recurring_setup" &&
              state.recurringSetup &&
              state.recurringIntent?.type === "recurring" ? (
                <BookingStepRecurringSetup
                  value={state.recurringSetup}
                  foOptions={[]}
                  addonOptions={recurringAddonOptions}
                  onChange={(next) =>
                    setState((prev) => ({ ...prev, recurringSetup: next }))
                  }
                />
              ) : null}

              {state.step === "confirm" ? (
                <BookingStepConfirm state={state} />
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                {state.step !== "service" ? (
                  <button
                    onClick={goBack}
                    className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-white"
                  >
                    Back
                  </button>
                ) : (
                  <Link
                    href={`/services/${state.serviceId}`}
                    className="inline-flex items-center justify-center rounded-full border border-[#C9B27C]/25 px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] transition hover:bg-white"
                  >
                    Back to Service
                  </Link>
                )}

                {state.step === "decision" ? null : state.step === "confirm" ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void confirmBookingDirection()}
                    className="inline-flex items-center justify-center rounded-full bg-[#0D9488] px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b7f76] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Sending…" : "Confirm Booking Direction"}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    aria-disabled={!canContinue}
                    className={`inline-flex items-center justify-center rounded-full px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white transition ${
                      canContinue
                        ? "bg-[#0D9488] shadow-[0_14px_40px_rgba(13,148,136,0.22)] hover:-translate-y-0.5 hover:bg-[#0b7f76]"
                        : "bg-[#94A3B8] shadow-none"
                    }`}
                  >
                    Continue
                  </button>
                )}
              </div>

              {state.step === "confirm" ? (
                submitError ? (
                  <p
                    ref={errorRef}
                    className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                  >
                    {submitError}
                  </p>
                ) : attemptedConfirm && !isBookingReady ? (
                  <p
                    ref={errorRef}
                    className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                  >
                    Please complete home details, job questionnaire, and
                    schedule selections before confirming.
                  </p>
                ) : attemptedConfirm && isBookingReady && !isContactReady ? (
                  <p
                    ref={errorRef}
                    className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                  >
                    Please add your name and a valid email before confirming.
                  </p>
                ) : null
              ) : state.step === "review" ? (
                submitError ? (
                  <p
                    ref={errorRef}
                    className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                  >
                    {submitError}
                  </p>
                ) : attemptedNext && stepError ? (
                  <p
                    ref={errorRef}
                    className="font-[var(--font-manrope)] text-sm font-medium text-[#B91C1C]"
                  >
                    {stepError}
                  </p>
                ) : null
              ) : attemptedNext && stepError ? (
                <p
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
                previewEstimate={estimateForDisplay}
                previewLoading={previewLoading}
                previewError={previewError}
              />

              <section className="rounded-[32px] border border-[#C9B27C]/16 bg-[#0F172A] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                  Why this matters
                </p>
                <h2 className="mt-4 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-white">
                  Premium conversion is not just about aesthetics.
                </h2>
                <p className="mt-4 font-[var(--font-manrope)] text-base leading-8 text-white/75">
                  This creates the exact front-end structure we need before connecting actual
                  service data, pricing, availability, and booking state.
                </p>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <PublicSiteFooter />

      <BookingFlowDebugPanel state={bookingDebugState} />
    </div>
  );
}
