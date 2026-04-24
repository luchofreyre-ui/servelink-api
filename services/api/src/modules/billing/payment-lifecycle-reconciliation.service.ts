import { Injectable, Logger } from "@nestjs/common";
import {
  BookingDepositRefundStatus,
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
          {
            AND: [
              { publicDepositPaymentIntentId: { not: null } },
              { depositRefundStatus: BookingDepositRefundStatus.refund_pending },
            ],
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
        depositRefundStatus: true,
      },
    });
    if (!booking) {
      return { touched: false, detail: "booking_not_found" };
    }

    let touched = false;

    if (
      booking.depositRefundStatus === BookingDepositRefundStatus.refund_pending &&
      booking.publicDepositPaymentIntentId?.trim()
    ) {
      // TODO: Narrow refund_pending reconciliation against Stripe (e.g. refunds.list on the
      // deposit PaymentIntent) once a small, idempotent helper exists on StripePaymentService —
      // today `charge.refund.updated` + `handleChargeRefundUpdated` is the primary path.
      this.log.debug({
        kind: "payment_lifecycle_reconcile",
        event: "deposit_refund_pending_skipped",
        bookingId,
        note: "webhook_and_manual_refund_flows_are_source_of_truth_until_pi_refund_list_helper_exists",
      });
    }

    const piId = booking.remainingBalancePaymentIntentId?.trim();
    if (!piId) {
      return { touched, detail: touched ? "partial" : "no_remaining_balance_pi" };
    }

    if (booking.remainingBalanceStatus === BookingRemainingBalancePaymentStatus.balance_canceled) {
      this.log.debug({
        kind: "payment_lifecycle_reconcile",
        event: "skipped_balance_canceled_immutable",
        bookingId,
      });
      return { touched: false, detail: "balance_canceled_immutable" };
    }

    if (booking.remainingBalanceStatus === BookingRemainingBalancePaymentStatus.balance_captured) {
      return { touched: false, detail: "already_captured_no_downgrade" };
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
      return { touched: false, detail: `pi_status_noop_${st}` };
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
      return { touched: false, detail: "no_status_change" };
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

    return { touched: true, detail: "remaining_balance_reconciled" };
  }
}
