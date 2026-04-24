import { Injectable, Logger } from "@nestjs/common";
import {
  BookingDepositRefundStatus,
  BookingPublicDepositStatus,
  BookingStatus,
} from "@prisma/client";
import { PrismaService } from "../../../prisma";
import { computeCancellationPolicy } from "../payment-lifecycle-policy";
import { StripePaymentService } from "../stripe/stripe-payment.service";

@Injectable()
export class BookingCancellationPaymentService {
  private readonly log = new Logger(BookingCancellationPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripePayments: StripePaymentService,
  ) {}

  /**
   * Applies deposit refund vs cancellation-fee retention for a canceled booking (idempotent).
   */
  async enforcePublicDepositOnCancellation(args: {
    bookingId: string;
    now?: Date;
  }): Promise<{ ok: boolean; skipped?: string }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: args.bookingId },
    });
    if (!booking) {
      return { ok: false, skipped: "booking_not_found" };
    }
    if (booking.status !== BookingStatus.canceled && booking.status !== BookingStatus.cancelled) {
      return { ok: false, skipped: "booking_not_canceled" };
    }

    const now = args.now ?? new Date();

    if (!booking.scheduledStart) {
      this.log.warn(
        `cancellation payment: no scheduledStart booking=${args.bookingId}; skipping financial enforcement`,
      );
      return { ok: true, skipped: "no_scheduled_start" };
    }

    const depositAmount = Math.max(0, Math.floor(booking.publicDepositAmountCents ?? 0));
    const policy = computeCancellationPolicy({
      scheduledStart: booking.scheduledStart,
      now,
      depositAmountCents: depositAmount,
    });

    const depositSucceeded =
      booking.publicDepositStatus === BookingPublicDepositStatus.deposit_succeeded;
    const alreadyRefunded =
      booking.depositRefundStatus === BookingDepositRefundStatus.refund_succeeded ||
      booking.publicDepositStatus === BookingPublicDepositStatus.refunded;
    const feeAlreadyRecorded = booking.cancellationFeeRetainedAt != null;

    if (!depositSucceeded) {
      if (
        booking.depositRefundStatus === BookingDepositRefundStatus.refund_not_required &&
        booking.cancellationFeeAmountCents == null
      ) {
        await this.prisma.booking.update({
          where: { id: args.bookingId },
          data: {
            depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
          },
        });
      }
      return { ok: true, skipped: "no_deposit_succeeded" };
    }

    if (policy.depositRefundable) {
      if (alreadyRefunded) {
        return { ok: true, skipped: "refund_already_recorded" };
      }
      if (feeAlreadyRecorded) {
        return { ok: true, skipped: "fee_already_recorded" };
      }

      const piId = booking.publicDepositPaymentIntentId?.trim();
      if (!piId) {
        await this.prisma.booking.update({
          where: { id: args.bookingId },
          data: {
            depositRefundStatus: BookingDepositRefundStatus.refund_failed,
          },
        });
        return { ok: false, skipped: "missing_deposit_pi" };
      }

      if (!process.env.STRIPE_SECRET_KEY?.trim()) {
        await this.prisma.booking.update({
          where: { id: args.bookingId },
          data: {
            depositRefundStatus: BookingDepositRefundStatus.refund_failed,
          },
        });
        return { ok: false, skipped: "stripe_not_configured" };
      }

      await this.prisma.booking.update({
        where: { id: args.bookingId },
        data: { depositRefundStatus: BookingDepositRefundStatus.refund_pending },
      });

      try {
        const refund = await this.stripePayments.refundPaymentIntent({
          paymentIntentId: piId,
          idempotencyKey: `pb-deposit-refund:${args.bookingId}`.slice(0, 255),
        });
        const st = String(refund.status ?? "");
        if (st === "succeeded" || st === "pending") {
          await this.prisma.booking.update({
            where: { id: args.bookingId },
            data: {
              depositRefundId: refund.id,
              depositRefundStatus:
                st === "succeeded"
                  ? BookingDepositRefundStatus.refund_succeeded
                  : BookingDepositRefundStatus.refund_pending,
              depositRefundedAt: st === "succeeded" ? new Date() : null,
              publicDepositStatus: BookingPublicDepositStatus.refunded,
              cancellationFeeAmountCents: 0,
              cancellationFeeRetainedAt: null,
            },
          });
        } else {
          await this.prisma.booking.update({
            where: { id: args.bookingId },
            data: {
              depositRefundStatus: BookingDepositRefundStatus.refund_failed,
              depositRefundId: refund.id,
            },
          });
          return { ok: false, skipped: `refund_status_${st}` };
        }
      } catch (e) {
        this.log.warn(
          `deposit refund failed booking=${args.bookingId} err=${e instanceof Error ? e.message : String(e)}`,
        );
        await this.prisma.booking.update({
          where: { id: args.bookingId },
          data: {
            depositRefundStatus: BookingDepositRefundStatus.refund_failed,
          },
        });
        return { ok: false, skipped: "refund_exception" };
      }
      return { ok: true };
    }

    if (feeAlreadyRecorded && booking.cancellationFeeAmountCents != null) {
      return { ok: true, skipped: "cancellation_fee_already_retained" };
    }
    if (alreadyRefunded) {
      return { ok: true, skipped: "already_refunded" };
    }

    const fee = Math.min(10_000, depositAmount);
    await this.prisma.booking.update({
      where: { id: args.bookingId },
      data: {
        cancellationFeeAmountCents: fee,
        cancellationFeeRetainedAt: new Date(),
        publicDepositStatus: BookingPublicDepositStatus.cancellation_fee_retained,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
      },
    });
    return { ok: true };
  }
}
