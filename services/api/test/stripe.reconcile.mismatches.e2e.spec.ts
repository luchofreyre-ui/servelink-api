import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { StripeService } from "../src/modules/billing/stripe.service";
import { BookingStatus } from "@prisma/client";

jest.setTimeout(15000);

describe("Stripe reconcile mismatches (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

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
    process.env.STRIPE_SECRET_KEY = "sk_test_e2e";

    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StripeService)
      .useValue({ stripe: stripeMock })
      .compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const adminEmail = `admin_stripe_mismatch_${Date.now()}@servelink.local`;
    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = adminLogin.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    stripeMock.paymentIntents.list.mockReset();
    stripeMock.refunds.list.mockReset();
  });

  it("GET /api/v1/admin/stripe/reconcile/mismatches flags STRIPE_PI_SUCCEEDED_MISSING_LEDGER_SETTLEMENT (evidence=1)", async () => {
    const currency = "usd";
    const ts = Date.now();
    const piId = `pi_missing_settlement_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const chargeId = `ch_missing_settlement_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // Use a dead anchor window to avoid collisions with other tests
    const anchor = new Date("1980-01-01T00:00:00.000Z");
    const since = new Date(anchor.getTime() - 1000);
    const until = new Date(anchor.getTime() + 1000);

    // Create a real customer + booking so BookingStripePayment FK is valid
    const customerEmail = `cust_stripe_mismatch_${ts}@servelink.local`;
    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const customer = await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 6500,
        estimatedHours: 1,
        currency,
        status: BookingStatus.pending_payment,
      },
    });

    // Pointer exists for PI, but we intentionally DO NOT create a ledger SETTLEMENT entry
    await prisma.bookingStripePayment.create({
      data: {
        bookingId: booking.id,
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

    // Stripe returns one succeeded PI in window
    stripeMock.paymentIntents.list.mockResolvedValueOnce({
      data: [
        {
          id: piId,
          status: "succeeded",
          amount_received: 5000,
          currency: "usd",
          created: Math.floor(anchor.getTime() / 1000),
        },
      ],
      has_more: false,
    });

    // No refunds
    stripeMock.refunds.list.mockResolvedValueOnce({
      data: [],
      has_more: false,
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/stripe/reconcile/mismatches")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({
        currency,
        since: since.toISOString(),
        until: until.toISOString(),
        limit: 200,
        evidence: "1",
      })
      .expect(200);

    expect(res.body.currency).toBe("usd");
    expect(Array.isArray(res.body.mismatches)).toBe(true);
    expect(typeof res.body.mismatchCount).toBe("number");
    expect(res.body.mismatchCount).toBeGreaterThanOrEqual(1);

    const v = (res.body.mismatches as any[]).find(
      (m) => m.code === "STRIPE_PI_SUCCEEDED_MISSING_LEDGER_SETTLEMENT",
    );
    expect(v).toBeTruthy();
    expect(v.currency).toBe("usd");
    expect(v.details).toBeDefined();

    // Evidence should include useful fields when evidence=1 (don't over-spec exact shape)
    // We at least expect the PI id to be present somewhere in details.
    const detailsStr = JSON.stringify(v.details ?? {});
    expect(detailsStr).toMatch(new RegExp(piId));
  });
});
