import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import {
  Booking,
  BookingEventType,
  BookingPaymentStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../../prisma";
import { PaymentReliabilityService } from "../payment-reliability/payment-reliability.service";
import { StripePaymentService } from "../stripe/stripe-payment.service";
import type {
  BookingCheckoutSession,
  CreateBookingCheckoutInput,
  UpdateBookingPaymentStatusInput,
} from "./payment.types";

@Injectable()
export class BookingPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripePaymentService: StripePaymentService,
    private readonly paymentReliability: PaymentReliabilityService,
  ) {}

  async createCheckout(
    booking: Booking,
    input: CreateBookingCheckoutInput,
  ): Promise<BookingCheckoutSession> {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      throw new BadRequestException(
        "Stripe is not configured (STRIPE_SECRET_KEY). Checkout requires Stripe.",
      );
    }
    return this.stripePaymentService.createCheckoutSession(booking, input);
  }

  async updatePaymentStatus(
    booking: Booking,
    input: UpdateBookingPaymentStatusInput,
  ) {
    const now = new Date();

    const prevMeta =
      booking.paymentMeta &&
      typeof booking.paymentMeta === "object" &&
      !Array.isArray(booking.paymentMeta)
        ? (booking.paymentMeta as Record<string, unknown>)
        : {};

    const mergedMeta: Prisma.InputJsonValue = {
      ...prevMeta,
      previousPaymentStatus: booking.paymentStatus,
      updatedAt: now.toISOString(),
      ...(input.payload ?? {}),
    };

    const isAdminWaive =
      String(input.actorRole ?? "").toLowerCase() === "admin" &&
      input.nextStatus === BookingPaymentStatus.waived;

    const eventType = isAdminWaive
      ? BookingEventType.PAYMENT_ADMIN_OVERRIDE
      : BookingEventType.PAYMENT_STATUS_CHANGED;

    const eventPayload: Prisma.InputJsonValue = {
      previousPaymentStatus: booking.paymentStatus,
      nextStatus: input.nextStatus,
      ...(input.payload ?? {}),
      ...(isAdminWaive ? { adminOverride: true, reason: "waived" } : {}),
    };

    const patch: Prisma.BookingUpdateInput = {
      paymentStatus: input.nextStatus,
      paymentMeta: mergedMeta,
      BookingEvent: {
        create: {
          type: eventType,
          actorUserId: input.actorUserId ?? null,
          actorRole: input.actorRole ?? null,
          note: input.note ?? null,
          payload: eventPayload,
        },
      },
    };

    if (input.nextStatus === BookingPaymentStatus.authorized) {
      patch.paymentAuthorizedAt = now;
    }

    if (input.nextStatus === BookingPaymentStatus.paid) {
      patch.paymentPaidAt = now;
    }

    if (input.nextStatus === BookingPaymentStatus.failed) {
      patch.paymentFailedAt = now;
    }

    if (input.nextStatus === BookingPaymentStatus.waived) {
      patch.paymentWaivedAt = now;
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: patch,
      include: {
        BookingEvent: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    await this.paymentReliability.resolveAnomaliesForBooking(booking.id);

    return updated;
  }

  canConfirm(paymentStatus: BookingPaymentStatus): boolean {
    return (
      paymentStatus === BookingPaymentStatus.authorized ||
      paymentStatus === BookingPaymentStatus.paid ||
      paymentStatus === BookingPaymentStatus.waived
    );
  }
}
