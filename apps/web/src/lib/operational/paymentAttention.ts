/**
 * Canonical payment-attention semantics — aligned with
 * `CUSTOMER_PAYMENT_ATTENTION` / `FO_PAYMENT_ATTENTION` in
 * `booking-screen.service.ts` (API operational counts).
 */
export const PAYMENT_ATTENTION_STATUSES = new Set([
  "unpaid",
  "checkout_created",
  "payment_pending",
  "failed",
]);

export function isPaymentAttentionStatus(paymentStatus: string | null | undefined): boolean {
  return typeof paymentStatus === "string" && PAYMENT_ATTENTION_STATUSES.has(paymentStatus);
}

/** Matches API gate for scheduling from pending_payment toward dispatch (authorized | paid | waived). */
export function paymentStatusAllowsScheduleToDispatch(
  paymentStatus: string | null | undefined,
): boolean {
  const ps = paymentStatus ?? "";
  return ps === "authorized" || ps === "paid" || ps === "waived";
}
