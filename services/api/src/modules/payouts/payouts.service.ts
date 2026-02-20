import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  JournalEntryType,
  LedgerAccount,
  LineDirection,
  PayoutBatchStatus,
} from "@prisma/client";

import { PrismaService } from "../../prisma";
import { LedgerService } from "../ledger/ledger.service";

export type PayoutPreviewLine = { foId: string; amountCents: number };

export type PayoutPreviewResult = {
  lines: PayoutPreviewLine[];
  totalCents: number;
};

export type PayoutPreviewEligibleResult = {
  asOf: string;
  currency: string;
  gross: { lines: PayoutPreviewLine[]; totalCents: number };
  eligible: { lines: PayoutPreviewLine[]; totalCents: number };
};

export type LockBatchResult = {
  batch: {
    id: string;
    status: PayoutBatchStatus;
    currency: string;
    asOf: Date;
    executedAt: Date | null;
    executedByAdminId: string | null;
    idempotencyKey: string;
    createdAt: Date;
  };
  lines: Array<{ id: string; batchId: string; foId: string; amountCents: number; currency: string }>;
  alreadyApplied?: boolean;
};

export type MarkExecutedResult = {
  batch: {
    id: string;
    status: PayoutBatchStatus;
    currency: string;
    asOf: Date;
    executedAt: Date | null;
    executedByAdminId: string | null;
    idempotencyKey: string;
    executedIdempotencyKey: string | null;
    createdAt: Date;
  };
  lines: Array<{ id: string; batchId: string; foId: string; amountCents: number; currency: string }>;
  alreadyApplied?: boolean;
};

/**
 * FO payout batching v1: ledger-based preview, execute posts PAYOUT entries.
 * No real money transfer; admin-only.
 */
