import { ForbiddenException, Injectable } from "@nestjs/common";
import Stripe from "stripe";

import { PrismaService } from "../../prisma";
import { StripeService } from "./stripe.service";
import { JournalEntryType, LedgerAccount, LineDirection } from "@prisma/client";

export type StripeReconcileSummary = {
  currency: string;
  window: { since: string | null; until: string | null };
  stripe: {
    paymentIntentsSucceededCount: number;
    grossCapturedCents: number;
    refundsCount: number;
    refundedCents: number;
  };
  ledger: {
    chargedCents: number;
    refundedCashCents: number;
  };
  delta: {
    chargeDeltaCents: number;
    refundDeltaCents: number;
  };
  ok: boolean;
};

export type StripeReconcileMismatchCode =
  | "STRIPE_PI_SUCCEEDED_ORPHAN_DB"
  | "STRIPE_PI_SUCCEEDED_MISSING_LEDGER_SETTLEMENT"
  | "STRIPE_PI_SUCCEEDED_AMOUNT_MISMATCH"
  | "STRIPE_REFUND_ORPHAN_DB"
  | "STRIPE_REFUND_MISSING_LEDGER_REFUND"
  | "STRIPE_REFUND_AMOUNT_MISMATCH"
  | "LEDGER_SETTLEMENT_MISSING_STRIPE_PI"
  | "LEDGER_REFUND_MISSING_STRIPE_REFUND";

export type StripeReconcileMismatch = {
  code: StripeReconcileMismatchCode;
  message: string;
  currency: string;
  details?: Record<string, unknown>;
};

@Injectable()
export class StripeReconcileService {
  constructor(
    private readonly db: PrismaService,
    private readonly stripeSvc: StripeService,
  ) {}

