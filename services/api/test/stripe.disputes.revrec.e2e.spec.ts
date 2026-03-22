import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import express from "express";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { StripeService } from "../src/modules/billing/stripe.service";
import { JournalEntryType, LedgerAccount, LineDirection } from "@prisma/client";

const WEBHOOK_SECRET = "whsec_test_revrec";

jest.setTimeout(20000);

const FO_ID = `fo-disputes-revrec-${Date.now()}`;

describe("Stripe disputes + rev-rec interleaving (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let stripeSvc: StripeService;
  let customerToken: string;
  let adminToken: string;
  let adminEmail: string;
  const adminPassword = "test-password";

  const loginAdmin = async (): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);
    const token = res.body?.accessToken;
    if (!token) throw new Error("admin login missing accessToken");
    return token;
  };

  beforeAll(async () => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({ bodyParser: false });
    app.use("/api/v1/stripe/webhook", express.raw({ type: "application/json" }));
    app.use(express.json());
    await app.init();

    prisma = app.get(PrismaService);
    stripeSvc = app.get(StripeService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const customerEmail = `cust_disputes_revrec_${Date.now()}@servelink.local`;
    const customer = await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });
    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);
    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    adminEmail = `admin_disputes_revrec_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });
    adminToken = await loginAdmin();
    expect(adminToken).toBeTruthy();

    const foUser = await prisma.user.create({
      data: { email: `fo_disputes_revrec_${Date.now()}@servelink.local`, passwordHash, role: "fo" },
    });
    await prisma.franchiseOwner.upsert({
      where: { id: FO_ID },
      update: { status: "active", userId: foUser.id },
      create: { id: FO_ID, userId: foUser.id, status: "active" },
    });

    const foWithProvider = await prisma.franchiseOwner.findUnique({
      where: { id: FO_ID },
      include: { provider: true },
    });
    expect(foWithProvider).toBeTruthy();
    expect(foWithProvider?.providerId).toBeTruthy();
    expect(foWithProvider?.provider).toBeTruthy();
    expect(foWithProvider?.provider?.userId).toBe(foUser.id);
  });

  afterAll(async () => {
    await app.close();
  });

  it("dispute funds_withdrawn → reopen (reverse) → funds_reinstated → complete leaves invariants intact", async () => {
    const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_disputes_revrec_" } },
    });
    expect(customer).toBeTruthy();

    const amountCents = 6500;
    const chargeId = `ch_${uniq("1")}`;
    const disputeId = `dp_${uniq("1")}`;
    const piId = `pi_${uniq("1")}`;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: amountCents,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await prisma.billingSession.create({
      data: {
        bookingId: booking.id,
        foId: FO_ID,
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
        durationSec: 3600,
        billableMin: 60,
        billableCents: amountCents,
      },
    });

    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents,
        currency: "usd",
        status: "paid",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/billing/finalize`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ idempotencyKey: `e2e-disputes-revrec-finalize-${uniq("f")}` })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "sched-1")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "assign-1")
      .send({ foId: FO_ID })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "start-1")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "complete-1")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const postWebhook = async (type: string, eventId: string, amt: number) => {
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
      const evt = {
        id: eventId,
        type,
        data: {
          object: {
            id: disputeId,
            charge: chargeId,
            amount: amt,
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

    const evWithdrawn = `ev_${uniq("withdrawn")}`;
    const resWithdrawn = await postWebhook("charge.dispute.funds_withdrawn", evWithdrawn, amountCents);
    expect(resWithdrawn.status).toBe(201);
    expect(resWithdrawn.body).toMatchObject({ ok: true, data: { processed: true } });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/reopen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "reopen-1")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const evReinstated = `ev_${uniq("reinstated")}`;
    const resReinstated = await postWebhook("charge.dispute.funds_reinstated", evReinstated, amountCents);
    expect(resReinstated.status).toBe(201);
    expect(resReinstated.body).toMatchObject({ ok: true, data: { processed: true } });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "complete-2")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const snap = await request(app.getHttpServer())
      .get(`/api/v1/admin/ledger/bookings/${booking.id}/snapshot?currency=usd`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(snap.body.totals.deferredPlatformCents).toBe(0);
    expect(snap.body.totals.earnedPlatformCents).toBeGreaterThan(0);

    const validateRes = await request(app.getHttpServer())
      .post("/api/v1/admin/ledger/validate")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ currency: "usd", limit: 5000, evidence: 1 })
      .expect(200);

    const violations = validateRes.body?.violations ?? [];
    const deferredNegative = violations.find(
      (v: any) => v.code === "DEFERRED_NEGATIVE" && v.bookingId === booking.id,
    );
    const foPayableNegative = violations.find(
      (v: any) => v.code === "FO_PAYABLE_NEGATIVE" && v.bookingId === booking.id,
    );
    expect(deferredNegative).toBeUndefined();
    expect(foPayableNegative).toBeUndefined();
  });

  it("A1: dispute loss when deferred exists debits LIAB_DEFERRED_REVENUE", async () => {
    const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_disputes_revrec_" } },
    });
    expect(customer).toBeTruthy();

    const amountCents = 5000;
    const chargeId = `ch_${uniq("a1")}`;
    const disputeId = `dp_${uniq("a1")}`;
    const piId = `pi_${uniq("a1")}`;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: amountCents,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await prisma.billingSession.create({
      data: {
        bookingId: booking.id,
        foId: FO_ID,
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
        durationSec: 3600,
        billableMin: 60,
        billableCents: amountCents,
      },
    });

    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents,
        currency: "usd",
        status: "paid",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/billing/finalize`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ idempotencyKey: `e2e-a1-finalize-${uniq("f")}` })
      .expect(201);

    const postDisputeClosedLost = async (eventId: string, disputeAmountCents: number) => {
      const freshAdminToken = await loginAdmin();
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
      const evt = {
        id: eventId,
        type: "charge.dispute.closed",
        data: {
          object: {
            id: disputeId,
            charge: chargeId,
            amount: disputeAmountCents,
            currency: "usd",
            status: "lost",
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
        .set("Authorization", `Bearer ${freshAdminToken}`)
        .set("Content-Type", "application/json")
        .set("stripe-signature", sig)
        .send(payload);
    };

    // Dispute amount = platform share only so deferred goes to 0 without going negative (20% of 5000 = 1000)
    const disputeAmountCents = 1000;
    const evClosed = `ev_${uniq("closed")}`;
    const resClosed = await postDisputeClosedLost(evClosed, disputeAmountCents);
    expect(resClosed.status).toBe(201);
    expect(resClosed.body).toMatchObject({ ok: true, data: { processed: true } });

    const lossEntries = await prisma.journalEntry.findMany({
      where: {
        bookingId: booking.id,
        currency: "usd",
        type: JournalEntryType.DISPUTE_LOSS,
      },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
    });
    expect(lossEntries.length).toBeGreaterThanOrEqual(1);
    const entry = lossEntries[0]!;
    expect(entry.lines).toHaveLength(2);

    const drLine = entry.lines.find(
      (l) => l.direction === LineDirection.DEBIT && l.account === LedgerAccount.LIAB_DEFERRED_REVENUE,
    );
    const crLine = entry.lines.find(
      (l) => l.direction === LineDirection.CREDIT && l.account === LedgerAccount.AR_CUSTOMER,
    );
    expect(drLine).toBeTruthy();
    expect(crLine).toBeTruthy();
    expect(drLine!.amountCents).toBe(disputeAmountCents);
    expect(crLine!.amountCents).toBe(disputeAmountCents);

    const validateRes = await request(app.getHttpServer())
      .post("/api/v1/admin/ledger/validate")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ currency: "usd", limit: 5000, evidence: 1 })
      .expect(200);
    const violations = validateRes.body?.violations ?? [];
    expect(
      violations.find((v: any) => v.code === "DEFERRED_NEGATIVE" && v.bookingId === booking.id),
    ).toBeUndefined();
    expect(
      violations.find((v: any) => v.code === "FO_PAYABLE_NEGATIVE" && v.bookingId === booking.id),
    ).toBeUndefined();
  });

  it("A2: dispute loss when no deferred debits REV_PLATFORM", async () => {
    const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_disputes_revrec_" } },
    });
    expect(customer).toBeTruthy();

    const amountCents = 5000;
    const chargeId = `ch_${uniq("a2")}`;
    const disputeId = `dp_${uniq("a2")}`;
    const piId = `pi_${uniq("a2")}`;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: amountCents,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await prisma.billingSession.create({
      data: {
        bookingId: booking.id,
        foId: FO_ID,
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
        durationSec: 3600,
        billableMin: 60,
        billableCents: amountCents,
      },
    });

    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents,
        currency: "usd",
        status: "paid",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/billing/finalize`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ idempotencyKey: `e2e-a2-finalize-${uniq("f")}` })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "a2-sched")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "a2-assign")
      .send({ foId: FO_ID })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "a2-start")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "a2-complete")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const postDisputeClosedLost = async (eventId: string, disputeAmountCents: number) => {
      const freshAdminToken = await loginAdmin();
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
      const evt = {
        id: eventId,
        type: "charge.dispute.closed",
        data: {
          object: {
            id: disputeId,
            charge: chargeId,
            amount: disputeAmountCents,
            currency: "usd",
            status: "lost",
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
        .set("Authorization", `Bearer ${freshAdminToken}`)
        .set("Content-Type", "application/json")
        .set("stripe-signature", sig)
        .send(payload);
    };

    // Dispute amount = platform share so earned is reduced to 0 without going negative (20% of 5000 = 1000)
    const disputeAmountCents = 1000;
    const evClosed = `ev_${uniq("closed")}`;
    const resClosed = await postDisputeClosedLost(evClosed, disputeAmountCents);
    expect(resClosed.status).toBe(201);
    expect(resClosed.body).toMatchObject({ ok: true, data: { processed: true } });

    const lossEntries = await prisma.journalEntry.findMany({
      where: {
        bookingId: booking.id,
        currency: "usd",
        type: JournalEntryType.DISPUTE_LOSS,
      },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
    });
    expect(lossEntries.length).toBeGreaterThanOrEqual(1);
    const entry = lossEntries[0]!;
    expect(entry.lines).toHaveLength(2);

    const drLine = entry.lines.find(
      (l) => l.direction === LineDirection.DEBIT && l.account === LedgerAccount.REV_PLATFORM,
    );
    const crLine = entry.lines.find(
      (l) => l.direction === LineDirection.CREDIT && l.account === LedgerAccount.AR_CUSTOMER,
    );
    expect(drLine).toBeTruthy();
    expect(crLine).toBeTruthy();
    expect(drLine!.amountCents).toBe(disputeAmountCents);
    expect(crLine!.amountCents).toBe(disputeAmountCents);

    const snap = await request(app.getHttpServer())
      .get(`/api/v1/admin/ledger/bookings/${booking.id}/snapshot?currency=usd`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(snap.body.totals.deferredPlatformCents).toBe(0);
    expect(snap.body.totals.earnedPlatformCents).toBeGreaterThanOrEqual(0);

    const validateRes = await request(app.getHttpServer())
      .post("/api/v1/admin/ledger/validate")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ currency: "usd", limit: 5000, evidence: 1 })
      .expect(200);
    const violations = validateRes.body?.violations ?? [];
    expect(
      violations.find((v: any) => v.code === "DEFERRED_NEGATIVE" && v.bookingId === booking.id),
    ).toBeUndefined();
    expect(
      violations.find((v: any) => v.code === "FO_PAYABLE_NEGATIVE" && v.bookingId === booking.id),
    ).toBeUndefined();
  });

  it("replay dispute.closed lost is idempotent (no second DISPUTE_LOSS)", async () => {
    const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_disputes_revrec_" } },
    });
    expect(customer).toBeTruthy();

    const amountCents = 5000;
    const platformCents = 1000;
    const chargeId = `ch_${uniq("idem")}`;
    const disputeId = `dp_${uniq("idem")}`;
    const piId = `pi_${uniq("idem")}`;
    const eventId = `ev_${uniq("idem")}`;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: amountCents,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await prisma.billingSession.create({
      data: {
        bookingId: booking.id,
        foId: FO_ID,
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
        durationSec: 3600,
        billableMin: 60,
        billableCents: amountCents,
      },
    });

    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents,
        currency: "usd",
        status: "paid",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/billing/finalize`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ idempotencyKey: `e2e-idem-finalize-${uniq("f")}` })
      .expect(201);

    const postDisputeClosedLost = async (evId: string, amt: number) => {
      const freshAdminToken = await loginAdmin();
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
      const evt = {
        id: evId,
        type: "charge.dispute.closed",
        data: {
          object: {
            id: disputeId,
            charge: chargeId,
            amount: amt,
            currency: "usd",
            status: "lost",
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
        .set("Authorization", `Bearer ${freshAdminToken}`)
        .set("Content-Type", "application/json")
        .set("stripe-signature", sig)
        .send(payload);
    };

    const res1 = await postDisputeClosedLost(eventId, platformCents);
    expect(res1.status).toBe(201);
    expect(res1.body).toMatchObject({ ok: true, data: { processed: true } });

    const snap1 = await request(app.getHttpServer())
      .get(`/api/v1/admin/ledger/bookings/${booking.id}/snapshot?currency=usd`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const res2 = await postDisputeClosedLost(eventId, platformCents);
    expect(res2.status).toBe(201);
    expect(res2.body?.data?.duplicate === true || res2.body?.data?.processed === true).toBe(true);

    const lossCount = await prisma.journalEntry.count({
      where: {
        bookingId: booking.id,
        currency: "usd",
        type: JournalEntryType.DISPUTE_LOSS,
      },
    });
    expect(lossCount).toBe(1);

    const snap2 = await request(app.getHttpServer())
      .get(`/api/v1/admin/ledger/bookings/${booking.id}/snapshot?currency=usd`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(snap2.body.totals.deferredPlatformCents).toBe(snap1.body.totals.deferredPlatformCents);
    expect(snap2.body.totals.earnedPlatformCents).toBe(snap1.body.totals.earnedPlatformCents);
  });

  it("funds_withdrawn after reopen posts cleanly and validates", async () => {
    const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_disputes_revrec_" } },
    });
    expect(customer).toBeTruthy();

    const amountCents = 6500;
    const chargeId = `ch_${uniq("wd")}`;
    const disputeId = `dp_${uniq("wd")}`;
    const piId = `pi_${uniq("wd")}`;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: amountCents,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await prisma.billingSession.create({
      data: {
        bookingId: booking.id,
        foId: FO_ID,
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
        durationSec: 3600,
        billableMin: 60,
        billableCents: amountCents,
      },
    });

    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents,
        currency: "usd",
        status: "paid",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/billing/finalize`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ idempotencyKey: `e2e-wd-finalize-${uniq("f")}` })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "wd-sched")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "wd-assign")
      .send({ foId: FO_ID })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "wd-start")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "wd-complete-1")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/reopen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "wd-reopen")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const postWebhook = async (type: string, evId: string, amt: number) => {
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
      const evt = {
        id: evId,
        type,
        data: {
          object: {
            id: disputeId,
            charge: chargeId,
            amount: amt,
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

    const evWithdrawn = `ev_${uniq("withdrawn")}`;
    const resWithdrawn = await postWebhook("charge.dispute.funds_withdrawn", evWithdrawn, amountCents);
    expect(resWithdrawn.status).toBe(201);
    expect(resWithdrawn.body).toMatchObject({ ok: true, data: { processed: true } });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "wd-complete-2")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const validateRes = await request(app.getHttpServer())
      .post("/api/v1/admin/ledger/validate")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ currency: "usd", limit: 5000, evidence: 1 })
      .expect(200);
    const violations = validateRes.body?.violations ?? [];
    expect(
      violations.find((v: any) => v.code === "DEFERRED_NEGATIVE" && v.bookingId === booking.id),
    ).toBeUndefined();
    expect(
      violations.find((v: any) => v.code === "FO_PAYABLE_NEGATIVE" && v.bookingId === booking.id),
    ).toBeUndefined();
  });

  it("complete then refund webhook: snapshot + validate", async () => {
    const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_disputes_revrec_" } },
    });
    expect(customer).toBeTruthy();

    const amountCents = 6500;
    const chargeId = `ch_${uniq("ref")}`;
    const refundId = `re_${uniq("ref")}`;
    const piId = `pi_${uniq("ref")}`;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: amountCents,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await prisma.billingSession.create({
      data: {
        bookingId: booking.id,
        foId: FO_ID,
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
        durationSec: 3600,
        billableMin: 60,
        billableCents: amountCents,
      },
    });

    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents,
        currency: "usd",
        status: "paid",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/billing/finalize`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ idempotencyKey: `e2e-refund-finalize-${uniq("f")}` })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "ref-sched")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "ref-assign")
      .send({ foId: FO_ID })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "ref-start")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "ref-complete")
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const refundAmountCents = 2000;
    const postRefundWebhook = (evId: string) => {
      process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
      const evt = {
        id: evId,
        type: "charge.refund.updated",
        data: {
          object: {
            id: refundId,
            charge: chargeId,
            amount: refundAmountCents,
            currency: "usd",
            status: "succeeded",
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

    const evRefund = `ev_${uniq("refund")}`;
    const resRefund = await postRefundWebhook(evRefund);
    expect(resRefund.status).toBe(201);
    expect(resRefund.body).toMatchObject({ ok: true, data: { processed: true } });

    const snap = await request(app.getHttpServer())
      .get(`/api/v1/admin/ledger/bookings/${booking.id}/snapshot?currency=usd`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(snap.body.totals).toBeDefined();
    expect(snap.body.totals.deferredPlatformCents).toBeDefined();
    expect(snap.body.totals.earnedPlatformCents).toBeDefined();

    const validateRes = await request(app.getHttpServer())
      .post("/api/v1/admin/ledger/validate")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ currency: "usd", limit: 5000, evidence: 1 })
      .expect(200);
    const violations = validateRes.body?.violations ?? [];
    expect(
      violations.find((v: any) => v.code === "DEFERRED_NEGATIVE" && v.bookingId === booking.id),
    ).toBeUndefined();
    expect(
      violations.find((v: any) => v.code === "FO_PAYABLE_NEGATIVE" && v.bookingId === booking.id),
    ).toBeUndefined();
  });

  it("replay charge.refund.updated is idempotent (no second REFUND, snapshot unchanged)", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_disputes_revrec_" } },
    });
    expect(customer).toBeTruthy();

    const booking = await prisma.booking.create({
      data: {
        status: "pending_payment",
        hourlyRateCents: 6500,
        estimatedHours: 1,
        currency: "usd",
        customerId: customer!.id,
      } as any,
    });

    await prisma.billingSession.create({
      data: {
        bookingId: booking.id,
        foId: FO_ID,
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
        durationSec: 3600,
        billableMin: 60,
        billableCents: 6500,
      } as any,
    });

    const chargeId = `ch_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const piId = `pi_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: piId,
        stripeChargeId: chargeId,
        amountCents: 6500,
        currency: "usd",
        status: "succeeded",
      } as any,
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/billing/finalize`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ idempotencyKey: `finalize-${Date.now()}` })
      .expect(201);

    const ok2xx = (r: any) => {
      expect(r.status).toBeGreaterThanOrEqual(200);
      expect(r.status).toBeLessThan(300);
    };

    ok2xx(
      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${booking.id}/schedule`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("idempotency-key", `sched-${Date.now()}`)
        .send({}),
    );

    ok2xx(
      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${booking.id}/assign`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("idempotency-key", `assign-${Date.now()}`)
        .send({ foId: FO_ID, note: "assign for refund replay" }),
    );

    ok2xx(
      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${booking.id}/start`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("idempotency-key", `start-${Date.now()}`)
        .send({}),
    );

    ok2xx(
      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${booking.id}/complete`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("idempotency-key", `complete-${Date.now()}`)
        .send({ note: "complete for refund replay" }),
    );

    const snap0 = await request(app.getHttpServer())
      .get(`/api/v1/admin/ledger/bookings/${booking.id}/snapshot?currency=usd`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const totals0 = snap0.body?.totals ?? snap0.body?.data?.totals ?? snap0.body?.snapshot?.totals;
    expect(totals0).toBeTruthy();

    const eventId = `evt_refund_replay_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const refundId = `re_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const postRefundUpdated = async () => {
      const payload = JSON.stringify({
        id: eventId,
        type: "charge.refund.updated",
        data: {
          object: {
            id: refundId,
            object: "refund",
            amount: 2000,
            currency: "usd",
            charge: chargeId,
            status: "succeeded",
          },
        },
      });

      const sig = stripeSvc.stripe.webhooks.generateTestHeaderString({
        payload,
        secret: process.env.STRIPE_WEBHOOK_SECRET!,
      });

      return request(app.getHttpServer())
        .post(`/api/v1/stripe/webhook`)
        .set("stripe-signature", sig)
        .set("Content-Type", "application/json")
        .send(payload);
    };

    const res1 = await postRefundUpdated();
    expect(res1.status).toBe(201);
    expect(res1.body?.ok).toBe(true);

    const refunds1 = await prisma.journalEntry.findMany({
      where: { bookingId: booking.id, type: JournalEntryType.REFUND },
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    });
    expect(refunds1.length).toBe(1);

    const snap1 = await request(app.getHttpServer())
      .get(`/api/v1/admin/ledger/bookings/${booking.id}/snapshot?currency=usd`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const totals1 = snap1.body?.totals ?? snap1.body?.data?.totals ?? snap1.body?.snapshot?.totals;

    const res2 = await postRefundUpdated();
    expect(res2.status).toBe(201);
    expect(res2.body?.ok).toBe(true);
    expect(
      res2.body?.data?.duplicate === true ||
        res2.body?.data?.processed === true ||
        res2.body?.ok === true,
    ).toBe(true);

    const refunds2 = await prisma.journalEntry.findMany({
      where: { bookingId: booking.id, type: JournalEntryType.REFUND },
      orderBy: { createdAt: "desc" },
    });
    expect(refunds2.length).toBe(1);

    const snap2 = await request(app.getHttpServer())
      .get(`/api/v1/admin/ledger/bookings/${booking.id}/snapshot?currency=usd`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const totals2 = snap2.body?.totals ?? snap2.body?.data?.totals ?? snap2.body?.snapshot?.totals;

    expect(totals2.deferredPlatformCents).toBe(totals1.deferredPlatformCents);
    expect(totals2.earnedPlatformCents).toBe(totals1.earnedPlatformCents);
  });
});
