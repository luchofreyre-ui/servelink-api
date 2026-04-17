export type LifecycleBookingSource =
  | "manual_booking"
  | "booking_direction_submit"
  | "recurring_occurrence";

export type LifecycleBookingAuthorityInput = {
  source: LifecycleBookingSource;
  customerId?: string | null;
  bookingId?: string | null;
  recurringPlanId?: string | null;
  recurringOccurrenceId?: string | null;
  tenantId?: string | null;
  host?: string | null;
  /** When true, unknown explicit `tenantId` values fail fast (orchestrator-owned boundary). */
  validateExplicitTenant?: boolean;
  estimateInput: Record<string, unknown>;
  intakeSnapshot?: Record<string, unknown> | null;
  estimateSnapshot?: Record<string, unknown> | null;
  pricingSnapshot?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export type LifecycleBookingAuthorityResult = {
  ok: boolean;
  bookingId: string | null;
  source: LifecycleBookingSource;
  created: boolean;
  dispatchEligible: boolean;
  paymentRequired: boolean;
  message: string;
  authorityOwner: "orchestrator";
  mode: "wrapper_only";
  /** Canonical tenant id for downstream booking writes (always non-empty after successful preflight). */
  tenantId: string;
};

export type LifecycleDispatchReadiness = {
  bookingId: string;
  paymentRequired: boolean;
  paymentSatisfied: boolean;
  dispatchEligible: boolean;
  reason: string | null;
};
