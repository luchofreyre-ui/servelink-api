import { Test } from "@nestjs/testing";
import { JournalEntryType, LedgerAccount, LineDirection } from "@prisma/client";

import { PrismaService } from "../src/prisma";
import { LedgerService } from "../src/modules/ledger/ledger.service";
import {
  StripeWebhookHandlerService,
  StripePaymentIntentSucceededEvent,
} from "../src/modules/billing/stripe.webhook.handler.service";

describe("StripeWebhookHandlerService", () => {
  let handler: StripeWebhookHandlerService;
  let ledgerPostEntry: jest.SpyInstance;
  let dbFindFirst: jest.SpyInstance;
  let dbReceiptUpdate: jest.SpyInstance;
  let dbPointerUpdate: jest.SpyInstance;
  let dbBookingEventCreate: jest.SpyInstance;

  const mockEvent = (
    overrides: Partial<StripePaymentIntentSucceededEvent> = {},
  ): StripePaymentIntentSucceededEvent => ({
    id: "ev_1",
    data: {
      object: {
        id: "pi_123",
        amount_received: 6500,
        amount: 6500,
        currency: "usd",
      },
    },
    ...overrides,
  });

  const pointer = {
    bookingId: "booking_1",
    stripePaymentIntentId: "pi_123",
    stripeChargeId: "ch_1",
  };

  let mockDb: any;
  let dbFindUnique: jest.SpyInstance;

  beforeEach(async () => {
    mockDb = {
      bookingStripePayment: {
        findFirst: jest.fn().mockResolvedValue(pointer),
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args?.where?.stripeChargeId === "ch_1") return Promise.resolve(pointer);
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      stripeWebhookReceipt: {
        update: jest.fn().mockResolvedValue({}),
      },
      bookingEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
      disputeCase: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      booking: {
        findUnique: jest.fn().mockResolvedValue({ foId: "fo_1" }),
      },
      journalEntry: {
        findFirst: jest.fn().mockResolvedValue({ id: "existing_charge" }),
      },
      journalLine: {
        aggregate: jest.fn().mockImplementation((args: any) => {
          const acct = args?.where?.account;
          const dir = args?.where?.direction;

          // Default: nothing refunded
          if (acct === LedgerAccount.CASH_STRIPE && dir === LineDirection.CREDIT) {
            return Promise.resolve({ _sum: { amountCents: 0 } });
          }
          if (acct === LedgerAccount.REV_PLATFORM && dir === LineDirection.DEBIT) {
            return Promise.resolve({ _sum: { amountCents: 0 } });
          }
          if (acct === LedgerAccount.LIAB_FO_PAYABLE && dir === LineDirection.DEBIT) {
            return Promise.resolve({ _sum: { amountCents: 0 } });
          }
          return Promise.resolve({ _sum: { amountCents: 0 } });
        }),
      },
    };
    const mockLedger = {
      postEntry: jest.fn().mockResolvedValue({
        id: "entry_1",
        type: JournalEntryType.SETTLEMENT,
        alreadyApplied: false,
      }),
    };

    const modRef = await Test.createTestingModule({
      providers: [
        StripeWebhookHandlerService,
        { provide: PrismaService, useValue: mockDb },
        { provide: LedgerService, useValue: mockLedger },
      ],
    }).compile();

    handler = modRef.get(StripeWebhookHandlerService);
    ledgerPostEntry = (handler as any).ledger.postEntry as jest.SpyInstance;
    dbFindFirst = (handler as any).db.bookingStripePayment.findFirst as jest.SpyInstance;
    dbFindUnique = (handler as any).db.bookingStripePayment.findUnique as jest.SpyInstance;
    dbReceiptUpdate = (handler as any).db.stripeWebhookReceipt.update as jest.SpyInstance;
    dbPointerUpdate = (handler as any).db.bookingStripePayment.update as jest.SpyInstance;
    dbBookingEventCreate = (handler as any).db.bookingEvent.create as jest.SpyInstance;
  });

  it("posts SETTLEMENT entry when pointer exists (non-orphan)", async () => {
    const event = mockEvent();
    await handler.handlePaymentIntentSucceeded(event);

    expect(ledgerPostEntry).toHaveBeenCalledTimes(1);
    const call = ledgerPostEntry.mock.calls[0][0];
    expect(call.type).toBe(JournalEntryType.SETTLEMENT);
    expect(call.bookingId).toBe("booking_1");
    expect(call.currency).toBe("usd");
    expect(call.idempotencyKey).toBe(
      "ledger:settlement:stripe_pi:booking_1:pi_123",
    );
    expect(call.lines).toHaveLength(2);
    const debit = call.lines.find(
      (l: any) => l.account === LedgerAccount.CASH_STRIPE && l.direction === LineDirection.DEBIT,
    );
    const credit = call.lines.find(
      (l: any) =>
        l.account === LedgerAccount.AR_CUSTOMER && l.direction === LineDirection.CREDIT,
    );
    expect(debit).toBeTruthy();
    expect(credit).toBeTruthy();
    expect(debit.amountCents).toBe(6500);
    expect(credit.amountCents).toBe(6500);
    expect(call.metadata).toMatchObject({
      stripeEventId: "ev_1",
      paymentIntentId: "pi_123",
      amountCents: 6500,
      currency: "usd",
    });
  });

  it("replay: second call with same event.id does not duplicate (ledger returns alreadyApplied)", async () => {
    const event = mockEvent();
    ledgerPostEntry
      .mockResolvedValueOnce({ id: "entry_1", type: JournalEntryType.SETTLEMENT })
      .mockResolvedValueOnce({
        id: "entry_1",
        type: JournalEntryType.SETTLEMENT,
        alreadyApplied: true,
      });

    await handler.handlePaymentIntentSucceeded(event);
    await handler.handlePaymentIntentSucceeded(event);

    expect(ledgerPostEntry).toHaveBeenCalledTimes(2);
    expect(ledgerPostEntry.mock.calls[0][0].idempotencyKey).toBe(
      ledgerPostEntry.mock.calls[1][0].idempotencyKey,
    );
    expect(ledgerPostEntry.mock.calls[1][0].idempotencyKey).toBe(
      "ledger:settlement:stripe_pi:booking_1:pi_123",
    );
  });

  it("orphan: does not call ledger when pointer is null", async () => {
    dbFindFirst.mockResolvedValueOnce(null);
    const event = mockEvent();

    await handler.handlePaymentIntentSucceeded(event);

    expect(ledgerPostEntry).not.toHaveBeenCalled();
    expect(dbBookingEventCreate).toHaveBeenCalled(); // orphan note
  });

  it("uses amount when amount_received is missing", async () => {
    const event = mockEvent({
      data: {
        object: {
          id: "pi_456",
          amount: 9999,
          currency: "usd",
        },
      },
    });
    dbFindFirst.mockResolvedValueOnce({
      bookingId: "b2",
      stripePaymentIntentId: "pi_456",
    });

    await handler.handlePaymentIntentSucceeded(event);

    expect(ledgerPostEntry).toHaveBeenCalledTimes(1);
    const call = ledgerPostEntry.mock.calls[0][0];
    expect(call.lines[0].amountCents).toBe(9999);
    expect(call.lines[1].amountCents).toBe(9999);
    expect(call.idempotencyKey).toBe("ledger:settlement:stripe_pi:b2:pi_456");
  });

  it("posts CHARGE then SETTLEMENT when no prior CHARGE exists (quote / upfront path)", async () => {
    mockDb.journalEntry.findFirst = jest.fn().mockResolvedValue(null);
    const event = mockEvent();
    await handler.handlePaymentIntentSucceeded(event);

    expect(ledgerPostEntry).toHaveBeenCalledTimes(2);
    expect(ledgerPostEntry.mock.calls[0][0].type).toBe(JournalEntryType.CHARGE);
    expect(ledgerPostEntry.mock.calls[0][0].idempotencyKey).toBe(
      "ledger:charge:stripe_pi:booking_1:pi_123",
    );
    expect(ledgerPostEntry.mock.calls[1][0].type).toBe(JournalEntryType.SETTLEMENT);
    expect(ledgerPostEntry.mock.calls[1][0].idempotencyKey).toBe(
      "ledger:settlement:stripe_pi:booking_1:pi_123",
    );
  });

  describe("handleChargeRefundUpdated", () => {
    const chargeEntryWithLines = {
      id: "charge_entry_1",
      bookingId: "booking_1",
      type: JournalEntryType.CHARGE,
      currency: "usd",
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 6500 },
        { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.CREDIT, amountCents: 1300 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 5200 },
      ],
    };

    const refundEvent = (overrides: any = {}) => ({
      id: "ev_refund_1",
      data: {
        object: {
          id: "re_1",
          charge: "ch_1",
          amount: 6500,
          currency: "usd",
        },
      },
      ...overrides,
    });

    it("refund non-orphan posts 3-line REFUND with DR REV_PLATFORM / DR LIAB_FO_PAYABLE / CR CASH_STRIPE (prorated from CHARGE)", async () => {
      mockDb.journalEntry = { findFirst: jest.fn().mockResolvedValue(chargeEntryWithLines) };
      await handler.handleChargeRefundUpdated(refundEvent());

      expect(ledgerPostEntry).toHaveBeenCalledTimes(1);
      const call = ledgerPostEntry.mock.calls[0][0];
      expect(call.type).toBe(JournalEntryType.REFUND);
      expect(call.bookingId).toBe("booking_1");
      expect(call.idempotencyKey).toBe("ledger:refund:booking_1:re_1:ev_refund_1");
      expect(call.lines).toHaveLength(3);
      const drRev = call.lines.find(
        (l: any) => l.account === LedgerAccount.REV_PLATFORM && l.direction === LineDirection.DEBIT,
      );
      const drLiab = call.lines.find(
        (l: any) => l.account === LedgerAccount.LIAB_FO_PAYABLE && l.direction === LineDirection.DEBIT,
      );
      const crCash = call.lines.find(
        (l: any) => l.account === LedgerAccount.CASH_STRIPE && l.direction === LineDirection.CREDIT,
      );
      expect(drRev?.amountCents).toBe(1300);
      expect(drLiab?.amountCents).toBe(5200);
      expect(crCash?.amountCents).toBe(6500);
      const sumDebits = (drRev?.amountCents ?? 0) + (drLiab?.amountCents ?? 0);
      const sumCredits = crCash?.amountCents ?? 0;
      expect(sumDebits).toBe(6500);
      expect(sumCredits).toBe(6500);
      expect(call.metadata?.platformRefundCents).toBe(1300);
      expect(call.metadata?.foRefundCents).toBe(5200);
      expect(call.metadata?.chargeEntryId).toBe("charge_entry_1");
    });

    it("refund with no CHARGE entry uses splitCharge fallback (3-line balanced)", async () => {
      mockDb.journalEntry = { findFirst: jest.fn().mockResolvedValue(null) };
      const event = refundEvent();
      event.data!.object!.amount = 3000;
      await handler.handleChargeRefundUpdated(event);

      expect(ledgerPostEntry).toHaveBeenCalledTimes(1);
      const call = ledgerPostEntry.mock.calls[0][0];
      expect(call.type).toBe(JournalEntryType.REFUND);
      expect(call.lines).toHaveLength(3);
      const debits = call.lines.filter((l: any) => l.direction === LineDirection.DEBIT);
      const credits = call.lines.filter((l: any) => l.direction === LineDirection.CREDIT);
      const sumDebits = debits.reduce((s: number, l: any) => s + l.amountCents, 0);
      const sumCredits = credits.reduce((s: number, l: any) => s + l.amountCents, 0);
      expect(sumDebits).toBe(3000);
      expect(sumCredits).toBe(3000);
      expect(credits.find((l: any) => l.account === LedgerAccount.CASH_STRIPE)?.amountCents).toBe(3000);
      expect(call.metadata?.platformRefundCents + call.metadata?.foRefundCents).toBe(3000);
    });

    it("refund orphan does not post ledger", async () => {
      dbFindUnique.mockResolvedValueOnce(null);
      await handler.handleChargeRefundUpdated(refundEvent());

      expect(ledgerPostEntry).not.toHaveBeenCalled();
      expect(dbBookingEventCreate).toHaveBeenCalled();
    });

    it("refund resolves pointer by chargeId (no Stripe API call)", async () => {
      await handler.handleChargeRefundUpdated(refundEvent());

      expect(dbFindUnique).toHaveBeenCalledWith({ where: { stripeChargeId: "ch_1" } });
      expect(ledgerPostEntry).toHaveBeenCalledTimes(1);
      expect(ledgerPostEntry.mock.calls[0][0].type).toBe(JournalEntryType.REFUND);
    });

    it("replay: second call returns alreadyApplied (mock ledger)", async () => {
      ledgerPostEntry
        .mockResolvedValueOnce({ id: "e1", type: JournalEntryType.REFUND })
        .mockResolvedValueOnce({ id: "e1", type: JournalEntryType.REFUND, alreadyApplied: true });

      await handler.handleChargeRefundUpdated(refundEvent());
      await handler.handleChargeRefundUpdated(refundEvent());

      expect(ledgerPostEntry).toHaveBeenCalledTimes(2);
      expect(ledgerPostEntry.mock.calls[0][0].idempotencyKey).toBe(
        ledgerPostEntry.mock.calls[1][0].idempotencyKey,
      );
    });

    it("over-refund guard: when already refunded >= charge total, caps to 0 and does not post ledger", async () => {
      // CHARGE exists and totals are known
      mockDb.journalEntry = { findFirst: jest.fn().mockResolvedValue(chargeEntryWithLines) };

      // Ledger truth: already refunded cash equals full charge total
      mockDb.journalLine.aggregate
        .mockResolvedValueOnce({ _sum: { amountCents: 6500 } })
        .mockResolvedValueOnce({ _sum: { amountCents: 1300 } })
        .mockResolvedValueOnce({ _sum: { amountCents: 5200 } });

      const event = refundEvent();
      event.data!.object!.amount = 1000; // attempt to refund more

      await handler.handleChargeRefundUpdated(event);

      expect(ledgerPostEntry).not.toHaveBeenCalled();

      expect(mockDb.journalLine.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account: LedgerAccount.CASH_STRIPE,
            direction: LineDirection.CREDIT,
            entry: expect.objectContaining({
              bookingId: pointer.bookingId,
              type: JournalEntryType.REFUND,
              currency: "usd",
            }),
          }),
        }),
      );
    });

    it("over-refund guard: caps posted refund to remaining cash (cappedRefundCents) and stays balanced", async () => {
      mockDb.journalEntry = { findFirst: jest.fn().mockResolvedValue(chargeEntryWithLines) };

      // Remaining cash cap = 500 (6500 - 6000)
      mockDb.journalLine.aggregate
        .mockResolvedValueOnce({ _sum: { amountCents: 6000 } })
        .mockResolvedValueOnce({ _sum: { amountCents: 1200 } })
        .mockResolvedValueOnce({ _sum: { amountCents: 4800 } });

      const event = refundEvent();
      event.data!.object!.amount = 1000; // request > remaining

      await handler.handleChargeRefundUpdated(event);

      expect(ledgerPostEntry).toHaveBeenCalledTimes(1);
      const call = ledgerPostEntry.mock.calls[0][0];

      // Ensure cappedRefundCents = 500 was used everywhere
      expect(call.type).toBe(JournalEntryType.REFUND);

      // Metadata assertions
      expect(call.metadata?.refundRequestedCents).toBe(1000);
      expect(call.metadata?.amountCents).toBe(500);

      // Ledger line assertions
      expect(call.lines).toHaveLength(3);

      const drRev = call.lines.find(
        (l: any) =>
          l.account === LedgerAccount.REV_PLATFORM &&
          l.direction === LineDirection.DEBIT,
      );

      const drLiab = call.lines.find(
        (l: any) =>
          l.account === LedgerAccount.LIAB_FO_PAYABLE &&
          l.direction === LineDirection.DEBIT,
      );

      const crCash = call.lines.find(
        (l: any) =>
          l.account === LedgerAccount.CASH_STRIPE &&
          l.direction === LineDirection.CREDIT,
      );

      // Credit must equal capped amount
      expect(crCash?.amountCents).toBe(500);

      // Debits must sum to capped amount
      const sumDebits =
        (drRev?.amountCents ?? 0) +
        (drLiab?.amountCents ?? 0);

      expect(sumDebits).toBe(crCash?.amountCents ?? 0);
    });
  });

  describe("handleChargeDisputeCreated", () => {
    const disputeCreatedEvent = (overrides: any = {}) => ({
      id: "ev_dispute_1",
      data: {
        object: {
          id: "dp_1",
          charge: "ch_1",
          amount: 5000,
          currency: "usd",
          status: "needs_response",
        },
      },
      ...overrides,
    });

    it("dispute.created resolves pointer by chargeId (no Stripe API call)", async () => {
      await handler.handleChargeDisputeCreated(disputeCreatedEvent());

      expect(dbFindUnique).toHaveBeenCalledWith({ where: { stripeChargeId: "ch_1" } });
      expect(ledgerPostEntry).toHaveBeenCalledTimes(0);
    });

    it("dispute.created non-orphan does not post ledger (cash movement happens on funds_withdrawn)", async () => {
      await handler.handleChargeDisputeCreated(disputeCreatedEvent());
      expect(ledgerPostEntry).toHaveBeenCalledTimes(0);
    });

    it("replay: dispute.created does not post ledger (idempotency is on note + DB writes)", async () => {
      await handler.handleChargeDisputeCreated(disputeCreatedEvent());
      await handler.handleChargeDisputeCreated(disputeCreatedEvent());
      expect(ledgerPostEntry).toHaveBeenCalledTimes(0);
    });
  });

  describe("handleChargeDisputeFundsWithdrawn", () => {
    const disputeFundsWithdrawnEvent = () => ({
      id: "ev_dispute_withdrawn_1",
      type: "charge.dispute.funds_withdrawn",
      data: { object: { id: "dp_1", charge: "ch_1", amount: 1234, currency: "usd", status: "funds_withdrawn" } },
    });

    it("funds_withdrawn resolves pointer by chargeId (no Stripe API call) and posts DISPUTE_WITHDRAWAL", async () => {
      await handler.handleChargeDisputeFundsWithdrawn(disputeFundsWithdrawnEvent());

      expect(dbFindUnique).toHaveBeenCalledWith({ where: { stripeChargeId: "ch_1" } });
      expect(ledgerPostEntry).toHaveBeenCalledTimes(1);

      const call = ledgerPostEntry.mock.calls[0][0];
      expect(call.type).toBe(JournalEntryType.DISPUTE_WITHDRAWAL);
      expect(call.bookingId).toBe("booking_1");
      expect(call.currency).toBe("usd");
      expect(call.idempotencyKey).toBe("ledger:dispute_withdrawal:booking_1:dp_1:ev_dispute_withdrawn_1");

      expect(call.lines).toEqual([
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 1234 },
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents: 1234 },
      ]);
    });

    it("replay: second funds_withdrawn call returns alreadyApplied (same idempotencyKey)", async () => {
      await handler.handleChargeDisputeFundsWithdrawn(disputeFundsWithdrawnEvent());
      await handler.handleChargeDisputeFundsWithdrawn(disputeFundsWithdrawnEvent());

      expect(ledgerPostEntry).toHaveBeenCalledTimes(2);
      expect(ledgerPostEntry.mock.calls[0][0].idempotencyKey).toBe(
        ledgerPostEntry.mock.calls[1][0].idempotencyKey,
      );
    });
  });

  describe("handleChargeDisputeFundsReinstated", () => {
    const disputeFundsReinstatedEvent = () => ({
      id: "ev_dispute_reinstated_1",
      type: "charge.dispute.funds_reinstated",
      data: { object: { id: "dp_1", charge: "ch_1", amount: 1234, currency: "usd", status: "funds_reinstated" } },
    });

    it("funds_reinstated resolves pointer by chargeId (no Stripe API call) and posts DISPUTE_REVERSAL", async () => {
      await handler.handleChargeDisputeFundsReinstated(disputeFundsReinstatedEvent());

      expect(dbFindUnique).toHaveBeenCalledWith({ where: { stripeChargeId: "ch_1" } });
      expect(ledgerPostEntry).toHaveBeenCalledTimes(1);

      const call = ledgerPostEntry.mock.calls[0][0];
      expect(call.type).toBe(JournalEntryType.DISPUTE_REVERSAL);
      expect(call.bookingId).toBe("booking_1");
      expect(call.currency).toBe("usd");
      expect(call.idempotencyKey).toBe("ledger:dispute_reversal:booking_1:dp_1:ev_dispute_reinstated_1");

      expect(call.lines).toEqual([
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 1234 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 1234 },
      ]);
    });

    it("replay: second funds_reinstated call returns alreadyApplied (same idempotencyKey)", async () => {
      await handler.handleChargeDisputeFundsReinstated(disputeFundsReinstatedEvent());
      await handler.handleChargeDisputeFundsReinstated(disputeFundsReinstatedEvent());

      expect(ledgerPostEntry).toHaveBeenCalledTimes(2);
      expect(ledgerPostEntry.mock.calls[0][0].idempotencyKey).toBe(
        ledgerPostEntry.mock.calls[1][0].idempotencyKey,
      );
    });
  });

  describe("handleChargeDisputeClosed", () => {
    const disputeClosedEvent = (status: "won" | "lost", overrides: any = {}) => ({
      id: "ev_dispute_closed_1",
      data: {
        object: {
          id: "dp_1",
          charge: "ch_1",
          amount: 5000,
          currency: "usd",
          status,
        },
      },
      ...overrides,
    });

    it("dispute.closed resolves pointer by chargeId (no Stripe API call)", async () => {
      await handler.handleChargeDisputeClosed(disputeClosedEvent("won"));

      expect(dbFindUnique).toHaveBeenCalledWith({ where: { stripeChargeId: "ch_1" } });
      expect(ledgerPostEntry).toHaveBeenCalledTimes(0);
    });

    it("dispute.closed won does not post ledger (cash movement happens on funds_reinstated)", async () => {
      await handler.handleChargeDisputeClosed(disputeClosedEvent("won"));
      expect(ledgerPostEntry).toHaveBeenCalledTimes(0);
    });

    it("dispute.closed lost posts DR REV_PLATFORM / CR AR_CUSTOMER", async () => {
      await handler.handleChargeDisputeClosed(disputeClosedEvent("lost"));

      expect(ledgerPostEntry).toHaveBeenCalledTimes(1);
      const call = ledgerPostEntry.mock.calls[0][0];
      expect(call.type).toBe(JournalEntryType.DISPUTE_LOSS);
      expect(call.idempotencyKey).toBe(
        "ledger:dispute_loss:booking_1:dp_1:ev_dispute_closed_1",
      );
      expect(call.lines).toEqual([
        { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.DEBIT, amountCents: 5000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 5000 },
      ]);
    });

    it("replay: second dispute.closed (lost) call returns alreadyApplied (same idempotencyKey)", async () => {
      await handler.handleChargeDisputeClosed(disputeClosedEvent("lost"));
      await handler.handleChargeDisputeClosed(disputeClosedEvent("lost"));

      expect(ledgerPostEntry).toHaveBeenCalledTimes(2);
      expect(ledgerPostEntry.mock.calls[0][0].idempotencyKey).toBe(
        ledgerPostEntry.mock.calls[1][0].idempotencyKey,
      );
    });
  });
});
