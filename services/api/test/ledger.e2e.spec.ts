import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { LedgerService } from "../src/modules/ledger/ledger.service";
import {
  BookingStatus,
  JournalEntryType,
  LedgerAccount,
  LineDirection,
  OpsAnomalyType,
} from "@prisma/client";

jest.setTimeout(15000);

describe("Ledger (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const customerEmail = `cust_ledger_${Date.now()}@servelink.local`;
    const adminEmail = `admin_ledger_${Date.now()}@servelink.local`;
    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const customerLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);
    customerToken = customerLogin.body?.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = adminLogin.body?.accessToken;

    expect(customerToken).toBeTruthy();
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("finalize billing posts 3-line CHARGE entry with platform/FO split and balanced debits/credits", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_ledger_" } },
    });
    expect(customer).toBeTruthy();

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 6500,
        estimatedHours: 1,
        currency: "usd",
        status: BookingStatus.pending_payment,
      },
    });

    // Create an ended billing session so finalize has billable amount (6500 cents = 20% platform => 1300, FO => 5200)
    await prisma.billingSession.create({
      data: {
        bookingId: booking.id,
        foId: "fo-placeholder",
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
        durationSec: 3600,
        billableMin: 60,
        billableCents: 6500,
      },
    });

    const idem = `e2e-finalize-${Date.now()}`;
    const finalizeRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/billing/finalize`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ idempotencyKey: idem })
      .expect(201);

    const totalCents = 6500;
    expect(finalizeRes.body?.finalBillableCents).toBe(totalCents);

    const entriesRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/ledger/entries`)
      .query({ bookingId: booking.id, limit: 10 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const items = entriesRes.body?.items ?? [];
    expect(items.length).toBeGreaterThanOrEqual(1);
    const chargeEntry = items.find((e: any) => e.type === "CHARGE");
    expect(chargeEntry).toBeTruthy();
    expect(chargeEntry.lines).toBeDefined();
    expect(chargeEntry.lines.length).toBe(3);

    const debits = chargeEntry.lines
      .filter((l: any) => l.direction === "DEBIT")
      .reduce((s: number, l: any) => s + l.amountCents, 0);
    const credits = chargeEntry.lines
      .filter((l: any) => l.direction === "CREDIT")
      .reduce((s: number, l: any) => s + l.amountCents, 0);
    expect(debits).toBe(credits);
    expect(debits).toBe(totalCents);

    const deferred = chargeEntry.lines.find((l: any) => l.account === "LIAB_DEFERRED_REVENUE");
    const liabFo = chargeEntry.lines.find((l: any) => l.account === "LIAB_FO_PAYABLE");

    expect(deferred).toBeTruthy();
    expect(liabFo).toBeTruthy();

    expect(deferred.direction).toBe("CREDIT");
    expect(liabFo.direction).toBe("CREDIT");
    expect(deferred.amountCents + liabFo.amountCents).toBe(totalCents);
  });

  it("enforces refund invariant at test level: refunded must not exceed charged", async () => {
    const ledger = app.get(LedgerService);

    const bookingId = `booking_refund_invariant_${Date.now()}`;
    const currency = "usd";

    // Seed a CHARGE: AR 6500 (DR), REV 1300 (CR), LIAB 5200 (CR)
    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId,
      currency,
      idempotencyKey: `ledger:e2e:charge:${bookingId}`,
      metadata: { bookingId, currency, test: "refund-invariant" },
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 6500 },
        { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.CREDIT, amountCents: 1300 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 5200 },
      ],
    });

    // Post a REFUND that stays <= charged
    await ledger.postEntry({
      type: JournalEntryType.REFUND,
      bookingId,
      currency,
      idempotencyKey: `ledger:e2e:refund:${bookingId}`,
      metadata: { bookingId, currency, test: "refund-invariant" },
      lines: [
        { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.DEBIT, amountCents: 1200 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.DEBIT, amountCents: 4800 },
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents: 6000 },
      ],
    });

    // charged = sum AR_CUSTOMER DEBIT for CHARGE entries
    const chargedAgg = await prisma.journalLine.aggregate({
      where: {
        account: LedgerAccount.AR_CUSTOMER,
        direction: LineDirection.DEBIT,
        entry: { bookingId, type: JournalEntryType.CHARGE, currency },
      },
      _sum: { amountCents: true },
    });

    // refunded = sum CASH_STRIPE CREDIT for REFUND entries
    const refundedAgg = await prisma.journalLine.aggregate({
      where: {
        account: LedgerAccount.CASH_STRIPE,
        direction: LineDirection.CREDIT,
        entry: { bookingId, type: JournalEntryType.REFUND, currency },
      },
      _sum: { amountCents: true },
    });

    const charged = chargedAgg._sum.amountCents ?? 0;
    const refunded = refundedAgg._sum.amountCents ?? 0;

    expect({ charged, refunded }).toEqual({ charged: 6500, refunded: 6000 });
    expect(refunded).toBeLessThanOrEqual(charged);
  });

  it("runtime hard-fail: imbalanced entry emits CRITICAL OpsAlert + Rollup (ledger invariant violation)", async () => {
    const ledger = app.get(LedgerService);

    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_ledger_" } },
    });
    expect(customer).toBeTruthy();

    // OpsAlert.bookingId is a FK → must be a real Booking id.
    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 6500,
        estimatedHours: 1,
        currency: "usd",
        status: BookingStatus.pending_payment,
      },
    });

    const idem = `e2e-ledger-imbalanced-${Date.now()}`;
    const sourceEventId = `ledger_guard:${idem}:ENTRY_IMBALANCED`;

    // Intentionally imbalanced: debits=100, credits=90
    await expect(
      ledger.postEntry({
        type: JournalEntryType.CHARGE,
        bookingId: booking.id,
        currency: "usd",
        idempotencyKey: idem,
        metadata: { test: true },
        lines: [
          { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 100 },
          { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.CREDIT, amountCents: 50 },
          { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 40 },
        ],
      }),
    ).rejects.toBeTruthy();

    const alert = await prisma.opsAlert.findUnique({
      where: { sourceEventId },
    });

    expect(alert).toBeTruthy();
    expect(alert!.bookingId).toBe(booking.id);
    expect(alert!.anomalyType).toBe(OpsAnomalyType.LEDGER_INVARIANT_VIOLATION);
    expect(String(alert!.severity)).toBe("critical");
    expect(String(alert!.status)).toBe("open");
    expect(alert!.fingerprint).toBeTruthy();
    expect(alert!.slaDueAt).toBeTruthy();

    const rollup = await prisma.opsAlertRollup.findUnique({
      where: { fingerprint: alert!.fingerprint! },
    });

    expect(rollup).toBeTruthy();
    expect(rollup!.anomalyType).toBe(OpsAnomalyType.LEDGER_INVARIANT_VIOLATION);
    expect(String(rollup!.severity)).toBe("critical");
    expect(String(rollup!.status)).toBe("open");
    expect(rollup!.occurrences).toBeGreaterThanOrEqual(1);
  });

  it("validator endpoint flags FO_PAYABLE_NEGATIVE (with evidence) when FO liability goes negative", async () => {
    const currency = "usd";
    const foId = `e2e-fo-negative-${Date.now()}`;

    // Seed corrupted PAYOUT-like entry directly (bypass LedgerService guard):
    // LIAB_FO_PAYABLE DR 100, CASH_STRIPE CR 100 with no prior LIAB credits for this FO.
    const entry = await prisma.journalEntry.create({
      data: {
        bookingId: null,
        foId,
        type: JournalEntryType.PAYOUT,
        currency,
        idempotencyKey: `e2e-fo-negative-entry-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
      },
    });

    await prisma.journalLine.createMany({
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

    const res = await request(app.getHttpServer())
      .post("/api/v1/admin/ledger/validate")
      .query({ currency, limit: 5000, evidence: "1" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const violations = res.body?.violations ?? [];
    const v = violations.find(
      (x: any) => x.code === "FO_PAYABLE_NEGATIVE" && x.details?.foId === foId,
    );

    expect(v).toBeTruthy();
    expect(v.currency).toBe(currency);

    // Evidence payload (requires controller to pass evidence flag through)
    expect(v.details.creditsCents).toBeDefined();
    expect(v.details.debitsCents).toBeDefined();
    expect(v.details.netCents).toBeDefined();
    expect(v.details.netCents).toBeLessThan(0);
    expect(Array.isArray(v.details.recentEntries)).toBe(true);
  });

  it("validator endpoint flags DEFERRED_NEGATIVE when deferred liability goes negative", async () => {
    const currency = "usd";

    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_ledger_" } },
    });
    expect(customer).toBeTruthy();

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency,
        status: BookingStatus.pending_payment,
      },
    });

    // Seed CHARGE: credits LIAB_DEFERRED_REVENUE 2000
    const charge = await prisma.journalEntry.create({
      data: {
        bookingId: booking.id,
        foId: null,
        type: JournalEntryType.CHARGE,
        currency,
        idempotencyKey: `e2e-deferred-neg-charge-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
      },
    });
    await prisma.journalLine.createMany({
      data: [
        { entryId: charge.id, account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 5000 },
        { entryId: charge.id, account: LedgerAccount.LIAB_DEFERRED_REVENUE, direction: LineDirection.CREDIT, amountCents: 2000 },
        { entryId: charge.id, account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });

    // Overdraw: REVENUE_RECOGNITION debits deferred 3000
    const revRec = await prisma.journalEntry.create({
      data: {
        bookingId: booking.id,
        foId: null,
        type: JournalEntryType.REVENUE_RECOGNITION,
        currency,
        idempotencyKey: `e2e-deferred-neg-revrec-${Date.now()}`,
        metadataJson: JSON.stringify({ test: true }),
        disputeOutcome: null,
      },
    });
    await prisma.journalLine.createMany({
      data: [
        { entryId: revRec.id, account: LedgerAccount.LIAB_DEFERRED_REVENUE, direction: LineDirection.DEBIT, amountCents: 3000 },
        { entryId: revRec.id, account: LedgerAccount.REV_PLATFORM, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });

    const res = await request(app.getHttpServer())
      .post("/api/v1/admin/ledger/validate")
      .query({ currency, limit: 200, evidence: "1" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const violations = res.body?.violations ?? [];
    const v = violations.find(
      (x: any) => x.code === "DEFERRED_NEGATIVE" && x.bookingId === booking.id,
    );

    expect(v).toBeTruthy();
    expect(v.currency).toBe(currency);
    expect(v.details?.balanceCents).toBe(-1000);
  });
});
