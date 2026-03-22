import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { StripeService as PaymentsStripeService } from "../src/modules/payments/stripe.service";

jest.setTimeout(25000);

describe("Payments orchestration (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let customerId: string;

  const createPaymentIntent = jest.fn();
  const retrievePaymentIntent = jest.fn();

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PaymentsStripeService)
      .useValue({
        createPaymentIntent,
        retrievePaymentIntent,
      })
      .compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const passwordHash = await bcrypt.hash("test-password", 10);
    const customerEmail = `pay_e2e_${Date.now()}@servelink.local`;
    const customer = await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });
    customerId = customer.id;

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password: "test-password" })
      .expect(201);

    customerToken = login.body?.accessToken;
    expect(customerToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    createPaymentIntent.mockReset();
    retrievePaymentIntent.mockReset();
  });

  it("POST intent fails when quote total missing", async () => {
    const booking = await prisma.booking.create({
      data: {
        customerId,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        paymentStatus: "none",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/payments/bookings/${booking.id}/intent`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(400);

    await prisma.booking.delete({ where: { id: booking.id } });
  });

  it("POST intent stores paymentIntentId and paymentStatus requires_payment", async () => {
    const piIntent = `pi_e2e_intent_${Date.now()}`;
    createPaymentIntent.mockResolvedValue({
      id: piIntent,
      client_secret: "cs_test_e2e",
      status: "requires_payment_method",
    });

    const booking = await prisma.booking.create({
      data: {
        customerId,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        quotedTotal: new Prisma.Decimal(99.5),
        quotedSubtotal: new Prisma.Decimal(80),
        quotedMargin: new Prisma.Decimal(19.5),
        paymentStatus: "quote_ready",
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/payments/bookings/${booking.id}/intent`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(201);

    expect(res.body?.paymentIntentId).toBe(piIntent);
    expect(res.body?.reused).toBe(false);

    const row = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(row?.paymentIntentId).toBe(piIntent);
    expect(row?.paymentStatus).toBe("requires_payment");

    await prisma.bookingStripePayment.deleteMany({
      where: { bookingId: booking.id },
    });
    await prisma.booking.delete({ where: { id: booking.id } });
  });

  it("POST confirm with mismatched intent creates anomaly", async () => {
    const piStored = `pi_e2e_stored_${Date.now()}`;
    const booking = await prisma.booking.create({
      data: {
        customerId,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        quotedTotal: new Prisma.Decimal(40),
        quotedSubtotal: new Prisma.Decimal(30),
        quotedMargin: new Prisma.Decimal(10),
        paymentStatus: "requires_payment",
        paymentIntentId: piStored,
      },
    });

    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: piStored,
        amountCents: 4000,
        currency: "usd",
        status: "requires_payment_method",
      },
    });

    const before = await prisma.opsAnomaly.count({
      where: { bookingId: booking.id, type: "payment_mismatch" },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/payments/bookings/${booking.id}/confirm`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ paymentIntentId: `pi_e2e_other_${Date.now()}` })
      .expect(400);

    const after = await prisma.opsAnomaly.count({
      where: { bookingId: booking.id, type: "payment_mismatch" },
    });
    expect(after).toBe(before + 1);

    await prisma.opsAnomaly.deleteMany({ where: { bookingId: booking.id } });
    await prisma.bookingStripePayment.deleteMany({
      where: { bookingId: booking.id },
    });
    await prisma.booking.delete({ where: { id: booking.id } });
  });

  it("POST fail sets paymentStatus failed and opens anomaly", async () => {
    const booking = await prisma.booking.create({
      data: {
        customerId,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        quotedTotal: new Prisma.Decimal(25),
        paymentStatus: "requires_payment",
        paymentIntentId: "pi_fail_test",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/payments/bookings/${booking.id}/fail`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ detail: "card_declined" })
      .expect(201);

    const row = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(row?.paymentStatus).toBe("failed");

    const anomaly = await prisma.opsAnomaly.findFirst({
      where: { bookingId: booking.id, type: "payment_missing" },
    });
    expect(anomaly).toBeTruthy();
    expect(anomaly?.detail).toContain("card_declined");

    await prisma.opsAnomaly.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.delete({ where: { id: booking.id } });
  });

  it("POST confirm succeeds when Stripe reports succeeded (ledger + payment row)", async () => {
    const piOk = `pi_e2e_confirm_${Date.now()}`;
    retrievePaymentIntent.mockResolvedValue({
      id: piOk,
      status: "succeeded",
    });

    const booking = await prisma.booking.create({
      data: {
        customerId,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        quotedTotal: new Prisma.Decimal(60),
        quotedSubtotal: new Prisma.Decimal(50),
        quotedMargin: new Prisma.Decimal(10),
        paymentStatus: "requires_payment",
        paymentIntentId: piOk,
      },
    });

    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: piOk,
        amountCents: 6000,
        currency: "usd",
        status: "requires_payment_method",
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/payments/bookings/${booking.id}/confirm`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ paymentIntentId: piOk })
      .expect(201);

    expect(res.body?.ok).toBe(true);

    const row = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(row?.paymentStatus).toBe("paid");

    const pay = await prisma.payment.findFirst({
      where: { bookingId: booking.id, externalRef: piOk },
    });
    expect(pay).toBeTruthy();

    const entries = await prisma.journalEntry.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: "asc" },
    });
    const types = entries.map((e) => e.type);
    expect(types).toContain("CHARGE");
    expect(types).toContain("SETTLEMENT");

    await prisma.payment.deleteMany({ where: { bookingId: booking.id } });
    await prisma.bookingStripePayment.deleteMany({
      where: { bookingId: booking.id },
    });
    await prisma.booking.delete({ where: { id: booking.id } });
  });
});
