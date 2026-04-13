export type RecurringPlanCreateInput = {
  customerId: string;
  cadence: "weekly" | "biweekly" | "monthly";
  serviceType: string;
  preferredTimeWindow?: string;
  preferredFoId?: string;
  bookingNotes?: string;
  defaultAddonIds: string[];
  nextAnchorAt: Date;
  estimateSnapshot: Record<string, unknown>;
  pricingSnapshot: Record<string, unknown>;
  intakeSnapshot: Record<string, unknown>;
  addressSnapshot: Record<string, unknown>;
};

export type OccurrenceProcessingState =
  | "ready"
  | "processing"
  | "failed"
  | "completed";

export type OccurrenceReconciliationState =
  | "clean"
  | "booking_created_occurrence_pending"
  | "needs_manual_review";

export type ProcessOccurrenceResult =
  | {
      kind: "already_claimed";
      occurrenceId: string;
    }
  | {
      kind: "already_completed";
      occurrenceId: string;
      bookingId?: string;
    }
  | {
      kind: "processed_success";
      occurrenceId: string;
      bookingId: string;
    }
  | {
      kind: "processed_failure";
      occurrenceId: string;
      generationError: string;
    };

export type OccurrenceGenerationResult = {
  occurrenceId: string;
  bookingId?: string;
  status:
    | "pending_generation"
    | "booking_created"
    | "scheduled"
    | "needs_review";
  generationError?: string;
};

/** Derived reconciliation for customer recurring APIs (not persisted). */
export type PlanCancellationEffect =
  | "none"
  | "plan_only"
  | "plan_and_unbooked_occurrence"
  | "booking_linked_but_not_canceled"
  | "booking_canceled";

export type NextOccurrenceDisposition =
  | "unchanged"
  | "canceled"
  | "skipped"
  | "booking_retained";

export type PlanReconciliationFields = {
  hasUpcomingBookedOccurrence: boolean;
  upcomingBookedOccurrenceId?: string;
  upcomingBookedOccurrenceStatus?: string;
  planCancellationEffect: PlanCancellationEffect;
};

export type RecurringPlanLifecycleResponseMeta = {
  downstreamBookingEffect: "not_attempted" | "unsupported" | "applied";
  downstreamBookingEffectReason?: string;
  nextOccurrenceDisposition: NextOccurrenceDisposition;
};
