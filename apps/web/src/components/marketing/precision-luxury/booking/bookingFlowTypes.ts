import type { BookingStepId } from "@/lib/booking/bookingProductContract";
import type { DeepCleanProgramDisplay } from "@/types/deepCleanProgram";
import type { BookingEstimateFactorsState } from "./bookingEstimateFactors";

export type { BookingStepId };

export type RecurringCadence = "weekly" | "biweekly" | "monthly";

export type RecurringIntent =
  | {
      type: "one_time";
    }
  | {
      type: "recurring";
      cadence: RecurringCadence;
    };

export type RecurringTimePreference =
  | "morning"
  | "midday"
  | "afternoon"
  | "anytime";

export type RecurringSetupState = {
  /** YYYY-MM-DD */
  nextAnchorDate: string;
  timePreference: RecurringTimePreference;
  preferredFoId?: string;
  bookingNotes?: string;
  addonIds: string[];
};

export type BookingServiceOption = {
  id: string;
  title: string;
  body: string;
  meta: string;
};

export type BookingFrequencyOption =
  | "Weekly"
  | "Bi-Weekly"
  | "Monthly"
  | "One-Time";

export type BookingTimeOption =
  | "Weekday Morning"
  | "Weekday Afternoon"
  | "Friday"
  | "Saturday";

/** Public deep clean product; empty when service is not deep clean. */
export type BookingDeepCleanProgramChoice = "single_visit" | "phased_3_visit";

/** Immutable server estimate + UI card, keyed to the preview request inputs. */
export type BookingEstimateSnapshot = {
  previewRequestKey: string;
  priceCents: number;
  durationMinutes: number;
  confidence: number;
  source: "server";
  deepCleanProgramCard: DeepCleanProgramDisplay | null;
};

/**
 * Hybrid scheduling: exact arrival window when availability + JWT hold path is used;
 * otherwise honest preference-only capture.
 */
export type ScheduleSelection = {
  mode: "preference_only" | "slot_selection";
  preferredTime?: string | null;
  preferredDayWindow?: string | null;
  flexibilityNotes?: string | null;
  selectedSlotId?: string | null;
  selectedSlotLabel?: string | null;
  selectedSlotDate?: string | null;
  selectedSlotWindowStart?: string | null;
  selectedSlotWindowEnd?: string | null;
  /** Franchise owner id for the selected window (matches preferred cleaner `cleanerId` in funnel). */
  selectedSlotFoId?: string | null;
  holdId?: string | null;
  holdExpiresAt?: string | null;
  /** Set client-side after `confirm-hold` succeeds (optional echo on handoff). */
  slotHoldConfirmed?: boolean;
};

export type CleanerPreference = {
  mode: "none" | "preferred_cleaner";
  cleanerId?: string | null;
  cleanerLabel?: string | null;
  hardRequirement?: boolean;
  preferenceNotes?: string | null;
};

export type BookingFlowState = {
  step: BookingStepId;
  serviceId: string;
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  /** Optional ops note; not used in estimator (pet detail lives in `estimateFactors`). */
  pets: string;
  /** Explicit questionnaire → `EstimateInput` (no silent defaults). */
  estimateFactors: BookingEstimateFactorsState;
  /** Empty until user selects a valid option (URL/parser may omit). */
  frequency: BookingFrequencyOption | "";
  /** Empty until user selects a valid option (URL/parser may omit). */
  preferredTime: BookingTimeOption | "";
  /** Richer schedule intent for confirm / ops handoff (not yet on booking-direction DTO). */
  scheduleSelection?: ScheduleSelection;
  /** Cleaner / team preference (funnel-only until API exposes a first-class field). */
  cleanerPreference?: CleanerPreference;
  /** Set when `serviceId` is deep clean; otherwise "". */
  deepCleanProgram: BookingDeepCleanProgramChoice | "";
  /**
   * Contact capture for the funnel (Phase 3). Intentionally not mirrored in URL
   * query params to avoid leaking PII through referrers and server logs.
   */
  customerName: string;
  customerEmail: string;
  recurringIntent?: RecurringIntent;
  recurringSetup?: RecurringSetupState;
  estimateSnapshot?: BookingEstimateSnapshot | null;
};

export type BookingStepDefinition = {
  id: BookingStepId;
  order: number;
  label: string;
};

/** Server-backed estimate shown on the review step (no client fallback). */
export type FunnelReviewEstimate = {
  priceCents: number;
  durationMinutes: number;
  confidence: number;
  source: "server";
};
