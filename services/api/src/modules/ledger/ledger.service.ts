import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DisputeOutcome,
  JournalEntryType,
  LedgerAccount,
  LineDirection,
} from "@prisma/client";

import { PrismaService } from "../../prisma";

export type PostLineInput = {
  account: LedgerAccount;
  direction: LineDirection;
  amountCents: number;
};

export type PostEntryInput = {
  type: JournalEntryType;
  bookingId?: string;
  foId?: string;
  currency?: string;
  idempotencyKey?: string;
  lines: PostLineInput[];
  metadata?: Record<string, unknown>;
  disputeOutcome?: DisputeOutcome | null;
};

export type LedgerValidationViolation = {
  code:
    | "ENTRY_IMBALANCED"
    | "REFUND_EXCEEDS_CHARGE"
    | "FO_PAYABLE_NEGATIVE"
    | "DEFERRED_NEGATIVE"
    | "ENTRY_MISSING_LINES"
    | "ENTRY_NEGATIVE_OR_ZERO_AMOUNT";
  message: string;
  entryId?: string;
  bookingId?: string | null;
  currency?: string;
  details?: Record<string, unknown>;
};

export type ValidateLedgerResult = {
  ok: boolean;
  scannedEntries: number;
  checkedRefundGroups: number;
  violations: LedgerValidationViolation[];
};

const VALID_ACCOUNTS = new Set<string>(Object.values(LedgerAccount));

/**
 * Double-entry ledger: every entry has >= 2 lines and sum(debits) === sum(credits).
 * Append-only; idempotency via unique constraint on JournalEntry.idempotencyKey.
 */
