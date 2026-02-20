import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";

import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { StripeService } from "../src/modules/billing/stripe.service";
import { JournalEntryType, LedgerAccount, LineDirection } from "@prisma/client";

jest.setTimeout(15000);

describe("Stripe Reconcile (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  const stripeMock = {
    paymentIntents: { list: jest.fn() },
    refunds: { list: jest.fn() },
  };

  const inCreatedWindow = (created: number, createdParam: any) => {
    if (!createdParam) return true;

    // Stripe list params may be numbers or an object like { gte, lte }
    if (typeof createdParam === "number") return created === createdParam;

    const gte = typeof createdParam.gte === "number" ? createdParam.gte : -Infinity;
    const lte = typeof createdParam.lte === "number" ? createdParam.lte : Infinity;
    return created >= gte && created <= lte;
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

    const adminEmail = `admin_stripe_reconcile_${Date.now()}@servelink.local`;
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

  beforeEach(() => {
    stripeMock.paymentIntents.list.mockReset();
    stripeMock.refunds.list.mockReset();
  });

  it("GET /admin/stripe/reconcile/summary returns ok=true when stripe totals match ledger within window", async () => {
    const currency = "eur";
    const ts = Date.now();
    const bookingId = `e2e-stripe-reconcile-${ts}`;

    // Fixed window so only our seeded data is included (no collision with other tests)
    const since = new Date("1980-01-01T00:00:00.000Z");
    const until = new Date("1980-01-01T00:00:02.000Z");
    const anchor = new Date("1980-01-01T00:00:00.000Z");

    // Seed CHARGE: AR DEBIT 5000, REV CREDIT 1000, LIAB CREDIT 4000 (createdAt inside window)
    await prisma.journalEntry.create({
      data: {
        bookingId,
        foId: "fo-e2e",
        type: JournalEntryType.CHARGE,
        currency,
        idempotencyKey: `e2e-stripe-reconcile-charge-${ts}`,
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

    // Seed REFUND: CASH CREDIT 1200, REV DEBIT 200, LIAB DEBIT 1000 (createdAt inside window)
    await prisma.journalEntry.create({
      data: {
        bookingId,
        foId: "fo-e2e",
        type: JournalEntryType.REFUND,
        currency,
        idempotencyKey: `e2e-stripe-reconcile-refund-${ts}`,
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

    // Stripe mocks: list() is called with created { gte, lte }; filter so only in-window items are returned
    const anchorUnix = Math.floor(anchor.getTime() / 1000);

    const pi1 = { id: "pi_1", status: "succeeded", amount_received: 5000, currency: "eur", created: anchorUnix };
    const paymentIntentsAll = [pi1];
    stripeMock.paymentIntents.list.mockImplementation(async (params: any) => {
      const filtered = paymentIntentsAll.filter((pi) => inCreatedWindow(pi.created, params?.created));
      return { data: filtered, has_more: false } as any;
    });

    const refund1 = { id: "re_1", amount: 1200, currency: "eur", created: anchorUnix };
    const refund2 = { id: "re_2", amount: 9999, currency: "eur", created: anchorUnix + 10 };
    const refundsAll = [refund1, refund2];
    stripeMock.refunds.list.mockImplementation(async (params: any) => {
      const filtered = refundsAll.filter((r) => inCreatedWindow(r.created, params?.created));
      return { data: filtered, has_more: false } as any;
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/stripe/reconcile/summary")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ currency, since: since.toISOString(), until: until.toISOString() })
      .expect(200);

    expect(res.body.currency).toBe("eur");
    expect(res.body.ok).toBe(true);

    expect(res.body.stripe.grossCapturedCents).toBe(5000);
    expect(res.body.stripe.refundedCents).toBe(1200);

    expect(res.body.ledger.chargedCents).toBe(5000);
    expect(res.body.ledger.refundedCashCents).toBe(1200);

    expect(res.body.delta.chargeDeltaCents).toBe(0);
    expect(res.body.delta.refundDeltaCents).toBe(0);
  });

  it("rejects non-admin (403)", async () => {
    const customerEmail = `cust_stripe_reconcile_${Date.now()}@servelink.local`;
    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    const token = login.body?.accessToken;
    expect(token).toBeTruthy();

    await request(app.getHttpServer())
      .get("/api/v1/admin/stripe/reconcile/summary")
      .set("Authorization", `Bearer ${token}`)
      .query({ currency: "usd" })
      .expect(403);
  });
});
