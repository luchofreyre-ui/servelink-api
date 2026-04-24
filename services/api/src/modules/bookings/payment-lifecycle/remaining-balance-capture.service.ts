import { Injectable, Logger } from "@nestjs/common";
import { BookingRemainingBalancePaymentStatus } from "@prisma/client";
import { PrismaService } from "../../../prisma";
import { computeRemainingBalanceCaptureEligibility } from "../payment-lifecycle-policy";
import { StripePaymentService } from "../stripe/stripe-payment.service";

@Injectable()
export class RemainingBalanceCaptureService {
  private readonly log = new Logger(RemainingBalanceCaptureService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripePayments: StripePaymentService,
  ) {}

  async captureRemainingBalanceForBooking(bookingId: string): Promise<{
    ok: boolean;
    skipped?: string;
  }> {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return { ok: false, skipped: "stripe_not_configured" };
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return { ok: false, skipped: "booking_not_found" };
    }

    if (booking.remainingBalanceStatus === BookingRemainingBalancePaymentStatus.balance_captured) {
      return { ok: true, skipped: "already_captured" };
    }

    const elig = computeRemainingBalanceCaptureEligibility({
      bookingStatus: booking.status,
      balanceStatus: booking.remainingBalanceStatus,
      completedAt: booking.completedAt,
    });
    if (!elig.eligible) {
      return { ok: false, skipped: elig.reason ?? "not_eligible" };
    }

    const piId = booking.remainingBalancePaymentIntentId?.trim();
    if (!piId) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_capture_failed,
          remainingBalanceAuthorizationFailureReason: "missing_remaining_balance_payment_intent",
        },
      });
      return { ok: false, skipped: "missing_payment_intent" };
    }

    const pi = await this.stripePayments.retrievePaymentIntent(piId);
    const st = pi.status;

    if (st === "requires_capture") {
      try {
        await this.stripePayments.captureRemainingBalancePaymentIntent(
          piId,
          `rb-capture:${bookingId}`.slice(0, 255),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            remainingBalanceStatus:
              BookingRemainingBalancePaymentStatus.balance_capture_failed,
            remainingBalanceAuthorizationFailureReason: msg.slice(0, 500),
          },
        });
        return { ok: false, skipped: "capture_failed" };
      }
      const after = await this.stripePayments.retrievePaymentIntent(piId);
      if (after.status === "succeeded") {
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_captured,
            remainingBalanceCapturedAt: new Date(),
          },
        });
        return { ok: true };
      }
      this.log.warn(
        `remaining balance capture unexpected status booking=${bookingId} status=${after.status}`,
      );
      return { ok: false, skipped: "unexpected_post_capture_status" };
    }

    if (st === "succeeded") {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_captured,
          remainingBalanceCapturedAt: booking.remainingBalanceCapturedAt ?? new Date(),
        },
      });
      return { ok: true };
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_capture_failed,
        remainingBalanceAuthorizationFailureReason: `capture_precondition_status_${st}`,
      },
    });
    return { ok: false, skipped: `pi_status_${st}` };
  }
}
