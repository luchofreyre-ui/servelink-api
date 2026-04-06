import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingPaymentStatus, OpsAnomalyStatus, OpsAnomalyType, Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma";
import { FinancialService } from "../financial/financial.service";
import { StripeService } from "./stripe.service";

@Injectable()
export class PaymentOrchestrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly financialService: FinancialService,
  ) {}

  async attachQuoteToBooking(input: {
    bookingId: string;
    subtotal: number;
    margin: number;
    total: number;
  }) {
    return this.prisma.booking.update({
      where: { id: input.bookingId },
      data: {
        quotedSubtotal: new Prisma.Decimal(input.subtotal),
        quotedMargin: new Prisma.Decimal(input.margin),
        quotedTotal: new Prisma.Decimal(input.total),
        paymentStatus: BookingPaymentStatus.payment_pending,
      },
    });
  }

  async createPaymentIntentForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        quotedTotal: true,
        paymentIntentId: true,
        paymentStatus: true,
        currency: true,
        customer: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.quotedTotal == null) {
      throw new BadRequestException("Booking does not have a quote total");
    }

    const quotedTotalNum = Number(booking.quotedTotal);
    if (!Number.isFinite(quotedTotalNum) || quotedTotalNum <= 0) {
      throw new BadRequestException("Invalid quote total");
    }

    const amountCents = Math.round(quotedTotalNum * 100);

    const canReuseIntent =
      Boolean(booking.paymentIntentId) &&
      booking.paymentStatus !== BookingPaymentStatus.failed;

    if (canReuseIntent) {
      const existing = await this.stripeService.retrievePaymentIntent(
        booking.paymentIntentId!,
      );

      const currency = (booking.currency ?? "usd").toLowerCase();
      await this.prisma.bookingStripePayment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          stripePaymentIntentId: existing.id,
          amountCents,
          currency,
          status: existing.status,
          clientSecret: existing.client_secret ?? null,
        },
        update: {
          stripePaymentIntentId: existing.id,
          amountCents,
          currency,
          status: existing.status,
          clientSecret: existing.client_secret ?? null,
        },
      });

      return {
        reused: true,
        paymentIntentId: existing.id,
        clientSecret: existing.client_secret,
        status: existing.status,
      };
    }

    const paymentIntent = await this.stripeService.createPaymentIntent({
      bookingId: booking.id,
      amount: quotedTotalNum,
      customerEmail: booking.customer?.email ?? null,
    });

    const currency = (booking.currency ?? "usd").toLowerCase();

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentIntentId: paymentIntent.id,
          paymentStatus: BookingPaymentStatus.payment_pending,
        },
      });

      await tx.bookingStripePayment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          stripePaymentIntentId: paymentIntent.id,
          amountCents,
          currency,
          status: paymentIntent.status,
          clientSecret: paymentIntent.client_secret ?? null,
        },
        update: {
          stripePaymentIntentId: paymentIntent.id,
          amountCents,
          currency,
          status: paymentIntent.status,
          clientSecret: paymentIntent.client_secret ?? null,
        },
      });
    });

    return {
      reused: false,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    };
  }

  async confirmPaid(input: { bookingId: string; paymentIntentId: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        foId: true,
        paymentIntentId: true,
        quotedTotal: true,
        paymentStatus: true,
        currency: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.quotedTotal == null) {
      throw new BadRequestException("Quoted total missing");
    }

    const quotedTotalNum = Number(booking.quotedTotal);

    const storedPi = booking.paymentIntentId ?? null;
    if (storedPi && storedPi !== input.paymentIntentId) {
      await this.prisma.opsAnomaly.create({
        data: {
          bookingId: input.bookingId,
          foId: booking.foId ?? null,
          type: OpsAnomalyType.payment_mismatch,
          title: "Payment intent mismatch",
          detail:
            "A payment confirmation was attempted with a mismatched payment intent ID.",
          status: OpsAnomalyStatus.open,
        },
      });

      throw new BadRequestException("Payment intent mismatch");
    }

    if (
      booking.paymentStatus === BookingPaymentStatus.paid &&
      storedPi === input.paymentIntentId
    ) {
      const existingPayment = await this.prisma.payment.findFirst({
        where: {
          bookingId: input.bookingId,
          externalRef: input.paymentIntentId,
        },
      });
      return {
        ok: true,
        bookingId: input.bookingId,
        paymentIntentId: input.paymentIntentId,
        status: "paid",
        idempotent: true as const,
        paymentId: existingPayment?.id ?? null,
      };
    }

    const intent = await this.stripeService.retrievePaymentIntent(
      input.paymentIntentId,
    );

    if (intent.status !== "succeeded") {
      throw new BadRequestException(
        `Payment intent not succeeded: ${intent.status}`,
      );
    }

    const amountCents = Math.round(quotedTotalNum * 100);
    const currency = (booking.currency ?? "usd").toLowerCase();

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: input.bookingId },
        data: {
          paymentIntentId: input.paymentIntentId,
          paymentStatus: BookingPaymentStatus.paid,
        },
      });

      await tx.bookingStripePayment.upsert({
        where: { bookingId: input.bookingId },
        create: {
          bookingId: input.bookingId,
          stripePaymentIntentId: input.paymentIntentId,
          amountCents,
          currency,
          status: "succeeded",
          clientSecret: null,
        },
        update: {
          stripePaymentIntentId: input.paymentIntentId,
          amountCents,
          currency,
          status: "succeeded",
        },
      });

      const recorded = await this.financialService.recordPayment(
        input.bookingId,
        quotedTotalNum,
        { stripePaymentIntentId: input.paymentIntentId },
        tx as unknown as PrismaService,
      );

      if (!recorded.ledgerPosted) {
        throw new BadRequestException("Payment amount invalid for ledger posting");
      }
    });

    return {
      ok: true,
      bookingId: input.bookingId,
      paymentIntentId: input.paymentIntentId,
      status: "paid",
    };
  }

  async markPaymentFailure(input: { bookingId: string; detail: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { id: true, foId: true },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    await this.prisma.booking.update({
      where: { id: input.bookingId },
      data: {
        paymentStatus: BookingPaymentStatus.failed,
      },
    });

    return this.prisma.opsAnomaly.create({
      data: {
        bookingId: input.bookingId,
        foId: booking.foId ?? null,
        type: OpsAnomalyType.payment_missing,
        title: "Payment failed or missing",
        detail: input.detail,
        status: OpsAnomalyStatus.open,
      },
    });
  }
}
