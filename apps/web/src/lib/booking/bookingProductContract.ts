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
  | "provider_aware_slot_selection";

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

  /** Target: slot-level booking once a public funnel API exists; today the funnel uses honest preference capture only. */
  schedulingMode: "slot_selection" as SchedulingMode,

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
