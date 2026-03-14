import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(15000);

describe("Booking create + estimate + FO matching (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;
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

    const customerEmail = `cust_create_match_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `admin_create_match_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = adminLoginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();

    const foUser1 = await prisma.user.create({
      data: {
        email: `fo_create_match_1_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });

    const foUser2 = await prisma.user.create({
      data: {
        email: `fo_create_match_2_${Date.now()}@servelink.local`,
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

  it("creates booking, returns estimate.matchedCleaners, and stores immutable estimate snapshot", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E create booking with estimator and matching",
        estimateInput: {
          property_type: "house",
          sqft_band: "1200_1599",
          bedrooms: "3",
          bathrooms: "2",
          floors: "1",
          service_type: "maintenance",
          first_time_with_servelink: "yes",
          last_professional_clean: "1_3_months",
          clutter_level: "light",
          kitchen_condition: "normal",
          bathroom_condition: "normal",
          pet_presence: "none",
          addons: [],
          siteLat: 36.1540,
          siteLng: -95.9920,
        },
      })
      .expect(201);

    expect(res.body?.booking?.id).toBeTruthy();
    expect(res.body?.estimate).toBeTruthy();
    expect(res.body?.estimate?.matchedCleaners).toBeTruthy();
    expect(Array.isArray(res.body.estimate.matchedCleaners)).toBe(true);
    expect(res.body.estimate.matchedCleaners.length).toBeGreaterThan(0);
    expect(res.body.estimate.matchedCleaners.length).toBeLessThanOrEqual(2);

    const first = res.body.estimate.matchedCleaners[0];
    expect(first.id).toBeTruthy();
    expect(typeof first.travelMinutes).toBe("number");

    const bookingId = res.body.booking.id;

    const snapshot = await prisma.bookingEstimateSnapshot.findUnique({
      where: { bookingId },
    });

    expect(snapshot).toBeTruthy();
    expect(snapshot?.inputJson).toBeTruthy();
    expect(snapshot?.outputJson).toBeTruthy();

    const output = JSON.parse(String(snapshot?.outputJson ?? "{}"));
    expect(output.matchedCleaners).toBeTruthy();
    expect(Array.isArray(output.matchedCleaners)).toBe(true);
    expect(output.matchedCleaners.length).toBeGreaterThan(0);

    const refreshedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    expect(refreshedBooking).toBeTruthy();
    expect(Number(refreshedBooking?.estimatedHours ?? 0)).toBeGreaterThan(0);
  });

  it("starts dispatch and creates booking offers when a booking is scheduled into pending_dispatch", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E dispatch start on schedule",
        estimateInput: {
          property_type: "house",
          sqft_band: "1200_1599",
          bedrooms: "3",
          bathrooms: "2",
          floors: "1",
          service_type: "maintenance",
          first_time_with_servelink: "yes",
          last_professional_clean: "1_3_months",
          clutter_level: "light",
          kitchen_condition: "normal",
          bathroom_condition: "normal",
          pet_presence: "none",
          addons: [],
          siteLat: 36.1540,
          siteLng: -95.9920,
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id;
    expect(bookingId).toBeTruthy();

    const scheduledStart = new Date(
      Date.now() + 15 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const scheduleRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Schedule booking to trigger dispatch",
        scheduledStart,
      });

    expect(scheduleRes.status).toBeGreaterThanOrEqual(200);
    expect(scheduleRes.status).toBeLessThan(300);

    const refreshedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    expect(refreshedBooking).toBeTruthy();
    expect(refreshedBooking?.status).toBe("offered");

    const offers = await prisma.bookingOffer.findMany({
      where: { bookingId },
      orderBy: { rank: "asc" },
    });

    expect(offers.length).toBeGreaterThan(0);
    expect(offers.length).toBeLessThanOrEqual(2);
    expect(offers[0]?.status).toBe("offered");
    expect(offers[0]?.dispatchRound).toBe(1);
    expect(offers[0]?.rank).toBe(1);

    const snapshot = await prisma.bookingEstimateSnapshot.findUnique({
      where: { bookingId },
    });

    expect(snapshot).toBeTruthy();

    const output = JSON.parse(String(snapshot?.outputJson ?? "{}"));
    const matchedCleaners = Array.isArray(output.matchedCleaners)
      ? output.matchedCleaners
      : [];

    expect(matchedCleaners.length).toBeGreaterThan(0);

    const expectedFoIds = matchedCleaners.map((c: any) => c.id);
    const offerFoIds = offers.map((o) => o.foId);

    expect(offerFoIds).toEqual(expectedFoIds.slice(0, offers.length));

    const events = await prisma.bookingEvent.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
    });

    expect(events.some((e) => e.type === "DISPATCH_STARTED")).toBe(true);
    expect(events.some((e) => e.type === "OFFER_CREATED")).toBe(true);
  });

  it("blocks assigning the same FO to two bookings at the exact same scheduledStart", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_create_match_" } },
    });
    expect(customer).toBeTruthy();

    const scheduledStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const bookingA = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
      },
    });

    const bookingB = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule booking A", scheduledStart })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule booking B", scheduledStart })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign FO to booking A" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign FO to booking B" });

    expect(res.status).toBe(409);
    expect(
      String(res.body?.message ?? res.body?.error ?? ""),
    ).toContain("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME");

    const refreshedB = await prisma.booking.findUnique({
      where: { id: bookingB.id },
    });

    expect(refreshedB?.foId ?? null).toBeNull();
  });

  it("blocks assigning the same FO to overlapping bookings when start times differ", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_create_match_" } },
    });
    expect(customer).toBeTruthy();

    const base = Date.now() + 8 * 24 * 60 * 60 * 1000;
    const scheduledStartA = new Date(base).toISOString();
    const scheduledStartB = new Date(base + 60 * 60 * 1000).toISOString(); // starts 1 hour later
    // booking A is 3h, booking B is 2h => overlap from hour 1 to hour 3

    const bookingA = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 3,
        currency: "usd",
        status: "pending_payment",
      },
    });

    const bookingB = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule booking A overlap case", scheduledStart: scheduledStartA })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule booking B overlap case", scheduledStart: scheduledStartB })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign FO to booking A overlap case" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign FO to booking B overlap case" });

    expect(res.status).toBe(409);
    expect(
      String(res.body?.message ?? res.body?.error ?? ""),
    ).toContain("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME");

    const refreshedB = await prisma.booking.findUnique({
      where: { id: bookingB.id },
    });

    expect(refreshedB?.foId ?? null).toBeNull();
  });

  it("allows assigning the same FO to non-overlapping bookings", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_create_match_" } },
    });
    expect(customer).toBeTruthy();

    const base = Date.now() + 9 * 24 * 60 * 60 * 1000;
    const scheduledStartA = new Date(base).toISOString();
    const scheduledStartB = new Date(base + 2 * 60 * 60 * 1000).toISOString();
    // booking A is 1h, booking B starts 2h later => no overlap

    const bookingA = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
      },
    });

    const bookingB = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule booking A non-overlap case", scheduledStart: scheduledStartA })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule booking B non-overlap case", scheduledStart: scheduledStartB })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign FO to booking A non-overlap case" })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign FO to booking B non-overlap case" })
      .expect(201);

    const refreshedA = await prisma.booking.findUnique({
      where: { id: bookingA.id },
    });

    const refreshedB = await prisma.booking.findUnique({
      where: { id: bookingB.id },
    });

    expect(refreshedA?.foId).toBe(fo1Id);
    expect(refreshedB?.foId).toBe(fo1Id);
  });

  it("blocks rescheduling an assigned booking into overlap with another booking for the same FO", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_create_match_" } },
    });
    expect(customer).toBeTruthy();

    const base = Date.now() + 10 * 24 * 60 * 60 * 1000;
    const scheduledStartA = new Date(base).toISOString();
    const scheduledStartB = new Date(base + 3 * 60 * 60 * 1000).toISOString();
    const overlappingRescheduleB = new Date(base + 60 * 60 * 1000).toISOString();
    // booking A is 2h at T+0, booking B is 2h at T+3 => initially no overlap
    // rescheduling B to T+1 creates overlap from hour 1 to hour 2

    const bookingA = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
      },
    });

    const bookingB = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Schedule booking A reschedule-overlap case",
        scheduledStart: scheduledStartA,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Schedule booking B reschedule-overlap case",
        scheduledStart: scheduledStartB,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign FO to booking A reschedule-overlap case" })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign FO to booking B reschedule-overlap case" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Reschedule booking B into overlap",
        scheduledStart: overlappingRescheduleB,
      });

    expect(res.status).toBe(409);
    expect(
      String(res.body?.message ?? res.body?.error ?? ""),
    ).toContain("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME");

    const refreshedB = await prisma.booking.findUnique({
      where: { id: bookingB.id },
    });

    expect(refreshedB).toBeTruthy();
    expect(
      Math.floor(new Date(String(refreshedB?.scheduledStart)).getTime() / 1000),
    ).toBe(Math.floor(new Date(scheduledStartB).getTime() / 1000));
    expect(refreshedB?.foId).toBe(fo1Id);
  });

  it("allows rescheduling an assigned booking to a non-overlapping time", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_create_match_" } },
    });
    expect(customer).toBeTruthy();

    const base = Date.now() + 11 * 24 * 60 * 60 * 1000;
    const scheduledStartA = new Date(base).toISOString();
    const scheduledStartB = new Date(base + 4 * 60 * 60 * 1000).toISOString();
    const nonOverlappingRescheduleB = new Date(base + 2 * 60 * 60 * 1000).toISOString();
    // booking A is 2h at T+0, booking B is 2h at T+4 => initially no overlap
    // rescheduling B to T+2 is back-to-back and should still not overlap

    const bookingA = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
      },
    });

    const bookingB = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Schedule booking A reschedule-non-overlap case",
        scheduledStart: scheduledStartA,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Schedule booking B reschedule-non-overlap case",
        scheduledStart: scheduledStartB,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign FO to booking A reschedule-non-overlap case" })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign FO to booking B reschedule-non-overlap case" })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Reschedule booking B to non-overlapping time",
        scheduledStart: nonOverlappingRescheduleB,
      })
      .expect(201);

    const refreshedB = await prisma.booking.findUnique({
      where: { id: bookingB.id },
    });

    expect(refreshedB).toBeTruthy();
    expect(
      Math.floor(new Date(String(refreshedB?.scheduledStart)).getTime() / 1000),
    ).toBe(Math.floor(new Date(nonOverlappingRescheduleB).getTime() / 1000));
    expect(refreshedB?.foId).toBe(fo1Id);
  });

  it("allows reassigning an assigned booking to another available FO", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_create_match_" } },
    });
    expect(customer).toBeTruthy();

    const scheduledStart = new Date(
      Date.now() + 12 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const booking = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Schedule booking for reassignment-available case",
        scheduledStart,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Initial assign to FO1" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${booking.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo2Id, note: "Reassign to available FO2" });

    expect(res.status).toBe(201);
    expect(res.body?.status).toBe("assigned");
    expect(res.body?.foId).toBe(fo2Id);

    const refreshed = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    expect(refreshed).toBeTruthy();
    expect(refreshed?.status).toBe("assigned");
    expect(refreshed?.foId).toBe(fo2Id);
  });

  it("blocks reassigning an assigned booking to an overlapping FO", async () => {
    const customer = await prisma.user.findFirst({
      where: { email: { contains: "cust_create_match_" } },
    });
    expect(customer).toBeTruthy();

    const base = Date.now() + 13 * 24 * 60 * 60 * 1000;
    const scheduledStartA = new Date(base).toISOString();
    const scheduledStartB = new Date(base + 60 * 60 * 1000).toISOString();
    // booking A is 3h assigned to FO2
    // booking B is 2h initially assigned to FO1
    // reassigning booking B to FO2 should fail due to overlap

    const bookingA = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 3,
        currency: "usd",
        status: "pending_payment",
      },
    });

    const bookingB = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Schedule booking A for reassignment-overlap case",
        scheduledStart: scheduledStartA,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "Schedule booking B for reassignment-overlap case",
        scheduledStart: scheduledStartB,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingA.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo2Id, note: "Assign booking A to FO2" })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo1Id, note: "Assign booking B to FO1" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingB.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foId: fo2Id, note: "Attempt reassign booking B to overlapping FO2" });

    expect(res.status).toBe(409);
    expect(
      String(res.body?.message ?? res.body?.error ?? ""),
    ).toContain("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME");

    const refreshedB = await prisma.booking.findUnique({
      where: { id: bookingB.id },
    });

    expect(refreshedB).toBeTruthy();
    expect(refreshedB?.status).toBe("assigned");
    expect(refreshedB?.foId).toBe(fo1Id);
  });

  it("allows accepting a dispatch offer and assigns the booking", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E dispatch accept offer",
        estimateInput: {
          property_type: "house",
          sqft_band: "1200_1599",
          bedrooms: "3",
          bathrooms: "2",
          floors: "1",
          service_type: "maintenance",
          first_time_with_servelink: "yes",
          last_professional_clean: "1_3_months",
          clutter_level: "light",
          kitchen_condition: "normal",
          bathroom_condition: "normal",
          pet_presence: "none",
          addons: [],
          siteLat: 36.1540,
          siteLng: -95.9920,
        },
      })
      .expect(201);

    const bookingId = createRes.body.booking.id;

    const scheduledStart = new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000,
    ).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "schedule for dispatch",
        scheduledStart,
      })
      .expect((res) => {
        expect(res.status).toBeLessThan(300);
      });

    const offers = await prisma.bookingOffer.findMany({
      where: { bookingId },
      orderBy: { rank: "asc" },
    });

    expect(offers.length).toBeGreaterThan(0);

    const offerId = offers[0].id;

    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/offers/${offerId}/accept`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({})
      .expect(201);

    expect(acceptRes.body.ok).toBe(true);

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    expect(updatedBooking?.status).toBe("assigned");
    expect(updatedBooking?.foId).toBe(offers[0].foId);

    const updatedOffer = await prisma.bookingOffer.findUnique({
      where: { id: offerId },
    });

    expect(updatedOffer?.status).toBe("accepted");
  });
});
