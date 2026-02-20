import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import express from "express";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { StripeService } from "../src/modules/billing/stripe.service";
import { LedgerAccount, LineDirection, JournalEntryType } from "@prisma/client";

const WEBHOOK_SECRET = "whsec_test_123";

jest.setTimeout(15000);

describe("Stripe dispute lifecycle (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let stripeSvc: StripeService;

  beforeAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({ bodyParser: false });
    app.use(express.raw({ type: "application/json" }));
    await app.init();

    prisma = app.get(PrismaService);
    stripeSvc = app.get(StripeService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("posts DISPUTE_WITHDRAWAL on funds_withdrawn and DISPUTE_REVERSAL on funds_reinstated; replays are idempotent", async () => {
    const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // ---- Arrange: create customer + booking + stripe pointer to resolve by chargeId ----
    const passwordHash = await bcrypt.hash("Passw0rd!", 10);
    const customer = await prisma.user.create({
      data: { email: `cust_disputes_${uniq("c")}@servelink.local`, passwordHash, role: "customer" },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 6500,
        estimatedHours: 1,
        currency: "usd",
      },
    });

    const chargeId = `ch_${uniq("1")}`;
    const disputeId = `dp_${uniq("1")}`;
    const piId = `pi_${uniq("1")}`;

    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents: 1234,
        currency: "usd",
        status: "paid",
      },
    });

    // ---- Helper: post webhook event (raw JSON + stripe-signature) ----
    const postWebhook = async (type: string, eventId: string, amountCents: number) => {
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

      const evt = {
        id: eventId,
        type,
        data: {
          object: {
            id: disputeId,
            charge: chargeId,
            amount: amountCents,
            currency: "usd",
            status:
              type === "charge.dispute.funds_withdrawn"
                ? "funds_withdrawn"
                : type === "charge.dispute.funds_reinstated"
                  ? "funds_reinstated"
                  : "created",
          },
        },
      };

      const payload = JSON.stringify(evt);

      const sig = stripeSvc.stripe.webhooks.generateTestHeaderString({
        payload,
        secret: WEBHOOK_SECRET,
      });

      return request(app.getHttpServer())
        .post("/api/v1/stripe/webhook")
        .set("Content-Type", "application/json")
        .set("stripe-signature", sig)
        .send(payload);
    };

    // ---- Act 1: funds_withdrawn posts DISPUTE_WITHDRAWAL ----
    const evWithdrawn = `ev_${uniq("withdrawn")}`;
    const res1 = await postWebhook("charge.dispute.funds_withdrawn", evWithdrawn, 1234);
    expect(res1.status).toBe(201);
    expect(res1.body).toMatchObject({ ok: true, data: { processed: true } });

    // replay idempotent
    const res1b = await postWebhook("charge.dispute.funds_withdrawn", evWithdrawn, 1234);
    expect(res1b.status).toBe(201);

    // ---- Assert 1: ledger entry exists once (unique idempotency in LedgerService) ----
    const withdrawalEntries = await prisma.journalEntry.findMany({
      where: {
        bookingId: booking.id,
        type: JournalEntryType.DISPUTE_WITHDRAWAL,
      },
      include: { lines: true },
      orderBy: { createdAt: "asc" },
    });

    expect(withdrawalEntries.length).toBe(1);
    const w = withdrawalEntries[0];
    expect(w.currency).toBe("usd");

    // balanced + correct lines
    expect(w.lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.DEBIT,
          amountCents: 1234,
        }),
        expect.objectContaining({
          account: LedgerAccount.CASH_STRIPE,
          direction: LineDirection.CREDIT,
          amountCents: 1234,
        }),
      ]),
    );

    // ---- Act 2: funds_reinstated posts DISPUTE_REVERSAL ----
    const evReinstated = `ev_${uniq("reinstated")}`;
    const res2 = await postWebhook("charge.dispute.funds_reinstated", evReinstated, 1234);
    expect(res2.status).toBe(201);
    expect(res2.body).toMatchObject({ ok: true, data: { processed: true } });

    // replay idempotent
    const res2b = await postWebhook("charge.dispute.funds_reinstated", evReinstated, 1234);
    expect(res2b.status).toBe(201);

    // ---- Assert 2: reversal entry exists once ----
    const reversalEntries = await prisma.journalEntry.findMany({
      where: {
        bookingId: booking.id,
        type: JournalEntryType.DISPUTE_REVERSAL,
      },
      include: { lines: true },
      orderBy: { createdAt: "asc" },
    });

    expect(reversalEntries.length).toBe(1);
    const r = reversalEntries[0];
    expect(r.currency).toBe("usd");

    expect(r.lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          account: LedgerAccount.CASH_STRIPE,
          direction: LineDirection.DEBIT,
          amountCents: 1234,
        }),
        expect.objectContaining({
          account: LedgerAccount.AR_CUSTOMER,
          direction: LineDirection.CREDIT,
          amountCents: 1234,
        }),
      ]),
    );
  });
});
