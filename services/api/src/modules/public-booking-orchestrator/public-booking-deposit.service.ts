import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  BookingEventType,
  BookingPublicDepositStatus,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { initialRemainingBalanceStatusFromRemainingCents } from "../bookings/payment-lifecycle-policy";
import {
  computeRemainingBalanceAfterDepositCents,
  PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
} from "../bookings/public-deposit-policy";
import type Stripe from "stripe";
import { StripePaymentService } from "../bookings/stripe/stripe-payment.service";

const SKIP_DEPOSIT_ENV = "PUBLIC_BOOKING_SKIP_DEPOSIT_AT_CONFIRM";

function readEstimatedPriceCentsFromSnapshot(outputJson: string | null): number {
  if (!outputJson?.trim()) return 0;
  try {
    const out = JSON.parse(outputJson) as Record<string, unknown>;
    const v = out.estimatedPriceCents;
    if (typeof v === "number" && Number.isFinite(v)) {
      return Math.max(0, Math.floor(v));
    }
  } catch {
    /* ignore */
  }
  return 0;
}

/**
 * Public booking deposit: $100 immediate capture before hold confirmation assigns the booking.
 * Skipped only when {@link SKIP_DEPOSIT_ENV} is set to `1` (local/CI opt-in — never for production policy).
 */
@Injectable()
export class PublicBookingDepositService {
  private readonly log = new Logger(PublicBookingDepositService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripePayments: StripePaymentService,
  ) {}

