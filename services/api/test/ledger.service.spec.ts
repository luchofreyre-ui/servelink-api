import { Test } from "@nestjs/testing";
import { JournalEntryType, LedgerAccount, LineDirection } from "@prisma/client";

import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { LedgerService } from "../src/modules/ledger/ledger.service";

describe("LedgerService (unit)", () => {
  let service: LedgerService;
  let db: PrismaService;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [LedgerService],
    }).compile();
    service = modRef.get(LedgerService);
    db = modRef.get(PrismaService);
  });

  it("rejects entry with fewer than 2 lines", async () => {
    await expect(
      service.postEntry({
        type: JournalEntryType.CHARGE,
        idempotencyKey: `unit-one-line-${Date.now()}`,
        lines: [
          {
            account: LedgerAccount.AR_CUSTOMER,
            direction: LineDirection.DEBIT,
            amountCents: 1000,
          },
        ],
      }),
    ).rejects.toThrow(/LEDGER_ENTRY_NEEDS_AT_LEAST_TWO_LINES/);
  });

  it("rejects imbalanced entry (debits != credits)", async () => {
    await expect(
      service.postEntry({
        type: JournalEntryType.CHARGE,
        idempotencyKey: `unit-imbalanced-${Date.now()}`,
        lines: [
          {
            account: LedgerAccount.AR_CUSTOMER,
            direction: LineDirection.DEBIT,
            amountCents: 1000,
          },
          {
            account: LedgerAccount.REV_PLATFORM,
            direction: LineDirection.CREDIT,
            amountCents: 500,
          },
        ],
      }),
    ).rejects.toThrow(/LEDGER_IMBALANCED/);
  });

  it("accepts balanced entry and returns 2+ lines with sum(debits)==sum(credits)", async () => {
    const idem = `unit-balanced-${Date.now()}`;
    const result = await service.postEntry({
      type: JournalEntryType.CHARGE,
      idempotencyKey: idem,
      lines: [
        {
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          amountCents: 5000,
        },
        {
          account: LedgerAccount.REV_PLATFORM,
          direction: LineDirection.CREDIT,
          amountCents: 5000,
        },
      ],
    });

    expect(result.lines.length).toBeGreaterThanOrEqual(2);
    const debits = result.lines
      .filter((l) => l.direction === LineDirection.DEBIT)
      .reduce((s, l) => s + l.amountCents, 0);
    const credits = result.lines
      .filter((l) => l.direction === LineDirection.CREDIT)
      .reduce((s, l) => s + l.amountCents, 0);
    expect(debits).toBe(credits);
    expect(result.type).toBe(JournalEntryType.CHARGE);
    expect(result.id).toBeTruthy();
  });

  it("idempotency replay returns existing entry with alreadyApplied", async () => {
    const idem = `unit-replay-${Date.now()}`;
    const first = await service.postEntry({
      type: JournalEntryType.CHARGE,
      idempotencyKey: idem,
      lines: [
        {
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          amountCents: 100,
        },
        {
          account: LedgerAccount.REV_PLATFORM,
          direction: LineDirection.CREDIT,
          amountCents: 100,
        },
      ],
    });
    const second = await service.postEntry({
      type: JournalEntryType.CHARGE,
      idempotencyKey: idem,
      lines: [
        {
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          amountCents: 100,
        },
        {
          account: LedgerAccount.REV_PLATFORM,
          direction: LineDirection.CREDIT,
          amountCents: 100,
        },
      ],
    });

    expect(second.alreadyApplied).toBe(true);
    expect(second.id).toBe(first.id);
    expect(second.lines.length).toBe(first.lines.length);
  });

  it("PAYOUT requires foId", async () => {
    await expect(
      service.postEntry({
        type: JournalEntryType.PAYOUT,
        currency: "usd",
        idempotencyKey: `unit-payout-missing-fo-${Date.now()}`,
        lines: [
          {
            account: LedgerAccount.LIAB_FO_PAYABLE,
            direction: LineDirection.DEBIT,
            amountCents: 100,
          },
          {
            account: LedgerAccount.CASH_STRIPE,
            direction: LineDirection.CREDIT,
            amountCents: 100,
          },
        ],
      }),
    ).rejects.toThrow(/PAYOUT requires foId/);
  });

  it("PAYOUT must debit LIAB_FO_PAYABLE > 0", async () => {
    await expect(
      service.postEntry({
        type: JournalEntryType.PAYOUT,
        foId: `unit-fo-${Date.now()}`,
        currency: "usd",
        idempotencyKey: `unit-payout-missing-liab-debit-${Date.now()}`,
        lines: [
          // Balanced but does NOT debit LIAB_FO_PAYABLE
          {
            account: LedgerAccount.CASH_STRIPE,
            direction: LineDirection.DEBIT,
            amountCents: 100,
          },
          {
            account: LedgerAccount.REV_PLATFORM,
            direction: LineDirection.CREDIT,
            amountCents: 100,
          },
        ],
      }),
    ).rejects.toThrow(/PAYOUT must debit LIAB_FO_PAYABLE > 0/);
  });

  it("PAYOUT rejects when requested payout exceeds available payable for foId+currency", async () => {
    const currency = "usd";
    const foId = `unit-fo-payable-${Date.now()}`;

    // Seed payable: LIAB credit 5000 for this FO
    await service.postEntry({
      type: JournalEntryType.CHARGE,
      foId,
      currency,
      idempotencyKey: `unit-payable-seed-${Date.now()}`,
      lines: [
        {
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          amountCents: 5000,
        },
        {
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.CREDIT,
          amountCents: 5000,
        },
      ],
    });

    // Attempt payout 6000 -> should fail
    await expect(
      service.postEntry({
        type: JournalEntryType.PAYOUT,
        foId,
        currency,
        idempotencyKey: `unit-payout-exceeds-${Date.now()}`,
        lines: [
          {
            account: LedgerAccount.LIAB_FO_PAYABLE,
            direction: LineDirection.DEBIT,
            amountCents: 6000,
          },
          {
            account: LedgerAccount.CASH_STRIPE,
            direction: LineDirection.CREDIT,
            amountCents: 6000,
          },
        ],
      }),
    ).rejects.toThrow(/Payout exceeds payable/);
  });

  it("PAYOUT allows payout equal to available payable and then blocks any further payout", async () => {
    const currency = "usd";
    const foId = `unit-fo-payable-eq-${Date.now()}`;

    // Seed payable: 4200
    await service.postEntry({
      type: JournalEntryType.CHARGE,
      foId,
      currency,
      idempotencyKey: `unit-payable-seed-eq-${Date.now()}`,
      lines: [
        {
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          amountCents: 4200,
        },
        {
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.CREDIT,
          amountCents: 4200,
        },
      ],
    });

    // Payout exactly 4200 -> ok
    const payout = await service.postEntry({
      type: JournalEntryType.PAYOUT,
      foId,
      currency,
      idempotencyKey: `unit-payout-eq-${Date.now()}`,
      lines: [
        {
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.DEBIT,
          amountCents: 4200,
        },
        {
          account: LedgerAccount.CASH_STRIPE,
          direction: LineDirection.CREDIT,
          amountCents: 4200,
        },
      ],
    });
    expect(payout.type).toBe(JournalEntryType.PAYOUT);

    // Any additional payout should now fail (available payable = 0)
    await expect(
      service.postEntry({
        type: JournalEntryType.PAYOUT,
        foId,
        currency,
        idempotencyKey: `unit-payout-after-zero-${Date.now()}`,
        lines: [
          {
            account: LedgerAccount.LIAB_FO_PAYABLE,
            direction: LineDirection.DEBIT,
            amountCents: 1,
          },
          {
            account: LedgerAccount.CASH_STRIPE,
            direction: LineDirection.CREDIT,
            amountCents: 1,
          },
        ],
      }),
    ).rejects.toThrow(/Payout exceeds payable/);
  });

  it("booking snapshot aggregates totals and invariants", async () => {
    const bookingId = `unit-snapshot-booking-${Date.now()}`;
    const currency = "usd";
    const platformFeeCents = 1000;

    // CHARGE 6500 split: platform 1000 to deferred, FO payable 5500
    await service.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId,
      currency,
      idempotencyKey: `unit-snapshot-charge-${Date.now()}`,
      lines: [
        {
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          amountCents: 6500,
        },
        {
          account: LedgerAccount.LIAB_DEFERRED_REVENUE,
          direction: LineDirection.CREDIT,
          amountCents: platformFeeCents,
        },
        {
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.CREDIT,
          amountCents: 5500,
        },
      ],
    });

    // After CHARGE only: deferred holds platform, earned is 0
    const snapAfterCharge = await service.getBookingSnapshot({ bookingId, currency });
    expect(snapAfterCharge.totals.deferredPlatformCents).toBe(platformFeeCents);
    expect(snapAfterCharge.totals.earnedPlatformCents).toBe(0);

    // REFUND cash 2000 split: platform 500 from deferred, FO 1500
    await service.postEntry({
      type: JournalEntryType.REFUND,
      bookingId,
      currency,
      idempotencyKey: `unit-snapshot-refund-${Date.now()}`,
      lines: [
        {
          account: LedgerAccount.LIAB_DEFERRED_REVENUE,
          direction: LineDirection.DEBIT,
          amountCents: 500,
        },
        {
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.DEBIT,
          amountCents: 1500,
        },
        {
          account: LedgerAccount.CASH_STRIPE,
          direction: LineDirection.CREDIT,
          amountCents: 2000,
        },
      ],
      metadata: {
        test: true,
      },
    });

    const snap = await service.getBookingSnapshot({ bookingId, currency });

    expect(snap.bookingId).toBe(bookingId);
    expect(snap.currency).toBe(currency);

    expect(snap.totals.chargedCents).toBe(6500);
    expect(snap.totals.refundedCashCents).toBe(2000);
    expect(snap.totals.platformRevenueCents).toBe(0); // no REV_PLATFORM until recognition
    expect(snap.totals.deferredPlatformCents).toBe(500); // 1000 credit - 500 debit
    expect(snap.totals.earnedPlatformCents).toBe(0);
    expect(snap.totals.foPayableCents).toBe(4000); // 5500 credit - 1500 debit
    expect(snap.totals.netCashCents).toBe(-2000); // 0 debit - 2000 credit

    expect(snap.invariantStatus.refundSafe).toBe(true);
    expect(snap.invariantStatus.balanced).toBe(true);

    // Recognize remaining deferred revenue; then snapshot should show deferred 0, earned = platformFeeCents (remaining 500)
    await service.recognizeRevenueForBooking({ bookingId, currency });
    const snapAfterRec = await service.getBookingSnapshot({ bookingId, currency });
    expect(snapAfterRec.totals.deferredPlatformCents).toBe(0);
    expect(snapAfterRec.totals.earnedPlatformCents).toBe(500); // recognized amount
  });

  it("booking snapshot throws NOT_FOUND when booking has no lines in currency", async () => {
    const bookingId = `unit-snapshot-missing-${Date.now()}`;
    await expect(
      service.getBookingSnapshot({ bookingId, currency: "usd" }),
    ).rejects.toThrow(/LEDGER_BOOKING_NOT_FOUND/);
  });

  it("validateLedger flags ENTRY_IMBALANCED when corrupted entry exists", async () => {
    const currency = "usd";
    const bookingId = `unit-validate-imbalanced-${Date.now()}`;

    // Seed a corrupted entry directly (bypass LedgerService guards)
    const entry = await db.journalEntry.create({
      data: {
        bookingId,
        foId: null,
        type: JournalEntryType.CHARGE,
        currency,
        idempotencyKey: `unit-validate-imbalanced-entry-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
      },
    });

    // Debits 1000, credits 900 => imbalanced
    await db.journalLine.createMany({
      data: [
        {
          entryId: entry.id,
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          amountCents: 1000,
        },
        {
          entryId: entry.id,
          account: LedgerAccount.REV_PLATFORM,
          direction: LineDirection.CREDIT,
          amountCents: 900,
        },
      ],
    });

    const result = await service.validateLedger({
      currency,
      limit: 5000,
    });

    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.code === "ENTRY_IMBALANCED")).toBe(
      true,
    );
  });

  it("validateLedger flags REFUND_EXCEEDS_CHARGE when corrupted refund totals exceed charge", async () => {
    const currency = "usd";
    const bookingId = `unit-validate-overrefund-${Date.now()}`;

    // Seed a minimal valid CHARGE (balanced), but only 1000 charged AR.
    const charge = await db.journalEntry.create({
      data: {
        bookingId,
        foId: null,
        type: JournalEntryType.CHARGE,
        currency,
        idempotencyKey: `unit-validate-overrefund-charge-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
      },
    });
    await db.journalLine.createMany({
      data: [
        {
          entryId: charge.id,
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          amountCents: 1000,
        },
        {
          entryId: charge.id,
          account: LedgerAccount.REV_PLATFORM,
          direction: LineDirection.CREDIT,
          amountCents: 1000,
        },
      ],
    });

    // Seed a corrupted REFUND (balanced) that refunds CASH 1500 (exceeds charged 1000).
    const refund = await db.journalEntry.create({
      data: {
        bookingId,
        foId: null,
        type: JournalEntryType.REFUND,
        currency,
        idempotencyKey: `unit-validate-overrefund-refund-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
      },
    });
    await db.journalLine.createMany({
      data: [
        {
          entryId: refund.id,
          account: LedgerAccount.REV_PLATFORM,
          direction: LineDirection.DEBIT,
          amountCents: 1500,
        },
        {
          entryId: refund.id,
          account: LedgerAccount.CASH_STRIPE,
          direction: LineDirection.CREDIT,
          amountCents: 1500,
        },
      ],
    });

    const result = await service.validateLedger({
      currency,
      limit: 5000,
    });

    expect(result.ok).toBe(false);
    expect(
      result.violations.some(
        (v) =>
          v.code === "REFUND_EXCEEDS_CHARGE" &&
          v.bookingId === bookingId &&
          v.currency === currency,
      ),
    ).toBe(true);
  });

  it("validateLedger flags FO_PAYABLE_NEGATIVE when FO liability goes negative", async () => {
    const currency = "usd";
    const foId = `unit-fo-negative-${Date.now()}`;

    // Seed a corrupted PAYOUT-like entry directly (bypass LedgerService guards):
    // LIAB_FO_PAYABLE DEBIT 100, CASH_STRIPE CREDIT 100 without any prior LIAB credit for this FO.
    const entry = await db.journalEntry.create({
      data: {
        bookingId: null,
        foId,
        type: JournalEntryType.PAYOUT,
        currency,
        idempotencyKey: `unit-fo-negative-entry-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
      },
    });

    await db.journalLine.createMany({
      data: [
        {
          entryId: entry.id,
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.DEBIT,
          amountCents: 100,
        },
        {
          entryId: entry.id,
          account: LedgerAccount.CASH_STRIPE,
          direction: LineDirection.CREDIT,
          amountCents: 100,
        },
      ],
    });

    const res = await service.validateLedger({ currency });
    const violation = res.violations.find(
      (v) => v.code === "FO_PAYABLE_NEGATIVE" && (v.details as any)?.foId === foId,
    );
    expect(violation).toBeTruthy();
    expect(violation!.currency).toBe(currency);
    expect(violation!.details).toBeDefined();
    expect((violation!.details as any).foId).toBe(foId);
  });

  it("validateLedger FO_PAYABLE_NEGATIVE includes evidence when evidence=1", async () => {
    const currency = "usd";
    const foId = `unit-fo-negative-evidence-${Date.now()}`;

    const entry = await db.journalEntry.create({
      data: {
        bookingId: null,
        foId,
        type: JournalEntryType.PAYOUT,
        currency,
        idempotencyKey: `unit-fo-negative-evidence-entry-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
      },
    });

    await db.journalLine.createMany({
      data: [
        {
          entryId: entry.id,
          account: LedgerAccount.LIAB_FO_PAYABLE,
          direction: LineDirection.DEBIT,
          amountCents: 50,
        },
        {
          entryId: entry.id,
          account: LedgerAccount.CASH_STRIPE,
          direction: LineDirection.CREDIT,
          amountCents: 50,
        },
      ],
    });

    const res = await service.validateLedger({ currency, evidence: true });
    const violation = res.violations.find(
      (v) => v.code === "FO_PAYABLE_NEGATIVE" && (v.details as any)?.foId === foId,
    );
    expect(violation).toBeTruthy();

    const details: any = violation!.details ?? {};
    expect(details.foId).toBe(foId);
    expect(details.creditsCents).toBeDefined();
    expect(details.debitsCents).toBeDefined();
    expect(details.netCents).toBeDefined();
    expect(details.netCents).toBeLessThan(0);
    expect(details.recentEntries).toBeDefined();
    expect(Array.isArray(details.recentEntries)).toBe(true);
  });

  it("validateLedger flags DEFERRED_NEGATIVE when deferred liability goes negative", async () => {
    const currency = "usd";
    const bookingId = `unit-deferred-negative-${Date.now()}`;

    // Seed CHARGE: credits LIAB_DEFERRED_REVENUE 2000
    const charge = await db.journalEntry.create({
      data: {
        bookingId,
        foId: null,
        type: JournalEntryType.CHARGE,
        currency,
        idempotencyKey: `unit-deferred-neg-charge-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
      },
    });
    await db.journalLine.createMany({
      data: [
        { entryId: charge.id, account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 5000 },
        { entryId: charge.id, account: LedgerAccount.LIAB_DEFERRED_REVENUE, direction: LineDirection.CREDIT, amountCents: 2000 },
        { entryId: charge.id, account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });

    // Overdraw: REVENUE_RECOGNITION debits deferred 3000 (only 2000 existed)
    const revRec = await db.journalEntry.create({
      data: {
        bookingId,
        foId: null,
        type: JournalEntryType.REVENUE_RECOGNITION,
        currency,
        idempotencyKey: `unit-deferred-neg-revrec-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
      },
    });
    await db.journalLine.createMany({
      data: [
        { entryId: revRec.id, account: LedgerAccount.LIAB_DEFERRED_REVENUE, direction: LineDirection.DEBIT, amountCents: 3000 },
        { entryId: revRec.id, account: LedgerAccount.REV_PLATFORM, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });

    const res = await service.validateLedger({ currency, limit: 5000, evidence: true });
    const violation = res.violations.find(
      (v) => v.code === "DEFERRED_NEGATIVE" && v.bookingId === bookingId,
    );
    expect(violation).toBeTruthy();
    expect(violation!.bookingId).toBe(bookingId);
    expect(violation!.currency).toBe(currency);
    expect((violation!.details as any).balanceCents).toBe(-1000);
    expect((violation!.details as any).recentEntries).toBeDefined();
  });

  describe("recognizeRevenueForBooking", () => {
    it("posts REVENUE_RECOGNITION moving deferred -> REV_PLATFORM and is idempotent", async () => {
      // Arrange: create a bookingId/currency with deferred balance via a CHARGE-like entry
      const bookingId = `booking_revrec_${Date.now()}_${Math.random()}`;
      const currency = "usd";

      // Create deferred revenue (credit) so recognition has something to move.
      await service.postEntry({
        type: JournalEntryType.CHARGE,
        bookingId,
        currency,
        idempotencyKey: `ledger:test:deferred:${bookingId}:${currency}`,
        metadata: { bookingId, currency },
        lines: [
          { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 10000 },
          { account: LedgerAccount.LIAB_DEFERRED_REVENUE, direction: LineDirection.CREDIT, amountCents: 2000 },
          { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 8000 },
        ],
      });

      // Act: recognize revenue
      const r1 = await service.recognizeRevenueForBooking({
        bookingId,
        currency,
        idempotencyKey: "test-complete-1",
      });

      // Assert: recognized amount is the deferred balance
      expect(r1.skipped).toBeFalsy();
      expect(r1.recognizedCents).toBe(2000);
    expect(r1.entry).toBeTruthy();
    const entry1 = r1.entry!;
    expect(entry1.type).toBe(JournalEntryType.REVENUE_RECOGNITION);

    // Verify the entry lines (2 lines, balanced)
    const lines1 = entry1.lines;
      expect(lines1).toHaveLength(2);

    const drDeferred = lines1.find((l: any) => l.account === LedgerAccount.LIAB_DEFERRED_REVENUE);
    const crRev = lines1.find((l: any) => l.account === LedgerAccount.REV_PLATFORM);

    expect(drDeferred).toBeTruthy();
    expect(crRev).toBeTruthy();

    const dr = drDeferred!;
    const cr = crRev!;

    expect(dr.direction).toBe(LineDirection.DEBIT);
    expect(cr.direction).toBe(LineDirection.CREDIT);

    expect(dr.amountCents).toBe(2000);
    expect(cr.amountCents).toBe(2000);

      // Act again: idempotency replay should not double-recognize
      const r2 = await service.recognizeRevenueForBooking({
        bookingId,
        currency,
        idempotencyKey: "test-complete-1",
      });

      // Depending on how your postEntry replay returns, either:
      // - it returns the same entry with alreadyApplied, OR
      // - deferred is now 0 so it returns skipped.
      // We accept either behavior, but never a second recognition.
      expect(r2.recognizedCents === 0 || r2.recognizedCents === 2000).toBe(true);

      // Strong check: deferred balance after recognition is 0
      const deferredLines = await db.journalLine.findMany({
        where: {
          account: LedgerAccount.LIAB_DEFERRED_REVENUE,
          entry: { bookingId, currency },
        },
        select: { direction: true, amountCents: true },
      });

      const deferredBalance = deferredLines.reduce((acc: number, l: any) => {
        return acc + (l.direction === LineDirection.CREDIT ? l.amountCents : -l.amountCents);
      }, 0);

      expect(deferredBalance).toBe(0);
    });

    it("skips when deferred is <= 0", async () => {
      const bookingId = "booking_revrec_2";
      const currency = "usd";

      const r = await service.recognizeRevenueForBooking({ bookingId, currency });
      expect(r).toEqual({ recognizedCents: 0, skipped: true });
    });

    it("supports partial recognition via maxRecognizeCents", async () => {
      const bookingId = `booking_partial_${Date.now()}`;
      const currency = "usd";

      await service.postEntry({
        type: JournalEntryType.CHARGE,
        bookingId,
        currency,
        idempotencyKey: `ledger:test:deferred:${bookingId}:${currency}`,
        metadata: { bookingId, currency },
        lines: [
          { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 10000 },
          { account: LedgerAccount.LIAB_DEFERRED_REVENUE, direction: LineDirection.CREDIT, amountCents: 2000 },
          { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 8000 },
        ],
      });

      const r = await service.recognizeRevenueForBooking({
        bookingId,
        currency,
        maxRecognizeCents: 500,
        idempotencyKey: "partial-1",
      });
      expect(r.skipped).toBeFalsy();
      expect(r.recognizedCents).toBe(500);

      const deferredLines = await db.journalLine.findMany({
        where: {
          account: LedgerAccount.LIAB_DEFERRED_REVENUE,
          entry: { bookingId, currency },
        },
        select: { direction: true, amountCents: true },
      });
      const deferredBalance = deferredLines.reduce((acc: number, l: any) => {
        return acc + (l.direction === LineDirection.CREDIT ? l.amountCents : -l.amountCents);
      }, 0);
      expect(deferredBalance).toBe(1500);
    });
  });

  describe("reverseRevenueRecognitionForBooking", () => {
    it("moves REV_PLATFORM -> deferred and is idempotent", async () => {
      const bookingId = `booking_reverse_${Date.now()}`;
      const currency = "usd";

      await service.postEntry({
        type: JournalEntryType.CHARGE,
        bookingId,
        currency,
        idempotencyKey: `ledger:test:deferred:${bookingId}:${currency}`,
        metadata: { bookingId, currency },
        lines: [
          { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 10000 },
          { account: LedgerAccount.LIAB_DEFERRED_REVENUE, direction: LineDirection.CREDIT, amountCents: 2000 },
          { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 8000 },
        ],
      });

      await service.recognizeRevenueForBooking({
        bookingId,
        currency,
        idempotencyKey: "complete-1",
      });

      const r1 = await service.reverseRevenueRecognitionForBooking({
        bookingId,
        currency,
        idempotencyKey: "reopen-1",
      });
      expect(r1.skipped).toBeFalsy();
      expect(r1.reversedCents).toBe(2000);
      expect(r1.entry?.lines).toHaveLength(2);
      const drRev = r1.entry!.lines.find((l: any) => l.account === LedgerAccount.REV_PLATFORM && l.direction === LineDirection.DEBIT);
      const crDef = r1.entry!.lines.find((l: any) => l.account === LedgerAccount.LIAB_DEFERRED_REVENUE && l.direction === LineDirection.CREDIT);
      expect(drRev?.amountCents).toBe(2000);
      expect(crDef?.amountCents).toBe(2000);

      const r2 = await service.reverseRevenueRecognitionForBooking({
        bookingId,
        currency,
        idempotencyKey: "reopen-1",
      });
      expect(r2.skipped).toBe(true);
      expect(r2.reversedCents).toBe(0);

      const deferredLines = await db.journalLine.findMany({
        where: { account: LedgerAccount.LIAB_DEFERRED_REVENUE, entry: { bookingId, currency } },
        select: { direction: true, amountCents: true },
      });
      const deferredBalance = deferredLines.reduce((acc: number, l: any) => {
        return acc + (l.direction === LineDirection.CREDIT ? l.amountCents : -l.amountCents);
      }, 0);
      expect(deferredBalance).toBe(2000);

      const revLines = await db.journalLine.findMany({
        where: { account: LedgerAccount.REV_PLATFORM, entry: { bookingId, currency } },
        select: { direction: true, amountCents: true },
      });
      const revBalance = revLines.reduce((acc: number, l: any) => {
        return acc + (l.direction === LineDirection.CREDIT ? l.amountCents : -l.amountCents);
      }, 0);
      expect(revBalance).toBe(0);
    });
  });
});
