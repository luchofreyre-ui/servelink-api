import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import {
  BookingPaymentStatus,
  BookingStatus,
} from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import { seedBookingPaymentAuthorized } from "./helpers/booking-payment-test-helpers";

jest.setTimeout(25000);

describe("Scheduling wall-clock invariants (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let bookings: BookingsService;
  let customerToken: string;
  let customerId: string;
  let fo1Id: string;

  const wallMinutes = 184;
  const laborHours = 12.07;
  const t0 = new Date("2035-06-04T19:00:00.000Z");

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    bookings = app.get(BookingsService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const customerEmail = `cust_wall_inv_${Date.now()}@servelink.local`;
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

    const foUser = await prisma.user.create({
      data: {
        email: `fo_wall_inv_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });

    const fo1 = await prisma.franchiseOwner.create({
      data: {
        userId: foUser.id,
        status: "active",
        safetyHold: false,
        teamSize: 4,
        minCrewSize: 2,
        preferredCrewSize: 2,
        maxCrewSize: 6,
        maxSquareFootage: 3200,
        maxLaborMinutes: 720,
        maxDailyLaborMinutes: 720,
        homeLat: 36.15398,
        homeLng: -95.99277,
        maxTravelMinutes: 60,
        reliabilityScore: 95,
        displayName: "Wall Inv FO",
        photoUrl: "https://example.com/w.jpg",
        bio: "E2E wall clock",
        yearsExperience: 5,
        completedJobsCount: 50,
        foSchedules: {
          create: {
            dayOfWeek: 2,
            startTime: "07:00",
            endTime: "23:00",
          },
        },
      },
    });

    fo1Id = fo1.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const rows = await prisma.booking.findMany({
      where: { customerId },
      select: { id: true },
    });
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return;
    await prisma.bookingSlotHold.deleteMany({ where: { bookingId: { in: ids } } });
    await prisma.bookingEvent.deleteMany({ where: { bookingId: { in: ids } } });
    await prisma.booking.deleteMany({ where: { id: { in: ids } } });
  });

  async function createBookingShell() {
    const res = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "wall-clock invariant e2e",
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
    return res.body.booking as { id: string; estimatedHours: number };
  }

  async function seedAssignedBookingA() {
    const snap = {
      estimatedDurationMinutes: wallMinutes,
      adjustedLaborMinutes: 724,
      effectiveTeamSize: 4,
      estimateMinutes: 724,
    };

    await prisma.booking.create({
      data: {
        customerId,
        hourlyRateCents: 5000,
        estimatedHours: laborHours,
        currency: "usd",
        status: BookingStatus.assigned,
        foId: fo1Id,
        scheduledStart: t0,
        paymentStatus: BookingPaymentStatus.authorized,
        paymentAuthorizedAt: new Date(),
        estimateSnapshot: {
          create: {
            estimatorVersion: "e2e_wall",
            mode: "STANDARD",
            confidence: 0.9,
            riskPercentUncapped: 0,
            riskPercentCappedForRange: 0,
            riskCapped: false,
            inputJson: "{}",
            outputJson: JSON.stringify(snap),
          },
        },
      },
    });
  }

  it("adjacent hold confirms for same FO (wall end touches next start)", async () => {
    await seedAssignedBookingA();

    const bookingB = await createBookingShell();
    await seedBookingPaymentAuthorized(prisma, bookingB.id);

    const tAdj = new Date(t0.getTime() + wallMinutes * 60 * 1000);
    const hold = await prisma.bookingSlotHold.create({
      data: {
        bookingId: bookingB.id,
        foId: fo1Id,
        startAt: tAdj,
        endAt: new Date(tAdj.getTime() + 90 * 60 * 1000),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const out = await bookings.confirmBookingFromHold({
      bookingId: bookingB.id,
      holdId: hold.id,
      idempotencyKey: `wall-adj-${Date.now()}`,
      useHoldElapsedDurationModel: true,
    });

    expect(out.status).toBe(BookingStatus.assigned);
    expect(out.foId).toBe(fo1Id);
    expect(new Date(out.scheduledStart!).getTime()).toBe(tAdj.getTime());

    const row = await prisma.booking.findUnique({
      where: { id: bookingB.id },
      include: { estimateSnapshot: true },
    });
    expect(row?.estimateSnapshot?.outputJson).toBeTruthy();
    const parsed = JSON.parse(row!.estimateSnapshot!.outputJson) as {
      estimatedDurationMinutes?: number;
    };
    const bWall = Math.floor(Number(parsed.estimatedDurationMinutes ?? 0));
    expect(bWall).toBeGreaterThan(0);

    const pub = await request(app.getHttpServer())
      .get(`/api/v1/public/bookings/${bookingB.id}/confirmation`)
      .expect(200);

    expect(pub.body?.kind).toBe("public_booking_confirmation");
    const laborPhantomEnd = new Date(
      new Date(out.scheduledStart!).getTime() +
        Number(row!.estimatedHours) * 60 * 60 * 1000,
    ).toISOString();
    expect(pub.body?.scheduledEnd).not.toBe(laborPhantomEnd);

    const expectedEnd = new Date(
      new Date(out.scheduledStart!).getTime() + bWall * 60 * 1000,
    ).toISOString();
    expect(pub.body?.scheduledEnd).toBe(expectedEnd);
  });

  it("overlapping hold is rejected (same FO, real overlap)", async () => {
    await seedAssignedBookingA();

    const bookingB = await createBookingShell();
    await seedBookingPaymentAuthorized(prisma, bookingB.id);

    const tOverlapStart = new Date(t0.getTime() + 60 * 60 * 1000);
    const hold = await prisma.bookingSlotHold.create({
      data: {
        bookingId: bookingB.id,
        foId: fo1Id,
        startAt: tOverlapStart,
        endAt: new Date(tOverlapStart.getTime() + 120 * 60 * 1000),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await expect(
      bookings.confirmBookingFromHold({
        bookingId: bookingB.id,
        holdId: hold.id,
        idempotencyKey: `wall-over-${Date.now()}`,
        useHoldElapsedDurationModel: true,
      }),
    ).rejects.toThrow(/FO_NOT_AVAILABLE_AT_SCHEDULED_TIME/);
  });
});
