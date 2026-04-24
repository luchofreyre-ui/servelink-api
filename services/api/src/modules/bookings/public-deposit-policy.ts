/** Fixed public-booking deposit (USD cents). */
export const PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS = 10_000;

/** Cancel before this many ms ahead of `scheduledStart` → deposit refundable. */
export const PUBLIC_BOOKING_DEPOSIT_REFUND_WINDOW_MS = 48 * 60 * 60 * 1000;

export function computeRemainingBalanceAfterDepositCents(args: {
  estimatedTotalCents: number;
  depositAmountCents?: number;
}): number {
  const dep = Math.max(
    0,
    Math.floor(Number(args.depositAmountCents ?? PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS)),
  );
  const total = Math.max(0, Math.floor(Number(args.estimatedTotalCents)));
  return Math.max(0, total - dep);
}

/**
 * Cancellation fee rules for the public deposit (foundation only — no Stripe refund here).
 */
export function computePublicDepositCancellationPolicy(args: {
  scheduledStart: Date;
  now: Date;
  depositAmountCents: number;
}): { depositRefundable: boolean; cancellationFeeCents: number } {
  const msUntil = args.scheduledStart.getTime() - args.now.getTime();
  const depositRefundable = msUntil > PUBLIC_BOOKING_DEPOSIT_REFUND_WINDOW_MS;
  const dep = Math.max(0, Math.floor(Number(args.depositAmountCents)));
  if (depositRefundable) {
    return { depositRefundable: true, cancellationFeeCents: 0 };
  }
  return {
    depositRefundable: false,
    cancellationFeeCents: Math.min(PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS, dep),
  };
}
