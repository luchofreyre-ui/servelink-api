/**
 * Mirrors API `BookingPaymentStatus` — include full enum so we never lie to the UI.
 */
export type BookingPaymentStatus =
  | "unpaid"
  | "checkout_created"
  | "payment_pending"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded"
  | "waived";

export interface BookingCommercialFields {
  quotedSubtotal: number | null;
  quotedMargin: number | null;
  quotedTotal: number | null;
  paymentStatus: BookingPaymentStatus | null;
  paymentIntentId: string | null;
}

export interface BookingStatusResponse extends BookingCommercialFields {
  id: string;
  status: string;
  scheduledStart: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CreatePaymentIntentResponse {
  reused: boolean;
  paymentIntentId: string;
  clientSecret: string | null;
  status: string;
}

export interface ConfirmPaymentResponse {
  ok: true;
  bookingId: string;
  paymentIntentId: string;
  status: "paid";
  idempotent?: true;
  paymentId?: string | null;
}

export interface BookingPaymentRecord {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  externalRef?: string | null;
}

export interface BookingTrustEvent {
  id: string;
  type: string;
  createdAt: string;
  payload?: Record<string, unknown> | null;
}

export interface BookingOpsAnomaly {
  id: string;
  type: string;
  status: string;
  title: string;
  detail?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface AdminBookingOperationalDetail extends BookingCommercialFields {
  id: string;
  status: string;
  scheduledStart: string | null;
  startedAt: string | null;
  completedAt: string | null;
  payments: BookingPaymentRecord[];
  trustEvents: BookingTrustEvent[];
  opsAnomalies: BookingOpsAnomaly[];
}

/** Prisma-backed ops anomalies (payment_missing, payment_mismatch, …) — GET /api/v1/admin/anomalies */
export type AdminPrismaOpsAnomalyItem = {
  id: string;
  type: string;
  status: string;
  title: string;
  detail?: string | null;
  createdAt: string;
  booking?: {
    id: string;
    status: string;
    scheduledStart?: string | null;
  } | null;
  fo?: {
    id: string;
    displayName?: string | null;
  } | null;
};
