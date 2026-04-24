import { Injectable, Logger } from "@nestjs/common";
import {
  BookingDepositRefundStatus,
  BookingPublicDepositStatus,
  BookingRemainingBalancePaymentStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { StripePaymentService } from "../bookings/stripe/stripe-payment.service";

const REMAINING_RECONCILE_STATUSES: BookingRemainingBalancePaymentStatus[] = [
  BookingRemainingBalancePaymentStatus.balance_pending_authorization,
  BookingRemainingBalancePaymentStatus.balance_authorization_required,
  BookingRemainingBalancePaymentStatus.balance_authorized,
  BookingRemainingBalancePaymentStatus.balance_authorization_failed,
  BookingRemainingBalancePaymentStatus.balance_capture_failed,
];

@Injectable()
export class PaymentLifecycleReconciliationService {
  private readonly log = new Logger(PaymentLifecycleReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripePayments: StripePaymentService,
  ) {}

  async findBookingsForLifecycleReconciliation(args: {
    limit: number;
  }): Promise<string[]> {
    const take = Math.max(1, Math.min(200, Math.floor(args.limit)));
    const rows = await this.prisma.booking.findMany({
      where: {
        OR: [
          { remainingBalancePaymentIntentId: { not: null } },
          { remainingBalanceStatus: { in: REMAINING_RECONCILE_STATUSES } },
          { depositRefundId: { not: null } },
          {
            depositRefundStatus: {
              in: [
                BookingDepositRefundStatus.refund_pending,
                BookingDepositRefundStatus.refund_failed,
              ],
            },
          },
        ],
      },
      select: { id: true },
      take,
      orderBy: { updatedAt: "asc" },
    });
    return rows.map((r) => r.id);
  }

  async reconcileBookingPaymentLifecycle(bookingId: string): Promise<{
    touched: boolean;
    detail?: string;
  }> {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return { touched: false, detail: "stripe_not_configured" };
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        remainingBalancePaymentIntentId: true,
        remainingBalanceStatus: true,
        remainingBalanceAuthorizedAt: true,
        remainingBalanceCapturedAt: true,
        remainingBalanceAuthorizationFailureReason: true,
        publicDepositPaymentIntentId: true,
        publicDepositStatus: true,
        depositRefundStatus: true,
        depositRefundId: true,
        depositRefundedAt: true,
      },
    });
    if (!booking) {
      return { touched: false, detail: "booking_not_found" };
    }

    let touched = false;
    const details: string[] = [];

    if (
      booking.depositRefundStatus === BookingDepositRefundStatus.refund_pending &&
      !booking.depositRefundId?.trim()
    ) {
      this.log.warn({
        kind: "payment_lifecycle_reconcile",
        event: "refund_pending_missing_refund_id",
        bookingId,
      });
      details.push("refund_pending_missing_refund_id");
    }

    const refundId = booking.depositRefundId?.trim() ?? null;
    if (refundId) {
      if (booking.depositRefundStatus === BookingDepositRefundStatus.refund_succeeded) {
        details.push("deposit_refund_already_succeeded_no_downgrade");
      } else {
        try {
          const rf = await this.stripePayments.retrieveRefundForDepositReconciliation(refundId);
          const expectedPi = booking.publicDepositPaymentIntentId?.trim() || null;
          if (rf.paymentIntentId && expectedPi && rf.paymentIntentId !== expectedPi) {
            this.log.error({
              kind: "payment_lifecycle_reconcile",
              event: "deposit_refund_payment_intent_mismatch",
              bookingId,
              expectedPaymentIntentId: expectedPi,
              observedPaymentIntentId: rf.paymentIntentId,
            });
            details.push("deposit_refund_pi_mismatch");
          } else {
            const st = (rf.status ?? "").toLowerCase();
            if (
              st !== "succeeded" &&
              st !== "pending" &&
              st !== "failed" &&
              st !== "canceled"
            ) {
              this.log.warn({
                kind: "payment_lifecycle_reconcile",
                event: "deposit_refund_unknown_status",
                bookingId,
                stripeRefundStatus: rf.status,
              });
              details.push(`deposit_refund_unknown_status_${st || "empty"}`);
            } else {
              const patch: Prisma.BookingUpdateInput = {};
              if (st === "succeeded") {
                patch.depositRefundStatus = BookingDepositRefundStatus.refund_succeeded;
                patch.depositRefundedAt = booking.depositRefundedAt ?? new Date();
                if (
                  booking.publicDepositStatus !==
                  BookingPublicDepositStatus.cancellation_fee_retained
                ) {
                  patch.publicDepositStatus = BookingPublicDepositStatus.refunded;
                }
              } else if (st === "pending") {
                patch.depositRefundStatus = BookingDepositRefundStatus.refund_pending;
              } else if (st === "failed" || st === "canceled") {
                patch.depositRefundStatus = BookingDepositRefundStatus.refund_failed;
              }

              if (Object.keys(patch).length > 0) {
                await this.prisma.booking.update({
                  where: { id: bookingId },
                  data: patch,
                });
                touched = true;
                this.log.log({
                  kind: "payment_lifecycle_reconcile",
                  event: "deposit_refund_updated",
                  bookingId,
                  refundId,
                  stripeRefundStatus: rf.status,
                });
                details.push("deposit_refund_reconciled");
              }
            }
          }
        } catch (e) {
          this.log.warn({
            kind: "payment_lifecycle_reconcile",
            event: "deposit_refund_retrieve_failed",
            bookingId,
            refundId,
            message: e instanceof Error ? e.message : String(e),
          });
          details.push("deposit_refund_retrieve_failed");
        }
      }
    }

    const piId = booking.remainingBalancePaymentIntentId?.trim();
    if (!piId) {
      return {
        touched,
        detail:
          details.join(",") || (touched ? "deposit_refund_only" : "no_remaining_balance_pi"),
      };
    }

    if (booking.remainingBalanceStatus === BookingRemainingBalancePaymentStatus.balance_canceled) {
      this.log.debug({
        kind: "payment_lifecycle_reconcile",
        event: "skipped_balance_canceled_immutable",
        bookingId,
      });
      return {
        touched,
        detail:
          details.join(",") ||
          (touched ? "deposit_plus_balance_canceled_skip" : "balance_canceled_immutable"),
      };
    }

    if (booking.remainingBalanceStatus === BookingRemainingBalancePaymentStatus.balance_captured) {
      return {
        touched,
        detail:
          details.join(",") ||
          (touched ? "deposit_plus_already_captured" : "already_captured_no_downgrade"),
      };
    }

    const pi = await this.stripePayments.retrievePaymentIntent(piId);
    const st = String(pi.status ?? "");
    const prevStatus = booking.remainingBalanceStatus;

    const patch: Prisma.BookingUpdateInput = {};

    if (st === "requires_capture") {
      patch.remainingBalanceStatus = BookingRemainingBalancePaymentStatus.balance_authorized;
      if (!booking.remainingBalanceAuthorizedAt) {
        patch.remainingBalanceAuthorizedAt = new Date();
      }
    } else if (st === "succeeded") {
      patch.remainingBalanceStatus = BookingRemainingBalancePaymentStatus.balance_captured;
      if (!booking.remainingBalanceCapturedAt) {
        patch.remainingBalanceCapturedAt = new Date();
      }
      if (!booking.remainingBalanceAuthorizedAt) {
        patch.remainingBalanceAuthorizedAt = new Date();
      }
    } else if (st === "canceled" || st === "failed") {
      patch.remainingBalanceStatus =
        BookingRemainingBalancePaymentStatus.balance_authorization_failed;
      if (!booking.remainingBalanceAuthorizationFailureReason) {
        patch.remainingBalanceAuthorizationFailureReason = `stripe_reconcile_pi_${st}`;
      }
    } else if (st === "requires_payment_method") {
      patch.remainingBalanceStatus =
        BookingRemainingBalancePaymentStatus.balance_authorization_required;
      if (!booking.remainingBalanceAuthorizationFailureReason) {
        patch.remainingBalanceAuthorizationFailureReason =
          "stripe_reconcile_requires_payment_method";
      }
    } else {
      return {
        touched,
        detail: details.join(",") || `pi_status_noop_${st}`,
      };
    }

    const nextStatus =
      (patch.remainingBalanceStatus as BookingRemainingBalancePaymentStatus | undefined) ??
      prevStatus;

    if (
      patch.remainingBalanceStatus === prevStatus &&
      !patch.remainingBalanceAuthorizedAt &&
      !patch.remainingBalanceCapturedAt &&
      !patch.remainingBalanceAuthorizationFailureReason
    ) {
      return {
        touched,
        detail: details.join(",") || "no_status_change",
      };
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: patch,
    });
    touched = true;

    this.log.log({
      kind: "payment_lifecycle_reconcile",
      event: "remaining_balance_updated",
      bookingId,
      piId,
      stripeStatus: st,
      prevRemainingBalanceStatus: prevStatus,
      nextRemainingBalanceStatus: nextStatus,
    });

    details.push("remaining_balance_reconciled");
    return { touched: true, detail: details.join(",") };
  }
}
