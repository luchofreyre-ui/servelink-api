import { Controller, Headers, Post, Req } from "@nestjs/common";
import { BookingEventType } from "@prisma/client";
import type { Request } from "express";

import { PrismaService } from "../../prisma";
import { fail, ok } from "../../utils/http";
import { StripeService } from "./stripe.service";
import { StripeWebhookHandlerService } from "./stripe.webhook.handler.service";

@Controller("/api/v1/stripe")
export class StripeWebhookController {
  constructor(
    private readonly db: PrismaService,
    private readonly stripeSvc: StripeService,
    private readonly webhookHandler: StripeWebhookHandlerService,
  ) {}

  @Post("webhook")
  async handle(@Req() req: Request, @Headers("stripe-signature") sig?: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return fail("STRIPE_NOT_CONFIGURED", "Stripe webhook is not configured");
    if (!sig) return fail("INVALID_REQUEST", "Missing Stripe signature");

    const stripe = this.stripeSvc.stripe;

    let event: any;
    try {
      const raw =
        Buffer.isBuffer(req.body)
          ? (req.body as any)
          : process.env.NODE_ENV === "test"
            ? Buffer.from(JSON.stringify(req.body ?? {}))
            : (req.body as any);

      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
    } catch (e: any) {
      return fail("WEBHOOK_INVALID_SIGNATURE", "Invalid Stripe webhook signature");
    }

    const type = String(event?.type ?? "");

    // ✅ Exactly-once processing gate (Stripe retries deliveries)
    try {
      await this.db.stripeWebhookReceipt.create({
        data: {
          stripeEventId: String(event.id),
          type,
          livemode: Boolean(event.livemode),
        },
      });
    } catch (err: any) {
      // Unique violation => already processed
      if (err?.code === "P2002") {
        return ok({ duplicate: true, type });
      }
      throw err;
    }

    // Helper: idempotent NOTE append
    const emitNote = async (args: { bookingId: string; idempotencyKey: string; note: any }) => {
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
    };

    // Helper: map payment_intent -> booking pointer
    const findPointerByPi = async (paymentIntentId: string) => {
      return this.db.bookingStripePayment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      });
    };

    // ✅ Event 1: payment_intent.succeeded (note + SETTLEMENT ledger entry)
    if (type === "payment_intent.succeeded") {
      await this.webhookHandler.handlePaymentIntentSucceeded(event);
      return ok({ processed: true });
    }

    // ✅ Event 2: charge.dispute.created (note + case status; no cash movement)
    if (type === "charge.dispute.created") {
      await this.webhookHandler.handleChargeDisputeCreated(event);
      return ok({ processed: true });
    }

    // ✅ Event 2b: charge.dispute.funds_withdrawn (cash leaves Stripe)
    if (type === "charge.dispute.funds_withdrawn") {
      await this.webhookHandler.handleChargeDisputeFundsWithdrawn(event);
      return ok({ processed: true });
    }

    // ✅ Event 2c: charge.dispute.funds_reinstated (cash returns to Stripe)
    if (type === "charge.dispute.funds_reinstated") {
      await this.webhookHandler.handleChargeDisputeFundsReinstated(event);
      return ok({ processed: true });
    }

    // ✅ Event 3: charge.refund.updated (note + REFUND ledger entry)
    if (type === "charge.refund.updated") {
      await this.webhookHandler.handleChargeRefundUpdated(event);
      return ok({ processed: true });
    }

    // ✅ Event: payment_intent.payment_failed
    if (type === "payment_intent.payment_failed") {
      const pi = event.data?.object;
      const paymentIntentId = String(pi?.id ?? "");
      if (!paymentIntentId) return ok({ processed: true });

      const pointer = await this.db.bookingStripePayment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      // Enrich receipt (even if orphan)
      await this.db.stripeWebhookReceipt.update({
        where: { stripeEventId: String(event.id) },
        data: { stripePaymentIntentId: paymentIntentId, bookingId: pointer?.bookingId ?? null },
      });

      if (!pointer) {
        await emitNote({
          bookingId: "UNKNOWN",
          idempotencyKey: `STRIPE_PI_FAILED_ORPHAN:${paymentIntentId}:${event.id}`,
          note: {
            type: "STRIPE_PI_FAILED_ORPHAN",
            paymentIntentId,
            stripeEventId: event.id,
            createdAt: new Date().toISOString(),
          },
        });
        return ok({ processed: true });
      }

      await this.db.bookingStripePayment.update({
        where: { bookingId: pointer.bookingId },
        data: { status: "payment_failed" },
      });

      await emitNote({
        bookingId: pointer.bookingId,
        idempotencyKey: `STRIPE_PI_PAYMENT_FAILED:${pointer.bookingId}:${paymentIntentId}:${event.id}`,
        note: {
          type: "STRIPE_PI_PAYMENT_FAILED",
          bookingId: pointer.bookingId,
          paymentIntentId,
          stripeEventId: event.id,
          lastPaymentError: pi?.last_payment_error ?? null,
          createdAt: new Date().toISOString(),
        },
      });

      return ok({ processed: true });
    }

    // ✅ Event: charge.dispute.closed (note + loss write-off if lost; cash movement handled by funds_* events)
    if (type === "charge.dispute.closed") {
      await this.webhookHandler.handleChargeDisputeClosed(event);
      return ok({ processed: true });
    }

    // Ignore everything else for now (deterministic + safe)
    return ok({ ignored: true, type });
  }
}
