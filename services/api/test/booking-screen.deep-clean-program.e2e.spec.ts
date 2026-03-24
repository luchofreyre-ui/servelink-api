import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { DEEP_CLEAN_BUNDLE_IDS } from "../src/modules/scope/task-bundles";

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

describe("Booking screen — deepCleanProgram (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const customerEmail = `cust_dc_screen_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("non-deep-clean booking: screen.deepCleanProgram is null", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E maintenance screen",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          service_type: "maintenance",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;
    expect(bookingId).toBeTruthy();

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    expect(screenRes.body?.kind).toBe("booking_screen");
    expect(screenRes.body?.screen?.deepCleanProgram).toBeNull();
    expect(screenRes.body?.screen?.deepCleanCalibration).toBeNull();
  });

  it("single-visit deep clean: programType single_visit, one visit, tasks present", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E deep single",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "single_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;
    expect(bookingId).toBeTruthy();

    const row = await prisma.bookingDeepCleanProgram.findUnique({
      where: { bookingId },
    });
    expect(row).toBeTruthy();

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    const prog = screenRes.body?.screen?.deepCleanProgram;
    expect(prog).toBeTruthy();
    expect(prog.programType).toBe("single_visit");
    expect(prog.programId).toBe(row!.id);
    expect(prog.visits).toHaveLength(1);
    expect(prog.visits[0].visitNumber).toBe(1);
    expect(prog.visits[0].tasks.length).toBeGreaterThan(0);
    expect(prog.visits[0].tasks.some((t: { taskId: string }) => t.taskId)).toBe(
      true,
    );
    expect(prog.totalPriceCents).toBeGreaterThan(0);

    const cal = screenRes.body?.screen?.deepCleanCalibration;
    expect(cal).toBeTruthy();
    expect(cal.program.estimatedTotalDurationMinutes).toBeGreaterThan(0);
    expect(cal.visits).toHaveLength(1);
    expect(cal.visits[0].estimatedDurationMinutes).toBeGreaterThan(0);

    const pub = await request(app.getHttpServer())
      .get(`/api/v1/public/bookings/${bookingId}/confirmation`)
      .expect(200);

    expect(pub.body?.kind).toBe("public_booking_confirmation");
    expect(pub.body?.deepCleanProgram?.programType).toBe("single_visit");
    expect(pub.body?.deepCleanProgram?.visits).toHaveLength(1);
  });

  it("three-visit deep clean: programType three_visit, three visits, bundle + tasks", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E deep phased",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "phased_3_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    const prog = screenRes.body?.screen?.deepCleanProgram;
    expect(prog?.programType).toBe("three_visit");
    expect(prog?.visits).toHaveLength(3);

    const v1 = prog.visits[0];
    expect(v1.taskBundleId).toBe(DEEP_CLEAN_BUNDLE_IDS.FOUNDATION);
    expect(v1.taskBundleLabel).toBeTruthy();
    expect(v1.tasks.map((t: { taskId: string }) => t.taskId)).toContain(
      "dcc_t_surface_reset",
    );

    const sumVisits = prog.visits.reduce(
      (s: number, v: { priceCents: number }) => s + v.priceCents,
      0,
    );
    expect(sumVisits).toBe(prog.totalPriceCents);
  });

  it("reload-safe: public confirmation matches persisted program (no intake/session)", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E public reload",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "phased_3_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    const persisted = await prisma.bookingDeepCleanProgram.findUnique({
      where: { bookingId },
    });
    expect(persisted).toBeTruthy();

    const a = await request(app.getHttpServer())
      .get(`/api/v1/public/bookings/${bookingId}/confirmation`)
      .expect(200);

    const b = await request(app.getHttpServer())
      .get(`/api/v1/public/bookings/${bookingId}/confirmation`)
      .expect(200);

    expect(a.body.deepCleanProgram?.programId).toBe(persisted!.id);
    expect(b.body.deepCleanProgram?.programId).toBe(persisted!.id);
    expect(b.body.deepCleanProgram?.visits).toHaveLength(3);
  });

  it("resilient catalog miss: 200 with degraded visit metadata", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E degraded bundle",
        estimateInput: {
          ...DEEP_BASE_INPUT,
          deep_clean_program: "single_visit",
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id as string;

    await prisma.bookingDeepCleanProgram.update({
      where: { bookingId },
      data: {
        visitsJson: JSON.stringify([
          {
            visitIndex: 1,
            label: "Degraded visit",
            summary: "Test",
            estimatedPriceCents: 5000,
            estimatedLaborMinutes: 360,
            estimatedDurationMinutes: 180,
            taskBundleIds: ["__unknown_bundle_xyz__"],
            taskIds: [],
            bundleLabels: [],
            taskLabels: [],
          },
        ]),
      },
    });

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/screen`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);

    const prog = screenRes.body?.screen?.deepCleanProgram;
    expect(prog).toBeTruthy();
    expect(prog.visits).toHaveLength(1);
    expect(prog.visits[0].taskBundleId).toBe("__unknown_bundle_xyz__");
    expect(prog.visits[0].taskBundleLabel).toBeNull();
    expect(prog.visits[0].tasks).toEqual([]);
  });
});
