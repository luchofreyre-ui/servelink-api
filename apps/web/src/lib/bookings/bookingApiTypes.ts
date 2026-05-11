/**
 * API-aligned booking types (GET /api/v1/bookings/:id and related responses).
 * Source of truth for UI that reflects persisted booking state.
 */

export type BookingStatus =
  | "pending_payment"
  | "pending_dispatch"
  | "hold"
  | "review"
  | "offered"
  | "assigned"
  | "accepted"
  | "en_route"
  | "active"
  | "in_progress"
  | "completed"
  | "canceled"
  | "cancelled"
  | "exception";

export type BookingPaymentStatus =
  | "unpaid"
  | "checkout_created"
  | "payment_pending"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded"
  | "waived";

export type BookingCheckoutSession = {
  provider: "stripe";
  checkoutUrl: string;
  reference: string;
  amountCents: number;
  currency: string;
  status: BookingPaymentStatus;
};

export type BookingEvent = {
  id: string;
  bookingId: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: string;
  idempotencyKey?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  source?: string | null;
  environment?: string | null;
  eligibleForTraining?: boolean | null;
  governanceReason?: string | null;
  createdBy?: string | null;
  payload?: Record<string, unknown> | null;
};

export type ControlledCompletionAudit = {
  exists: boolean;
  executedBy: string | null;
  executedAt: string | null;
  reason: string | null;
  note: string | null;
  actualMinutes: number | null;
  previousStatus: string | null;
  nextStatus: string | null;
  source: "SYNTHETIC" | null;
  environment: "SANDBOX" | null;
  eligibleForTraining: false | null;
  confirmationReceived: boolean | null;
};

export type BookingEstimateSnapshotRecord = {
  id: string;
  bookingId: string;
  estimatorVersion: string | null;
  mode: string | null;
  confidence: number | null;
  riskPercentUncapped: number | null;
  riskPercentCappedForRange: number | null;
  riskCapped: boolean | null;
  inputJson: string | null;
  outputJson: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

/** Compact list summary derived from persisted estimate snapshot (governance V1). */
export type EstimateGovernanceSummary = {
  escalationLevel: string;
  severityScore: number;
  confidenceClassification: string;
  weakestDomainCount: number;
  criticalDomainCount: number;
  lowDomainCount: number;
  hasRecurringInstability: boolean;
  hasPriceCollapseSignal: boolean;
  hasSparseIntakeSignal: boolean;
  recommendedActionCount: number;
  bookingDetailAnchor: "#estimate-governance";
};

export type BookingCustomerRecord = {
  id: string;
  email: string | null;
  phone: string | null;
  role?: string | null;
};

export type BookingFoRecord = {
  id: string;
  userId?: string | null;
  displayName?: string | null;
};

/** Core booking row returned by GET /api/v1/bookings/:id */
export interface BookingRecord {
  id: string;
  customerId: string;
  status: BookingStatus;
  hourlyRateCents: number;
  estimatedHours: number;
  currency: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  stripeLastEventId?: string | null;
  stripeClientSecret?: string | null;
  scheduledStart?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  foId?: string | null;
  geofenceRadiusMeters?: number | null;
  siteLat?: number | null;
  siteLng?: number | null;
  lastInsideAt?: string | null;
  outsideSinceAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  priceSubtotal?: number | null;
  priceTotal?: number | null;
  margin?: number | null;
  quotedSubtotal?: string | number | null;
  quotedMargin?: string | number | null;
  quotedTotal?: string | number | null;
  paymentStatus?: BookingPaymentStatus;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  paymentCheckoutUrl?: string | null;
  paymentAmountCents?: number | null;
  paymentCurrency?: string | null;
  paymentAuthorizedAt?: string | null;
  paymentPaidAt?: string | null;
  paymentFailedAt?: string | null;
  paymentWaivedAt?: string | null;
  paymentMeta?: Record<string, unknown> | null;
  paymentIntentId?: string | null;
  acceptedAt?: string | null;
  enRouteAt?: string | null;
  /** Present when the list/detail response included booking events. */
  events?: BookingEvent[];
  /** Derived from the latest CONTROLLED_COMPLETION_AUDIT booking event. */
  controlledCompletionAudit?: ControlledCompletionAudit | null;
  /** Present on detail responses. */
  estimateSnapshot?: BookingEstimateSnapshotRecord | null;
  /** Present on admin list payloads when governance V1 exists on the snapshot. */
  governanceSummary?: EstimateGovernanceSummary | null;
  customer?: BookingCustomerRecord | null;
  fo?: BookingFoRecord | null;
}

export type CreateBookingInput = {
  estimateInput: Record<string, unknown>;
  note?: string;
};

export type UpdateBookingInput = Record<string, unknown>;

export type AssignBookingInput = {
  foId: string;
  note?: string;
  assignmentSource?: "manual" | "recommended";
  recommendationSummary?: Record<string, unknown>;
};

export type AssignmentReason = {
  code: string;
  message: string;
};

export type AssignmentWorkloadSnapshot = {
  activeAssignedCount: number;
  inProgressPipelineCount: number;
  todayScheduledCount: number;
};

export type AssignmentCandidate = {
  foUserId: string;
  foId: string;
  displayName: string;
  workload: AssignmentWorkloadSnapshot;
  capacityScore: number;
  regionMatchScore: number;
  serviceAreaFitScore: number;
  geographyPlaceholderScore: number;
  finalRecommendationScore: number;
  reasons: AssignmentReason[];
};

export type AssignmentRecommendation = {
  rank: number;
  recommended: boolean;
  candidate: AssignmentCandidate;
};

/** Use `nextStatus` for POST /api/v1/bookings/:id/transition, or legacy `transition` for segment routes. */
export type TransitionBookingInput =
  | {
      nextStatus: BookingStatus;
      note?: string;
      scheduledStart?: string;
      foId?: string;
      actorUserId?: string | null;
      actorRole?: string | null;
    }
  | {
      transition: "schedule" | "start" | "complete" | "cancel" | "reopen";
      note?: string;
      scheduledStart?: string;
    };

/** GET /api/v1/admin/payments/ops-summary */
export type AdminPaymentOpsSummary = {
  openAnomalyCount: number;
  recentWebhookFailureCount: number;
  stuckPendingPaymentShortCount: number;
  stuckPendingPaymentLongCount: number;
  duplicateWebhookRecentCount: number;
  paidMissingStripeIdsCount: number;
  stripeIdsButUnpaidCount: number;
  webhookReceiptsMissingBookingEventCount: number;
};

/** GET /api/v1/admin/payments/anomalies */
export type AdminPaymentAnomalyRow = {
  id: string;
  bookingId: string | null;
  kind: string;
  severity: string;
  message: string;
  detectedAt: string;
  stripeEventId: string | null;
};