@Injectable()
export class PayoutsService {
  constructor(
    private readonly db: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * Computes per-FO net LIAB_FO_PAYABLE as of cutoff, scoped to currency.
   * Sum credits - sum debits grouped by foId; only lines with createdAt <= asOf and entry.currency = currency.
   * Returns only positive balances.
   */
  async preview(args: {
    asOf?: Date;
    currency?: string;
  }): Promise<PayoutPreviewResult> {
    const asOf = args.asOf ?? new Date();
    const currency = (args.currency ?? "usd").toLowerCase();
    const lines = await this.db.journalLine.findMany({
      where: {
        account: LedgerAccount.LIAB_FO_PAYABLE,
        createdAt: { lte: asOf },
        entry: { currency },
      },
      include: { entry: true },
      orderBy: { createdAt: "asc" },
    });

    const byFo: Record<string, number> = {};
    for (const line of lines) {
      const foId = line.entry.foId;
      if (foId == null || foId === "") continue;
      if (!byFo[foId]) byFo[foId] = 0;
      const delta =
        line.direction === LineDirection.CREDIT
          ? line.amountCents
          : -line.amountCents;
      byFo[foId] += delta;
    }

    const resultLines: PayoutPreviewLine[] = [];
    let totalCents = 0;
    for (const [foId, amountCents] of Object.entries(byFo)) {
      if (amountCents > 0) {
        resultLines.push({ foId, amountCents });
        totalCents += amountCents;
      }
    }

    return { lines: resultLines, totalCents };
  }

  /**
   * Returns booking IDs that are eligible for payout: settled, not refunded, not disputed (or dispute won).
   * Uses JournalEntry type SETTLEMENT / REFUND / DISPUTE with createdAt <= asOf and currency; idempotencyKey prefix for dispute outcome.
   */
  private async getEligibleBookingIds(asOf: Date, currency: string): Promise<Set<string>> {
    const entries = await this.db.journalEntry.findMany({
      where: {
        currency,
        type: { in: [JournalEntryType.SETTLEMENT, JournalEntryType.REFUND, JournalEntryType.DISPUTE] },
        bookingId: { not: null },
        createdAt: { lte: asOf },
      },
      select: { bookingId: true, type: true, disputeOutcome: true },
    });

    const byBooking = new Map<
      string,
      { hasSettlement: boolean; hasRefund: boolean; hasDisputeWon: boolean; hasDisputeOther: boolean }
    >();
    for (const e of entries) {
      const bid = e.bookingId!;
      if (!byBooking.has(bid)) {
        byBooking.set(bid, { hasSettlement: false, hasRefund: false, hasDisputeWon: false, hasDisputeOther: false });
      }
      const cur = byBooking.get(bid)!;
      if (e.type === JournalEntryType.SETTLEMENT) cur.hasSettlement = true;
      else if (e.type === JournalEntryType.REFUND) cur.hasRefund = true;
      else if (e.type === JournalEntryType.DISPUTE) {
        if (e.disputeOutcome === "won") cur.hasDisputeWon = true;
        else cur.hasDisputeOther = true; // created / lost / closed / null
      }
    }

    const eligible = new Set<string>();
    for (const [bookingId, state] of byBooking) {
      if (!state.hasSettlement || state.hasRefund) continue;
      if (state.hasDisputeOther && !state.hasDisputeWon) continue;
      eligible.add(bookingId);
    }
    return eligible;
  }

  /**
   * Preview with gross (net LIAB_FO_PAYABLE) and eligible (only from settled, non-refunded, non-disputed bookings).
   * eligible = LIAB_FO_PAYABLE credits from eligible bookings minus PAYOUT debits by foId, per FO.
   */
  async previewEligible(args: {
    asOf?: Date;
    currency?: string;
  }): Promise<PayoutPreviewEligibleResult> {
    const asOf = args.asOf ?? new Date();
    const currency = (args.currency ?? "usd").toLowerCase();

    const gross = await this.preview({ asOf, currency });

    const eligibleBookingIds = await this.getEligibleBookingIds(asOf, currency);

    const allLiabLines = await this.db.journalLine.findMany({
      where: {
        account: LedgerAccount.LIAB_FO_PAYABLE,
        createdAt: { lte: asOf },
        entry: { currency },
      },
      include: { entry: { select: { bookingId: true, foId: true, type: true } } },
    });

    const eligibleCreditsByFo: Record<string, number> = {};
    const paidDebitsByFo: Record<string, number> = {};

    for (const line of allLiabLines) {
      const foId = line.entry.foId ?? "";
      if (line.direction === LineDirection.CREDIT) {
        if (line.entry.bookingId && eligibleBookingIds.has(line.entry.bookingId) && foId) {
          eligibleCreditsByFo[foId] = (eligibleCreditsByFo[foId] ?? 0) + line.amountCents;
        }
      } else {
        if (line.entry.type === JournalEntryType.PAYOUT && foId) {
          paidDebitsByFo[foId] = (paidDebitsByFo[foId] ?? 0) + line.amountCents;
        }
      }
    }

    const eligibleLines: PayoutPreviewLine[] = [];
    let eligibleTotalCents = 0;
    for (const foId of new Set([...Object.keys(eligibleCreditsByFo), ...Object.keys(paidDebitsByFo)])) {
      const credits = eligibleCreditsByFo[foId] ?? 0;
      const debits = paidDebitsByFo[foId] ?? 0;
      const net = Math.max(0, credits - debits);
      if (net > 0) {
        eligibleLines.push({ foId, amountCents: net });
        eligibleTotalCents += net;
      }
    }

    return {
      asOf: asOf.toISOString(),
      currency,
      gross: { lines: gross.lines, totalCents: gross.totalCents },
      eligible: { lines: eligibleLines, totalCents: eligibleTotalCents },
    };
  }

  /**
   * Lock a payout batch: create batch + lines (preview as-of cutoff). Does NOT post ledger entries.
   * Write-first on batch idempotencyKey; on P2002 returns existing with alreadyApplied.
   * If preview is empty, batch status is set to void.
   */
  async lockBatch(args: {
    asOf?: Date;
    currency?: string;
    idempotencyKey: string;
  }): Promise<LockBatchResult> {
    const asOf = args.asOf ?? new Date();
    const currency = (args.currency ?? "usd").toLowerCase();

    let batch: { id: string; status: PayoutBatchStatus; currency: string; asOf: Date; executedAt: Date | null; executedByAdminId: string | null; idempotencyKey: string; createdAt: Date };
    try {
      batch = await this.db.payoutBatch.create({
        data: {
          status: PayoutBatchStatus.draft,
          currency,
          asOf,
          idempotencyKey: args.idempotencyKey,
        },
      });
    } catch (e: any) {
      if (e?.code === "P2002") {
        const existing = await this.db.payoutBatch.findUnique({
          where: { idempotencyKey: args.idempotencyKey },
          include: { lines: true },
        });
        if (existing) {
          return {
            batch: {
              id: existing.id,
              status: existing.status,
              currency: existing.currency,
              asOf: existing.asOf,
              executedAt: existing.executedAt,
              executedByAdminId: existing.executedByAdminId,
              idempotencyKey: existing.idempotencyKey,
              createdAt: existing.createdAt,
            },
            lines: existing.lines.map((l) => ({
              id: l.id,
              batchId: l.batchId,
              foId: l.foId,
              amountCents: l.amountCents,
              currency: l.currency,
            })),
            alreadyApplied: true,
          };
        }
      }
      throw e;
    }

    const { eligible } = await this.previewEligible({ asOf, currency });
    const previewLines = eligible.lines;
    if (previewLines.length === 0) {
      await this.db.payoutBatch.update({
        where: { id: batch.id },
        data: { status: PayoutBatchStatus.void },
      });
      return {
        batch: {
          ...batch,
          status: PayoutBatchStatus.void,
        },
        lines: [],
      };
    }

    const createdLines = await this.db.payoutLine.createManyAndReturn({
      data: previewLines.map((l) => ({
        batchId: batch.id,
        foId: l.foId,
        amountCents: l.amountCents,
        currency,
      })),
    });

    return {
      batch: {
        id: batch.id,
        status: PayoutBatchStatus.draft,
        currency: batch.currency,
        asOf: batch.asOf,
        executedAt: batch.executedAt,
        executedByAdminId: batch.executedByAdminId,
        idempotencyKey: batch.idempotencyKey,
        createdAt: batch.createdAt,
      },
      lines: createdLines.map((l) => ({
        id: l.id,
        batchId: l.batchId,
        foId: l.foId,
        amountCents: l.amountCents,
        currency: l.currency,
      })),
    };
  }

  /**
   * Mark a locked batch as executed: post PAYOUT ledger entry per FO, then update batch.
   * Idempotency via executedIdempotencyKey (unique on PayoutBatch). Void batch → Conflict.
   */
  async markExecuted(args: {
    batchId: string;
    idempotencyKey: string;
    actorAdminId?: string;
  }): Promise<MarkExecutedResult> {
    const existingByKey = await this.db.payoutBatch.findUnique({
      where: { executedIdempotencyKey: args.idempotencyKey },
      include: { lines: true },
    });
    if (existingByKey) {
      return {
        batch: {
          id: existingByKey.id,
          status: existingByKey.status,
          currency: existingByKey.currency,
          asOf: existingByKey.asOf,
          executedAt: existingByKey.executedAt,
          executedByAdminId: existingByKey.executedByAdminId,
          idempotencyKey: existingByKey.idempotencyKey,
          executedIdempotencyKey: existingByKey.executedIdempotencyKey,
          createdAt: existingByKey.createdAt,
        },
        lines: existingByKey.lines.map((l) => ({
          id: l.id,
          batchId: l.batchId,
          foId: l.foId,
          amountCents: l.amountCents,
          currency: l.currency,
        })),
        alreadyApplied: true,
      };
    }

    const batch = await this.db.payoutBatch.findUnique({
      where: { id: args.batchId },
      include: { lines: true },
    });
    if (!batch) {
      throw new NotFoundException("PayoutBatch not found");
    }
    if (batch.status === "void") {
      throw new ConflictException("Cannot mark void batch as executed");
    }
    if (batch.status === "executed") {
      return {
        batch: {
          id: batch.id,
          status: batch.status,
          currency: batch.currency,
          asOf: batch.asOf,
          executedAt: batch.executedAt,
          executedByAdminId: batch.executedByAdminId,
          idempotencyKey: batch.idempotencyKey,
          executedIdempotencyKey: batch.executedIdempotencyKey,
          createdAt: batch.createdAt,
        },
        lines: batch.lines.map((l) => ({
          id: l.id,
          batchId: l.batchId,
          foId: l.foId,
          amountCents: l.amountCents,
          currency: l.currency,
        })),
        alreadyApplied: true,
      };
    }

    const claimed = await this.db.payoutBatch.updateMany({
      where: { id: args.batchId, status: PayoutBatchStatus.draft, executedIdempotencyKey: null },
      data: { executedIdempotencyKey: args.idempotencyKey },
    });
    if (claimed.count === 0) {
      const refetched = await this.db.payoutBatch.findUnique({
        where: { executedIdempotencyKey: args.idempotencyKey },
        include: { lines: true },
      });
      if (refetched) {
        return {
          batch: {
            id: refetched.id,
            status: refetched.status,
            currency: refetched.currency,
            asOf: refetched.asOf,
            executedAt: refetched.executedAt,
            executedByAdminId: refetched.executedByAdminId,
            idempotencyKey: refetched.idempotencyKey,
            executedIdempotencyKey: refetched.executedIdempotencyKey,
            createdAt: refetched.createdAt,
          },
          lines: refetched.lines.map((l) => ({
            id: l.id,
            batchId: l.batchId,
            foId: l.foId,
            amountCents: l.amountCents,
            currency: l.currency,
          })),
          alreadyApplied: true,
        };
      }
      const batchAgain = await this.db.payoutBatch.findUnique({
        where: { id: args.batchId },
        include: { lines: true },
      });
      if (batchAgain && (batchAgain.status === "executed" || batchAgain.executedIdempotencyKey != null)) {
        return {
          batch: {
            id: batchAgain.id,
            status: batchAgain.status,
            currency: batchAgain.currency,
            asOf: batchAgain.asOf,
            executedAt: batchAgain.executedAt,
            executedByAdminId: batchAgain.executedByAdminId,
            idempotencyKey: batchAgain.idempotencyKey,
            executedIdempotencyKey: batchAgain.executedIdempotencyKey,
            createdAt: batchAgain.createdAt,
          },
          lines: batchAgain.lines.map((l) => ({
            id: l.id,
            batchId: l.batchId,
            foId: l.foId,
            amountCents: l.amountCents,
            currency: l.currency,
          })),
          alreadyApplied: true,
        };
      }
      throw new ConflictException("Batch could not be claimed (already executed or claimed)");
    }

    const batchWithLines = await this.db.payoutBatch.findUnique({
      where: { id: args.batchId },
      include: { lines: true },
    });
    if (!batchWithLines) throw new NotFoundException("PayoutBatch not found");

    const asOf = batchWithLines.asOf;
    const currency = batchWithLines.currency;
    for (const line of batchWithLines.lines) {
      if (line.amountCents <= 0) continue;
      await this.ledger.postEntry({
        type: JournalEntryType.PAYOUT,
        foId: line.foId,
        currency,
        idempotencyKey: `ledger:payout:${args.batchId}:${line.foId}`,
        metadata: { batchId: args.batchId, asOf: asOf.toISOString() },
        lines: [
          {
            account: LedgerAccount.LIAB_FO_PAYABLE,
            direction: LineDirection.DEBIT,
            amountCents: line.amountCents,
          },
          {
            account: LedgerAccount.CASH_STRIPE,
            direction: LineDirection.CREDIT,
            amountCents: line.amountCents,
          },
        ],
      });
    }

    const updated = await this.db.payoutBatch.update({
      where: { id: args.batchId },
      data: {
        status: PayoutBatchStatus.executed,
        executedAt: new Date(),
        executedByAdminId: args.actorAdminId ?? null,
      },
    });

    return {
      batch: {
        id: updated.id,
        status: updated.status,
        currency: updated.currency,
        asOf: updated.asOf,
        executedAt: updated.executedAt,
        executedByAdminId: updated.executedByAdminId,
        idempotencyKey: updated.idempotencyKey,
        executedIdempotencyKey: updated.executedIdempotencyKey,
        createdAt: updated.createdAt,
      },
      lines: batchWithLines.lines.map((l) => ({
        id: l.id,
        batchId: l.batchId,
        foId: l.foId,
        amountCents: l.amountCents,
        currency: l.currency,
      })),
    };
  }
}
