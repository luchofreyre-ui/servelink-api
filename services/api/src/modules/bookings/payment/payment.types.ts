import type { BookingPaymentStatus } from "@prisma/client";

export type BookingPaymentEventKind =
  | "PAYMENT_CHECKOUT_CREATED"
  | "PAYMENT_STATUS_CHANGED"
  | "PAYMENT_ADMIN_OVERRIDE";

export interface BookingCheckoutSession {
  provider: "stripe";
  checkoutUrl: string;
  reference: string;
  amountCents: number;
  currency: string;
  status: BookingPaymentStatus;
}

export interface CreateBookingCheckoutInput {
  actorUserId?: string | null;
  actorRole?: string | null;
  successUrl?: string | null;
  cancelUrl?: string | null;
}

export interface UpdateBookingPaymentStatusInput {
  nextStatus: BookingPaymentStatus;
  actorUserId?: string | null;
  actorRole?: string | null;
  note?: string | null;
  payload?: Record<string, unknown> | null;
}
