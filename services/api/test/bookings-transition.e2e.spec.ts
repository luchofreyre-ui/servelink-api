import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import {
  BookingEventType,
  BookingPaymentStatus,
  BookingStatus,
  FoStatus,
  JournalEntryType,
  LedgerAccount,
  LineDirection,
  Role,
} from "@prisma/client";
import { seedBookingPaymentAuthorized } from "./helpers/booking-payment-test-helpers";

jest.setTimeout(15000);

jest.mock("stripe", () => {
  let n = 0;
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockImplementation(() => {
          n += 1;
          const u = `${Date.now()}_${n}_${Math.random().toString(36).slice(2, 11)}`;
          return Promise.resolve({
            id: `cs_test_mock_${u}`,
            url: `https://checkout.stripe.com/c/pay/cs_test_mock_${u}`,
            payment_intent: `pi_test_mock_${u}`,
            customer: null,
          });
        }),
      },
    },
    webhooks: {
      constructEvent: jest.fn((payload: Buffer) => JSON.parse(payload.toString())),
    },
  }));
});

const FO_ID = `fo-trans-${Date.now()}`;

describe("Booking transitions (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;
  let customerId: string;

  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY =
      process.env.STRIPE_SECRET_KEY || "sk_test_bookings_transition_e2e";

    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const customerEmail = `cust_trans_${Date.now()}@servelink.local`;
    const customer = await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });
    customerId = customer.id;

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);
    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `admin_trans_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });
    const adminLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = adminLoginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();

    const foUser = await prisma.user.create({
      data: { email: `fo_trans_${Date.now()}@servelink.local`, passwordHash, role: "fo" },
    });
    await prisma.franchiseOwner.upsert({
      where: { id: FO_ID },
      update: {
        userId: foUser.id,
        status: "active",
        safetyHold: false,
        teamSize: 2,
        maxSquareFootage: 2600,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36.15398,
        homeLng: -95.99277,
        maxTravelMinutes: 60,
      },
      create: {
        id: FO_ID,
        userId: foUser.id,
        status: "active",
        safetyHold: false,
        teamSize: 2,
        maxSquareFootage: 2600,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36.15398,
        homeLng: -95.99277,
        maxTravelMinutes: 60,
        displayName: "Transition FO",
        foSchedules: {
          create: {
            dayOfWeek: 1,
            startTime: "07:00",
            endTime: "19:00",
          },
        },
      },
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

  it("repairs FO provider link idempotently when providerId is nulled", async () => {
    const repairUser = await prisma.user.create({
      data: {
        email: `fo_repair_${Date.now()}@servelink.local`,
        passwordHash: "hash",
        role: "fo",
      },
    });
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: repairUser.id,
        status: "active",
        displayName: "Repair Target",
        safetyHold: false,
        teamSize: 2,
        maxSquareFootage: 2600,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36.21,
        homeLng: -95.21,
        maxTravelMinutes: 60,
        foSchedules: {
          create: {
            dayOfWeek: 1,
            startTime: "07:00",
            endTime: "19:00",
          },
        },
      },
    });

    const initial = await prisma.franchiseOwner.findUnique({
      where: { id: fo.id },
      include: { provider: true },
    });
    expect(initial?.providerId).toBeTruthy();
    expect(initial?.provider).toBeTruthy();

    await prisma.franchiseOwner.update({
      where: { id: fo.id },
      data: { providerId: null },
    });

    const repaired = await prisma.franchiseOwner.findUnique({
      where: { id: fo.id },
      include: { provider: true },
    });
    expect(repaired?.providerId).toBeTruthy();
    expect(repaired?.provider).toBeTruthy();
    expect(repaired?.provider?.userId).toBe(fo.userId);

    const providerIdAfterFirstRepair = repaired?.providerId;

    await prisma.franchiseOwner.update({
      where: { id: fo.id },
      data: { providerId: null },
    });

    const repairedAgain = await prisma.franchiseOwner.findUnique({
      where: { id: fo.id },
      include: { provider: true },
    });
    expect(repairedAgain?.providerId).toBeTruthy();
    expect(repairedAgain?.providerId).toBe(providerIdAfterFirstRepair);
    expect(repairedAgain?.provider?.userId).toBe(fo.userId);
  });

  it("replay schedule with same idempotency-key does not create duplicate event", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_trans_" } },
    });
    expect(customer).toBeTruthy();

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: BookingStatus.pending_payment,
      },
    });

    await seedBookingPaymentAuthorized(prisma, booking.id);

    const idemKey = `idem-replay-${Date.now()}`;

    const res1 = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", idemKey)
      .send({ note: "First schedule" });

    const res2 = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", idemKey)
      .send({ note: "Replay schedule" });

    expect(res1.status).toBeGreaterThanOrEqual(200);
    expect(res1.status).toBeLessThan(300);
    expect(res2.status).toBeGreaterThanOrEqual(200);
    expect(res2.status).toBeLessThan(300);

    expect(res1.body?.status).toBe(BookingStatus.pending_dispatch);
    expect(res2.body?.status).toBe(BookingStatus.pending_dispatch);
    expect(res2.body?.alreadyApplied).toBe(true);

    const final = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(final?.status).toBe(BookingStatus.pending_dispatch);

    const events = await prisma.bookingEvent.findMany({
      where: {
        bookingId: booking.id,
        type: BookingEventType.STATUS_CHANGED,
        fromStatus: BookingStatus.pending_payment,
        toStatus: BookingStatus.pending_dispatch,
      },
    });
    expect(events.length).toBe(1);
  });

  it("concurrent schedule with same idempotency-key produces single event", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_trans_" } },
    });
    expect(customer).toBeTruthy();

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: BookingStatus.pending_payment,
      },
    });

    await seedBookingPaymentAuthorized(prisma, booking.id);

    const idemKey = `idem-concurrent-${Date.now()}`;

    const scheduleReq = () =>
      request(app.getHttpServer())
        .post(`/api/v1/bookings/${booking.id}/schedule`)
        .set("Authorization", `Bearer ${customerToken}`)
        .set("idempotency-key", idemKey)
        .send({ note: "E2E concurrent idem" });

    const [res1, res2] = await Promise.all([scheduleReq(), scheduleReq()]);

    const successCount = [res1.status, res2.status].filter((s) => s === 200 || s === 201).length;
    expect(successCount).toBe(2);

    const final = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(final?.status).toBe(BookingStatus.pending_dispatch);

    const events = await prisma.bookingEvent.findMany({
      where: {
        bookingId: booking.id,
        type: BookingEventType.STATUS_CHANGED,
        fromStatus: BookingStatus.pending_payment,
        toStatus: BookingStatus.pending_dispatch,
      },
    });
    expect(events.length).toBe(1);
  });

  it("concurrent schedule transition: one applies, other gets alreadyApplied or CONFLICT; single event", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_trans_" } },
    });
    expect(customer).toBeTruthy();

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: BookingStatus.pending_payment,
      },
    });

    await seedBookingPaymentAuthorized(prisma, booking.id);

    const scheduleReq = () =>
      request(app.getHttpServer())
        .post(`/api/v1/bookings/${booking.id}/schedule`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ note: "E2E schedule" });

    const [res1, res2] = await Promise.all([
      scheduleReq(),
      scheduleReq(),
    ]);

    const status1 = res1.status;
    const status2 = res2.status;
    const body1 = res1.body;
    const body2 = res2.body;

    const successCount = [status1, status2].filter((s) => s === 200 || s === 201).length;
    const conflictCount = [status1, status2].filter((s) => s === 409).length;
    expect(successCount + conflictCount).toBe(2);
    expect(successCount).toBeGreaterThanOrEqual(1);

    const firstSuccess = status1 === 200 || status1 === 201 ? body1 : body2;
    const secondSuccess = status1 === 200 || status1 === 201 ? body2 : body1;
    const appliedBody = firstSuccess?.alreadyApplied !== true ? firstSuccess : secondSuccess?.alreadyApplied !== true ? secondSuccess : null;
    expect(appliedBody).toBeTruthy();
    expect(appliedBody.status).toBe(BookingStatus.pending_dispatch);

    if (successCount === 2) {
      const otherBody = appliedBody === body1 ? body2 : body1;
      expect(otherBody?.alreadyApplied).toBe(true);
      expect(otherBody?.status).toBe(BookingStatus.pending_dispatch);
    } else {
      expect(conflictCount).toBe(1);
      const conflictBody = status1 === 409 ? body1 : body2;
      expect(conflictBody?.message ?? conflictBody?.code).toBeTruthy();
    }

    const final = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(final?.status).toBe(BookingStatus.pending_dispatch);

    const events = await prisma.bookingEvent.findMany({
      where: {
        bookingId: booking.id,
        type: BookingEventType.STATUS_CHANGED,
        fromStatus: BookingStatus.pending_payment,
        toStatus: BookingStatus.pending_dispatch,
      },
    });
    expect(events.length).toBe(1);
  });

  it("assign transition is idempotent", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_trans_" } },
    });
    expect(customer).toBeTruthy();

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: BookingStatus.pending_payment,
      },
    });

    await seedBookingPaymentAuthorized(prisma, booking.id);

    const scheduleIdem = `idem-assign-schedule-${Date.now()}`;
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", scheduleIdem)
      .send({ note: "Schedule for assign idem test" })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const assignIdem = "assignIdem";
    const assign1 = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", assignIdem)
      .send({ foId: FO_ID, note: "First assign" });

    const assign2 = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", assignIdem)
      .send({ foId: FO_ID, note: "Replay assign" });

    expect(assign1.status).toBeGreaterThanOrEqual(200);
    expect(assign1.status).toBeLessThan(300);
    expect(assign2.status).toBeGreaterThanOrEqual(200);
    expect(assign2.status).toBeLessThan(300);
    expect(assign1.body?.status).toBe(BookingStatus.assigned);
    expect(assign2.body?.status).toBe(BookingStatus.assigned);
    expect(assign2.body?.alreadyApplied).toBe(true);

    const final = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(final?.status).toBe(BookingStatus.assigned);

    const assignEvents = await prisma.bookingEvent.findMany({
      where: {
        bookingId: booking.id,
        type: {
          in: [
            BookingEventType.STATUS_CHANGED,
            BookingEventType.BOOKING_ASSIGNED,
          ],
        },
        fromStatus: BookingStatus.pending_dispatch,
        toStatus: BookingStatus.assigned,
      },
    });
    expect(assignEvents.length).toBe(1);
  });

  it("blocks rescheduling once a booking is in_progress", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_trans_" } },
    });
    expect(customer).toBeTruthy();

    const originalScheduledStart = new Date(
      Date.now() + 12 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const attemptedReschedule = new Date(
      Date.now() + 13 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: BookingStatus.pending_payment,
      },
    });

    await seedBookingPaymentAuthorized(prisma, booking.id);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", `sched-in-progress-${Date.now()}`)
      .send({
        note: "Initial schedule before start",
        scheduledStart: originalScheduledStart,
      })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", `assign-in-progress-${Date.now()}`)
      .send({ foId: FO_ID, note: "Assign before start" })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", `start-in-progress-${Date.now()}`)
      .send({ note: "Start booking" })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Attempt reschedule after start",
        scheduledStart: attemptedReschedule,
      });

    expect(res.status).toBe(409);
    expect(String(res.body?.code ?? "")).toBe("INVALID_TRANSITION");

    const refreshed = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    expect(refreshed?.status).toBe(BookingStatus.in_progress);
    expect(
      Math.floor(new Date(String(refreshed?.scheduledStart)).getTime() / 1000),
    ).toBe(Math.floor(new Date(originalScheduledStart).getTime() / 1000));
  });

  it("blocks reassigning once a booking is in_progress", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_trans_" } },
    });
    expect(customer).toBeTruthy();

    const scheduledStart = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: BookingStatus.pending_payment,
      },
    });

    await seedBookingPaymentAuthorized(prisma, booking.id);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", `sched-reassign-in-progress-${Date.now()}`)
      .send({
        note: "Initial schedule before reassignment block test",
        scheduledStart,
      })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", `assign-fo1-in-progress-${Date.now()}`)
      .send({ foId: FO_ID, note: "Assign FO before start" })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const fo2 = await prisma.franchiseOwner.create({
      data: {
        user: {
          create: {
            email: `fo_reassign_block_${Date.now()}@example.com`,
            passwordHash: "hash",
            role: Role.fo,
          },
        },
        status: FoStatus.active,
        safetyHold: false,
        teamSize: 2,
        maxSquareFootage: 2600,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36.154,
        homeLng: -95.993,
        maxTravelMinutes: 60,
        reliabilityScore: 80,
        displayName: "Reassign block FO",
        foSchedules: {
          create: {
            dayOfWeek: 1,
            startTime: "07:00",
            endTime: "19:00",
          },
        },
      },
    });

    const fo2WithProvider = await prisma.franchiseOwner.findUnique({
      where: { id: fo2.id },
      include: { provider: true },
    });
    expect(fo2WithProvider).toBeTruthy();
    expect(fo2WithProvider?.providerId).toBeTruthy();
    expect(fo2WithProvider?.provider).toBeTruthy();
    expect(fo2WithProvider?.provider?.userId).toBe(fo2.userId);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", `start-reassign-in-progress-${Date.now()}`)
      .send({ note: "Start booking before reassignment attempt" })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        foId: fo2.id,
        note: "Attempt reassignment after booking started",
      });

    expect(res.status).toBe(409);
    expect(String(res.body?.code ?? "")).toBe("INVALID_TRANSITION");

    const refreshed = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    expect(refreshed).toBeTruthy();
    expect(refreshed?.status).toBe(BookingStatus.in_progress);
    expect(refreshed?.foId).toBe(FO_ID);
  });

  it("complete transition posts REVENUE_RECOGNITION and replay is idempotent", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_trans_" } },
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

    await seedBookingPaymentAuthorized(prisma, booking.id);

    // Create ended billing session and finalize to post CHARGE (with LIAB_DEFERRED_REVENUE)
    await prisma.billingSession.create({
      data: {
        bookingId: booking.id,
        foId: FO_ID,
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
        durationSec: 3600,
        billableMin: 60,
        billableCents: 6500,
      },
    });

    const finalizeIdem = `e2e-revrec-finalize-${Date.now()}`;
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/billing/finalize`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ idempotencyKey: finalizeIdem })
      .expect(201);

    const scheduleIdem = `e2e-revrec-schedule-${Date.now()}`;
    const scheduleRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", scheduleIdem)
      .send({ note: "Schedule for rev-rec test" });
    expect(scheduleRes.status).toBeGreaterThanOrEqual(200);
    expect(scheduleRes.status).toBeLessThan(300);
    expect(scheduleRes.body?.status).toBe(BookingStatus.pending_dispatch);

    const assignRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "assignIdem")
      .send({ foId: FO_ID, note: "Assign for rev-rec test" });
    expect(assignRes.status).toBeGreaterThanOrEqual(200);
    expect(assignRes.status).toBeLessThan(300);
    expect(assignRes.body?.status).toBe(BookingStatus.assigned);

    const startIdem = `e2e-revrec-start-${Date.now()}`;
    const startRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/start`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", startIdem)
      .send({ note: "Start for rev-rec test" });
    expect(startRes.status).toBeGreaterThanOrEqual(200);
    expect(startRes.status).toBeLessThan(300);
    expect(startRes.body?.status).toBe(BookingStatus.in_progress);

    const completeIdem = `e2e-revrec-complete-${Date.now()}`;

    const res1 = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", completeIdem)
      .send({ note: "Complete for rev-rec" });

    expect(res1.status).toBeGreaterThanOrEqual(200);
    expect(res1.status).toBeLessThan(300);
    expect(res1.body?.status).toBe(BookingStatus.completed);

    const revRecEntries = await prisma.journalEntry.findMany({
      where: { bookingId: booking.id, type: JournalEntryType.REVENUE_RECOGNITION },
      include: { lines: true },
    });
    expect(revRecEntries.length).toBe(1);

    const entry = revRecEntries[0]!;
    expect(entry.lines).toHaveLength(2);

    const drDeferred = entry.lines.find(
      (l) => l.account === LedgerAccount.LIAB_DEFERRED_REVENUE && l.direction === LineDirection.DEBIT,
    );
    const crRev = entry.lines.find(
      (l) => l.account === LedgerAccount.REV_PLATFORM && l.direction === LineDirection.CREDIT,
    );
    expect(drDeferred).toBeTruthy();
    expect(crRev).toBeTruthy();
    expect(drDeferred!.amountCents).toBe(crRev!.amountCents);

    // Replay complete with same idempotency-key
    const res2 = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/complete`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", completeIdem)
      .send({ note: "Replay complete" });

    expect(res2.status).toBeGreaterThanOrEqual(200);
    expect(res2.status).toBeLessThan(300);

    const revRecEntriesAfter = await prisma.journalEntry.findMany({
      where: { bookingId: booking.id, type: JournalEntryType.REVENUE_RECOGNITION },
    });
    expect(revRecEntriesAfter.length).toBe(1);
  });

  it("completed → reopen → completed results in single net revenue recognition", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_trans_" } },
    });
    expect(customer).toBeTruthy();

    const bookingRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({})
      .expect(201);

    const bookingId = bookingRes.body.booking?.id ?? bookingRes.body.id;
    expect(bookingId).toBeTruthy();

    await prisma.booking.update({
      where: { id: bookingId },
      data: { hourlyRateCents: 6500, estimatedHours: 1, currency: "usd" },
    });

    await prisma.billingSession.create({
      data: {
        bookingId,
        foId: FO_ID,
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
        durationSec: 3600,
        billableMin: 60,
        billableCents: 6500,
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/billing/finalize`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ idempotencyKey: `e2e-reopen-finalize-${Date.now()}` })
      .expect(201);

    await seedBookingPaymentAuthorized(prisma, bookingId);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "sched-1")
      .send()
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "assign-1")
      .send({ foId: FO_ID })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "start-1")
      .send()
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "complete-1")
      .send()
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/reopen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "reopen-1")
      .send()
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("idempotency-key", "complete-2")
      .send()
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const snap = await request(app.getHttpServer())
      .get(`/api/v1/admin/ledger/bookings/${bookingId}/snapshot?currency=usd`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(snap.body.totals.deferredPlatformCents).toBe(0);
    expect(snap.body.totals.earnedPlatformCents).toBeGreaterThan(0);
  });

  it("create-checkout returns Stripe session and updates booking payment fields", async () => {
    const booking = await prisma.booking.create({
      data: {
        customerId,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: BookingStatus.pending_payment,
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/create-checkout`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        successUrl: "http://127.0.0.1:3000/customer/bookings/{CHECKOUT_SESSION_ID}",
        cancelUrl: "http://127.0.0.1:3000/customer/bookings/canceled",
      });

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body?.ok).toBe(true);
    expect(res.body?.item?.provider).toBe("stripe");
    expect(String(res.body?.item?.checkoutUrl ?? "")).toContain("checkout.stripe.com");
    expect(String(res.body?.item?.reference ?? "")).toMatch(/^cs_/);

    const row = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(row?.paymentStatus).toBe(BookingPaymentStatus.checkout_created);
    expect(row?.paymentProvider).toBe("stripe");
    expect(row?.paymentReference).toBeTruthy();

    const payEvents = await prisma.bookingEvent.findMany({
      where: {
        bookingId: booking.id,
        type: BookingEventType.PAYMENT_CHECKOUT_CREATED,
      },
    });
    expect(payEvents.length).toBe(1);
  });

  it("rejects schedule from pending_payment when payment is unpaid", async () => {
    const booking = await prisma.booking.create({
      data: {
        customerId,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: BookingStatus.pending_payment,
        paymentStatus: BookingPaymentStatus.unpaid,
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Should fail without payment" });

    expect(res.status).toBe(400);
    expect(String(res.body?.message ?? "")).toContain(
      "Booking cannot be confirmed until payment is authorized, paid, or waived",
    );
  });

  it("allows schedule when payment is authorized via admin payment-status", async () => {
    const booking = await prisma.booking.create({
      data: {
        customerId,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: BookingStatus.pending_payment,
        paymentStatus: BookingPaymentStatus.unpaid,
      },
    });

    const payRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/payment-status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nextStatus: BookingPaymentStatus.authorized,
        note: "E2E authorize for schedule",
      });

    expect(payRes.status).toBeGreaterThanOrEqual(200);
    expect(payRes.status).toBeLessThan(300);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "After payment authorized" });

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body?.status).toBe(BookingStatus.pending_dispatch);
  });
});