@Injectable()
export class LedgerService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Write-first idempotent post: attempt create; on P2002 (unique violation) fetch existing and return.
   * Concurrency-safe; no read-before-write.
   */
  async postEntry(input: PostEntryInput): Promise<{
    id: string;
    type: JournalEntryType;
    bookingId: string | null;
    foId: string | null;
    currency: string;
    idempotencyKey: string | null;
    metadataJson: string | null;
    createdAt: Date;
    lines: Array<{
      id: string;
      account: LedgerAccount;
      direction: LineDirection;
      amountCents: number;
      createdAt: Date;
    }>;
    alreadyApplied?: boolean;
  }> {
    const lines = input.lines ?? [];
    if (lines.length < 2) {
      throw new BadRequestException("LEDGER_ENTRY_NEEDS_AT_LEAST_TWO_LINES");
    }
    for (const line of lines) {
      if (!VALID_ACCOUNTS.has(line.account)) {
        throw new BadRequestException(`LEDGER_INVALID_ACCOUNT: ${line.account}`);
      }
      if (line.amountCents <= 0 || !Number.isInteger(line.amountCents)) {
        throw new BadRequestException("LEDGER_AMOUNT_MUST_BE_POSITIVE_INTEGER");
      }
    }
    const debits = lines
      .filter((l) => l.direction === LineDirection.DEBIT)
      .reduce((s, l) => s + l.amountCents, 0);
    const credits = lines
      .filter((l) => l.direction === LineDirection.CREDIT)
      .reduce((s, l) => s + l.amountCents, 0);
    if (debits !== credits) {
      throw new BadRequestException("LEDGER_IMBALANCED");
    }

    const currency = (input.currency ?? "usd").toLowerCase();
    const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;

    // --- REFUND invariant guard (ledger-level) ---
    // Enforce: total refunded CASH (including this entry) must not exceed total charged AR for the booking/currency.
    if (input.type === JournalEntryType.REFUND) {
      const bookingId = input.bookingId ?? null;

      if (!bookingId) {
        throw new ConflictException("REFUND requires bookingId");
      }

      // How much cash this REFUND is crediting back out of Stripe
      const requestedRefundCashCents = input.lines
        .filter(
          (l) =>
            l.account === LedgerAccount.CASH_STRIPE &&
            l.direction === LineDirection.CREDIT,
        )
        .reduce((s, l) => s + l.amountCents, 0);

      if (requestedRefundCashCents <= 0) {
        throw new ConflictException("REFUND must credit CASH_STRIPE > 0");
      }

      // Total charged (AR debit) for this booking/currency
      const chargedAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          entry: {
            bookingId,
            type: JournalEntryType.CHARGE,
            currency,
          },
        },
        _sum: { amountCents: true },
      });
      const chargedCents = chargedAgg._sum.amountCents ?? 0;

      if (chargedCents <= 0) {
        throw new ConflictException("Cannot post REFUND without CHARGE");
      }

      // Total already-refunded cash (CASH credit) for this booking/currency
      const refundedAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.CASH_STRIPE,
          direction: LineDirection.CREDIT,
          entry: {
            bookingId,
            type: JournalEntryType.REFUND,
            currency,
          },
        },
        _sum: { amountCents: true },
      });
      const alreadyRefundedCents = refundedAgg._sum.amountCents ?? 0;

      if (alreadyRefundedCents + requestedRefundCashCents > chargedCents) {
        throw new ConflictException(
          `Refund exceeds charged amount (charged=${chargedCents}, alreadyRefunded=${alreadyRefundedCents}, requested=${requestedRefundCashCents})`,
        );
      }
    }
    // --- end REFUND invariant guard ---

    // --- PAYOUT invariant guard (ledger-level) ---
    // Enforce: a PAYOUT may not debit LIAB_FO_PAYABLE beyond current payable for foId+currency.
    // payable = sum(LIAB_FO_PAYABLE credits) - sum(LIAB_FO_PAYABLE debits)
    if (input.type === JournalEntryType.PAYOUT) {
      const foId = input.foId ?? null;
      if (!foId) {
        throw new ConflictException("PAYOUT requires foId");
      }

      const requestedPayoutCents = input.lines
        .filter(
          (l) =>
            l.account === LedgerAccount.LIAB_FO_PAYABLE &&
            l.direction === LineDirection.DEBIT,
        )
        .reduce((s, l) => s + l.amountCents, 0);

      if (requestedPayoutCents <= 0) {
        throw new ConflictException("PAYOUT must debit LIAB_FO_PAYABLE > 0");
      }

      const liabCreditsAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.CREDIT,
          entry: {
            foId,
            currency,
          },
        },
        _sum: { amountCents: true },
      });
      const liabDebitsAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.DEBIT,
          entry: {
            foId,
            currency,
          },
        },
        _sum: { amountCents: true },
      });

      const availablePayableCents =
        (liabCreditsAgg._sum.amountCents ?? 0) -
        (liabDebitsAgg._sum.amountCents ?? 0);

      if (requestedPayoutCents > availablePayableCents) {
        throw new ConflictException(
          `Payout exceeds payable (available=${availablePayableCents}, requested=${requestedPayoutCents})`,
        );
      }
    }
    // --- end PAYOUT invariant guard ---

    try {
      const entry = await this.db.$transaction(async (tx) => {
        const created = await tx.journalEntry.create({
          data: {
            bookingId: input.bookingId ?? null,
            foId: input.foId ?? null,
            type: input.type,
            currency,
            idempotencyKey: input.idempotencyKey ?? null,
            metadataJson,
            disputeOutcome: input.disputeOutcome ?? null,
          },
        });
        await tx.journalLine.createMany({
          data: lines.map((l) => ({
            entryId: created.id,
            account: l.account,
            direction: l.direction,
            amountCents: l.amountCents,
          })),
        });
        const withLines = await tx.journalEntry.findUnique({
          where: { id: created.id },
          include: { lines: true },
        });
        if (!withLines) throw new Error("Journal entry not found after create");
        return withLines;
      });
      return {
        id: entry.id,
        type: entry.type,
        bookingId: entry.bookingId,
        foId: entry.foId,
        currency: entry.currency,
        idempotencyKey: entry.idempotencyKey,
        metadataJson: entry.metadataJson,
        createdAt: entry.createdAt,
        lines: entry.lines.map((l) => ({
          id: l.id,
          account: l.account,
          direction: l.direction,
          amountCents: l.amountCents,
          createdAt: l.createdAt,
        })),
      };
    } catch (e: any) {
      if (e?.code === "P2002" && input.idempotencyKey) {
        const existing = await this.db.journalEntry.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: { lines: true },
        });
        if (existing) {
          return {
            id: existing.id,
            type: existing.type,
            bookingId: existing.bookingId,
            foId: existing.foId,
            currency: existing.currency,
            idempotencyKey: existing.idempotencyKey,
            metadataJson: existing.metadataJson,
            createdAt: existing.createdAt,
            lines: existing.lines.map((l) => ({
              id: l.id,
              account: l.account,
              direction: l.direction,
              amountCents: l.amountCents,
              createdAt: l.createdAt,
            })),
            alreadyApplied: true,
          };
        }
      }
      throw e;
    }
  }

  async getEntry(entryId: string) {
    return this.db.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: true },
    });
  }

  async listEntries(args: {
    bookingId?: string;
    foId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const limit = Math.min(Math.max(1, args.limit ?? 50), 100);
    const where: { bookingId?: string; foId?: string } = {};
    if (args.bookingId) where.bookingId = args.bookingId;
    if (args.foId) where.foId = args.foId;

    const items = await this.db.journalEntry.findMany({
      where,
      take: limit + 1,
      ...(args.cursor ? { cursor: { id: args.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    });

    const nextCursor =
      items.length > limit ? items[limit - 1]?.id ?? null : null;
    const page = items.length > limit ? items.slice(0, limit) : items;

    return { items: page, nextCursor };
  }

  /**
   * Recognize deferred revenue for a booking/currency: move balance from LIAB_DEFERRED_REVENUE to REV_PLATFORM.
   * Supports partial recognition via maxRecognizeCents and caller-provided idempotency.
   */
  async recognizeRevenueForBooking(params: {
    bookingId: string;
    currency: string;
    idempotencyKey?: string | null;
    maxRecognizeCents?: number;
  }) {
    const { bookingId, currency } = params;
    const cur = (currency ?? "usd").toLowerCase();

    const creditsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.LIAB_DEFERRED_REVENUE,
        direction: LineDirection.CREDIT,
        entry: { bookingId, currency: cur },
      },
      _sum: { amountCents: true },
    });
    const debitsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.LIAB_DEFERRED_REVENUE,
        direction: LineDirection.DEBIT,
        entry: { bookingId, currency: cur },
      },
      _sum: { amountCents: true },
    });
    const creditsCents = creditsAgg._sum.amountCents ?? 0;
    const debitsCents = debitsAgg._sum.amountCents ?? 0;
    const deferredCents = creditsCents - debitsCents;
    const recognizeCents =
      params.maxRecognizeCents != null
        ? Math.min(deferredCents, params.maxRecognizeCents)
        : deferredCents;

    if (recognizeCents <= 0) return { recognizedCents: 0, skipped: true as const };

    const idem = params.idempotencyKey ? String(params.idempotencyKey) : null;
    const idempotencyKey = idem
      ? `ledger:revrec:${bookingId}:${cur}:${idem}`
      : `ledger:revrec:${bookingId}:${cur}`;

    const entry = await this.postEntry({
      type: JournalEntryType.REVENUE_RECOGNITION,
      bookingId,
      currency: cur,
      idempotencyKey,
      metadata: { bookingId, currency: cur },
      lines: [
        {
          account: LedgerAccount.LIAB_DEFERRED_REVENUE,
          direction: LineDirection.DEBIT,
          amountCents: recognizeCents,
        },
        {
          account: LedgerAccount.REV_PLATFORM,
          direction: LineDirection.CREDIT,
          amountCents: recognizeCents,
        },
      ],
    });

    return { recognizedCents: recognizeCents, entry };
  }

  /**
   * Reverse previously recognized revenue (e.g. on booking reopen: completed → non-completed).
   * Only reverses amounts that came from REVENUE_RECOGNITION entries (REV_PLATFORM credits minus debits for that type).
   */
  async reverseRevenueRecognitionForBooking(params: {
    bookingId: string;
    currency: string;
    idempotencyKey?: string | null;
    maxReverseCents?: number;
  }) {
    const bookingId = params.bookingId;
    const cur = (params.currency ?? "usd").toLowerCase();

    const creditsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.REV_PLATFORM,
        direction: LineDirection.CREDIT,
        entry: { bookingId, currency: cur, type: JournalEntryType.REVENUE_RECOGNITION },
      },
      _sum: { amountCents: true },
    });

    const debitsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.REV_PLATFORM,
        direction: LineDirection.DEBIT,
        entry: { bookingId, currency: cur, type: JournalEntryType.REVENUE_RECOGNITION },
      },
      _sum: { amountCents: true },
    });

    const creditsCents = creditsAgg._sum.amountCents ?? 0;
    const debitsCents = debitsAgg._sum.amountCents ?? 0;
    const earnedFromRevRecCents = creditsCents - debitsCents;

    const reverseCents =
      params.maxReverseCents != null
        ? Math.min(earnedFromRevRecCents, params.maxReverseCents)
        : earnedFromRevRecCents;

    if (reverseCents <= 0) return { reversedCents: 0, skipped: true as const };

    const idem = params.idempotencyKey ? String(params.idempotencyKey) : null;
    const idempotencyKey = idem
      ? `ledger:revrec:reverse:${bookingId}:${cur}:${idem}`
      : `ledger:revrec:reverse:${bookingId}:${cur}`;

    const entry = await this.postEntry({
      type: JournalEntryType.REVENUE_RECOGNITION,
      bookingId,
      currency: cur,
      metadata: { bookingId, currency: cur, kind: "revrec_reversal" },
      idempotencyKey,
      lines: [
        {
          account: LedgerAccount.REV_PLATFORM,
          direction: LineDirection.DEBIT,
          amountCents: reverseCents,
        },
        {
          account: LedgerAccount.LIAB_DEFERRED_REVENUE,
          direction: LineDirection.CREDIT,
          amountCents: reverseCents,
        },
      ],
    });

    return { reversedCents: reverseCents, entry };
  }

  /**
   * Balances derived from lines only (never stored). asOf = optional cutoff (inclusive).
   */
  async getBalances(args: { foId?: string; asOf?: Date }) {
    const where: {
      entry?: { foId?: string };
      createdAt?: { lte: Date };
    } = {};
    if (args.foId) where.entry = { foId: args.foId };
    if (args.asOf) where.createdAt = { lte: args.asOf };

    const lines = await this.db.journalLine.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { entry: true },
      orderBy: { createdAt: "asc" },
    });

    let filtered = lines;
    if (args.asOf) {
      const t = args.asOf.getTime();
      filtered = filtered.filter(
        (l) => new Date(l.createdAt).getTime() <= t,
      );
    }
    if (args.foId) {
      filtered = filtered.filter((l) => l.entry.foId === args.foId);
    }

    const balances: Record<string, number> = {};
    for (const line of filtered) {
      const key = line.account;
      if (!balances[key]) balances[key] = 0;
      const delta =
        line.direction === LineDirection.DEBIT
          ? line.amountCents
          : -line.amountCents;
      balances[key] += delta;
    }

    return balances;
  }

  /**
   * Booking-level snapshot aggregates for admin audit.
   * Strict: if the booking has no lines in this currency, throws NOT_FOUND.
   */
  async getBookingSnapshot(args: { bookingId: string; currency?: string }) {
    const bookingId = args.bookingId;
    const currency = (args.currency ?? "usd").toLowerCase();

    // Strict existence check: any ledger line for booking/currency?
    const lineCount = await this.db.journalLine.count({
      where: { entry: { bookingId, currency } },
    });
    if (lineCount === 0) {
      throw new NotFoundException("LEDGER_BOOKING_NOT_FOUND");
    }

    // Charged = AR_CUSTOMER DEBIT for CHARGE entries (authoritative for "charged")
    const chargedAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.AR_CUSTOMER,
        direction: LineDirection.DEBIT,
        entry: { bookingId, currency, type: JournalEntryType.CHARGE },
      },
      _sum: { amountCents: true },
    });
    const chargedCents = chargedAgg._sum.amountCents ?? 0;

    // Refunded cash = CASH_STRIPE CREDIT for REFUND entries (authoritative for "refunded")
    const refundedAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.CASH_STRIPE,
        direction: LineDirection.CREDIT,
        entry: { bookingId, currency, type: JournalEntryType.REFUND },
      },
      _sum: { amountCents: true },
    });
    const refundedCashCents = refundedAgg._sum.amountCents ?? 0;

    // REV_PLATFORM net = credits - debits for the account across this booking/currency
    const revCreditsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.REV_PLATFORM,
        direction: LineDirection.CREDIT,
        entry: { bookingId, currency },
      },
      _sum: { amountCents: true },
    });
    const revDebitsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.REV_PLATFORM,
        direction: LineDirection.DEBIT,
        entry: { bookingId, currency },
      },
      _sum: { amountCents: true },
    });
    const platformRevenueCents =
      (revCreditsAgg._sum.amountCents ?? 0) -
      (revDebitsAgg._sum.amountCents ?? 0);

    // LIAB_DEFERRED_REVENUE net = credits - debits (liability normal credit)
    const defRevCreditsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.LIAB_DEFERRED_REVENUE,
        direction: LineDirection.CREDIT,
        entry: { bookingId, currency },
      },
      _sum: { amountCents: true },
    });
    const defRevDebitsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.LIAB_DEFERRED_REVENUE,
        direction: LineDirection.DEBIT,
        entry: { bookingId, currency },
      },
      _sum: { amountCents: true },
    });
    const deferredPlatformCents =
      (defRevCreditsAgg._sum.amountCents ?? 0) -
      (defRevDebitsAgg._sum.amountCents ?? 0);

    // FO payable net = credits - debits (liability normal credit)
    const liabCreditsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.LIAB_FO_PAYABLE,
        direction: LineDirection.CREDIT,
        entry: { bookingId, currency },
      },
      _sum: { amountCents: true },
    });
    const liabDebitsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.LIAB_FO_PAYABLE,
        direction: LineDirection.DEBIT,
        entry: { bookingId, currency },
      },
      _sum: { amountCents: true },
    });
    const foPayableCents =
      (liabCreditsAgg._sum.amountCents ?? 0) -
      (liabDebitsAgg._sum.amountCents ?? 0);

    // CASH_STRIPE net = debits - credits (asset normal debit)
    const cashDebitsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.CASH_STRIPE,
        direction: LineDirection.DEBIT,
        entry: { bookingId, currency },
      },
      _sum: { amountCents: true },
    });
    const cashCreditsAgg = await this.db.journalLine.aggregate({
      where: {
        account: LedgerAccount.CASH_STRIPE,
        direction: LineDirection.CREDIT,
        entry: { bookingId, currency },
      },
      _sum: { amountCents: true },
    });
    const netCashCents =
      (cashDebitsAgg._sum.amountCents ?? 0) -
      (cashCreditsAgg._sum.amountCents ?? 0);

    // Booking-wide balance check: total debits == total credits
    const totalDebitsAgg = await this.db.journalLine.aggregate({
      where: { direction: LineDirection.DEBIT, entry: { bookingId, currency } },
      _sum: { amountCents: true },
    });
    const totalCreditsAgg = await this.db.journalLine.aggregate({
      where: {
        direction: LineDirection.CREDIT,
        entry: { bookingId, currency },
      },
      _sum: { amountCents: true },
    });
    const totalDebits = totalDebitsAgg._sum.amountCents ?? 0;
    const totalCredits = totalCreditsAgg._sum.amountCents ?? 0;

    return {
      bookingId,
      currency,
      totals: {
        chargedCents,
        refundedCashCents,
        platformRevenueCents,
        deferredPlatformCents,
        earnedPlatformCents: platformRevenueCents,
        foPayableCents,
        netCashCents,
      },
      invariantStatus: {
        refundSafe: refundedCashCents <= chargedCents,
        balanced: totalDebits === totalCredits,
      },
    };
  }

  /**
   * Ledger validator (admin tool).
   * - Checks entry-level balance (debits == credits), line sanity (>=2 lines, positive ints)
   * - Checks refund invariant across bookingId+currency: refunded CASH <= charged AR
   *
   * This is intended to detect legacy or manually-corrupted data.
   */
  async validateLedger(args?: {
    currency?: string;
    since?: Date;
    until?: Date;
    limit?: number; // entry scan cap
    evidence?: boolean; // include credits/debits/net in details (and small recent-entry sample)
  }): Promise<ValidateLedgerResult> {
    const currency = args?.currency ? String(args.currency).toLowerCase() : undefined;
    const since = args?.since;
    const until = args?.until;
    const limit = Math.min(Math.max(1, args?.limit ?? 500), 5000);
    const evidence = Boolean(args?.evidence);

    const violations: LedgerValidationViolation[] = [];

    // ---- Entry scan ----
    const entryWhere: any = {};
    if (currency) entryWhere.currency = currency;
    if (since || until) {
      entryWhere.createdAt = {};
      if (since) entryWhere.createdAt.gte = since;
      if (until) entryWhere.createdAt.lte = until;
    }

    const entries = await this.db.journalEntry.findMany({
      where: Object.keys(entryWhere).length ? entryWhere : undefined,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    });

    for (const e of entries) {
      const lines = e.lines ?? [];
      if (lines.length < 2) {
        violations.push({
          code: "ENTRY_MISSING_LINES",
          message: "Entry has fewer than 2 lines",
          entryId: e.id,
          bookingId: e.bookingId,
          currency: e.currency,
          details: { type: e.type, lineCount: lines.length },
        });
        continue;
      }

      let debits = 0;
      let credits = 0;

      for (const l of lines) {
        if (l.amountCents <= 0 || !Number.isInteger(l.amountCents)) {
          violations.push({
            code: "ENTRY_NEGATIVE_OR_ZERO_AMOUNT",
            message: "Entry contains a non-positive or non-integer amountCents",
            entryId: e.id,
            bookingId: e.bookingId,
            currency: e.currency,
            details: {
              lineId: l.id,
              account: l.account,
              direction: l.direction,
              amountCents: l.amountCents,
            },
          });
        }
        if (l.direction === LineDirection.DEBIT) debits += l.amountCents;
        if (l.direction === LineDirection.CREDIT) credits += l.amountCents;
      }

      if (debits !== credits) {
        violations.push({
          code: "ENTRY_IMBALANCED",
          message: "Entry debits != credits",
          entryId: e.id,
          bookingId: e.bookingId,
          currency: e.currency,
          details: { type: e.type, debits, credits, lineCount: lines.length },
        });
      }
    }

    // ---- Refund invariant scan (group by bookingId+currency) ----
    // We only care where bookingId is non-null.
    const bookingWhere: any = {
      bookingId: { not: null },
      type: { in: [JournalEntryType.CHARGE, JournalEntryType.REFUND] },
    };
    if (currency) bookingWhere.currency = currency;
    if (since || until) {
      bookingWhere.createdAt = {};
      if (since) bookingWhere.createdAt.gte = since;
      if (until) bookingWhere.createdAt.lte = until;
    }

    const bookingIds = await this.db.journalEntry.findMany({
      where: bookingWhere,
      select: { bookingId: true, currency: true },
      distinct: ["bookingId", "currency"],
      take: 5000,
    });

    let checkedRefundGroups = 0;
    for (const b of bookingIds) {
      const bookingId = b.bookingId!;
      const cur = b.currency;

      checkedRefundGroups += 1;

      const chargedAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          entry: { bookingId, currency: cur, type: JournalEntryType.CHARGE },
        },
        _sum: { amountCents: true },
      });
      const chargedCents = chargedAgg._sum.amountCents ?? 0;

      const refundedAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.CASH_STRIPE,
          direction: LineDirection.CREDIT,
          entry: { bookingId, currency: cur, type: JournalEntryType.REFUND },
        },
        _sum: { amountCents: true },
      });
      const refundedCashCents = refundedAgg._sum.amountCents ?? 0;

      if (refundedCashCents > chargedCents) {
        violations.push({
          code: "REFUND_EXCEEDS_CHARGE",
          message: "Total refunded cash exceeds total charged amount",
          bookingId,
          currency: cur,
          details: {
            chargedCents,
            refundedCashCents,
          },
        });
      }
    }

    // ---- FO payable non-negative scan (group by foId+currency) ----
    // Enforce: for each foId+currency, LIAB_FO_PAYABLE net (credits - debits) must be >= 0.
    const foWhere: any = {
      foId: { not: null },
    };
    if (currency) foWhere.currency = currency;
    if (since || until) {
      foWhere.createdAt = {};
      if (since) foWhere.createdAt.gte = since;
      if (until) foWhere.createdAt.lte = until;
    }

    const foGroups = await this.db.journalEntry.findMany({
      where: foWhere,
      select: { foId: true, currency: true },
      distinct: ["foId", "currency"],
      take: 5000,
    });

    for (const g of foGroups) {
      const foId = g.foId!;
      const cur = g.currency;

      const liabCreditsAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.CREDIT,
          entry: { foId, currency: cur },
        },
        _sum: { amountCents: true },
      });
      const liabDebitsAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.DEBIT,
          entry: { foId, currency: cur },
        },
        _sum: { amountCents: true },
      });

      const credits = liabCreditsAgg._sum.amountCents ?? 0;
      const debits = liabDebitsAgg._sum.amountCents ?? 0;
      const net = credits - debits;

      if (net < 0) {
        const details: Record<string, unknown> = evidence
          ? { creditsCents: credits, debitsCents: debits, netCents: net }
          : {};

        if (evidence) {
          const recent = await this.db.journalEntry.findMany({
            where: { foId, currency: cur },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { id: true, type: true, bookingId: true, createdAt: true },
          });
          details.recentEntries = recent;
        }

        violations.push({
          code: "FO_PAYABLE_NEGATIVE",
          message: "FO payable liability went negative (credits - debits < 0)",
          currency: cur,
          details: { foId, ...details },
        });
      }
    }

    // ---- Deferred revenue non-negative scan (group by bookingId+currency) ----
    const deferredBookingWhere: any = { bookingId: { not: null } };
    if (currency) deferredBookingWhere.currency = currency;
    if (since || until) {
      deferredBookingWhere.createdAt = {};
      if (since) deferredBookingWhere.createdAt.gte = since;
      if (until) deferredBookingWhere.createdAt.lte = until;
    }

    const deferredGroups = await this.db.journalEntry.findMany({
      where: deferredBookingWhere,
      select: { bookingId: true, currency: true },
      distinct: ["bookingId", "currency"],
      take: 5000,
    });

    for (const g of deferredGroups) {
      const bookingId = g.bookingId!;
      const cur = g.currency;

      const defCreditsAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.LIAB_DEFERRED_REVENUE,
          direction: LineDirection.CREDIT,
          entry: { bookingId, currency: cur },
        },
        _sum: { amountCents: true },
      });
      const defDebitsAgg = await this.db.journalLine.aggregate({
        where: {
          account: LedgerAccount.LIAB_DEFERRED_REVENUE,
          direction: LineDirection.DEBIT,
          entry: { bookingId, currency: cur },
        },
        _sum: { amountCents: true },
      });

      const creditsCents = defCreditsAgg._sum.amountCents ?? 0;
      const debitsCents = defDebitsAgg._sum.amountCents ?? 0;
      const balanceCents = creditsCents - debitsCents;

      if (balanceCents < 0) {
        const details: Record<string, unknown> = evidence
          ? { creditsCents, debitsCents, balanceCents }
          : { balanceCents };

        if (evidence) {
          const recent = await this.db.journalEntry.findMany({
            where: { bookingId, currency: cur },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { id: true, type: true, bookingId: true, createdAt: true },
          });
          details.recentEntries = recent;
        }

        violations.push({
          code: "DEFERRED_NEGATIVE",
          message: "Deferred revenue liability went negative (credits - debits < 0)",
          bookingId,
          currency: cur,
          details,
        });
      }
    }

    return {
      ok: violations.length === 0,
      scannedEntries: entries.length,
      checkedRefundGroups,
      violations,
    };
  }
}
