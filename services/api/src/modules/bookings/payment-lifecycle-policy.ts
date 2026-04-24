import type { BookingStatus } from "@prisma/client";
import {
  BookingPublicDepositStatus,
  BookingRemainingBalancePaymentStatus,
} from "@prisma/client";
import {
  computePublicDepositCancellationPolicy,
  computeRemainingBalanceAfterDepositCents,
} from "./public-deposit-policy";

export function computeRemainingBalanceCents(args: {
  estimatedTotalCents: number;
  depositAmountCents: number;
}): number {
  return computeRemainingBalanceAfterDepositCents({
    estimatedTotalCents: args.estimatedTotalCents,
    depositAmountCents: args.depositAmountCents,
  });
}

export function computeCancellationPolicy(args: {
  scheduledStart: Date;
  now: Date;
  depositAmountCents: number;
}): { depositRefundable: boolean; cancellationFeeCents: number } {
  return computePublicDepositCancellationPolicy(args);
}

const ASSIGNED_OR_SCHEDULED_STATUSES: ReadonlySet<BookingStatus> = new Set([
  "pending_dispatch",
  "offered",
  "assigned",
  "accepted",
  "en_route",
  "active",
  "in_progress",
]);

function hasTerminalBalanceAuthorizationOrCapture(
  s: BookingRemainingBalancePaymentStatus,
): boolean {
  return s === "balance_authorized" || s === "balance_captured";
}

/**
 * Eligibility for creating/confirming the T-24h remaining-balance manual-capture PaymentIntent.
 */
export function computeRemainingBalanceAuthorizationEligibility(args: {
  scheduledStart: Date | null;
  now: Date;
  remainingBalanceCents: number | null;
  bookingStatus: BookingStatus;
  depositStatus: BookingPublicDepositStatus;
  balanceStatus: BookingRemainingBalancePaymentStatus;
}): { eligible: boolean; reason?: string } {
  if (args.bookingStatus === "canceled" || args.bookingStatus === "cancelled") {
    return { eligible: false, reason: "booking_canceled" };
  }
  if (args.bookingStatus === "completed") {
    return { eligible: false, reason: "booking_completed" };
  }
  if (!ASSIGNED_OR_SCHEDULED_STATUSES.has(args.bookingStatus)) {
    return { eligible: false, reason: "booking_not_scheduled_equivalent" };
  }
  if (args.depositStatus !== BookingPublicDepositStatus.deposit_succeeded) {
    return { eligible: false, reason: "deposit_not_succeeded" };
  }
  const remaining = args.remainingBalanceCents;
  if (remaining == null || remaining <= 0) {
    return { eligible: false, reason: "no_remaining_balance" };
  }
  if (!args.scheduledStart) {
    return { eligible: false, reason: "missing_scheduled_start" };
  }
  const startMs = args.scheduledStart.getTime();
  const nowMs = args.now.getTime();
  const msUntilStart = startMs - nowMs;
  if (msUntilStart <= 0) {
    return { eligible: false, reason: "scheduled_start_not_future" };
  }
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  if (msUntilStart > twentyFourHoursMs) {
    return { eligible: false, reason: "outside_authorization_window" };
  }
  if (hasTerminalBalanceAuthorizationOrCapture(args.balanceStatus)) {
    return { eligible: false, reason: "balance_already_authorized_or_captured" };
  }
  return { eligible: true };
}

export function computeRemainingBalanceCaptureEligibility(args: {
  bookingStatus: BookingStatus;
  balanceStatus: BookingRemainingBalancePaymentStatus;
  completedAt: Date | null;
}): { eligible: boolean; reason?: string } {
  if (args.bookingStatus !== "completed") {
    return { eligible: false, reason: "booking_not_completed" };
  }
  if (!args.completedAt) {
    return { eligible: false, reason: "missing_completed_at" };
  }
  if (args.balanceStatus !== "balance_authorized") {
    return { eligible: false, reason: "balance_not_authorized" };
  }
  return { eligible: true };
}

export function initialRemainingBalanceStatusFromRemainingCents(
  remainingBalanceAfterDepositCents: number | null | undefined,
): BookingRemainingBalancePaymentStatus {
  if (
    remainingBalanceAfterDepositCents != null &&
    remainingBalanceAfterDepositCents > 0
  ) {
    return BookingRemainingBalancePaymentStatus.balance_pending_authorization;
  }
  return BookingRemainingBalancePaymentStatus.balance_not_required;
}
