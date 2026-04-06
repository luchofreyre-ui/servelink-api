import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { BookingStatus, BookingEventType } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(30000);

describe("Assignment recommendations + assign-recommended (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let customerId: string;
  let foHeavyId: string;
  let foLightId: string;
  let bookingId: string;

  const scheduledDay = new Date(Date.UTC(2030, 5, 15, 14, 0, 0, 0));

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const adminEmail = `admin_assign_rec_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = adminLoginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();

    const customer = await prisma.user.create({
      data: {
        email: `cust_assign_rec_${Date.now()}@servelink.local`,
        passwordHash,
        role: "customer",
      },
    });
    customerId = customer.id;

    const foUserHeavy = await prisma.user.create({
      data: {
        email: `fo_heavy_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });
    const foUserLight = await prisma.user.create({
      data: {
        email: `fo_light_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });

    const foHeavy = await prisma.franchiseOwner.create({
      data: {
        userId: foUserHeavy.id,
        status: "active",
        safetyHold: false,
        displayName: "Heavy Load FO",
        homeLat: 36.15,
        homeLng: -95.99,
      },
    });
    const foLight = await prisma.franchiseOwner.create({
      data: {
        userId: foUserLight.id,
        status: "active",
        safetyHold: false,
        displayName: "Light Load FO",
        homeLat: 36.16,
        homeLng: -95.99,
      },
    });
    foHeavyId = foHeavy.id;
    foLightId = foLight.id;

    for (let i = 0; i < 3; i += 1) {
      await prisma.booking.create({
        data: {
          customerId,
          status: BookingStatus.assigned,
          hourlyRateCents: 5000,
          estimatedHours: 2,
          foId: foHeavyId,
          scheduledStart: new Date(scheduledDay.getTime() + i * 86400000),
        },
      });
    }

    const target = await prisma.booking.create({
      data: {
        customerId,
        status: BookingStatus.pending_dispatch,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        scheduledStart: scheduledDay,
        siteLat: 36.152,
        siteLng: -95.991,
      },
    });
    bookingId = target.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET assignment-recommendations returns deterministic ordering (light FO before heavy)", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/assignment-recommendations`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body?.ok).toBe(true);
    const items = res.body?.items as Array<{
      rank: number;
      candidate: { foId: string; finalRecommendationScore: number };
    }>;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < items.length - 1; i += 1) {
      const a = items[i].candidate.finalRecommendationScore;
      const b = items[i + 1].candidate.finalRecommendationScore;
      if (a !== b) {
        expect(a).toBeGreaterThan(b);
      } else {
        expect(
          String(items[i].candidate.foId).localeCompare(
            String(items[i + 1].candidate.foId),
          ),
        ).toBeLessThan(0);
      }
    }

    const light = items.find((x) => x.candidate.foId === foLightId);
    const heavy = items.find((x) => x.candidate.foId === foHeavyId);
    expect(light).toBeTruthy();
    expect(heavy).toBeTruthy();
    expect(light!.rank).toBeLessThan(heavy!.rank);
  });

  it("POST assign-recommended assigns top candidate and writes BOOKING_ASSIGNED event", async () => {
    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/assignment-recommendations`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const topFoId = (listRes.body?.items as Array<{ candidate: { foId: string } }>)[0]
      ?.candidate?.foId;
    expect(topFoId).toBeTruthy();

    const res = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/assign-recommended`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    expect(res.body?.foId).toBe(topFoId);
    expect(res.body?.status).toBe(BookingStatus.assigned);

    const events = await prisma.bookingEvent.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
    });
    const assignedMeta = events.find((e) => e.type === BookingEventType.BOOKING_ASSIGNED);
    expect(assignedMeta).toBeTruthy();
    const parsed = JSON.parse(assignedMeta?.note ?? "{}") as {
      kind?: string;
      assignmentSource?: string;
    };
    expect(parsed.kind).toBe("booking_assigned");
    expect(parsed.assignmentSource).toBe("recommended");
  });
});
