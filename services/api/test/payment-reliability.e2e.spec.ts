import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { BookingPaymentStatus } from "@prisma/client";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(40000);

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn((payload: Buffer) => JSON.parse(payload.toString())),
    },
  }));
});

function stripeEventBody(args: {
  id: string;
  type: string;
  object: Record<string, unknown>;
}) {
  return {
    id: args.id,
    type: args.type,
    livemode: false,
    data: { object: args.object },
  };
}

describe("Payment reliability + observability (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY =
      process.env.STRIPE_SECRET_KEY || "sk_test_payment_reliability_e2e";
    process.env.STRIPE_WEBHOOK_SECRET =
      process.env.STRIPE_WEBHOOK_SECRET || "whsec_payment_reliability_e2e";

    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmail = `admin_payrel_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = adminLoginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/admin/payments/ops-summary returns expected shape", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/payments/ops-summary")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body?.ok).toBe(true);
    const item = res.body?.item;
    expect(item).toBeTruthy();
    expect(typeof item.openAnomalyCount).toBe("number");
    expect(typeof item.recentWebhookFailureCount).toBe("number");
    expect(typeof item.stuckPendingPaymentShortCount).toBe("number");
    expect(typeof item.paidMissingStripeIdsCount).toBe("number");
  });

  it("duplicate Stripe webhook does not double-mutate booking payment status", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_dup_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 1000,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
        paymentStatus: BookingPaymentStatus.checkout_created,
        stripeCheckoutSessionId: `cs_dup_${Date.now()}`,
      },
    });

    const eventId = `evt_dup_${Date.now()}`;
    const payload = stripeEventBody({
      id: eventId,
      type: "checkout.session.completed",
      object: {
        id: booking.stripeCheckoutSessionId,
        payment_status: "paid",
        metadata: { bookingId: booking.id },
        amount_total: 5000,
        currency: "usd",
      },
    });

    await prisma.stripeWebhookReceipt.deleteMany({ where: { stripeEventId: eventId } });
    await prisma.paymentAnomaly.deleteMany({ where: { stripeEventId: eventId } });

    const first = await request(app.getHttpServer())
      .post("/api/v1/stripe/webhook")
      .set("stripe-signature", "t=1,v1=test")
      .send(payload);

    expect([200, 201]).toContain(first.status);

    const mid = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(mid?.paymentStatus).toBe(BookingPaymentStatus.paid);

    const eventsAfterFirst = await prisma.bookingEvent.count({
      where: { bookingId: booking.id, type: "PAYMENT_STATUS_CHANGED" },
    });

    const second = await request(app.getHttpServer())
      .post("/api/v1/stripe/webhook")
      .set("stripe-signature", "t=1,v1=test")
      .send(payload);

    expect([200, 201]).toContain(second.status);
    expect(second.body?.data?.duplicate).toBe(true);

    const eventsAfterSecond = await prisma.bookingEvent.count({
      where: { bookingId: booking.id, type: "PAYMENT_STATUS_CHANGED" },
    });
    expect(eventsAfterSecond).toBe(eventsAfterFirst);

    await prisma.bookingEvent.deleteMany({ where: { bookingId: booking.id } });
    await prisma.stripeWebhookReceipt.deleteMany({ where: { stripeEventId: eventId } });
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.user.delete({ where: { id: customer.id } });
  });

  it("unresolved booking correlation records PaymentAnomaly", async () => {
    const eventId = `evt_orphan_${Date.now()}`;
    await prisma.stripeWebhookReceipt.deleteMany({ where: { stripeEventId: eventId } });
    await prisma.paymentAnomaly.deleteMany({ where: { stripeEventId: eventId } });

    const payload = stripeEventBody({
      id: eventId,
      type: "checkout.session.completed",
      object: {
        id: "cs_no_such_booking",
        payment_status: "paid",
        metadata: { bookingId: "bk_does_not_exist_xxx" },
        amount_total: 100,
        currency: "usd",
      },
    });

    const res = await request(app.getHttpServer())
      .post("/api/v1/stripe/webhook")
      .set("stripe-signature", "t=1,v1=test")
      .send(payload);

    expect([200, 201]).toContain(res.status);

    const anomaly = await prisma.paymentAnomaly.findFirst({
      where: { stripeEventId: eventId, kind: "unresolved_booking_correlation" },
    });
    expect(anomaly).toBeTruthy();

    await prisma.stripeWebhookReceipt.deleteMany({ where: { stripeEventId: eventId } });
    await prisma.paymentAnomaly.deleteMany({ where: { stripeEventId: eventId } });
  });

  it("POST /api/v1/webhooks/stripe is not registered (legacy route removed)", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/webhooks/stripe")
      .set("Content-Type", "application/json")
      .send({ id: "evt_legacy_wh", type: "payment_intent.succeeded" })
      .expect(404);
  });

  it("POST /api/v1/bookings/stripe/webhook is not registered (legacy compatibility route removed)", async () => {
    const payload = stripeEventBody({
      id: `evt_legacy_${Date.now()}`,
      type: "checkout.session.completed",
      object: {
        id: "cs_legacy",
        payment_status: "paid",
        metadata: { bookingId: "bk_x" },
        amount_total: 100,
        currency: "usd",
      },
    });

    await request(app.getHttpServer())
      .post("/api/v1/bookings/stripe/webhook")
      .set("stripe-signature", "t=1,v1=test")
      .send(payload)
      .expect(404);
  });

  it("ops summary reflects paid booking missing Stripe payment intent id", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_paidgap_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 1000,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
        paymentStatus: BookingPaymentStatus.paid,
        stripePaymentIntentId: null,
        stripeCheckoutSessionId: `cs_gap_${Date.now()}`,
      },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/payments/ops-summary")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body?.item?.paidMissingStripeIdsCount).toBeGreaterThanOrEqual(1);

    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.user.delete({ where: { id: customer.id } });
  });

  it("ops summary reflects stale checkout / pending payment", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `cust_stale_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const old = new Date(Date.now() - 40 * 60 * 1000);
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 1000,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
        paymentStatus: BookingPaymentStatus.checkout_created,
        updatedAt: old,
      },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/payments/ops-summary")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body?.item?.stuckPendingPaymentShortCount).toBeGreaterThanOrEqual(1);

    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.user.delete({ where: { id: customer.id } });
  });
});