  private requireStripe() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new ForbiddenException("STRIPE_NOT_CONFIGURED");
    }
    return this.stripeSvc.stripe;
  }

  private parseWindow(args: { since?: Date; until?: Date }) {
    const since = args.since ?? null;
    const until = args.until ?? null;
    return {
      sinceIso: since ? since.toISOString() : null,
      untilIso: until ? until.toISOString() : null,
      sinceUnix: since ? Math.floor(since.getTime() / 1000) : undefined,
      untilUnix: until ? Math.floor(until.getTime() / 1000) : undefined,
    };
  }

  /**
   * v1: Reconcile Stripe "money in" and "money out" vs ledger.
   * Stripe: PaymentIntents status=succeeded sum(amount_received); Refunds sum(amount).
   * Ledger (by entry.createdAt): CHARGE sum(AR_CUSTOMER DEBIT); REFUND sum(CASH_STRIPE CREDIT).
   * NOTE: Audit summary only, not object-level matching.
   */
  async summary(args: {
    currency: string;
    since?: Date;
    until?: Date;
  }): Promise<StripeReconcileSummary> {
    const stripe = this.requireStripe();
    const currency = String(args.currency ?? "").toLowerCase();
    if (!currency) throw new Error("currency is required");
    const w = this.parseWindow({ since: args.since, until: args.until });

    const stripePi = await this.sumSucceededPaymentIntents(stripe, {
      currency,
      createdGte: w.sinceUnix,
      createdLte: w.untilUnix,
    });
    const stripeRefunds = await this.sumRefunds(stripe, {
      currency,
      createdGte: w.sinceUnix,
      createdLte: w.untilUnix,
    });

    const entryWhere: any = { currency };
    if (args.since || args.until) {
      entryWhere.createdAt = {};
      if (args.since) entryWhere.createdAt.gte = args.since;
      if (args.until) entryWhere.createdAt.lte = args.until;
    }
    const chargedAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.AR_CUSTOMER,
        direction: LineDirection.DEBIT,
        entry: { ...entryWhere, type: JournalEntryType.CHARGE },
      },
      _sum: { amountCents: true },
    });
    const refundedAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.CASH_STRIPE,
        direction: LineDirection.CREDIT,
        entry: { ...entryWhere, type: JournalEntryType.REFUND },
      },
      _sum: { amountCents: true },
    });

    const ledgerCharged = chargedAgg._sum.amountCents ?? 0;
    const ledgerRefundedCash = refundedAgg._sum.amountCents ?? 0;
    const chargeDelta = stripePi.grossCapturedCents - ledgerCharged;
    const refundDelta = stripeRefunds.refundedCents - ledgerRefundedCash;
    const ok = chargeDelta === 0 && refundDelta === 0;

    return {
      currency,
      window: { since: w.sinceIso, until: w.untilIso },
      stripe: {
        paymentIntentsSucceededCount: stripePi.count,
        grossCapturedCents: stripePi.grossCapturedCents,
        refundsCount: stripeRefunds.count,
        refundedCents: stripeRefunds.refundedCents,
      },
      ledger: { chargedCents: ledgerCharged, refundedCashCents: ledgerRefundedCash },
      delta: { chargeDeltaCents: chargeDelta, refundDeltaCents: refundDelta },
      ok,
    };
  }

  private async sumSucceededPaymentIntents(
    stripe: Stripe,
    args: { currency: string; createdGte?: number; createdLte?: number },
  ): Promise<{ count: number; grossCapturedCents: number }> {
    let count = 0;
    let gross = 0;
    let startingAfter: string | undefined = undefined;
    for (;;) {
      const page: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        ...(args.currency ? { currency: args.currency } : {}),
        ...(args.createdGte || args.createdLte
          ? {
              created: {
                ...(args.createdGte ? { gte: args.createdGte } : {}),
                ...(args.createdLte ? { lte: args.createdLte } : {}),
              },
            }
          : {}),
      });
      for (const pi of page.data) {
        if (pi.status !== "succeeded") continue;
        const amt = typeof pi.amount_received === "number" ? pi.amount_received : 0;
        count += 1;
        gross += amt;
      }
      if (!page.has_more) break;
      startingAfter = page.data[page.data.length - 1]?.id;
      if (!startingAfter) break;
    }
    return { count, grossCapturedCents: gross };
  }

  private async sumRefunds(
    stripe: Stripe,
    args: { currency: string; createdGte?: number; createdLte?: number },
  ): Promise<{ count: number; refundedCents: number }> {
    let count = 0;
    let refunded = 0;
    let startingAfter: string | undefined = undefined;
    for (;;) {
      const page: Stripe.ApiList<Stripe.Refund> = await stripe.refunds.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        ...(args.createdGte || args.createdLte
          ? {
              created: {
                ...(args.createdGte ? { gte: args.createdGte } : {}),
                ...(args.createdLte ? { lte: args.createdLte } : {}),
              },
            }
          : {}),
      });
      for (const r of page.data) {
        if (r.currency?.toLowerCase() !== args.currency) continue;
        const amt = typeof r.amount === "number" ? r.amount : 0;
        count += 1;
        refunded += amt;
      }
      if (!page.has_more) break;
      startingAfter = page.data[page.data.length - 1]?.id;
      if (!startingAfter) break;
    }
    return { count, refundedCents: refunded };
  }

  private async listSucceededPaymentIntents(
    stripe: Stripe,
    args: { currency: string; createdGte?: number; createdLte?: number; limit: number },
  ): Promise<Array<{ id: string; status: string; amount_received: number | null; created: number }>> {
    const out: Array<{ id: string; status: string; amount_received: number | null; created: number }> = [];
    let startingAfter: string | undefined;

    while (out.length < args.limit) {
      const page: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        ...(args.currency ? { currency: args.currency } : {}),
        ...(args.createdGte || args.createdLte
          ? { created: { ...(args.createdGte ? { gte: args.createdGte } : {}), ...(args.createdLte ? { lte: args.createdLte } : {}) } }
          : {}),
      });

      for (const pi of page.data ?? []) {
        if (pi.status !== "succeeded") continue;
        out.push({ id: pi.id, status: pi.status, amount_received: pi.amount_received ?? null, created: pi.created });
        if (out.length >= args.limit) break;
      }

      if (!page.has_more) break;
      startingAfter = page.data?.[page.data.length - 1]?.id;
      if (!startingAfter) break;
    }

    return out;
  }

  private async listRefunds(
    stripe: Stripe,
    args: { currency: string; createdGte?: number; createdLte?: number; limit: number },
  ): Promise<Array<{ id: string; amount: number | null; currency: string | null; created: number; charge?: string | null }>> {
    const out: Array<{ id: string; amount: number | null; currency: string | null; created: number; charge?: string | null }> = [];
    let startingAfter: string | undefined;

    while (out.length < args.limit) {
      const page: Stripe.ApiList<Stripe.Refund> = await stripe.refunds.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        ...(args.createdGte || args.createdLte
          ? { created: { ...(args.createdGte ? { gte: args.createdGte } : {}), ...(args.createdLte ? { lte: args.createdLte } : {}) } }
          : {}),
      });

      for (const r of page.data ?? []) {
        if ((r.currency ?? "").toLowerCase() !== args.currency) continue;
        out.push({ id: r.id, amount: r.amount ?? null, currency: r.currency ?? null, created: r.created, charge: (r as any).charge ?? null });
        if (out.length >= args.limit) break;
      }

      if (!page.has_more) break;
      startingAfter = page.data?.[page.data.length - 1]?.id;
      if (!startingAfter) break;
    }

    return out;
  }

  async mismatches(args: {
    currency: string;
    since?: Date;
    until?: Date;
    limit?: number;
    evidence?: boolean;
  }): Promise<{
    currency: string;
    window: { since: string | null; until: string | null };
    scanned: { stripePaymentIntents: number; stripeRefunds: number; ledgerSettlements: number; ledgerRefunds: number };
    mismatchCount: number;
    mismatches: StripeReconcileMismatch[];
  }> {
    const stripe = this.requireStripe();

    const currency = String(args.currency ?? "").toLowerCase();
    const limit = Math.min(Math.max(1, args.limit ?? 200), 2000);
    const evidence = Boolean(args.evidence);

    const w = this.parseWindow({ since: args.since, until: args.until });

    const stripePIs = await this.listSucceededPaymentIntents(stripe, {
      currency,
      createdGte: w.sinceUnix,
      createdLte: w.untilUnix,
      limit,
    });

    const stripeRefunds = await this.listRefunds(stripe, {
      currency,
      createdGte: w.sinceUnix,
      createdLte: w.untilUnix,
      limit,
    });

    const stripePiIds = stripePIs.map((pi) => pi.id);
    const stripeRefundIds = stripeRefunds.map((r) => r.id);
    const stripeChargeIds = stripeRefunds.map((r) => String(r.charge ?? "")).filter(Boolean);

    const pointersByPi = new Map(
      (
        await this.db.bookingStripePayment.findMany({
          where: { stripePaymentIntentId: { in: stripePiIds.length ? stripePiIds : ["__none__"] } },
          select: { bookingId: true, stripePaymentIntentId: true, stripeChargeId: true },
        })
      ).map((p) => [p.stripePaymentIntentId, p]),
    );

    const pointersByCharge = new Map(
      (
        await this.db.bookingStripePayment.findMany({
          where: { stripeChargeId: { in: stripeChargeIds.length ? stripeChargeIds : ["__none__"] } },
          select: { bookingId: true, stripePaymentIntentId: true, stripeChargeId: true },
        })
      ).map((p) => [p.stripeChargeId!, p]),
    );

    const entryWhere: any = { currency };
    if (args.since || args.until) {
      entryWhere.createdAt = {};
      if (args.since) entryWhere.createdAt.gte = args.since;
      if (args.until) entryWhere.createdAt.lte = args.until;
    }

    const settlements = await this.db.journalEntry.findMany({
      where: { ...entryWhere, type: JournalEntryType.SETTLEMENT },
      select: { id: true, bookingId: true, currency: true, metadataJson: true, createdAt: true },
      take: 5000,
      orderBy: { createdAt: "desc" },
    });

    const refunds = await this.db.journalEntry.findMany({
      where: { ...entryWhere, type: JournalEntryType.REFUND },
      select: { id: true, bookingId: true, currency: true, metadataJson: true, createdAt: true },
      take: 5000,
      orderBy: { createdAt: "desc" },
    });

    const ledgerSettlementByPiId = new Map<string, { entryId: string; bookingId: string | null; amountCents: number | null; createdAt: Date }>();
    for (const e of settlements) {
      const meta = safeParseJson(e.metadataJson);
      const piId = meta?.paymentIntentId ? String(meta.paymentIntentId) : null;
      if (!piId) continue;
      const amt = meta?.amountCents != null ? Number(meta.amountCents) : null;
      ledgerSettlementByPiId.set(piId, { entryId: e.id, bookingId: e.bookingId, amountCents: Number.isFinite(amt) ? amt : null, createdAt: e.createdAt });
    }

    type LedgerRefundRec = { entryId: string; bookingId: string | null; amountCents: number | null; chargeId: string | null; refundId: string | null; createdAt: Date };
    const ledgerRefundByRefundId = new Map<string, LedgerRefundRec>();
    const ledgerRefundByChargeId = new Map<string, LedgerRefundRec>();
    for (const e of refunds) {
      const meta = safeParseJson(e.metadataJson);
      const refundId = meta?.refundId ? String(meta.refundId) : null;
      const chargeId = meta?.chargeId ? String(meta.chargeId) : null;
      const amt = meta?.amountCents != null ? Number(meta.amountCents) : null;
      const rec: LedgerRefundRec = { entryId: e.id, bookingId: e.bookingId, amountCents: Number.isFinite(amt) ? amt : null, chargeId, refundId, createdAt: e.createdAt };
      if (refundId) ledgerRefundByRefundId.set(refundId, rec);
      if (chargeId) ledgerRefundByChargeId.set(chargeId, rec);
    }

    const mismatches: StripeReconcileMismatch[] = [];

    for (const pi of stripePIs) {
      const ptr = pointersByPi.get(pi.id);
      if (!ptr) {
        mismatches.push({
          code: "STRIPE_PI_SUCCEEDED_ORPHAN_DB",
          message: "Stripe PaymentIntent succeeded but no BookingStripePayment pointer exists",
          currency,
          ...(evidence && { details: { paymentIntentId: pi.id, amountReceived: pi.amount_received ?? null, created: pi.created } }),
        });
        continue;
      }

      const settlement = ledgerSettlementByPiId.get(pi.id);
      if (!settlement) {
        mismatches.push({
          code: "STRIPE_PI_SUCCEEDED_MISSING_LEDGER_SETTLEMENT",
          message: "Stripe PaymentIntent succeeded but no ledger SETTLEMENT entry found for paymentIntentId",
          currency,
          ...(evidence && { details: { paymentIntentId: pi.id, bookingId: ptr.bookingId, amountReceived: pi.amount_received ?? null, created: pi.created } }),
        });
        continue;
      }

      const stripeAmt = typeof pi.amount_received === "number" ? pi.amount_received : null;
      if (stripeAmt != null && settlement.amountCents != null && stripeAmt !== settlement.amountCents) {
        mismatches.push({
          code: "STRIPE_PI_SUCCEEDED_AMOUNT_MISMATCH",
          message: "Stripe PaymentIntent amount_received does not match ledger SETTLEMENT amountCents",
          currency,
          ...(evidence && { details: { paymentIntentId: pi.id, bookingId: ptr.bookingId, stripeAmountReceived: stripeAmt, ledgerAmountCents: settlement.amountCents, settlementEntryId: settlement.entryId } }),
        });
      }
    }

    for (const r of stripeRefunds) {
      const refundId = r.id;
      const chargeId = String(r.charge ?? "");
      if (!chargeId) continue;

      const ptr = pointersByCharge.get(chargeId);
      if (!ptr) {
        mismatches.push({
          code: "STRIPE_REFUND_ORPHAN_DB",
          message: "Stripe refund exists but no BookingStripePayment pointer exists for its chargeId",
          currency,
          ...(evidence && { details: { refundId, chargeId, amount: r.amount ?? null, created: r.created } }),
        });
        continue;
      }

      const ledger = ledgerRefundByRefundId.get(refundId) ?? ledgerRefundByChargeId.get(chargeId) ?? null;
      if (!ledger) {
        mismatches.push({
          code: "STRIPE_REFUND_MISSING_LEDGER_REFUND",
          message: "Stripe refund exists but no ledger REFUND entry found by refundId/chargeId",
          currency,
          ...(evidence && { details: { refundId, chargeId, bookingId: ptr.bookingId, stripeAmount: r.amount ?? null, created: r.created } }),
        });
        continue;
      }

      const stripeAmt = typeof r.amount === "number" ? r.amount : null;
      if (stripeAmt != null && ledger.amountCents != null && stripeAmt !== ledger.amountCents) {
        mismatches.push({
          code: "STRIPE_REFUND_AMOUNT_MISMATCH",
          message: "Stripe refund amount does not match ledger REFUND amountCents",
          currency,
          ...(evidence && { details: { refundId, chargeId, bookingId: ptr.bookingId, stripeAmount: stripeAmt, ledgerAmountCents: ledger.amountCents, ledgerEntryId: ledger.entryId } }),
        });
      }
    }

    const stripePiSet = new Set(stripePiIds);
    for (const [piId, led] of ledgerSettlementByPiId.entries()) {
      if (!stripePiSet.has(piId)) {
        mismatches.push({
          code: "LEDGER_SETTLEMENT_MISSING_STRIPE_PI",
          message: "Ledger SETTLEMENT exists but Stripe PaymentIntent not found in the requested window",
          currency,
          ...(evidence && { details: { paymentIntentId: piId, bookingId: led.bookingId, settlementEntryId: led.entryId } }),
        });
      }
    }

    const stripeRefundSet = new Set(stripeRefundIds);
    for (const [rid, led] of ledgerRefundByRefundId.entries()) {
      if (!stripeRefundSet.has(rid)) {
        mismatches.push({
          code: "LEDGER_REFUND_MISSING_STRIPE_REFUND",
          message: "Ledger REFUND exists but Stripe refund not found in the requested window",
          currency,
          ...(evidence && { details: { refundId: rid, bookingId: led.bookingId, ledgerEntryId: led.entryId } }),
        });
      }
    }

    return {
      currency,
      window: { since: w.sinceIso, until: w.untilIso },
      scanned: {
        stripePaymentIntents: stripePIs.length,
        stripeRefunds: stripeRefunds.length,
        ledgerSettlements: settlements.length,
        ledgerRefunds: refunds.length,
      },
      mismatchCount: mismatches.length,
      mismatches,
    };
  }
}

function safeParseJson(s: string | null): Record<string, unknown> | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return null;
  }
}
