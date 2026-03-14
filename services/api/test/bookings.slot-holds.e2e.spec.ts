import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { BookingStatus } from "@prisma/client";

jest.setTimeout(20000);

describe("Booking slot holds + confirm from hold (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let customerId: string;
  let fo1Id: string;
  let fo2Id: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const customerEmail = `cust_slot_hold_${Date.now()}@servelink.local`;
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

    const foUser1 = await prisma.user.create({
      data: {
        email: `fo_slot_hold_1_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });

    const foUser2 = await prisma.user.create({
      data: {
        email: `fo_slot_hold_2_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });

    const fo1 = await prisma.franchiseOwner.create({
      data: {
        userId: foUser1.id,
        status: "active",
        safetyHold: false,
        teamSize: 2,
        maxSquareFootage: 2600,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36.15398,
        homeLng: -95.99277,
        maxTravelMinutes: 60,
        reliabilityScore: 95,
        displayName: "Cleaner One",
        photoUrl: "https://example.com/cleaner-one.jpg",
        bio: "Fast and detail-oriented.",
        yearsExperience: 5,
        completedJobsCount: 120,
      },
    });

    const fo2 = await prisma.franchiseOwner.create({
      data: {
        userId: foUser2.id,
        status: "active",
        safetyHold: false,
        teamSize: 3,
        maxSquareFootage: 3200,
        maxLaborMinutes: 720,
        maxDailyLaborMinutes: 720,
        homeLat: 36.1612,
        homeLng: -95.9895,
        maxTravelMinutes: 60,
        reliabilityScore: 88,
        displayName: "Cleaner Two",
        photoUrl: "https://example.com/cleaner-two.jpg",
        bio: "Experienced with larger homes.",
        yearsExperience: 8,
        completedJobsCount: 240,
      },
    });

    fo1Id = fo1.id;
    fo2Id = fo2.id;
  });

  afterAll(async () => {
    await app.close();
  });

  function makeWindow(hoursFromNow: number, durationHours: number) {
    const start = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return {
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
  }

  async function createBookingShell() {
    const res = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "slot hold e2e booking",
        estimateInput: {
          property_type: "house",
          sqft_band: "1200_1599",
          bedrooms: "2",
          bathrooms: "2",
          floors: "1",
          service_type: "maintenance",
          first_time_with_servelink: "no",
          clutter_level: "light",
          kitchen_condition: "normal",
          bathroom_condition: "normal",
          pet_presence: "none",
          siteLat: 36.15398,
          siteLng: -95.99277,
        },
      })
      .expect(201);

    expect(res.body?.booking?.id).toBeTruthy();
    expect(Number(res.body?.booking?.estimatedHours ?? 0)).toBeGreaterThan(0);

    return res.body.booking;
  }

  it("creates hold and confirms booking from hold", async () => {
    const booking = await createBookingShell();
    const { startAt, endAt } = makeWindow(24, 4);

    const holdRes = await request(app.getHttpServer())
      .post("/api/v1/bookings/availability/holds")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId: booking.id,
        foId: fo1Id,
        startAt,
        endAt,
      })
      .expect(201);

    expect(holdRes.body?.id).toBeTruthy();
    expect(holdRes.body?.foId).toBe(fo1Id);

    const confirmRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/confirm-hold`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", `confirm-hold-${Date.now()}`)
      .send({
        holdId: holdRes.body.id,
        note: "confirm slot hold",
      })
      .expect(201);

    expect(confirmRes.body?.status).toBe(BookingStatus.assigned);
    expect(confirmRes.body?.foId).toBe(fo1Id);
    expect(new Date(confirmRes.body?.scheduledStart).toISOString()).toBe(startAt);

    const holdInDb = await prisma.bookingSlotHold.findUnique({
      where: { id: holdRes.body.id },
    });
    expect(holdInDb).toBeNull();

    const finalBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    expect(finalBooking?.status).toBe(BookingStatus.assigned);
    expect(finalBooking?.foId).toBe(fo1Id);

    const events = await prisma.bookingEvent.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: "asc" },
    });

    expect(events.some((e) => e.type === "CREATED")).toBe(true);
    expect(
      events.some(
        (e) =>
          e.type === "STATUS_CHANGED" &&
          e.fromStatus === BookingStatus.pending_payment &&
          e.toStatus === BookingStatus.assigned,
      ),
    ).toBe(true);
  });

  it("rejects an overlapping second hold for the same FO", async () => {
    const booking = await createBookingShell();
    const { startAt, endAt } = makeWindow(30, 4);

    const firstHold = await request(app.getHttpServer())
      .post("/api/v1/bookings/availability/holds")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId: booking.id,
        foId: fo1Id,
        startAt,
        endAt,
      })
      .expect(201);

    expect(firstHold.body?.id).toBeTruthy();

    const overlappingRes = await request(app.getHttpServer())
      .post("/api/v1/bookings/availability/holds")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId: booking.id,
        foId: fo1Id,
        startAt,
        endAt,
      });

    expect(overlappingRes.status).toBe(409);
    expect(
      JSON.stringify(overlappingRes.body),
    ).toContain("FO_SLOT_ALREADY_HELD");
  });

  it("rejects confirm when hold is expired", async () => {
    const booking = await createBookingShell();
    const { startAt, endAt } = makeWindow(36, 4);

    const hold = await prisma.bookingSlotHold.create({
      data: {
        bookingId: booking.id,
        foId: fo1Id,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        expiresAt: new Date(Date.now() - 60 * 1000),
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/confirm-hold`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        holdId: hold.id,
        note: "expired hold confirm attempt",
      });

    expect(res.status).toBe(409);
    expect(JSON.stringify(res.body)).toContain("BOOKING_SLOT_HOLD_EXPIRED");
  });

  it("confirm replay with same idempotency-key returns alreadyApplied", async () => {
    const booking = await createBookingShell();
    const { startAt, endAt } = makeWindow(42, 4);

    const holdRes = await request(app.getHttpServer())
      .post("/api/v1/bookings/availability/holds")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId: booking.id,
        foId: fo1Id,
        startAt,
        endAt,
      })
      .expect(201);

    const idem = `confirm-hold-replay-${Date.now()}`;

    const first = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/confirm-hold`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", idem)
      .send({
        holdId: holdRes.body.id,
        note: "first confirm replay test",
      });

    const replay = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/confirm-hold`)
      .set("Authorization", `Bearer ${customerToken}`)
      .set("idempotency-key", idem)
      .send({
        holdId: holdRes.body.id,
        note: "replay confirm replay test",
      });

    expect(first.status).toBeGreaterThanOrEqual(200);
    expect(first.status).toBeLessThan(300);
    expect(replay.status).toBeGreaterThanOrEqual(200);
    expect(replay.status).toBeLessThan(300);

    expect(first.body?.status).toBe(BookingStatus.assigned);
    expect(replay.body?.status).toBe(BookingStatus.assigned);
    expect(replay.body?.alreadyApplied).toBe(true);

    const events = await prisma.bookingEvent.findMany({
      where: {
        bookingId: booking.id,
        type: "STATUS_CHANGED",
        idempotencyKey: idem,
      },
    });

    expect(events.length).toBe(1);
  });

  it("rejects hold when an existing assigned booking already blocks that FO window", async () => {
    const booking = await createBookingShell();
    const { startAt, endAt } = makeWindow(48, 4);

    await prisma.booking.create({
      data: {
        customerId,
        hourlyRateCents: 5000,
        estimatedHours: 4,
        currency: "usd",
        status: BookingStatus.assigned,
        foId: fo1Id,
        scheduledStart: new Date(startAt),
      },
    });

    const res = await request(app.getHttpServer())
      .post("/api/v1/bookings/availability/holds")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId: booking.id,
        foId: fo1Id,
        startAt,
        endAt,
      });

    expect(res.status).toBe(409);
    expect(
      JSON.stringify(res.body),
    ).toContain("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME");
  });

  it("availability windows exclude active holds and existing bookings", async () => {
    const booking = await createBookingShell();
    const { startAt, endAt } = makeWindow(54, 4);

    await prisma.bookingSlotHold.create({
      data: {
        bookingId: booking.id,
        foId: fo2Id,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const rangeStart = new Date(new Date(startAt).getTime() - 60 * 60 * 1000).toISOString();
    const rangeEnd = new Date(new Date(endAt).getTime() + 60 * 60 * 1000).toISOString();

    const res = await request(app.getHttpServer())
      .get("/api/v1/bookings/availability/windows")
      .set("Authorization", `Bearer ${customerToken}`)
      .query({
        foId: fo2Id,
        rangeStart,
        rangeEnd,
        durationMinutes: 240,
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    const blockedStartMs = new Date(startAt).getTime();
    const exactBlockedWindow = res.body.find(
      (w: any) => new Date(w.startAt).getTime() === blockedStartMs,
    );

    expect(exactBlockedWindow).toBeUndefined();
  });
});
