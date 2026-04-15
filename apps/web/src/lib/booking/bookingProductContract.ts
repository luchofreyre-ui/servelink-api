/**
 * Machine-readable booking product contract.
 * Human narrative: `BOOKING_PRODUCT_TRUTH.md`.
 */

export type BookingStepId =
  | "service"
  | "home"
  | "factors"
  | "schedule"
  | "review"
  | "decision"
  | "recurring_setup"
  | "confirm";

export type BookingPathKind = "one_time" | "recurring";

export type BookingAuthPoint =
  | "none"
  | "before_recurring_setup"
  | "before_confirm"
  | "after_confirm_intent_capture";

export type SchedulingMode =
  | "preference_only"
  | "slot_selection"
  | "provider_aware_slot_selection"
  /** Product label: slot-backed path when API + JWT allow; explicit preference fallback otherwise. */
  | "hybrid_slot_or_preference";

/** How widely the availability API fans out before the user picks a provider-backed window. */
export type AvailabilityScope =
  | "preferred_provider_only"
  | "multi_provider_candidates";

export type CleanerSelectionMode =
  | "none"
  | "preferred_cleaner"
  | "hard_cleaner_selection"
  | "best_match_only";

export type ConfirmRequirement =
  | "estimate_snapshot"
  | "recurring_setup_complete"
  | "schedule_complete"
  | "cleaner_rule_satisfied";

/**
 * `/book` query serialization for path truth (deep links, refresh, auth resume).
 * Write/parse/precedence rules live in
 * `apps/web/src/components/marketing/precision-luxury/booking/bookingUrlState.ts`.
 */
export const BOOKING_URL_SERIALIZATION = {
  cadenceParam: "cadence",
  bookingPathParam: "bookingPath",
  recurringBookingPath: "recurring",
  oneTimeBookingPath: "one_time",
  recAnchorParam: "recAnchor",
  recTimeParam: "recTime",
} as const;

/**
 * First-pass server assignment / capacity outcomes (dispatch module + intake bridge).
 * Intake persistence includes `liveInputs` (minimal active roster snapshot + recurring continuity
 * context when applicable) next to `constraints` and `evaluation`.
 */
export const ASSIGNMENT_CAPACITY_ENGINE = {
  version: "v1_first_pass" as const,
  /**
   * Provider recommendation is scored ranking (`provider-ranking.service.ts`), not arbitrary id order.
   * `recommendationConfidence` may force `needs_review` when only thin roster signals exist.
   */
  providerRankingVersion: "v1_scored" as const,
  decisionStatuses: [
    "assignable",
    "needs_review",
    "deferred",
    "unassignable",
  ] as const,
} as const;

export const BOOKING_PRODUCT_CONTRACT = {
  canonicalStepOrder: [
    "service",
    "home",
    "factors",
    "schedule",
    "review",
    "decision",
    "recurring_setup",
    "confirm",
  ] as const,

  oneTimePathKind: "one_time" as const,
  recurringPathKind: "recurring" as const,

  /** Recurring plan creation uses customer JWT; enforced at final submit, not at cadence pick. */
  recurringAuthPoint: "before_confirm" as BookingAuthPoint,

  /**
   * Hybrid scheduling: `slot_selection` captures a concrete FO + ISO window from aggregated
   * `GET /bookings/availability/windows/aggregate` (or legacy single-FO `.../windows`) when
   * JWT + data allow; holds use `POST /bookings/availability/holds` then `POST /bookings/:id/confirm-hold`.
   * Otherwise `preference_only` is used.
   */
  schedulingMode: "hybrid_slot_or_preference" as SchedulingMode,

  /**
   * Availability fan-out: multi-provider candidate roster (deterministic) with preferred FO
   * prioritized; still hybrid — empty aggregate → preference fallback.
   */
  availabilityScope: "multi_provider_candidates" as AvailabilityScope,

  /**
   * `preferredFoId` on `GET .../availability/windows/aggregate` is the persisted
   * `FranchiseOwner.id` string (Prisma `@default(cuid())`), not UUID-shaped by default.
   * The API validates a bounded non-empty string and resolves existence server-side;
   * unknown ids are ignored so aggregation still returns candidate windows.
   */
  aggregatePreferredFoIdKind: "franchise_owner_id" as const,

  /** Preferred cleaner / team request when data exists; never fake provider cards. */
  cleanerSelectionMode: "preferred_cleaner" as CleanerSelectionMode,

  confirmRequirements: [
    "estimate_snapshot",
    "schedule_complete",
  ] as const,

  recurringConfirmRequirements: [
    "estimate_snapshot",
    "recurring_setup_complete",
    "schedule_complete",
  ] as const,
} as const;
