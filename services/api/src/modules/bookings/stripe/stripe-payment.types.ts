import type { BookingPaymentStatus } from "@prisma/client";

export interface StripeCheckoutCreateInput {
  bookingId: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeBookingPaymentUpdate {
  bookingId: string;
  paymentStatus: BookingPaymentStatus;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  paymentReference?: string | null;
  paymentCheckoutUrl?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  note?: string | null;
  eventType: string;
  stripeEventId?: string | null;
  payload?: Record<string, unknown> | null;
}
