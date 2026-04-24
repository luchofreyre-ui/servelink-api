import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../../prisma";
import { BookingCancellationPaymentService } from "./booking-cancellation-payment.service";

const INNOCUOUS_SKIPS = new Set([
  "booking_not_found",
  "booking_not_canceled",
  "no_scheduled_start",
  "no_deposit_succeeded",
  "refund_already_recorded",
  "cancellation_fee_already_retained",
  "already_refunded",
  "fee_already_recorded",
]);

/**
 * Single entry point for **public deposit / cancellation fee** enforcement after a booking is canceled.
 *
 * Any future writer that sets `Booking.status` to `canceled` / `cancelled` should call
 * `BookingsService.enforceCancellationPaymentInvariantForBooking` (or this service) so refund vs fee
 * rules stay consistent. Repository search found no other production path that sets booking to
 * canceled outside `BookingsService.transitionBooking`.
 */
@Injectable()
export class BookingCancellationPaymentInvariantService {
  private readonly log = new Logger(BookingCancellationPaymentInvariantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cancellationPayment: BookingCancellationPaymentService,
  ) {}

  async enforceCancellationPaymentInvariantForBooking(
    bookingId: string,
    options?: { strict?: boolean; reason?: string },
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true },
    });

    if (!booking) {
      const msg = `cancellation invariant: booking not found bookingId=${bookingId}`;
      this.log.warn({ kind: "cancellation_payment_invariant", event: "booking_missing", bookingId });
      if (options?.strict) {
        throw new NotFoundException(msg);
      }
      return;
    }

    if (
      booking.status !== BookingStatus.canceled &&
      booking.status !== BookingStatus.cancelled
    ) {
      return;
    }

    try {
      const r = await this.cancellationPayment.enforcePublicDepositOnCancellation({
        bookingId,
      });

      if (r.ok) {
        this.log.log({
          kind: "cancellation_payment_invariant",
          event: "enforced",
          bookingId,
          skipped: r.skipped ?? null,
          reason: options?.reason ?? null,
        });
        return;
      }

      const skipped = r.skipped ?? "unknown";
      if (INNOCUOUS_SKIPS.has(skipped)) {
        return;
      }

      this.log.error({
        kind: "cancellation_payment_invariant",
        event: "financial_outcome_not_ok",
        bookingId,
        skipped,
        reason: options?.reason ?? null,
      });

      if (options?.strict) {
        throw new Error(`cancellation_payment_invariant: ${skipped}`);
      }
    } catch (e) {
      this.log.error({
        kind: "cancellation_payment_invariant",
        event: "exception",
        bookingId,
        message: e instanceof Error ? e.message : String(e),
        reason: options?.reason ?? null,
      });
      if (options?.strict) {
        throw e;
      }
    }
  }
}
