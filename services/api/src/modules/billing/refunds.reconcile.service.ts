import { Injectable, ForbiddenException } from "@nestjs/common";
import { BookingEventType } from "@prisma/client";

import { PrismaService } from "../../prisma";
import { StripeService } from "./stripe.service";

@Injectable()
export class RefundReconcileService {
  constructor(
    private readonly db: PrismaService,
    private readonly stripeSvc: StripeService,
  ) {}

  private async emit(bookingId: string, idempotencyKey: string, note: any) {
    try {
      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey,
          note: JSON.stringify(note),
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") return; // idempotent
      throw err;
    }
  }

  async executeIntentById(args: { refundIntentId: string }) {
    if (!process.env.STRIPE_SECRET_KEY) throw new ForbiddenException("STRIPE_NOT_CONFIGURED");

    const intent = await this.db.refundIntent.findUnique({
      where: { id: args.refundIntentId },
    });

    if (!intent) {
      return { ok: false, reason: "REFUND_INTENT_NOT_FOUND" };
    }

    if (intent.status === "executed") {
      return { ok: true, alreadyExecuted: true, refundId: intent.stripeRefundId ?? null };
    }

    // mark executing
    await this.db.refundIntent.update({
      where: { id: intent.id },
      data: { status: "executing" },
    });

    const bookingId = intent.bookingId;
    const stripe = this.stripeSvc.stripe;

    const ptr = await this.db.bookingStripePayment.findUnique({ where: { bookingId } });
    if (!ptr) {
      await this.emit(bookingId, `ADMIN_REFUND_INTENT_FAILED_NO_STRIPE:${bookingId}:${intent.id}`, {
        type: "ADMIN_REFUND_INTENT_FAILED",
        reason: "NO_BOOKING_STRIPE_PAYMENT",
        bookingId,
        refundIntentId: intent.id,
        createdAt: new Date().toISOString(),
      });

      await this.db.refundIntent.update({ where: { id: intent.id }, data: { status: "failed" } });
      return { ok: false, reason: "NO_BOOKING_STRIPE_PAYMENT" };
    }

    const piId = ptr.stripePaymentIntentId;
    const pi = await stripe.paymentIntents.retrieve(piId);

    if (pi.status !== "succeeded") {
      await this.emit(
        bookingId,
        `ADMIN_REFUND_INTENT_FAILED_PI_NOT_SUCCEEDED:${bookingId}:${piId}:${intent.id}`,
        {
          type: "ADMIN_REFUND_INTENT_FAILED",
          reason: "PAYMENT_INTENT_NOT_SUCCEEDED",
          bookingId,
          paymentIntentId: piId,
          piStatus: pi.status,
          refundIntentId: intent.id,
          createdAt: new Date().toISOString(),
        },
      );

      await this.db.refundIntent.update({ where: { id: intent.id }, data: { status: "failed" } });
      return { ok: false, reason: "PAYMENT_INTENT_NOT_SUCCEEDED", piStatus: pi.status };
    }

    const latestCharge = (pi as any).latest_charge as string | null;
    if (!latestCharge) {
      await this.emit(bookingId, `ADMIN_REFUND_INTENT_FAILED_NO_CHARGE:${bookingId}:${piId}:${intent.id}`, {
        type: "ADMIN_REFUND_INTENT_FAILED",
        reason: "NO_LATEST_CHARGE",
        bookingId,
        paymentIntentId: piId,
        refundIntentId: intent.id,
        createdAt: new Date().toISOString(),
      });

      await this.db.refundIntent.update({ where: { id: intent.id }, data: { status: "failed" } });
      return { ok: false, reason: "NO_LATEST_CHARGE" };
    }

    const refund = await stripe.refunds.create(
      {
        charge: latestCharge,
        amount: intent.amountCents ?? undefined,
        reason: "requested_by_customer",
        metadata: {
          bookingId,
          paymentIntentId: piId,
          refundIntentId: intent.id,
          refundIntentKey: intent.idempotencyKey,
        },
      },
      { idempotencyKey: `refund:${bookingId}:${intent.idempotencyKey}` },
    );

    await this.db.bookingStripePayment.update({
      where: { bookingId },
      data: { status: "refunding" },
    });

    await this.db.refundIntent.update({
      where: { id: intent.id },
      data: { status: "executed", stripeRefundId: refund.id },
    });

    await this.emit(bookingId, `STRIPE_REFUND_EXECUTED:${bookingId}:${refund.id}`, {
      type: "STRIPE_REFUND_EXECUTED",
      bookingId,
      paymentIntentId: piId,
      chargeId: latestCharge,
      refundId: refund.id,
      amount: refund.amount ?? null,
      currency: refund.currency ?? null,
      status: refund.status ?? null,
      refundIntentId: intent.id,
      refundIntentKey: intent.idempotencyKey,
      createdAt: new Date().toISOString(),
    });

    await this.emit(bookingId, `ADMIN_REFUND_INTENT_EXECUTED:${bookingId}:${intent.id}:${refund.id}`, {
      type: "ADMIN_REFUND_INTENT_EXECUTED",
      bookingId,
      refundIntentId: intent.id,
      refundId: refund.id,
      executedAt: new Date().toISOString(),
    });

    return { ok: true, refundId: refund.id };
  }

