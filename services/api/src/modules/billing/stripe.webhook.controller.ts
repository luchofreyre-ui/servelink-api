import { Controller, Headers, Post, Req } from "@nestjs/common";
import { BookingEventType } from "@prisma/client";
import type { Request } from "express";

import { PrismaService } from "../../prisma";
import { fail, ok } from "../../utils/http";
import { StripeService } from "./stripe.service";

@Controller("/api/v1/stripe")
export class StripeWebhookController {
  constructor(
    private readonly db: PrismaService,
    private readonly stripeSvc: StripeService,
  ) {}

  @Post("webhook")
  async handle(@Req() req: Request, @Headers("stripe-signature") sig?: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return fail("STRIPE_NOT_CONFIGURED", "Stripe webhook is not configured");
    if (!sig) return fail("INVALID_REQUEST", "Missing Stripe signature");

    const stripe = this.stripeSvc.stripe;

    let event: any;
    try {
      // With express.raw({type:"application/json"}), req.body is a Buffer.
      event = stripe.webhooks.constructEvent(req.body as any, sig, webhookSecret);
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

    // ✅ Event 1: payment_intent.succeeded
    if (type === "payment_intent.succeeded") {
      const pi = event.data?.object;
      const paymentIntentId = String(pi?.id ?? "");
      if (!paymentIntentId) return ok({ processed: true });

      const pointer = await findPointerByPi(paymentIntentId);

      await this.db.stripeWebhookReceipt.update({
        where: { stripeEventId: String(event.id) },
        data: { stripePaymentIntentId: paymentIntentId, bookingId: pointer?.bookingId ?? null },
      });

      if (!pointer) {
        await emitNote({
          bookingId: "UNKNOWN",
          idempotencyKey: `STRIPE_PI_SUCCEEDED_ORPHAN:${paymentIntentId}:${event.id}`,
          note: {
            type: "STRIPE_PI_SUCCEEDED_ORPHAN",
            paymentIntentId,
            stripeEventId: event.id,
            createdAt: new Date().toISOString(),
          },
        });
        return ok({ processed: true });
      }

      await this.db.bookingStripePayment.update({
        where: { bookingId: pointer.bookingId },
        data: { status: "succeeded" },
      });

      await emitNote({
        bookingId: pointer.bookingId,
        idempotencyKey: `STRIPE_PI_SUCCEEDED:${pointer.bookingId}:${paymentIntentId}:${event.id}`,
        note: {
          type: "STRIPE_PI_SUCCEEDED",
          bookingId: pointer.bookingId,
          paymentIntentId,
          stripeEventId: event.id,
          amountReceived: pi?.amount_received ?? null,
          currency: pi?.currency ?? null,
          createdAt: new Date().toISOString(),
        },
      });

      return ok({ processed: true });
    }

    // ✅ Event 2: charge.dispute.created
    if (type === "charge.dispute.created") {
      const dispute = event.data?.object;
      const disputeId = String(dispute?.id ?? "");
      const chargeId = String(dispute?.charge ?? "");
      if (!chargeId) return ok({ processed: true });

      // Retrieve charge to get payment_intent
      const charge = await stripe.charges.retrieve(chargeId);
      const paymentIntentId = String((charge as any)?.payment_intent ?? "");
      if (!paymentIntentId) {
        await emitNote({
          bookingId: "UNKNOWN",
          idempotencyKey: `STRIPE_DISPUTE_NO_PI:${chargeId}:${event.id}`,
          note: {
            type: "STRIPE_DISPUTE_NO_PI",
            stripeEventId: event.id,
            disputeId: disputeId || null,
            chargeId,
            createdAt: new Date().toISOString(),
          },
        });
        return ok({ processed: true });
      }

      const pointer = await findPointerByPi(paymentIntentId);

      await this.db.stripeWebhookReceipt.update({
        where: { stripeEventId: String(event.id) },
        data: { stripePaymentIntentId: paymentIntentId, bookingId: pointer?.bookingId ?? null },
      });

      if (!pointer) {
        await emitNote({
          bookingId: "UNKNOWN",
          idempotencyKey: `STRIPE_DISPUTE_ORPHAN:${paymentIntentId}:${event.id}`,
          note: {
            type: "STRIPE_DISPUTE_ORPHAN",
            stripeEventId: event.id,
            disputeId: disputeId || null,
            chargeId,
            paymentIntentId,
            createdAt: new Date().toISOString(),
          },
        });
        return ok({ processed: true });
      }

      // Operational record (DisputeCase)
      if (disputeId && pointer?.bookingId) {
        await this.db.disputeCase.upsert({
          where: { stripeDisputeId: disputeId },
          create: {
            bookingId: pointer.bookingId,
            stripeDisputeId: disputeId,
            stripeChargeId: chargeId || null,
            stripePaymentIntentId: paymentIntentId || null,
            status: String(dispute?.status ?? "created"),
            reason: dispute?.reason ?? null,
            amount: typeof dispute?.amount === "number" ? dispute.amount : null,
            currency: dispute?.currency ?? null,
          },
          update: {
            stripeChargeId: chargeId || null,
            stripePaymentIntentId: paymentIntentId || null,
            status: String(dispute?.status ?? "created"),
            reason: dispute?.reason ?? null,
            amount: typeof dispute?.amount === "number" ? dispute.amount : null,
            currency: dispute?.currency ?? null,
          },
        });
      }

      await this.db.bookingStripePayment.update({
        where: { bookingId: pointer.bookingId },
        data: { status: "disputed" },
      });

      await emitNote({
        bookingId: pointer.bookingId,
        idempotencyKey: `STRIPE_DISPUTE_CREATED:${pointer.bookingId}:${disputeId || chargeId}:${event.id}`,
        note: {
          type: "STRIPE_DISPUTE_CREATED",
          bookingId: pointer.bookingId,
          stripeEventId: event.id,
          disputeId: disputeId || null,
          chargeId,
          paymentIntentId,
          amount: dispute?.amount ?? null,
          currency: dispute?.currency ?? null,
          reason: dispute?.reason ?? null,
          status: dispute?.status ?? null,
          createdAt: new Date().toISOString(),
        },
      });

      return ok({ processed: true });
    }

    // ✅ Event 3: charge.refund.updated  (covers partial refunds and final state)
    if (type === "charge.refund.updated") {
      const refund = event.data?.object;
      const refundId = String(refund?.id ?? "");
      const chargeId = String(refund?.charge ?? "");
      if (!chargeId) return ok({ processed: true });

      const charge = await stripe.charges.retrieve(chargeId);
      const paymentIntentId = String((charge as any)?.payment_intent ?? "");
      if (!paymentIntentId) {
        await emitNote({
          bookingId: "UNKNOWN",
          idempotencyKey: `STRIPE_REFUND_NO_PI:${chargeId}:${event.id}`,
          note: {
            type: "STRIPE_REFUND_NO_PI",
            stripeEventId: event.id,
            refundId: refundId || null,
            chargeId,
            createdAt: new Date().toISOString(),
          },
        });
        return ok({ processed: true });
      }

      const pointer = await findPointerByPi(paymentIntentId);

      await this.db.stripeWebhookReceipt.update({
        where: { stripeEventId: String(event.id) },
        data: { stripePaymentIntentId: paymentIntentId, bookingId: pointer?.bookingId ?? null },
      });

      if (!pointer) {
        await emitNote({
          bookingId: "UNKNOWN",
          idempotencyKey: `STRIPE_REFUND_ORPHAN:${paymentIntentId}:${event.id}`,
          note: {
            type: "STRIPE_REFUND_ORPHAN",
            stripeEventId: event.id,
            refundId: refundId || null,
            chargeId,
            paymentIntentId,
            createdAt: new Date().toISOString(),
          },
        });
        return ok({ processed: true });
      }

      // For now, collapse all refunds into "refunded" status at pointer level.
      await this.db.bookingStripePayment.update({
        where: { bookingId: pointer.bookingId },
        data: { status: "refunded" },
      });

      await emitNote({
        bookingId: pointer.bookingId,
        idempotencyKey: `STRIPE_REFUND_UPDATED:${pointer.bookingId}:${refundId || chargeId}:${event.id}`,
        note: {
          type: "STRIPE_REFUND_UPDATED",
          bookingId: pointer.bookingId,
          stripeEventId: event.id,
          refundId: refundId || null,
          chargeId,
          paymentIntentId,
          amount: refund?.amount ?? null,
          currency: refund?.currency ?? null,
          status: refund?.status ?? null,
          reason: refund?.reason ?? null,
          createdAt: new Date().toISOString(),
        },
      });

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

    // ✅ Event: charge.dispute.closed  (final outcome)
    if (type === "charge.dispute.closed") {
      const dispute = event.data?.object;
      const disputeId = String(dispute?.id ?? "");
      const chargeId = String(dispute?.charge ?? "");
      if (!chargeId) return ok({ processed: true });

      // Retrieve charge to get payment_intent
      const charge = await stripe.charges.retrieve(chargeId);
      const paymentIntentId = String((charge as any)?.payment_intent ?? "");

      const pointer = paymentIntentId
        ? await this.db.bookingStripePayment.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          })
        : null;

      // Enrich receipt when we can
      await this.db.stripeWebhookReceipt.update({
        where: { stripeEventId: String(event.id) },
        data: {
          stripePaymentIntentId: paymentIntentId || null,
          bookingId: pointer?.bookingId ?? null,
        },
      });

      if (!paymentIntentId) {
        await emitNote({
          bookingId: "UNKNOWN",
          idempotencyKey: `STRIPE_DISPUTE_CLOSED_NO_PI:${chargeId}:${event.id}`,
          note: {
            type: "STRIPE_DISPUTE_CLOSED_NO_PI",
            stripeEventId: event.id,
            disputeId: disputeId || null,
            chargeId,
            createdAt: new Date().toISOString(),
          },
        });
        return ok({ processed: true });
      }

      if (!pointer) {
        await emitNote({
          bookingId: "UNKNOWN",
          idempotencyKey: `STRIPE_DISPUTE_CLOSED_ORPHAN:${paymentIntentId}:${event.id}`,
          note: {
            type: "STRIPE_DISPUTE_CLOSED_ORPHAN",
            stripeEventId: event.id,
            disputeId: disputeId || null,
            chargeId,
            paymentIntentId,
            status: dispute?.status ?? null,
            createdAt: new Date().toISOString(),
          },
        });
        return ok({ processed: true });
      }

      // Operational record (DisputeCase)
      if (disputeId && pointer?.bookingId) {
        await this.db.disputeCase.upsert({
          where: { stripeDisputeId: disputeId },
          create: {
            bookingId: pointer.bookingId,
            stripeDisputeId: disputeId,
            stripeChargeId: chargeId || null,
            stripePaymentIntentId: paymentIntentId || null,
            status: String(dispute?.status ?? "closed"),
            reason: dispute?.reason ?? null,
            amount: typeof dispute?.amount === "number" ? dispute.amount : null,
            currency: dispute?.currency ?? null,
            closedAt: new Date(),
          },
          update: {
            stripeChargeId: chargeId || null,
            stripePaymentIntentId: paymentIntentId || null,
            status: String(dispute?.status ?? "closed"),
            reason: dispute?.reason ?? null,
            amount: typeof dispute?.amount === "number" ? dispute.amount : null,
            currency: dispute?.currency ?? null,
            closedAt: new Date(),
          },
        });
      }

      // Stripe dispute "closed" can be won or lost; represent clearly in pointer status.
      // Common statuses include "won" / "lost" (Stripe dispute.status is final).
      const finalStatus = String(dispute?.status ?? "closed");
      const pointerStatus =
        finalStatus === "won" ? "dispute_won" : finalStatus === "lost" ? "dispute_lost" : "dispute_closed";

      await this.db.bookingStripePayment.update({
        where: { bookingId: pointer.bookingId },
        data: { status: pointerStatus },
      });

      await emitNote({
        bookingId: pointer.bookingId,
        idempotencyKey: `STRIPE_DISPUTE_CLOSED:${pointer.bookingId}:${disputeId || chargeId}:${event.id}`,
        note: {
          type: "STRIPE_DISPUTE_CLOSED",
          bookingId: pointer.bookingId,
          stripeEventId: event.id,
          disputeId: disputeId || null,
          chargeId,
          paymentIntentId,
          finalStatus,
          amount: dispute?.amount ?? null,
          currency: dispute?.currency ?? null,
          createdAt: new Date().toISOString(),
        },
      });

      return ok({ processed: true });
    }

    // Ignore everything else for now (deterministic + safe)
    return ok({ ignored: true, type });
  }
}