  /**
   * Ensures deposit succeeded (or skip flag). Otherwise throws structured HTTP errors.
   */
  async ensurePublicDepositResolvedBeforeConfirm(args: {
    bookingId: string;
    holdId: string;
    stripePaymentMethodId?: string | null;
    idempotencyKey: string | null;
  }): Promise<void> {
    if (process.env[SKIP_DEPOSIT_ENV]?.trim() === "1") {
      this.log.warn(
        `${SKIP_DEPOSIT_ENV}=1: skipping public deposit gate (non-production testing only).`,
      );
      return;
    }

    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      throw new ServiceUnavailableException({
        code: "PUBLIC_BOOKING_STRIPE_NOT_CONFIGURED",
        message:
          "Stripe is not configured on the server; public booking confirmation with deposit cannot proceed.",
      });
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: args.bookingId },
      include: {
        customer: { select: { id: true, email: true, stripeCustomerId: true } },
        estimateSnapshot: { select: { outputJson: true } },
      },
    });

    if (!booking) {
      throw new BadRequestException({ code: "BOOKING_NOT_FOUND", message: "Booking not found" });
    }

    if (booking.status !== BookingStatus.pending_payment) {
      return;
    }

    if (booking.publicDepositStatus === BookingPublicDepositStatus.deposit_succeeded) {
      return;
    }

    const stripeCustomerId = await this.stripePayments.ensureStripeCustomerForUser({
      userId: booking.customerId,
      email: String(booking.customer.email ?? "").trim() || `customer+${booking.customerId}@servelink.invalid`,
    });

    const idemBase =
      (args.idempotencyKey?.trim() || `pb:${args.bookingId}:${args.holdId}`).slice(0, 200);
    const idemPi = `pb-deposit-pi:${idemBase}`;
    const idemConfirm = `pb-deposit-confirm:${idemBase}`;

    const estimatedTotal = readEstimatedPriceCentsFromSnapshot(
      booking.estimateSnapshot?.outputJson ?? null,
    );
    const remaining = computeRemainingBalanceAfterDepositCents({
      estimatedTotalCents: estimatedTotal,
      depositAmountCents: booking.publicDepositAmountCents,
    });

    const existingPiId = booking.publicDepositPaymentIntentId?.trim() || null;
    const pm = args.stripePaymentMethodId?.trim() || null;

    if (pm) {
      await this.chargeOrConfirmWithPaymentMethod({
        bookingId: booking.id,
        holdId: args.holdId,
        stripeCustomerId,
        paymentMethodId: pm,
        idempotencyKey: idemConfirm,
        estimatedTotalCentsSnapshot: estimatedTotal > 0 ? estimatedTotal : null,
        remainingBalanceAfterDepositCents: estimatedTotal > 0 ? remaining : null,
        existingPaymentIntentId: existingPiId,
      });
      return;
    }

    let activeDepositPiId = existingPiId;
    if (activeDepositPiId) {
      const pi = await this.stripePayments.retrievePaymentIntent(activeDepositPiId);
      const st = pi.status;
      if (st === "succeeded") {
        await this.markDepositSucceededFromStripeState({
          bookingId: booking.id,
          paymentIntentId: activeDepositPiId,
          estimatedTotalCentsSnapshot: estimatedTotal > 0 ? estimatedTotal : null,
          remainingBalanceAfterDepositCents: estimatedTotal > 0 ? remaining : null,
        });
        return;
      }
      if (st === "processing") {
        throw new HttpException(
          {
            kind: "public_booking_deposit_processing",
            code: "PUBLIC_BOOKING_DEPOSIT_PROCESSING",
            message: "Deposit payment is processing. Retry confirmation shortly.",
            paymentIntentId: pi.id,
          },
          HttpStatus.CONFLICT,
        );
      }
      if (st === "canceled" || String(st) === "failed") {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            publicDepositPaymentIntentId: null,
            publicDepositStatus: BookingPublicDepositStatus.deposit_required,
          },
        });
        activeDepositPiId = null;
      } else if (st === "requires_action") {
        throw new HttpException(
          {
            kind: "public_booking_deposit_requires_action",
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRES_ACTION",
            message: "Additional authentication is required to complete the deposit.",
            clientSecret: pi.client_secret ?? null,
            paymentIntentId: pi.id,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      } else if (st === "requires_payment_method" || st === "requires_confirmation") {
        throw new HttpException(
          {
            kind: "public_booking_deposit_required",
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
            message:
              "A $100 deposit is required to confirm this booking. Add a payment method and retry.",
            amountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
            currency: "usd",
            clientSecret: pi.client_secret ?? null,
            paymentIntentId: pi.id,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      } else {
        this.log.warn(
          `Public deposit PI in unexpected state booking=${booking.id} status=${st}`,
        );
        throw new HttpException(
          {
            kind: "public_booking_deposit_required",
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
            message:
              "A $100 deposit is required to confirm this booking. Complete payment with Stripe, then retry confirmation with the same hold.",
            amountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
            currency: "usd",
            clientSecret: pi.client_secret ?? null,
            paymentIntentId: pi.id,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    const pi = await this.stripePayments.createPublicBookingDepositPaymentIntent({
      bookingId: booking.id,
      stripeCustomerId,
      idempotencyKey: idemPi,
      holdId: args.holdId,
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        publicDepositPaymentIntentId: pi.id,
        stripeCustomerId,
        publicDepositStatus: BookingPublicDepositStatus.deposit_required,
        publicDepositAmountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
      },
    });

    throw new HttpException(
      {
        kind: "public_booking_deposit_required",
        code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
        message:
          "A $100 deposit is required to confirm this booking. Complete payment with Stripe, then retry confirmation with the same hold.",
        amountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
        currency: "usd",
        clientSecret: pi.client_secret ?? null,
        paymentIntentId: pi.id,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }

  private async chargeOrConfirmWithPaymentMethod(args: {
    bookingId: string;
    holdId: string;
    stripeCustomerId: string;
    paymentMethodId: string;
    idempotencyKey: string;
    estimatedTotalCentsSnapshot: number | null;
    remainingBalanceAfterDepositCents: number | null;
    existingPaymentIntentId: string | null;
  }): Promise<void> {
    let pi: Stripe.PaymentIntent | null = null;

    if (args.existingPaymentIntentId) {
      const cur = await this.stripePayments.retrievePaymentIntent(
        args.existingPaymentIntentId,
      );
      if (cur.status === "succeeded") {
        await this.markDepositSucceededFromStripeState({
          bookingId: args.bookingId,
          paymentIntentId: cur.id,
          estimatedTotalCentsSnapshot: args.estimatedTotalCentsSnapshot,
          remainingBalanceAfterDepositCents: args.remainingBalanceAfterDepositCents,
        });
        return;
      }
      if (cur.status === "requires_action") {
        throw new HttpException(
          {
            kind: "public_booking_deposit_requires_action",
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRES_ACTION",
            message: "Additional authentication is required to complete the deposit.",
            clientSecret: cur.client_secret ?? null,
            paymentIntentId: cur.id,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      if (
        cur.status === "requires_payment_method" ||
        cur.status === "requires_confirmation"
      ) {
        pi = await this.stripePayments.confirmPaymentIntentWithPaymentMethod({
          paymentIntentId: cur.id,
          paymentMethodId: args.paymentMethodId,
          idempotencyKey: args.idempotencyKey,
        });
      } else if (cur.status === "processing") {
        throw new HttpException(
          {
            kind: "public_booking_deposit_processing",
            code: "PUBLIC_BOOKING_DEPOSIT_PROCESSING",
            message: "Deposit payment is processing. Retry confirmation shortly.",
            paymentIntentId: cur.id,
          },
          HttpStatus.CONFLICT,
        );
      } else {
        pi = await this.stripePayments.createAndConfirmPublicDepositPaymentIntent({
          bookingId: args.bookingId,
          stripeCustomerId: args.stripeCustomerId,
          paymentMethodId: args.paymentMethodId,
          idempotencyKey: args.idempotencyKey,
          holdId: args.holdId,
        });
      }
    } else {
      pi = await this.stripePayments.createAndConfirmPublicDepositPaymentIntent({
        bookingId: args.bookingId,
        stripeCustomerId: args.stripeCustomerId,
        paymentMethodId: args.paymentMethodId,
        idempotencyKey: args.idempotencyKey,
        holdId: args.holdId,
      });
    }

    if (!pi) {
      throw new BadRequestException({
        code: "PUBLIC_BOOKING_DEPOSIT_FAILED",
        message: "Deposit payment intent was not created.",
      });
    }

    if (pi.status === "succeeded") {
      await this.markDepositSucceededFromStripeState({
        bookingId: args.bookingId,
        paymentIntentId: pi.id,
        estimatedTotalCentsSnapshot: args.estimatedTotalCentsSnapshot,
        remainingBalanceAfterDepositCents: args.remainingBalanceAfterDepositCents,
      });
      return;
    }

    if (pi.status === "requires_action") {
      throw new HttpException(
        {
          kind: "public_booking_deposit_requires_action",
          code: "PUBLIC_BOOKING_DEPOSIT_REQUIRES_ACTION",
          message: "Additional authentication is required to complete the deposit.",
          clientSecret: pi.client_secret ?? null,
          paymentIntentId: pi.id,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    await this.prisma.booking.update({
      where: { id: args.bookingId },
      data: {
        publicDepositStatus: BookingPublicDepositStatus.deposit_failed,
        publicDepositPaymentIntentId: pi.id,
      },
    });

    throw new BadRequestException({
      code: "PUBLIC_BOOKING_DEPOSIT_FAILED",
      message: `Deposit did not succeed (status=${pi.status}).`,
    });
  }

  private async markDepositSucceededFromStripeState(args: {
    bookingId: string;
    paymentIntentId: string;
    estimatedTotalCentsSnapshot: number | null;
    remainingBalanceAfterDepositCents: number | null;
  }): Promise<void> {
    const patch: Prisma.BookingUpdateInput = {
      publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
      publicDepositPaidAt: new Date(),
      publicDepositPaymentIntentId: args.paymentIntentId,
      publicDepositAmountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
    };
    if (args.estimatedTotalCentsSnapshot != null) {
      patch.estimatedTotalCentsSnapshot = args.estimatedTotalCentsSnapshot;
    }
    if (args.remainingBalanceAfterDepositCents != null) {
      patch.remainingBalanceAfterDepositCents = args.remainingBalanceAfterDepositCents;
      patch.remainingBalanceStatus = initialRemainingBalanceStatusFromRemainingCents(
        args.remainingBalanceAfterDepositCents,
      );
    }

    await this.prisma.booking.update({
      where: { id: args.bookingId },
      data: {
        ...patch,
        BookingEvent: {
          create: {
            type: BookingEventType.NOTE,
            idempotencyKey: `public-deposit-sync:${args.paymentIntentId}`,
            note: "Public booking deposit captured",
            payload: {
              publicDeposit: true,
              paymentIntentId: args.paymentIntentId,
            } as Prisma.InputJsonValue,
          },
        },
      },
    });
  }
}
