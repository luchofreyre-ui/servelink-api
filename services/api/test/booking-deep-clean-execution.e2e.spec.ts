import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(30000);

const DEEP_BASE_INPUT = {
  property_type: "house",
  sqft_band: "1200_1599" as const,
  bedrooms: "3",
  bathrooms: "2",
  floors: "1",
  service_type: "deep_clean" as const,
  first_time_with_servelink: "no",
  last_professional_clean: "1_3_months",
  clutter_level: "light",
  kitchen_condition: "normal",
  bathroom_condition: "normal",
  pet_presence: "none",
  occupancy_state: "occupied_normal",
  floor_visibility: "mostly_clear",
  flooring_mix: "mostly_hard" as const,
  carpet_percent: "0_25" as const,
  stairs_flights: "one" as const,
  addons: [],
};

describe("Deep clean visit execution (E2E)", () => {
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

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const customerEmail = `cust_dc_exec_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });
    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);
    customerToken = customerLoginRes.body?.accessToken;

    const adminEmail = `admin_dc_exec_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });
    const adminLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = adminLoginRes.body?.accessToken;

    expect(customerToken).toBeTruthy();
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("Case 1 — non-deep-clean: start/complete reject; screen deepCleanExecution null", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E maintenance exec",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          service_type: "maintenance",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    const startRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);
    expect(startRes.body?.message ?? startRes.text).toMatch(/PROGRAM/i);

    const completeRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ actualDurationMinutes: 10, operatorNote: "x" })
      .expect(400);
    expect(completeRes.body?.message ?? completeRes.text).toMatch(/PROGRAM/i);

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(screenRes.body?.screen?.deepCleanExecution).toBeNull();
  });

  it("Case 2 — deep clean initial: execution rows, all not_started, programStatus not_started", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E deep phased exec",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "phased_3_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;
    const program = await prisma.bookingDeepCleanProgram.findUnique({
      where: { bookingId },
    });
    expect(program?.visitCount).toBe(3);

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const ex = screenRes.body?.screen?.deepCleanExecution;
    expect(ex).toBeTruthy();
    expect(ex.programStatus).toBe("not_started");
    expect(ex.totalVisits).toBe(3);
    expect(ex.completedVisits).toBe(0);
    expect(ex.visits).toHaveLength(3);
    expect(ex.visits.every((v: { status: string }) => v.status === "not_started")).toBe(
      true,
    );

    const rows = await prisma.bookingDeepCleanVisitExecution.findMany({
      where: { bookingId },
      orderBy: { visitNumber: "asc" },
    });
    expect(rows).toHaveLength(3);
  });

  it("Case 3 — start Visit 1: in_progress, startedAt, programStatus in_progress", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E start v1",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "phased_3_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const ex = screenRes.body?.screen?.deepCleanExecution;
    expect(ex.programStatus).toBe("in_progress");
    const v1 = ex.visits.find((v: { visitNumber: number }) => v.visitNumber === 1);
    expect(v1.status).toBe("in_progress");
    expect(v1.startedAt).toBeTruthy();
  });

  it("Case 4 — idempotent start: second start keeps in_progress", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E idem start",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "single_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    const rowAfterFirst = await prisma.bookingDeepCleanVisitExecution.findFirst({
      where: { bookingId, visitNumber: 1 },
    });
    expect(rowAfterFirst?.status).toBe("in_progress");

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    const rowAfterSecond = await prisma.bookingDeepCleanVisitExecution.findFirst({
      where: { bookingId, visitNumber: 1 },
    });
    expect(rowAfterSecond?.status).toBe("in_progress");
    expect(rowAfterSecond?.id).toBe(rowAfterFirst?.id);
  });

  it("Case 5 — complete with duration and note", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E complete",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "single_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    const completeRes = await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        actualDurationMinutes: 142,
        operatorNote: "Heavy soil in kitchen",
      })
      .expect(201);

    expect(completeRes.body?.execution?.status).toBe("completed");
    expect(completeRes.body?.execution?.actualDurationMinutes).toBe(142);
    expect(completeRes.body?.execution?.operatorNote).toBe("Heavy soil in kitchen");
    expect(completeRes.body?.execution?.completedAt).toBeTruthy();

    const row = await prisma.bookingDeepCleanVisitExecution.findFirst({
      where: { bookingId, visitNumber: 1 },
    });
    expect(row?.status).toBe("completed");
    expect(row?.actualDurationMinutes).toBe(142);
  });

  it("Case 6 — reject complete before start", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E reject complete",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "phased_3_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/2/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ actualDurationMinutes: 10 })
      .expect(400);
  });

  it("Case 7 — full completion: programStatus completed", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E full complete",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "phased_3_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    for (const n of [1, 2, 3]) {
      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/${n}/start`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/${n}/complete`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ actualDurationMinutes: 60 + n, operatorNote: `done ${n}` })
        .expect(201);
    }

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const ex = screenRes.body?.screen?.deepCleanExecution;
    expect(ex.programStatus).toBe("completed");
    expect(ex.completedVisits).toBe(3);
    expect(ex.totalVisits).toBe(3);
  });

  it("Case 8 — reload truth from DB", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E reload",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "single_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    const a = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const b = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(a.body.screen.deepCleanExecution.visits[0].status).toBe(
      "in_progress",
    );
    expect(b.body.screen.deepCleanExecution.visits[0].startedAt).toBe(
      a.body.screen.deepCleanExecution.visits[0].startedAt,
    );
  });
});
