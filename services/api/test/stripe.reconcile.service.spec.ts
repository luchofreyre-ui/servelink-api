import { Test } from "@nestjs/testing";
import { PrismaService } from "../src/prisma";
import { PrismaModule } from "../src/prisma.module";
import { StripeReconcileService } from "../src/modules/billing/stripe.reconcile.service";
import { StripeService } from "../src/modules/billing/stripe.service";
import {
  BookingStatus,
  JournalEntryType,
  LedgerAccount,
  LineDirection,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const uniq = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

describe("StripeReconcileService (unit)", () => {
  let svc: StripeReconcileService;
  let db: PrismaService;

  // Mocked stripe client shape we need
  const stripeMock = {
    paymentIntents: {
      list: jest.fn(),
    },
    refunds: {
      list: jest.fn(),
    },
  };

  beforeAll(async () => {
    // Ensure requireStripe() doesn't throw in unit tests
    process.env.STRIPE_SECRET_KEY = "sk_test_unit";

    const modRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        StripeReconcileService,
        {
          provide: StripeService,
          useValue: { stripe: stripeMock },
        },
      ],
    }).compile();

    svc = modRef.get(StripeReconcileService);
    db = modRef.get(PrismaService);
  });

  beforeEach(async () => {
    stripeMock.paymentIntents.list.mockReset();
    stripeMock.refunds.list.mockReset();
  });

  it("summary reconciles stripe succeeded PI + refunds vs ledger CHARGE/REFUND aggregates", async () => {
    const currency = "usd";
    const bookingId = `unit-stripe-reconcile-${Date.now()}`;
    const anchor = new Date("1980-01-01T00:00:00.000Z");
    const windowStart = new Date(anchor.getTime() - 1000);
    const windowEnd = new Date(anchor.getTime() + 1000);

    // Seed ledger with fixed createdAt so no other tests collide
    await db.journalEntry.create({
      data: {
        bookingId,
        foId: "fo-test",
        type: JournalEntryType.CHARGE,
        currency,
        idempotencyKey: `unit-reconcile-charge-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
        createdAt: anchor,
        lines: {
          create: [
            { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 5000 },
            { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.CREDIT, amountCents: 1000 },
            { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 4000 },
          ],
        },
      },
    });

    await db.journalEntry.create({
      data: {
        bookingId,
        foId: "fo-test",
        type: JournalEntryType.REFUND,
        currency,
        idempotencyKey: `unit-reconcile-refund-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
        createdAt: anchor,
        lines: {
          create: [
            { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.DEBIT, amountCents: 200 },
            { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.DEBIT, amountCents: 1000 },
            { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents: 1200 },
          ],
        },
      },
    });

    // Mock Stripe pagination for paymentIntents.list:
    // Page 1: one succeeded PI (5000), has_more=true
    // Page 2: one non-succeeded (ignored), has_more=false
    stripeMock.paymentIntents.list
      .mockResolvedValueOnce({
        data: [{ id: "pi_1", status: "succeeded", amount_received: 5000, currency: "usd", created: 1 }],
        has_more: true,
      })
      .mockResolvedValueOnce({
        data: [{ id: "pi_2", status: "requires_payment_method", amount_received: 9999, currency: "usd", created: 2 }],
        has_more: false,
      });

    // Mock refunds.list:
    // Include one USD refund 1200 and one EUR refund ignored by currency filter.
    stripeMock.refunds.list.mockResolvedValueOnce({
      data: [
        { id: "re_1", amount: 1200, currency: "usd", created: 3, charge: "ch_1" },
        { id: "re_2", amount: 777, currency: "eur", created: 4, charge: "ch_2" },
      ],
      has_more: false,
    });

    const res = await svc.summary({ currency, since: windowStart, until: windowEnd });

    expect(res.currency).toBe("usd");
    expect(res.stripe.paymentIntentsSucceededCount).toBe(1);
    expect(res.stripe.grossCapturedCents).toBe(5000);
    expect(res.stripe.refundsCount).toBe(1);
    expect(res.stripe.refundedCents).toBe(1200);

    expect(res.ledger.chargedCents).toBe(5000);
    expect(res.ledger.refundedCashCents).toBe(1200);

    expect(res.delta.chargeDeltaCents).toBe(0);
    expect(res.delta.refundDeltaCents).toBe(0);
    expect(res.ok).toBe(true);
  });

  it("summary returns ok=false when deltas exist", async () => {
    const currency = "usd";

    // Stripe reports 1000 captured, ledger has 0 in this window
    stripeMock.paymentIntents.list.mockResolvedValueOnce({
      data: [{ id: "pi_x", status: "succeeded", amount_received: 1000, currency: "usd", created: 10 }],
      has_more: false,
    });
    stripeMock.refunds.list.mockResolvedValueOnce({
      data: [],
      has_more: false,
    });

    const res = await svc.summary({
      currency,
      since: new Date(Date.now() + 10_000),
      until: new Date(Date.now() + 20_000),
    });

    expect(res.stripe.grossCapturedCents).toBe(1000);
    expect(res.ledger.chargedCents).toBe(0);
    expect(res.delta.chargeDeltaCents).toBe(1000);
    expect(res.ok).toBe(false);
  });

  it("mismatches returns 0 when Stripe objects, DB pointers, and ledger SETTLEMENT/REFUND all match (evidence=1)", async () => {
    const currency = "usd";
    const ts = Date.now();
    const piId = uniq("pi_ok");
    const chargeId = uniq("ch_ok");
    const refundId = uniq("re_ok");

    const customer = await db.user.create({
      data: {
        email: `unit-reconcile-cust-${ts}@test.local`,
        passwordHash: await bcrypt.hash("x", 10),
        role: "customer",
      },
    });
    const booking = await db.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency,
        status: BookingStatus.pending_payment,
      },
    });
    const bookingId = booking.id;

    // Dead anchor window (no collision with other tests)
    const anchor = new Date("2000-01-02T00:00:00.000Z");
    const windowStart = new Date(anchor.getTime() - 1000);
    const windowEnd = new Date(anchor.getTime() + 1000);

    // DB pointer for PI + charge
    await db.bookingStripePayment.create({
      data: {
        bookingId,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents: 5000,
        currency,
        status: "succeeded",
        clientSecret: null,
        createdAt: anchor,
        updatedAt: anchor,
      },
    });

    // Ledger SETTLEMENT with paymentIntentId in metadataJson
    await db.journalEntry.create({
      data: {
        bookingId,
        foId: null,
        type: JournalEntryType.SETTLEMENT,
        currency,
        idempotencyKey: `unit-mismatch-settlement-${ts}`,
        metadataJson: JSON.stringify({
          stripeEventId: "evt_ok_1",
          paymentIntentId: piId,
          amountCents: 5000,
          currency,
        }),
        disputeOutcome: null,
        createdAt: anchor,
        lines: {
          create: [
            { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 5000 },
            { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 5000 },
          ],
        },
      },
    });

    // Ledger REFUND with refundId/chargeId in metadataJson
    await db.journalEntry.create({
      data: {
        bookingId,
        foId: null,
        type: JournalEntryType.REFUND,
        currency,
        idempotencyKey: `unit-mismatch-refund-${ts}`,
        metadataJson: JSON.stringify({
          stripeEventId: "evt_ok_2",
          refundId,
          chargeId,
          amountCents: 1200,
          currency,
        }),
        disputeOutcome: null,
        createdAt: anchor,
        lines: {
          create: [
            { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.DEBIT, amountCents: 200 },
            { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.DEBIT, amountCents: 1000 },
            { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents: 1200 },
          ],
        },
      },
    });

    stripeMock.paymentIntents.list.mockResolvedValueOnce({
      data: [{ id: piId, status: "succeeded", amount_received: 5000, currency: "usd", created: 20 }],
      has_more: false,
    });

    stripeMock.refunds.list.mockResolvedValueOnce({
      data: [{ id: refundId, amount: 1200, currency: "usd", created: 21, charge: chargeId }],
      has_more: false,
    });

    const res = await svc.mismatches({
      currency,
      since: windowStart,
      until: windowEnd,
      limit: 200,
      evidence: true,
    });

    expect(res.currency).toBe("usd");
    expect(res.mismatchCount).toBe(0);
    expect(res.mismatches).toEqual([]);
  });

  it("mismatches flags STRIPE_PI_SUCCEEDED_ORPHAN_DB when Stripe PI succeeded has no BookingStripePayment pointer", async () => {
    const currency = "usd";
    const anchor = new Date("2000-01-03T00:00:00.000Z");
    const windowStart = new Date(anchor.getTime() - 1000);
    const windowEnd = new Date(anchor.getTime() + 1000);

    stripeMock.paymentIntents.list.mockResolvedValueOnce({
      data: [{ id: "pi_orphan_1", status: "succeeded", amount_received: 5000, currency: "usd", created: 30 }],
      has_more: false,
    });
    stripeMock.refunds.list.mockResolvedValueOnce({
      data: [],
      has_more: false,
    });

    const res = await svc.mismatches({
      currency,
      since: windowStart,
      until: windowEnd,
      limit: 200,
      evidence: true,
    });

    const v = res.mismatches.find((m) => m.code === "STRIPE_PI_SUCCEEDED_ORPHAN_DB");
    expect(v).toBeTruthy();
    expect(v!.currency).toBe("usd");
  });

  it("mismatches flags STRIPE_REFUND_MISSING_LEDGER_REFUND when Stripe refund exists and pointer exists but ledger REFUND is missing", async () => {
    const currency = "usd";
    const ts = Date.now();
    const piId = uniq("pi_some");
    const chargeId = uniq("ch_missing");
    const refundId = uniq("re_missing");

    const customer = await db.user.create({
      data: {
        email: `unit-reconcile-missing-${ts}@test.local`,
        passwordHash: await bcrypt.hash("x", 10),
        role: "customer",
      },
    });
    const booking = await db.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency,
        status: BookingStatus.pending_payment,
      },
    });
    const bookingId = booking.id;

    const anchor = new Date("2000-01-04T00:00:00.000Z");
    const windowStart = new Date(anchor.getTime() - 1000);
    const windowEnd = new Date(anchor.getTime() + 1000);

    // Pointer exists for charge -> booking
    await db.bookingStripePayment.create({
      data: {
        bookingId,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents: 5000,
        currency,
        status: "succeeded",
        clientSecret: null,
        createdAt: anchor,
        updatedAt: anchor,
      },
    });

    // Stripe has a refund for this charge, but we DO NOT create ledger REFUND entry.
    stripeMock.paymentIntents.list.mockResolvedValueOnce({
      data: [],
      has_more: false,
    });
    stripeMock.refunds.list.mockResolvedValueOnce({
      data: [{ id: refundId, amount: 1200, currency: "usd", created: 40, charge: chargeId }],
      has_more: false,
    });

    const res = await svc.mismatches({
      currency,
      since: windowStart,
      until: windowEnd,
      limit: 200,
      evidence: true,
    });

    const v = res.mismatches.find((m) => m.code === "STRIPE_REFUND_MISSING_LEDGER_REFUND");
    expect(v).toBeTruthy();
    expect(v!.currency).toBe("usd");
  });
});
