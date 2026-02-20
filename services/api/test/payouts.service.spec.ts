import { Test } from "@nestjs/testing";
import { JournalEntryType, LedgerAccount, LineDirection } from "@prisma/client";

import { PrismaModule } from "../src/prisma.module";
import { PrismaService } from "../src/prisma";
import { LedgerService } from "../src/modules/ledger/ledger.service";
import { PayoutsService } from "../src/modules/payouts/payouts.service";

import { resetPayoutTables } from "./helpers/resetPayoutTables";

describe("PayoutsService (unit)", () => {
  let prisma: PrismaService;
  let payouts: PayoutsService;
  let ledger: LedgerService;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [LedgerService, PayoutsService],
    }).compile();
    prisma = modRef.get(PrismaService);
    payouts = modRef.get(PayoutsService);
    ledger = modRef.get(LedgerService);
  });

  beforeEach(async () => {
    await resetPayoutTables(prisma);
  });

  it("preview: correct net LIAB_FO_PAYABLE after credits and one payout debit for fo1", async () => {
    const ts = Date.now();
    // Credit LIAB_FO_PAYABLE for fo1 (5000) and fo2 (3000) via balanced entries
    await ledger.postEntry({
      type: JournalEntryType.ADJUSTMENT,
      foId: "fo1",
      idempotencyKey: `payout-preview-fo1-${ts}`,
      lines: [
        { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.DEBIT, amountCents: 5000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 5000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.ADJUSTMENT,
      foId: "fo2",
      idempotencyKey: `payout-preview-fo2-${ts}`,
      lines: [
        { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });
    // Payout (debit LIAB_FO_PAYABLE) for fo1: 2000
    await ledger.postEntry({
      type: JournalEntryType.PAYOUT,
      foId: "fo1",
      idempotencyKey: `payout-preview-payout-fo1-${ts}`,
      lines: [
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.DEBIT, amountCents: 2000 },
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents: 2000 },
      ],
    });

    const result = await payouts.preview({});

    expect(result.lines.length).toBe(2);
    const fo1Line = result.lines.find((l) => l.foId === "fo1");
    const fo2Line = result.lines.find((l) => l.foId === "fo2");
    expect(fo1Line).toBeDefined();
    expect(fo2Line).toBeDefined();
    expect(fo1Line!.amountCents).toBe(3000); // 5000 - 2000
    expect(fo2Line!.amountCents).toBe(3000);
    expect(result.totalCents).toBe(6000);
  });

  it("previewEligible: gross vs eligible from settled/refund/dispute; only bookingA eligible", async () => {
    const ts = Date.now();
    const fo1 = "fo-elig-1";
    const fo2 = "fo-elig-2";
    const bookingA = `elig-bookingA-${ts}`;
    const bookingB = `elig-bookingB-${ts}`;
    const bookingC = `elig-bookingC-${ts}`;
    const bookingD = `elig-bookingD-${ts}`;

    // bookingA (fo1): CHARGE 3000 + SETTLEMENT → eligible
    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: bookingA,
      foId: fo1,
      idempotencyKey: `ledger:charge:${bookingA}:elig-${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: bookingA,
      idempotencyKey: `ledger:settlement:${bookingA}:pi:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });

    // bookingB (fo1): CHARGE 3000, NO settlement → not eligible
    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: bookingB,
      foId: fo1,
      idempotencyKey: `ledger:charge:${bookingB}:elig-${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });

    // bookingC (fo2): CHARGE 3000 + SETTLEMENT + REFUND → not eligible
    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: bookingC,
      foId: fo2,
      idempotencyKey: `ledger:charge:${bookingC}:elig-${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: bookingC,
      idempotencyKey: `ledger:settlement:${bookingC}:pi:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.REFUND,
      bookingId: bookingC,
      idempotencyKey: `ledger:refund:${bookingC}:ref:${ts}`,
      lines: [
        { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.DEBIT, amountCents: 500 },
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents: 500 },
      ],
    });

    // bookingD (fo2): CHARGE 3000 + SETTLEMENT + DISPUTE (created, no won) → not eligible
    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: bookingD,
      foId: fo2,
      idempotencyKey: `ledger:charge:${bookingD}:elig-${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: bookingD,
      idempotencyKey: `ledger:settlement:${bookingD}:pi:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.DISPUTE,
      bookingId: bookingD,
      idempotencyKey: `ledger:dispute_created:${bookingD}:d:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 1000 },
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents: 1000 },
      ],
    });

    const result = await payouts.previewEligible({});

    expect(result.gross.lines.length).toBe(2);
    expect(result.gross.totalCents).toBe(12000);
    const grossFo1 = result.gross.lines.find((l) => l.foId === fo1);
    const grossFo2 = result.gross.lines.find((l) => l.foId === fo2);
    expect(grossFo1?.amountCents).toBe(6000);
    expect(grossFo2?.amountCents).toBe(6000);

    expect(result.eligible.lines.length).toBe(1);
    expect(result.eligible.totalCents).toBe(3000);
    const eligFo1 = result.eligible.lines.find((l) => l.foId === fo1);
    expect(eligFo1?.amountCents).toBe(3000);
    expect(result.eligible.lines.find((l) => l.foId === fo2)).toBeUndefined();
  });

  it("previewEligible respects currency: usd ignores eur entries", async () => {
    const ts = Date.now();
    const foId = "fo-mixed-currency";
    const bookingUsd = `mixed-usd-${ts}`;
    const bookingEur = `mixed-eur-${ts}`;

    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: bookingUsd,
      foId,
      currency: "usd",
      idempotencyKey: `ledger:charge:${bookingUsd}:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: bookingUsd,
      currency: "usd",
      idempotencyKey: `ledger:settlement:${bookingUsd}:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });

    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: bookingEur,
      foId,
      currency: "eur",
      idempotencyKey: `ledger:charge:${bookingEur}:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 9000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 9000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: bookingEur,
      currency: "eur",
      idempotencyKey: `ledger:settlement:${bookingEur}:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 9000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 9000 },
      ],
    });

    const now = new Date();
    const usdResult = await payouts.previewEligible({ asOf: now, currency: "usd" });
    expect(usdResult.gross.totalCents).toBe(3000);
    expect(usdResult.eligible.totalCents).toBe(3000);
    expect(usdResult.eligible.lines.length).toBe(1);
    expect(usdResult.eligible.lines[0].foId).toBe(foId);
    expect(usdResult.eligible.lines[0].amountCents).toBe(3000);

    const eurResult = await payouts.previewEligible({ asOf: now, currency: "eur" });
    expect(eurResult.gross.totalCents).toBe(9000);
    expect(eurResult.eligible.totalCents).toBe(9000);
    expect(eurResult.eligible.lines.length).toBe(1);
    expect(eurResult.eligible.lines[0].foId).toBe(foId);
    expect(eurResult.eligible.lines[0].amountCents).toBe(9000);
  });

  it("previewEligible uses disputeOutcome not idempotencyKey prefix", async () => {
    const ts = Date.now();
    const fo1 = "fo-dispute-outcome-1";
    const fo2 = "fo-dispute-outcome-2";
    const bookingA = `dispute-outcome-bookingA-${ts}`;
    const bookingB = `dispute-outcome-bookingB-${ts}`;

    // bookingA: CHARGE + SETTLEMENT + DISPUTE with disputeOutcome "won" but idempotencyKey NOT ledger:dispute_won:
    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: bookingA,
      foId: fo1,
      currency: "usd",
      idempotencyKey: `ledger:charge:${bookingA}:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 2000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 2000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: bookingA,
      currency: "usd",
      idempotencyKey: `ledger:settlement:${bookingA}:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 2000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 2000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.DISPUTE,
      bookingId: bookingA,
      currency: "usd",
      disputeOutcome: "won",
      idempotencyKey: `custom:dispute-won:${bookingA}:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 500 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 500 },
      ],
    });

    // bookingB: CHARGE + SETTLEMENT + DISPUTE with disputeOutcome "created" → ineligible
    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: bookingB,
      foId: fo2,
      currency: "usd",
      idempotencyKey: `ledger:charge:${bookingB}:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 1000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 1000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: bookingB,
      currency: "usd",
      idempotencyKey: `ledger:settlement:${bookingB}:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 1000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 1000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.DISPUTE,
      bookingId: bookingB,
      currency: "usd",
      disputeOutcome: "created",
      idempotencyKey: `ledger:dispute_created:${bookingB}:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 500 },
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents: 500 },
      ],
    });

    const result = await payouts.previewEligible({ currency: "usd" });
    expect(result.eligible.lines.length).toBe(1);
    expect(result.eligible.totalCents).toBe(2000);
    const eligFo1 = result.eligible.lines.find((l) => l.foId === fo1);
    expect(eligFo1).toBeDefined();
    expect(eligFo1!.amountCents).toBe(2000);
    expect(result.eligible.lines.find((l) => l.foId === fo2)).toBeUndefined();
  });
});
