import { Injectable } from "@nestjs/common";
import { BookingEventType, JournalEntryType, LedgerAccount, LineDirection } from "@prisma/client";

import { PrismaService } from "../../prisma";
import { LedgerService } from "../ledger/ledger.service";
import { type PricingPolicyV1, splitCharge } from "./pricing.policy";

const PRICING_POLICY_V1: PricingPolicyV1 = {
  platformFeeBps: 2000,
  minPlatformFeeCents: 0,
};

export type StripePaymentIntentSucceededEvent = {
  id: string;
  data?: {
    object?: {
      id?: string;
      amount_received?: number;
      amount?: number;
      currency?: string;
    };
  };
};

/**
 * Handles payment_intent.succeeded: updates pointer, emits note, posts SETTLEMENT ledger entry.
 * Idempotency via ledger key ledger:settlement:${bookingId}:${paymentIntentId}:${event.id}.
 */
@Injectable()
export class StripeWebhookHandlerService {
  constructor(
    private readonly db: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async handlePaymentIntentSucceeded(
    event: StripePaymentIntentSucceededEvent,
  ): Promise<{ processed: true }> {
    const pi = event.data?.object;
    const paymentIntentId = String(pi?.id ?? "");
    if (!paymentIntentId) return { processed: true };

    const pointer = await this.db.bookingStripePayment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    await this.db.stripeWebhookReceipt.update({
      where: { stripeEventId: String(event.id) },
      data: {
        stripePaymentIntentId: paymentIntentId,
        bookingId: pointer?.bookingId ?? null,
      },
    });

    if (!pointer) {
      await this.emitNote({
        bookingId: "UNKNOWN",
        idempotencyKey: `STRIPE_PI_SUCCEEDED_ORPHAN:${paymentIntentId}:${event.id}`,
        note: {
          type: "STRIPE_PI_SUCCEEDED_ORPHAN",
          paymentIntentId,
          stripeEventId: event.id,
          createdAt: new Date().toISOString(),
        },
      });
      return { processed: true };
    }

    const chargeId =
      (pi as any)?.latest_charge ??
      (Array.isArray((pi as any)?.charges?.data) && (pi as any).charges.data[0]?.id
        ? (pi as any).charges.data[0].id
        : null);
    const updateData: { status: string; stripeChargeId?: string } = { status: "succeeded" };
    if (chargeId && typeof chargeId === "string" && chargeId.length > 0) {
      updateData.stripeChargeId = chargeId;
    }
    await this.db.bookingStripePayment.update({
      where: { bookingId: pointer.bookingId },
      data: updateData,
    });

    await this.emitNote({
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

    const amountCents =
      pi?.amount_received != null && pi.amount_received > 0
        ? Math.floor(pi.amount_received)
        : (pi?.amount != null ? Math.floor(pi.amount) : 0);
    const currency = (pi?.currency ?? "usd").toString().toLowerCase();

    if (amountCents > 0) {
      await this.ledger.postEntry({
        type: JournalEntryType.SETTLEMENT,
        bookingId: pointer.bookingId,
        currency,
        idempotencyKey: `ledger:settlement:${pointer.bookingId}:${paymentIntentId}:${event.id}`,
        metadata: {
          stripeEventId: event.id,
          paymentIntentId,
          amountCents,
          currency,
        },
        lines: [
          {
            account: LedgerAccount.CASH_STRIPE,
            direction: LineDirection.DEBIT,
            amountCents,
          },
          {
            account: LedgerAccount.AR_CUSTOMER,
            direction: LineDirection.CREDIT,
            amountCents,
          },
        ],
      });
    }

    return { processed: true };
  }

  async handleChargeRefundUpdated(event: any): Promise<{ processed: true }> {
    const refund = event.data?.object;
    const refundId = String(refund?.id ?? "");
    const chargeId = String(refund?.charge ?? "");
    if (!chargeId) return { processed: true };

    const pointer = await this.db.bookingStripePayment.findUnique({
      where: { stripeChargeId: chargeId },
    });

    await this.db.stripeWebhookReceipt.update({
      where: { stripeEventId: String(event.id) },
      data: {
        stripePaymentIntentId: pointer?.stripePaymentIntentId ?? null,
        bookingId: pointer?.bookingId ?? null,
      },
    });

    if (!pointer) {
      await this.emitNote({
        bookingId: "UNKNOWN",
        idempotencyKey: `STRIPE_REFUND_ORPHAN:${chargeId}:${event.id}`,
        note: {
          type: "STRIPE_REFUND_ORPHAN",
          stripeEventId: event.id,
          refundId: refundId || null,
          chargeId,
          createdAt: new Date().toISOString(),
        },
      });
      return { processed: true };
    }

    await this.db.bookingStripePayment.update({
      where: { bookingId: pointer.bookingId },
      data: { status: "refunded" },
    });

    await this.emitNote({
      bookingId: pointer.bookingId,
      idempotencyKey: `STRIPE_REFUND_UPDATED:${pointer.bookingId}:${refundId || chargeId}:${event.id}`,
      note: {
        type: "STRIPE_REFUND_UPDATED",
        bookingId: pointer.bookingId,
        stripeEventId: event.id,
        refundId: refundId || null,
        chargeId,
        paymentIntentId: pointer.stripePaymentIntentId ?? null,
        amount: refund?.amount ?? null,
        currency: refund?.currency ?? null,
        status: refund?.status ?? null,
        reason: refund?.reason ?? null,
        createdAt: new Date().toISOString(),
      },
    });

    const refundAmountCents =
      typeof refund?.amount === "number" && refund.amount > 0 ? Math.floor(refund.amount) : 0;
    const currency = (refund?.currency ?? "usd").toString().toLowerCase();

    if (refundAmountCents > 0) {
      // --- Over-refund guard (v1) ---
      // If we have a CHARGE, cap this refund so cumulative refunds never exceed chargeTotalCents.
      // Also cap platform/FO refund components so cumulative DRs never exceed original credits.
      const chargeEntry = await this.db.journalEntry.findFirst({
        where: { bookingId: pointer.bookingId, type: JournalEntryType.CHARGE, currency },
        orderBy: { createdAt: "desc" },
        include: { lines: true },
      });

      const arDebit = chargeEntry?.lines.find(
        (l) => l.account === LedgerAccount.AR_CUSTOMER && l.direction === LineDirection.DEBIT,
      );
      const revCredit = chargeEntry?.lines.find(
        (l) => l.account === LedgerAccount.REV_PLATFORM && l.direction === LineDirection.CREDIT,
      );
      const liabCredit = chargeEntry?.lines.find(
        (l) => l.account === LedgerAccount.LIAB_FO_PAYABLE && l.direction === LineDirection.CREDIT,
      );

      const chargeTotalCents = arDebit?.amountCents ?? 0;
      const platformFeeCents = revCredit?.amountCents ?? 0;
      const foEarningsCents = liabCredit?.amountCents ?? 0;

      // Sum already-posted refunds for this booking/currency (ledger truth).
      const alreadyRefundedCashAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.CASH_STRIPE,
          direction: LineDirection.CREDIT,
          entry: { bookingId: pointer.bookingId, type: JournalEntryType.REFUND, currency },
        },
        _sum: { amountCents: true },
      });
      const alreadyRefundedCashCents = alreadyRefundedCashAgg._sum.amountCents ?? 0;

      // If we can't find a valid CHARGE shape, we can't safely cap vs the original total.
      // In that case we fall back to policy split (existing behavior), but still balanced.
      const hasValidCharge =
        chargeEntry != null &&
        chargeTotalCents > 0 &&
        revCredit != null &&
        liabCredit != null &&
        platformFeeCents >= 0 &&
        foEarningsCents >= 0 &&
        platformFeeCents + foEarningsCents === chargeTotalCents;

      const remainingRefundableCents = hasValidCharge
        ? Math.max(0, chargeTotalCents - alreadyRefundedCashCents)
        : refundAmountCents;

      const cappedRefundCents = Math.max(0, Math.min(refundAmountCents, remainingRefundableCents));

      // If this refund would exceed what's refundable, we treat it as a no-op at the ledger layer.
      if (cappedRefundCents === 0) {
        return { processed: true };
      }

      let platformRefundCents: number;
      let foRefundCents: number;
      let chargeEntryId: string | null = null;

      if (hasValidCharge) {
        chargeEntryId = chargeEntry!.id;

        const alreadyPlatformRefundAgg = await this.db.journalLine.aggregate({
          where: {
            account: LedgerAccount.LIAB_DEFERRED_REVENUE,
            direction: LineDirection.DEBIT,
            entry: { bookingId: pointer.bookingId, type: JournalEntryType.REFUND, currency },
          },
          _sum: { amountCents: true },
        });
        const alreadyFoRefundAgg = await this.db.journalLine.aggregate({
          where: {
            account: LedgerAccount.LIAB_FO_PAYABLE,
            direction: LineDirection.DEBIT,
            entry: { bookingId: pointer.bookingId, type: JournalEntryType.REFUND, currency },
          },
          _sum: { amountCents: true },
        });

        const alreadyPlatformRefundCents = alreadyPlatformRefundAgg._sum.amountCents ?? 0;
        const alreadyFoRefundCents = alreadyFoRefundAgg._sum.amountCents ?? 0;

        const remainingPlatformCents = Math.max(0, platformFeeCents - alreadyPlatformRefundCents);
        const remainingFoCents = Math.max(0, foEarningsCents - alreadyFoRefundCents);

        // Target proration from original CHARGE proportions.
        let targetPlatform = Math.round((platformFeeCents * cappedRefundCents) / chargeTotalCents);
        targetPlatform = Math.max(0, Math.min(cappedRefundCents, targetPlatform));
        let targetFo = cappedRefundCents - targetPlatform;

        // Clamp to remaining buckets to prevent drift across multiple partial refunds.
        let finalPlatform = Math.min(targetPlatform, remainingPlatformCents);
        let finalFo = cappedRefundCents - finalPlatform;

        if (finalFo > remainingFoCents) {
          finalFo = remainingFoCents;
          finalPlatform = cappedRefundCents - finalFo;
          finalPlatform = Math.min(finalPlatform, remainingPlatformCents);
          finalFo = cappedRefundCents - finalPlatform;
        }

        platformRefundCents = finalPlatform;
        foRefundCents = finalFo;
      } else {
        const split = splitCharge(cappedRefundCents, PRICING_POLICY_V1);
        platformRefundCents = split.platformFeeCents;
        foRefundCents = split.foEarningsCents;
      }

      // Debit LIAB_DEFERRED_REVENUE when deferred exists; else REV_PLATFORM (after recognition).
      const defCredits = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.LIAB_DEFERRED_REVENUE,
          direction: LineDirection.CREDIT,
          entry: { bookingId: pointer.bookingId, currency },
        },
        _sum: { amountCents: true },
      });
      const defDebits = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.LIAB_DEFERRED_REVENUE,
          direction: LineDirection.DEBIT,
          entry: { bookingId: pointer.bookingId, currency },
        },
        _sum: { amountCents: true },
      });
      const deferredBalance =
        (defCredits._sum.amountCents ?? 0) - (defDebits._sum.amountCents ?? 0);
      const platformDebitAccount =
        deferredBalance > 0 ? LedgerAccount.LIAB_DEFERRED_REVENUE : LedgerAccount.REV_PLATFORM;

      await this.ledger.postEntry({
        type: JournalEntryType.REFUND,
        bookingId: pointer.bookingId,
        currency,
        idempotencyKey: `ledger:refund:${pointer.bookingId}:${refundId || chargeId}:${event.id}`,
        metadata: {
          stripeEventId: event.id,
          refundId: refundId || null,
          chargeId,
          amountCents: cappedRefundCents,
          currency,
          platformRefundCents,
          foRefundCents,
          refundRequestedCents: refundAmountCents,
          ...(chargeEntryId != null && { chargeEntryId }),
          ...(hasValidCharge && { chargeTotalCents }),
          ...(hasValidCharge && { alreadyRefundedCashCents }),
        },
        lines: [
          { account: platformDebitAccount, direction: LineDirection.DEBIT, amountCents: platformRefundCents },
          { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.DEBIT, amountCents: foRefundCents },
          { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents: cappedRefundCents },
        ],
      });
    }

    return { processed: true };
  }

  async handleChargeDisputeCreated(event: any): Promise<{ processed: true }> {
    const dispute = event.data?.object;
    const disputeId = String(dispute?.id ?? "");
    const chargeId = String(dispute?.charge ?? "");
    if (!chargeId) return { processed: true };

    const pointer = await this.db.bookingStripePayment.findUnique({
      where: { stripeChargeId: chargeId },
    });

    await this.db.stripeWebhookReceipt.update({
      where: { stripeEventId: String(event.id) },
      data: {
        stripePaymentIntentId: pointer?.stripePaymentIntentId ?? null,
        bookingId: pointer?.bookingId ?? null,
      },
    });

    if (!pointer) {
      await this.emitNote({
        bookingId: "UNKNOWN",
        idempotencyKey: `STRIPE_DISPUTE_ORPHAN:${chargeId}:${event.id}`,
        note: {
          type: "STRIPE_DISPUTE_ORPHAN",
          stripeEventId: event.id,
          disputeId: disputeId || null,
          chargeId,
          createdAt: new Date().toISOString(),
        },
      });
      return { processed: true };
    }

    if (disputeId && pointer?.bookingId) {
      await this.db.disputeCase.upsert({
        where: { stripeDisputeId: disputeId },
        create: {
          bookingId: pointer.bookingId,
          stripeDisputeId: disputeId,
          stripeChargeId: chargeId || null,
          stripePaymentIntentId: pointer.stripePaymentIntentId ?? null,
          status: String(dispute?.status ?? "created"),
          reason: dispute?.reason ?? null,
          amount: typeof dispute?.amount === "number" ? dispute.amount : null,
          currency: dispute?.currency ?? null,
        },
        update: {
          stripeChargeId: chargeId || null,
          stripePaymentIntentId: pointer.stripePaymentIntentId ?? null,
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

    await this.emitNote({
      bookingId: pointer.bookingId,
      idempotencyKey: `STRIPE_DISPUTE_CREATED:${pointer.bookingId}:${disputeId || chargeId}:${event.id}`,
      note: {
        type: "STRIPE_DISPUTE_CREATED",
        bookingId: pointer.bookingId,
        stripeEventId: event.id,
        disputeId: disputeId || null,
        chargeId,
        paymentIntentId: pointer.stripePaymentIntentId ?? null,
        amount: dispute?.amount ?? null,
        currency: dispute?.currency ?? null,
        reason: dispute?.reason ?? null,
        status: dispute?.status ?? null,
        createdAt: new Date().toISOString(),
      },
    });

    return { processed: true };
  }

  async handleChargeDisputeFundsWithdrawn(event: any): Promise<{ processed: true }> {
    const dispute = event.data?.object;
    const disputeId = String(dispute?.id ?? "");
    const chargeId = String(dispute?.charge ?? "");
    if (!chargeId) return { processed: true };

    const pointer = await this.db.bookingStripePayment.findUnique({
      where: { stripeChargeId: chargeId },
    });

    await this.db.stripeWebhookReceipt.update({
      where: { stripeEventId: String(event.id) },
      data: {
        stripePaymentIntentId: pointer?.stripePaymentIntentId ?? null,
        bookingId: pointer?.bookingId ?? null,
      },
    });

    if (!pointer) {
      await this.emitNote({
        bookingId: "UNKNOWN",
        idempotencyKey: `STRIPE_DISPUTE_FUNDS_WITHDRAWN_ORPHAN:${chargeId}:${event.id}`,
        note: {
          type: "STRIPE_DISPUTE_FUNDS_WITHDRAWN_ORPHAN",
          stripeEventId: event.id,
          disputeId: disputeId || null,
          chargeId,
          createdAt: new Date().toISOString(),
        },
      });
      return { processed: true };
    }

    // keep disputeCase current
    if (disputeId && pointer.bookingId) {
      await this.db.disputeCase.upsert({
        where: { stripeDisputeId: disputeId },
        create: {
          bookingId: pointer.bookingId,
          stripeDisputeId: disputeId,
          stripeChargeId: chargeId || null,
          stripePaymentIntentId: pointer.stripePaymentIntentId ?? null,
          status: String(dispute?.status ?? "funds_withdrawn"),
          reason: dispute?.reason ?? null,
          amount: typeof dispute?.amount === "number" ? dispute.amount : null,
          currency: dispute?.currency ?? null,
        },
        update: {
          stripeChargeId: chargeId || null,
          stripePaymentIntentId: pointer.stripePaymentIntentId ?? null,
          status: String(dispute?.status ?? "funds_withdrawn"),
          reason: dispute?.reason ?? null,
          amount: typeof dispute?.amount === "number" ? dispute.amount : null,
          currency: dispute?.currency ?? null,
        },
      });
    }

    await this.emitNote({
      bookingId: pointer.bookingId,
      idempotencyKey: `STRIPE_DISPUTE_FUNDS_WITHDRAWN:${pointer.bookingId}:${disputeId || chargeId}:${event.id}`,
      note: {
        type: "STRIPE_DISPUTE_FUNDS_WITHDRAWN",
        bookingId: pointer.bookingId,
        stripeEventId: event.id,
        disputeId: disputeId || null,
        chargeId,
        paymentIntentId: pointer.stripePaymentIntentId ?? null,
        amount: dispute?.amount ?? null,
        currency: dispute?.currency ?? null,
        reason: dispute?.reason ?? null,
        status: dispute?.status ?? null,
        createdAt: new Date().toISOString(),
      },
    });

    const amountCents =
      typeof dispute?.amount === "number" && dispute.amount > 0 ? Math.floor(dispute.amount) : 0;
    const currency = (dispute?.currency ?? "usd").toString().toLowerCase();

    if (amountCents > 0) {
      await this.ledger.postEntry({
        type: JournalEntryType.DISPUTE_WITHDRAWAL,
        bookingId: pointer.bookingId,
        currency,
        idempotencyKey: `ledger:dispute_withdrawal:${pointer.bookingId}:${disputeId || chargeId}:${event.id}`,
        metadata: {
          stripeEventId: event.id,
          disputeId: disputeId || null,
          chargeId,
          amountCents,
          currency,
        },
        lines: [
          { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents },
          { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents },
        ],
      });
    }

    return { processed: true };
  }

  async handleChargeDisputeFundsReinstated(event: any): Promise<{ processed: true }> {
    const dispute = event.data?.object;
    const disputeId = String(dispute?.id ?? "");
    const chargeId = String(dispute?.charge ?? "");
    if (!chargeId) return { processed: true };

    const pointer = await this.db.bookingStripePayment.findUnique({
      where: { stripeChargeId: chargeId },
    });

    await this.db.stripeWebhookReceipt.update({
      where: { stripeEventId: String(event.id) },
      data: {
        stripePaymentIntentId: pointer?.stripePaymentIntentId ?? null,
        bookingId: pointer?.bookingId ?? null,
      },
    });

    if (!pointer) {
      await this.emitNote({
        bookingId: "UNKNOWN",
        idempotencyKey: `STRIPE_DISPUTE_FUNDS_REINSTATED_ORPHAN:${chargeId}:${event.id}`,
        note: {
          type: "STRIPE_DISPUTE_FUNDS_REINSTATED_ORPHAN",
          stripeEventId: event.id,
          disputeId: disputeId || null,
          chargeId,
          createdAt: new Date().toISOString(),
        },
      });
      return { processed: true };
    }

    // keep disputeCase current
    if (disputeId && pointer.bookingId) {
      await this.db.disputeCase.upsert({
        where: { stripeDisputeId: disputeId },
        create: {
          bookingId: pointer.bookingId,
          stripeDisputeId: disputeId,
          stripeChargeId: chargeId || null,
          stripePaymentIntentId: pointer.stripePaymentIntentId ?? null,
          status: String(dispute?.status ?? "funds_reinstated"),
          reason: dispute?.reason ?? null,
          amount: typeof dispute?.amount === "number" ? dispute.amount : null,
          currency: dispute?.currency ?? null,
        },
        update: {
          stripeChargeId: chargeId || null,
          stripePaymentIntentId: pointer.stripePaymentIntentId ?? null,
          status: String(dispute?.status ?? "funds_reinstated"),
          reason: dispute?.reason ?? null,
          amount: typeof dispute?.amount === "number" ? dispute.amount : null,
          currency: dispute?.currency ?? null,
        },
      });
    }

    await this.emitNote({
      bookingId: pointer.bookingId,
      idempotencyKey: `STRIPE_DISPUTE_FUNDS_REINSTATED:${pointer.bookingId}:${disputeId || chargeId}:${event.id}`,
      note: {
        type: "STRIPE_DISPUTE_FUNDS_REINSTATED",
        bookingId: pointer.bookingId,
        stripeEventId: event.id,
        disputeId: disputeId || null,
        chargeId,
        paymentIntentId: pointer.stripePaymentIntentId ?? null,
        amount: dispute?.amount ?? null,
        currency: dispute?.currency ?? null,
        reason: dispute?.reason ?? null,
        status: dispute?.status ?? null,
        createdAt: new Date().toISOString(),
      },
    });

    const amountCents =
      typeof dispute?.amount === "number" && dispute.amount > 0 ? Math.floor(dispute.amount) : 0;
    const currency = (dispute?.currency ?? "usd").toString().toLowerCase();

    if (amountCents > 0) {
      await this.ledger.postEntry({
        type: JournalEntryType.DISPUTE_REVERSAL,
        bookingId: pointer.bookingId,
        currency,
        idempotencyKey: `ledger:dispute_reversal:${pointer.bookingId}:${disputeId || chargeId}:${event.id}`,
        metadata: {
          stripeEventId: event.id,
          disputeId: disputeId || null,
          chargeId,
          amountCents,
          currency,
        },
        lines: [
          { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents },
          { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents },
        ],
      });
    }

    return { processed: true };
  }

  async handleChargeDisputeClosed(event: any): Promise<{ processed: true }> {
    const dispute = event.data?.object;
    const disputeId = String(dispute?.id ?? "");
    const chargeId = String(dispute?.charge ?? "");
    if (!chargeId) return { processed: true };

    const pointer = await this.db.bookingStripePayment.findUnique({
      where: { stripeChargeId: chargeId },
    });

    await this.db.stripeWebhookReceipt.update({
      where: { stripeEventId: String(event.id) },
      data: {
        stripePaymentIntentId: pointer?.stripePaymentIntentId ?? null,
        bookingId: pointer?.bookingId ?? null,
      },
    });

    if (!pointer) {
      await this.emitNote({
        bookingId: "UNKNOWN",
        idempotencyKey: `STRIPE_DISPUTE_CLOSED_ORPHAN:${chargeId}:${event.id}`,
        note: {
          type: "STRIPE_DISPUTE_CLOSED_ORPHAN",
          stripeEventId: event.id,
          disputeId: disputeId || null,
          chargeId,
          status: dispute?.status ?? null,
          createdAt: new Date().toISOString(),
        },
      });
      return { processed: true };
    }

    if (disputeId && pointer?.bookingId) {
      await this.db.disputeCase.upsert({
        where: { stripeDisputeId: disputeId },
        create: {
          bookingId: pointer.bookingId,
          stripeDisputeId: disputeId,
          stripeChargeId: chargeId || null,
          stripePaymentIntentId: pointer.stripePaymentIntentId ?? null,
          status: String(dispute?.status ?? "closed"),
          reason: dispute?.reason ?? null,
          amount: typeof dispute?.amount === "number" ? dispute.amount : null,
          currency: dispute?.currency ?? null,
          closedAt: new Date(),
        },
        update: {
          stripeChargeId: chargeId || null,
          stripePaymentIntentId: pointer.stripePaymentIntentId ?? null,
          status: String(dispute?.status ?? "closed"),
          reason: dispute?.reason ?? null,
          amount: typeof dispute?.amount === "number" ? dispute.amount : null,
          currency: dispute?.currency ?? null,
          closedAt: new Date(),
        },
      });
    }

    const finalStatus = String(dispute?.status ?? "closed");
    const pointerStatus =
      finalStatus === "won" ? "dispute_won" : finalStatus === "lost" ? "dispute_lost" : "dispute_closed";

    await this.db.bookingStripePayment.update({
      where: { bookingId: pointer.bookingId },
      data: { status: pointerStatus },
    });

    await this.emitNote({
      bookingId: pointer.bookingId,
      idempotencyKey: `STRIPE_DISPUTE_CLOSED:${pointer.bookingId}:${disputeId || chargeId}:${event.id}`,
      note: {
        type: "STRIPE_DISPUTE_CLOSED",
        bookingId: pointer.bookingId,
        stripeEventId: event.id,
        disputeId: disputeId || null,
        chargeId,
        paymentIntentId: pointer.stripePaymentIntentId ?? null,
        finalStatus,
        amount: dispute?.amount ?? null,
        currency: dispute?.currency ?? null,
        createdAt: new Date().toISOString(),
      },
    });

    const amountCents =
      typeof dispute?.amount === "number" && dispute.amount > 0 ? Math.floor(dispute.amount) : 0;
    const currency = (dispute?.currency ?? "usd").toString().toLowerCase();

    if (amountCents > 0) {
      if (finalStatus === "lost") {
        // Use LIAB_DEFERRED_REVENUE for platform debit if this booking has deferred balance; else REV_PLATFORM.
        const deferredCredits = await this.db.journalLine.aggregate({
          where: {
            account: LedgerAccount.LIAB_DEFERRED_REVENUE,
            direction: LineDirection.CREDIT,
            entry: { bookingId: pointer.bookingId, currency },
          },
          _sum: { amountCents: true },
        });
        const deferredDebits = await this.db.journalLine.aggregate({
          where: {
            account: LedgerAccount.LIAB_DEFERRED_REVENUE,
            direction: LineDirection.DEBIT,
            entry: { bookingId: pointer.bookingId, currency },
          },
          _sum: { amountCents: true },
        });
        const deferredBalance =
          (deferredCredits._sum.amountCents ?? 0) - (deferredDebits._sum.amountCents ?? 0);
        const platformDebitAccount =
          deferredBalance > 0 ? LedgerAccount.LIAB_DEFERRED_REVENUE : LedgerAccount.REV_PLATFORM;

        await this.ledger.postEntry({
          type: JournalEntryType.DISPUTE_LOSS,
          bookingId: pointer.bookingId,
          currency,
          idempotencyKey: `ledger:dispute_loss:${pointer.bookingId}:${disputeId || chargeId}:${event.id}`,
          metadata: {
            stripeEventId: event.id,
            disputeId: disputeId || null,
            chargeId,
            amountCents,
            currency,
            finalStatus: "lost",
          },
          lines: [
            { account: platformDebitAccount, direction: LineDirection.DEBIT, amountCents },
            { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents },
          ],
        });
      }

      // If won/closed: cash movement is handled by charge.dispute.funds_reinstated
      // We intentionally do not post a cash-moving entry here to avoid double-counting.
    }

    return { processed: true };
  }

  private async emitNote(args: {
    bookingId: string;
    idempotencyKey: string;
    note: Record<string, unknown>;
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
      if (err?.code === "P2002") return;
      throw err;
    }
  }
}