  /**
   * Execute pending refund intents (ledger-first).
   * For now: manual trigger only (endpoint in controller).
   */
  async runOnce(args: { limit: number }) {
    if (!process.env.STRIPE_SECRET_KEY) throw new ForbiddenException("STRIPE_NOT_CONFIGURED");

    const stripe = this.stripeSvc.stripe;

    const intents = await this.db.refundIntent.findMany({
      where: { status: "pending_execution" },
      orderBy: { createdAt: "asc" },
      take: Math.max(1, Math.min(100, Math.floor(args.limit))),
    });

    const results: any[] = [];

    for (const intent of intents) {
      const bookingId = intent.bookingId;

      // mark executing (best-effort)
      await this.db.refundIntent.update({
        where: { id: intent.id },
        data: { status: "executing" },
      });

      const ptr = await this.db.bookingStripePayment.findUnique({ where: { bookingId } });
      if (!ptr) {
        await this.emit(
          bookingId,
          `ADMIN_REFUND_INTENT_SKIPPED_NO_STRIPE:${bookingId}:${intent.id}`,
          {
            type: "ADMIN_REFUND_INTENT_SKIPPED",
            reason: "NO_BOOKING_STRIPE_PAYMENT",
            bookingId,
            refundIntentId: intent.id,
            createdAt: new Date().toISOString(),
          },
        );

        await this.db.refundIntent.update({
          where: { id: intent.id },
          data: { status: "failed" },
        });

        results.push({ bookingId, status: "failed", reason: "no_stripe_pointer" });
        continue;
      }

      const piId = ptr.stripePaymentIntentId;
      const pi = await stripe.paymentIntents.retrieve(piId);

      if (pi.status !== "succeeded") {
        await this.emit(
          bookingId,
          `ADMIN_REFUND_INTENT_SKIPPED_PI_NOT_SUCCEEDED:${bookingId}:${piId}:${intent.id}`,
          {
            type: "ADMIN_REFUND_INTENT_SKIPPED",
            reason: "PAYMENT_INTENT_NOT_SUCCEEDED",
            bookingId,
            paymentIntentId: piId,
            piStatus: pi.status,
            refundIntentId: intent.id,
            createdAt: new Date().toISOString(),
          },
        );

        await this.db.refundIntent.update({
          where: { id: intent.id },
          data: { status: "failed" },
        });

        results.push({ bookingId, status: "failed", reason: "pi_not_succeeded", piStatus: pi.status });
        continue;
      }

      const latestCharge = (pi as any).latest_charge as string | null;
      if (!latestCharge) {
        await this.emit(
          bookingId,
          `ADMIN_REFUND_INTENT_SKIPPED_NO_CHARGE:${bookingId}:${piId}:${intent.id}`,
          {
            type: "ADMIN_REFUND_INTENT_SKIPPED",
            reason: "NO_LATEST_CHARGE",
            bookingId,
            paymentIntentId: piId,
            refundIntentId: intent.id,
            createdAt: new Date().toISOString(),
          },
        );

        await this.db.refundIntent.update({
          where: { id: intent.id },
          data: { status: "failed" },
        });

        results.push({ bookingId, status: "failed", reason: "no_latest_charge" });
        continue;
      }

      const refund = await stripe.refunds.create(
        {
          charge: latestCharge,
          amount: intent.amountCents ?? undefined, // undefined => full refund
          reason: "requested_by_customer",
          metadata: {
            bookingId,
            paymentIntentId: piId,
            refundIntentId: intent.id,
            refundIntentKey: intent.idempotencyKey,
          },
        },
        { idempotencyKey: `refund:${bookingId}:${intent.idempotencyKey}` },
      );

      // pointer status is best-effort until webhook confirms final state
      await this.db.bookingStripePayment.update({
        where: { bookingId },
        data: { status: "refunding" },
      });

      await this.db.refundIntent.update({
        where: { id: intent.id },
        data: {
          status: "executed",
          stripeRefundId: refund.id,
        },
      });

      await this.emit(bookingId, `STRIPE_REFUND_EXECUTED:${bookingId}:${refund.id}`, {
        type: "STRIPE_REFUND_EXECUTED",
        bookingId,
        paymentIntentId: piId,
        chargeId: latestCharge,
        refundId: refund.id,
        amount: refund.amount ?? null,
        currency: refund.currency ?? null,
        status: refund.status ?? null,
        refundIntentId: intent.id,
        refundIntentKey: intent.idempotencyKey,
        createdAt: new Date().toISOString(),
      });

      await this.emit(bookingId, `ADMIN_REFUND_INTENT_EXECUTED:${bookingId}:${intent.id}:${refund.id}`, {
        type: "ADMIN_REFUND_INTENT_EXECUTED",
        bookingId,
        refundIntentId: intent.id,
        refundId: refund.id,
        executedAt: new Date().toISOString(),
      });

      results.push({ bookingId, status: "executed", refundId: refund.id });
    }

    return {
      matchedIntents: intents.length,
      results,
    };
  }
}
