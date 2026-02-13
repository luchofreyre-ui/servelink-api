import {
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { BookingEventType } from "@prisma/client";

import { PrismaService } from "../../prisma";
import { fail, ok } from "../../utils/http";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { BillingService } from "./billing.service";
import { StripeService } from "./stripe.service";

type AuthedRequest = {
  user?: { userId: string; role: "customer" | "fo" | "admin" };
};

@Controller("/api/v1/bookings")
@UseGuards(JwtAuthGuard)
export class BillingStripeController {
  constructor(
    private readonly db: PrismaService,
    private readonly billing: BillingService,
    private readonly stripeSvc: StripeService,
  ) {}

  private async emitNoteEvent(args: {
    bookingId: string;
    idempotencyKey: string;
    note: any;
  }): Promise<void> {
    try {
      await this.db.bookingEvent.create({
        data: {
          bookingId: args.bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey: args.idempotencyKey,
          note: JSON.stringify(args.note),
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") return; // idempotent
      throw err;
    }
  }

  /**
   * Create or update Stripe PaymentIntent for a booking.
   * Amount is derived ONLY from finalized billing (system-of-record).
   */
  @Post(":id/stripe/payment-intent")
  async upsertPaymentIntent(
    @Req() req: AuthedRequest,
    @Param("id") bookingId: string,
    @Body() body: { idempotencyKey: string; currency?: string },
  ) {
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (!role || !userId) throw new ForbiddenException("UNAUTHENTICATED");

    // Customer or admin can create PI; FO cannot charge customer.
    if (role === "fo") throw new ForbiddenException("FORBIDDEN");

    const booking = await this.db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");

    // If customer, must be the booking customer
    if (role === "customer" && booking.customerId !== userId) {
      throw new ForbiddenException("FORBIDDEN");
    }

    const idem = String(body?.idempotencyKey ?? "");
    if (!idem) throw new ForbiddenException("IDEMPOTENCY_KEY_REQUIRED");

    const currency = String(body?.currency ?? "usd");

    // Finalize billing deterministically (idempotent via BookingEvent key)
    const finalized = await this.billing.finalizeBookingBilling({
      bookingId,
      idempotencyKey: `stripe_pi:${idem}`,
    });

    const amountCents = finalized.finalization?.finalBillableCents ?? finalized.finalBillableCents;

    if (!amountCents || !Number.isFinite(amountCents) || amountCents <= 0) {
      return fail("INVALID_REQUEST", "Finalized amount is invalid");
    }

    // Lookup existing PI pointer
    const existing = await this.db.bookingStripePayment.findUnique({
      where: { bookingId },
    });

    const stripe = this.stripeSvc.stripe;

    if (!process.env.STRIPE_SECRET_KEY) {
      return fail("STRIPE_NOT_CONFIGURED", "Stripe is not configured");
    }

    // Create new PI
    if (!existing) {
      const pi = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency,
          automatic_payment_methods: { enabled: true },
          metadata: {
            bookingId,
          },
        },
        { idempotencyKey: `pi_create:${bookingId}:${idem}` },
      );

      await this.db.bookingStripePayment.create({
        data: {
          bookingId,
          stripePaymentIntentId: pi.id,
          amountCents,
          currency,
          status: pi.status,
          clientSecret: pi.client_secret ?? null,
        },
      });

      await this.emitNoteEvent({
        bookingId,
        idempotencyKey: `STRIPE_PI_CREATED:${bookingId}:${idem}`,
        note: {
          type: "STRIPE_PI_CREATED",
          bookingId,
          paymentIntentId: pi.id,
          amountCents,
          currency,
          status: pi.status,
          createdAt: new Date().toISOString(),
        },
      });

      return ok({
        bookingId,
        paymentIntentId: pi.id,
        clientSecret: pi.client_secret,
        amountCents,
        currency,
        status: pi.status,
      });
    }

    // Existing PI: retrieve and possibly update amount
    const pi = await stripe.paymentIntents.retrieve(existing.stripePaymentIntentId);

    // Only update if Stripe allows (avoid updating succeeded/canceled)
    const immutableStatuses = new Set(["succeeded", "canceled"]);
    const canUpdate = !immutableStatuses.has(pi.status);

    if (existing.amountCents !== amountCents) {
      if (!canUpdate) {
        // Log mismatch; do not mutate external state.
        await this.emitNoteEvent({
          bookingId,
          idempotencyKey: `STRIPE_PI_AMOUNT_MISMATCH_IMMUTABLE:${bookingId}:${idem}`,
          note: {
            type: "STRIPE_PI_AMOUNT_MISMATCH_IMMUTABLE",
            bookingId,
            paymentIntentId: pi.id,
            existingAmountCents: existing.amountCents,
            desiredAmountCents: amountCents,
            status: pi.status,
            createdAt: new Date().toISOString(),
          },
        });

        return ok({
          bookingId,
          paymentIntentId: pi.id,
          clientSecret: existing.clientSecret,
          amountCents: existing.amountCents,
          currency: existing.currency,
          status: pi.status,
          warning: "PI_IMMUTABLE_AMOUNT_NOT_UPDATED",
          desiredAmountCents: amountCents,
        });
      }

      const updated = await stripe.paymentIntents.update(existing.stripePaymentIntentId, {
        amount: amountCents,
        currency,
      });

      await this.db.bookingStripePayment.update({
        where: { bookingId },
        data: {
          amountCents,
          currency,
          status: updated.status,
          clientSecret: updated.client_secret ?? existing.clientSecret,
        },
      });

      await this.emitNoteEvent({
        bookingId,
        idempotencyKey: `STRIPE_PI_UPDATED_AMOUNT:${bookingId}:${idem}:${amountCents}`,
        note: {
          type: "STRIPE_PI_UPDATED_AMOUNT",
          bookingId,
          paymentIntentId: updated.id,
          amountCents,
          currency,
          status: updated.status,
          createdAt: new Date().toISOString(),
        },
      });

      return ok({
        bookingId,
        paymentIntentId: updated.id,
        clientSecret: updated.client_secret ?? existing.clientSecret,
        amountCents,
        currency,
        status: updated.status,
      });
    }

    // Amount matches: just refresh status/client secret into DB
    await this.db.bookingStripePayment.update({
      where: { bookingId },
      data: {
        status: pi.status,
        clientSecret: (pi as any).client_secret ?? existing.clientSecret,
      },
    });

    await this.emitNoteEvent({
      bookingId,
      idempotencyKey: `STRIPE_PI_FETCHED:${bookingId}:${idem}`,
      note: {
        type: "STRIPE_PI_FETCHED",
        bookingId,
        paymentIntentId: pi.id,
        amountCents: existing.amountCents,
        currency: existing.currency,
        status: pi.status,
        createdAt: new Date().toISOString(),
      },
    });

    return ok({
      bookingId,
      paymentIntentId: pi.id,
      clientSecret: existing.clientSecret,
      amountCents: existing.amountCents,
      currency: existing.currency,
      status: pi.status,
    });
  }
}
