import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { LedgerService } from "../src/modules/ledger/ledger.service";
import { JournalEntryType, LedgerAccount, LineDirection } from "@prisma/client";

import { resetPayoutTables } from "./helpers/resetPayoutTables";

jest.setTimeout(15000);

describe("Payouts (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ledger: LedgerService;
  let adminToken: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    ledger = app.get(LedgerService);

    const adminEmail = `admin_payouts_${Date.now()}@servelink.local`;
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
    await resetPayoutTables(prisma);
  });

  it("lock creates batch + lines without PAYOUT entries; mark-executed posts PAYOUT; replays are idempotent", async () => {
    const ts = Date.now();
    const fo1 = "fo-payout-e2e-1";
    const fo2 = "fo-payout-e2e-2";
    const booking1 = `e2e-booking-fo1-${ts}`;
    const booking2 = `e2e-booking-fo2-${ts}`;

    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: booking1,
      foId: fo1,
      idempotencyKey: `ledger:charge:${booking1}:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 5000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 5000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: booking1,
      idempotencyKey: `ledger:settlement:${booking1}:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 5000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 5000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: booking2,
      foId: fo2,
      idempotencyKey: `ledger:charge:${booking2}:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: booking2,
      idempotencyKey: `ledger:settlement:${booking2}:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 3000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 3000 },
      ],
    });

    const asOf = new Date(Date.now() + 60_000).toISOString();
    const lockIdem = `payout-e2e-lock-${ts}`;
    const resLock = await request(app.getHttpServer())
      .post("/api/v1/admin/payouts/lock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ idempotencyKey: lockIdem, asOf })
      .expect(201);

    const lockBody = resLock.body;
    expect(lockBody.batch).toBeDefined();
    expect(lockBody.batch.status).toBe("draft");
    expect(lockBody.batch.idempotencyKey).toBe(lockIdem);
    expect(lockBody.lines.length).toBeGreaterThanOrEqual(2);
    expect(lockBody.alreadyApplied).toBeUndefined();

    const lineFoIds = lockBody.lines.map((l: any) => l.foId);
    expect(lineFoIds).toContain(fo1);
    expect(lineFoIds).toContain(fo2);

    const payoutsAfterLock = await prisma.journalEntry.findMany({
      where: { type: JournalEntryType.PAYOUT, foId: { in: [fo1, fo2] }, idempotencyKey: { startsWith: `ledger:payout:${lockBody.batch.id}:` } },
    });
    expect(payoutsAfterLock.length).toBe(0);

    const execIdem = `payout-e2e-exec-${ts}`;
    const resExec = await request(app.getHttpServer())
      .post("/api/v1/admin/payouts/mark-executed")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ batchId: lockBody.batch.id, idempotencyKey: execIdem })
      .expect(201);

    const execBody = resExec.body;
    expect(execBody.batch.status).toBe("executed");
    expect(execBody.batch.id).toBe(lockBody.batch.id);
    expect(execBody.alreadyApplied).toBeUndefined();

    const payoutsByFo = await prisma.journalEntry.findMany({
      where: { type: JournalEntryType.PAYOUT, foId: { in: [fo1, fo2] }, idempotencyKey: { startsWith: `ledger:payout:${lockBody.batch.id}:` } },
      include: { lines: true },
    });
    expect(payoutsByFo.length).toBe(2);
    for (const entry of payoutsByFo) {
      expect(entry.lines.length).toBe(2);
      const debits = entry.lines.filter((l: any) => l.direction === "DEBIT");
      const credits = entry.lines.filter((l: any) => l.direction === "CREDIT");
      expect(debits.length).toBe(1);
      expect(credits.length).toBe(1);
      expect(credits[0].amountCents).toBe(debits[0].amountCents);
    }

    const resReplayExec = await request(app.getHttpServer())
      .post("/api/v1/admin/payouts/mark-executed")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ batchId: lockBody.batch.id, idempotencyKey: execIdem })
      .expect(201);
    expect(resReplayExec.body.alreadyApplied).toBe(true);
    expect(resReplayExec.body.batch.id).toBe(lockBody.batch.id);
    const payoutsAfterReplayExec = await prisma.journalEntry.findMany({
      where: { type: JournalEntryType.PAYOUT, foId: { in: [fo1, fo2] }, idempotencyKey: { startsWith: `ledger:payout:${lockBody.batch.id}:` } },
    });
    expect(payoutsAfterReplayExec.length).toBe(2);

    const resReplayLock = await request(app.getHttpServer())
      .post("/api/v1/admin/payouts/lock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ idempotencyKey: lockIdem })
      .expect(201);
    expect(resReplayLock.body.alreadyApplied).toBe(true);
    expect(resReplayLock.body.batch.id).toBe(lockBody.batch.id);
  });

  it("mark-executed rejects if a payout line would overdraw FO payable; no PAYOUT entries are created", async () => {
    const ts = Date.now();
    const fo1 = `fo-overdraw-${ts}`;
    const booking1 = `e2e-overdraw-booking-${ts}`;

    // Seed payable: 5000 and make booking eligible (settled, no refund/dispute)
    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: booking1,
      foId: fo1,
      idempotencyKey: `ledger:charge:${booking1}:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 5000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 5000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: booking1,
      idempotencyKey: `ledger:settlement:${booking1}:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 5000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 5000 },
      ],
    });

    const asOf = new Date(Date.now() + 60_000).toISOString();
    const lockIdem = `payout-e2e-overdraw-lock-${ts}`;
    const resLock = await request(app.getHttpServer())
      .post("/api/v1/admin/payouts/lock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ idempotencyKey: lockIdem, asOf })
      .expect(201);

    const batchId = resLock.body.batch.id as string;

    // There should be exactly one line for fo1 at 5000.
    expect(resLock.body.lines.length).toBe(1);
    expect(resLock.body.lines[0].foId).toBe(fo1);
    expect(resLock.body.lines[0].amountCents).toBe(5000);

    // Tamper/race simulation: mutate the locked payout line to exceed available payable.
    await prisma.payoutLine.updateMany({
      where: { batchId, foId: fo1 },
      data: { amountCents: 6000 },
    });

    // Execute should fail due to ledger-level PAYOUT invariant (payout exceeds payable).
    const execIdem = `payout-e2e-overdraw-exec-${ts}`;
    await request(app.getHttpServer())
      .post("/api/v1/admin/payouts/mark-executed")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ batchId, idempotencyKey: execIdem })
      .expect(409);

    // Ensure no PAYOUT journal entries were created for this batch.
    const payouts = await prisma.journalEntry.findMany({
      where: {
        type: JournalEntryType.PAYOUT,
        foId: fo1,
        idempotencyKey: { startsWith: `ledger:payout:${batchId}:` },
      },
    });
    expect(payouts.length).toBe(0);

    // Batch should still not be executed.
    const batch = await prisma.payoutBatch.findUnique({ where: { id: batchId } });
    expect(batch).toBeTruthy();
    expect(batch!.status).toBe("draft");
  });

  it("preview returns gross and eligible; lock uses eligible only (fo1 eligible, fo2 not)", async () => {
    const ts = Date.now();
    const fo1 = "fo-e2e-elig-1";
    const fo2 = "fo-e2e-elig-2";
    const bookingA = `e2e-elig-bookingA-${ts}`;
    const bookingB = `e2e-elig-bookingB-${ts}`;

    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: bookingA,
      foId: fo1,
      idempotencyKey: `ledger:charge:${bookingA}:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 4000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 4000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.SETTLEMENT,
      bookingId: bookingA,
      idempotencyKey: `ledger:settlement:${bookingA}:${ts}`,
      lines: [
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.DEBIT, amountCents: 4000 },
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.CREDIT, amountCents: 4000 },
      ],
    });

    await ledger.postEntry({
      type: JournalEntryType.CHARGE,
      bookingId: bookingB,
      foId: fo2,
      idempotencyKey: `ledger:charge:${bookingB}:${ts}`,
      lines: [
        { account: LedgerAccount.AR_CUSTOMER, direction: LineDirection.DEBIT, amountCents: 2000 },
        { account: LedgerAccount.LIAB_FO_PAYABLE, direction: LineDirection.CREDIT, amountCents: 2000 },
      ],
    });
    await ledger.postEntry({
      type: JournalEntryType.REFUND,
      bookingId: bookingB,
      idempotencyKey: `ledger:refund:${bookingB}:${ts}`,
      lines: [
        { account: LedgerAccount.REV_PLATFORM, direction: LineDirection.DEBIT, amountCents: 2000 },
        { account: LedgerAccount.CASH_STRIPE, direction: LineDirection.CREDIT, amountCents: 2000 },
      ],
    });

    const asOf = new Date(Date.now() + 60_000).toISOString();
    const previewRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/payouts/preview?asOf=${encodeURIComponent(asOf)}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(previewRes.body.gross).toBeDefined();
    expect(previewRes.body.eligible).toBeDefined();
    expect(previewRes.body.gross.totalCents).toBe(6000);
    expect(previewRes.body.eligible.totalCents).toBe(4000);
    expect(previewRes.body.eligible.lines.length).toBe(1);
    expect(previewRes.body.eligible.lines[0].foId).toBe(fo1);
    expect(previewRes.body.eligible.lines[0].amountCents).toBe(4000);

    const lockIdem = `payout-e2e-elig-lock-${ts}`;
    const lockRes = await request(app.getHttpServer())
      .post("/api/v1/admin/payouts/lock")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ idempotencyKey: lockIdem, asOf })
      .expect(201);
    expect(lockRes.body.batch.status).toBe("draft");
    expect(lockRes.body.lines.length).toBe(1);
    expect(lockRes.body.lines[0].foId).toBe(fo1);
    expect(lockRes.body.lines[0].amountCents).toBe(4000);

    const execIdem = `payout-e2e-elig-exec-${ts}`;
    await request(app.getHttpServer())
      .post("/api/v1/admin/payouts/mark-executed")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ batchId: lockRes.body.batch.id, idempotencyKey: execIdem })
      .expect(201);

    const payouts = await prisma.journalEntry.findMany({
      where: { type: JournalEntryType.PAYOUT, foId: { in: [fo1, fo2] }, idempotencyKey: { startsWith: `ledger:payout:${lockRes.body.batch.id}:` } },
    });
    expect(payouts.length).toBe(1);
    expect(payouts[0].foId).toBe(fo1);
  });
});
