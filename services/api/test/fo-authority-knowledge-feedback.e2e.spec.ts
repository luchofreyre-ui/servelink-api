import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { BookingStatus, Role } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(30000);

describe("FO authority knowledge feedback (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let foToken: string;
  let bookingId: string;
  const password = "test-password";

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();

    const foUser = await prisma.user.create({
      data: {
        email: `fo_kfb_${ts}@servelink.local`,
        passwordHash,
        role: Role.fo,
      },
    });
    await prisma.franchiseOwner.create({
      data: {
        userId: foUser.id,
        status: "active",
        safetyHold: false,
        teamSize: 1,
        maxSquareFootage: 2000,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36,
        homeLng: -96,
        maxTravelMinutes: 45,
        reliabilityScore: 90,
        displayName: "E2E",
        photoUrl: "https://example.com/p.jpg",
        bio: "b",
        yearsExperience: 1,
        completedJobsCount: 0,
      },
    });

    const cust = await prisma.user.create({
      data: {
        email: `cust_kfb_${ts}@servelink.local`,
        passwordHash,
        role: Role.customer,
      },
    });
    const foRow = await prisma.franchiseOwner.findUniqueOrThrow({
      where: { userId: foUser.id },
    });
    const booking = await prisma.booking.create({
      data: {
        customerId: cust.id,
        foId: foRow.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        status: BookingStatus.pending_payment,
      },
    });
    bookingId = booking.id;

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: foUser.email, password })
      .expect(201);
    foToken = login.body?.accessToken;
    expect(foToken).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { id: bookingId } }).catch(() => null);
    await app.close();
  });

  it("submits feedback for assigned booking", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/fo/authority/bookings/${bookingId}/knowledge-feedback`)
      .set("Authorization", `Bearer ${foToken}`)
      .send({
        helpful: true,
        selectedKnowledgePath: "/problems/grease-buildup",
        notes: "Quick check",
      })
      .expect(201);

    expect(res.body.kind).toBe("fo_authority_knowledge_feedback");
    expect(res.body.bookingId).toBe(bookingId);
    expect(res.body.helpful).toBe(true);
    expect(res.body.id).toBeTruthy();
  });

  it("blocks non-FO roles", async () => {
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        email: `adm_kfb_${Date.now()}@servelink.local`,
        passwordHash,
        role: Role.admin,
      },
    });
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: admin.email, password })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/fo/authority/bookings/${bookingId}/knowledge-feedback`)
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .send({ helpful: false })
      .expect(403);

    await prisma.user.delete({ where: { id: admin.id } });
  });
});
