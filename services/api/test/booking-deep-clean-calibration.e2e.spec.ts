import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(60000);

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

describe("Deep clean calibration (E2E)", () => {
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

    const customerEmail = `cust_dc_cal_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });
    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);
    customerToken = customerLoginRes.body?.accessToken;

    const adminEmail = `admin_dc_cal_${Date.now()}@servelink.local`;
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

  it("Case 1 — non-deep-clean: deepCleanCalibration is null", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E cal maintenance",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          service_type: "maintenance",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(screenRes.body?.screen?.deepCleanCalibration).toBeNull();
  });

  it("Case 2 — initial deep clean: estimates present, actual/variance null, not fully completed", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E cal initial",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "phased_3_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const cal = screenRes.body?.screen?.deepCleanCalibration;
    expect(cal).toBeTruthy();
    expect(cal.program.isFullyCompleted).toBe(false);
    expect(cal.program.completedVisits).toBe(0);
    expect(cal.program.totalVisits).toBe(3);
    expect(cal.program.estimatedTotalDurationMinutes).toBeGreaterThan(0);
    expect(cal.program.actualTotalDurationMinutes).toBeNull();
    expect(cal.program.durationVarianceMinutes).toBeNull();
    expect(cal.program.durationVariancePercent).toBeNull();
    expect(cal.program.hasAnyOperatorNotes).toBe(false);

    for (const v of cal.visits) {
      expect(v.estimatedDurationMinutes).toBeGreaterThan(0);
      expect(v.actualDurationMinutes).toBeNull();
      expect(v.durationVarianceMinutes).toBeNull();
      expect(v.durationVariancePercent).toBeNull();
      expect(v.executionStatus).toBe("not_started");
      expect(v.hasOperatorNote).toBe(false);
    }
  });

  it("Case 3 — complete one visit: actual, variance, hasAnyOperatorNotes, partial program actual", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E cal one visit",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "phased_3_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    const screen0 = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const est1 =
      screen0.body.screen.deepCleanCalibration.visits.find(
        (x: { visitNumber: number }) => x.visitNumber === 1,
      ).estimatedDurationMinutes;

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        actualDurationMinutes: 100,
        operatorNote: "ran long",
      })
      .expect(201);

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const cal = screenRes.body?.screen?.deepCleanCalibration;
    const v1 = cal.visits.find(
      (x: { visitNumber: number }) => x.visitNumber === 1,
    );
    expect(v1.actualDurationMinutes).toBe(100);
    expect(v1.durationVarianceMinutes).toBe(100 - est1);
    const expectedPct = Math.round(((100 - est1) / est1) * 100 * 100) / 100;
    expect(v1.durationVariancePercent).toBeCloseTo(expectedPct, 5);
    expect(v1.hasOperatorNote).toBe(true);
    expect(v1.executionStatus).toBe("completed");
    expect(v1.completedAt).toBeTruthy();

    expect(cal.program.completedVisits).toBe(1);
    expect(cal.program.isFullyCompleted).toBe(false);
    expect(cal.program.actualTotalDurationMinutes).toBe(100);
    expect(cal.program.hasAnyOperatorNotes).toBe(true);
    const estTotal = cal.program.estimatedTotalDurationMinutes;
    expect(cal.program.durationVarianceMinutes).toBe(100 - estTotal);
  });

  it("Case 4 — complete all visits: program totals, fully completed, usable flag", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E cal full",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "single_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    const screen0 = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const est =
      screen0.body.screen.deepCleanCalibration.program
        .estimatedTotalDurationMinutes;
    const estV1 =
      screen0.body.screen.deepCleanCalibration.visits[0].estimatedDurationMinutes;
    expect(est).toBe(estV1);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ actualDurationMinutes: 42, operatorNote: null })
      .expect(201);

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const cal = screenRes.body?.screen?.deepCleanCalibration;
    expect(cal.program.isFullyCompleted).toBe(true);
    expect(cal.program.completedVisits).toBe(1);
    expect(cal.program.totalVisits).toBe(1);
    expect(cal.program.actualTotalDurationMinutes).toBe(42);
    expect(cal.program.durationVarianceMinutes).toBe(42 - est);
    expect(cal.program.hasAnyOperatorNotes).toBe(false);
    expect(cal.visits[0].hasOperatorNote).toBe(false);
    expect(cal.program.usableForCalibrationAnalysis).toBe(true);
  });

  it("Case 5 — note vs no note on completed visit", async () => {
    const withNote = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E cal note",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "single_visit",
        },
      })
      .expect(201);
    const id1 = withNote.body?.booking?.id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${id1}/deep-clean/visits/1/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${id1}/deep-clean/visits/1/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ actualDurationMinutes: 10, operatorNote: "x" })
      .expect(201);
    const s1 = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${id1}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(
      s1.body.screen.deepCleanCalibration.visits[0].hasOperatorNote,
    ).toBe(true);

    const noNote = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E cal no note",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "single_visit",
        },
      })
      .expect(201);
    const id2 = noNote.body?.booking?.id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${id2}/deep-clean/visits/1/start`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${id2}/deep-clean/visits/1/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ actualDurationMinutes: 11, operatorNote: "" })
      .expect(201);
    const s2 = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${id2}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(
      s2.body.screen.deepCleanCalibration.visits[0].hasOperatorNote,
    ).toBe(false);
  });

  it("Case 6 — reload truth: DB rows match screen", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E cal reload",
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
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/deep-clean/visits/1/complete`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ actualDurationMinutes: 77, operatorNote: null })
      .expect(201);

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const cal = screenRes.body?.screen?.deepCleanCalibration;
    const row = await prisma.bookingDeepCleanVisitCalibration.findFirst({
      where: { bookingId, visitNumber: 1 },
    });
    expect(row).toBeTruthy();
    expect(row!.actualDurationMinutes).toBe(77);
    expect(cal.visits[0].actualDurationMinutes).toBe(77);
    expect(cal.visits[0].durationVarianceMinutes).toBe(
      row!.durationVarianceMinutes,
    );
  });

  it("Case 7 — idempotent sync: repeated screen reads keep single visit rows", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E cal idem",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "phased_3_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .get(`/api/v1/bookings/${bookingId}/screen`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    }

    const visitRows = await prisma.bookingDeepCleanVisitCalibration.findMany({
      where: { bookingId },
    });
    expect(visitRows).toHaveLength(3);
    const progRows = await prisma.bookingDeepCleanProgramCalibration.findMany({
      where: { bookingId },
    });
    expect(progRows).toHaveLength(1);
  });
});
