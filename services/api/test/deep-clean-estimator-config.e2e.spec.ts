import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { DEFAULT_DEEP_CLEAN_ESTIMATOR_CONFIG } from "../src/modules/bookings/deep-clean-estimator-config.types";

jest.setTimeout(90000);

const DEEP_INPUT = {
  property_type: "house",
  sqft_band: "1200_1599",
  bedrooms: "3",
  bathrooms: "2",
  floors: "1",
  service_type: "deep_clean",
  first_time_with_servelink: "no",
  last_professional_clean: "1_3_months",
  clutter_level: "light",
  kitchen_condition: "normal",
  bathroom_condition: "normal",
  pet_presence: "none",
  occupancy_state: "occupied_normal",
  floor_visibility: "mostly_clear",
  flooring_mix: "mostly_hard",
  carpet_percent: "0_25",
  stairs_flights: "one",
  addons: [],
  deep_clean_program: "single_visit",
};

function cfgBody(over: Partial<typeof DEFAULT_DEEP_CLEAN_ESTIMATOR_CONFIG> = {}) {
  return { ...DEFAULT_DEEP_CLEAN_ESTIMATOR_CONFIG, ...over };
}

describe("Deep clean estimator config (E2E)", () => {
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

    await prisma.deepCleanEstimatorConfig.deleteMany({});

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const customerEmail = `cust_dc_est_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });
    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);
    customerToken = customerLoginRes.body?.accessToken;

    const adminEmail = `admin_dc_est_${Date.now()}@servelink.local`;
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

  it("Case 1 — bootstrap: active exists with neutral defaults", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/deep-clean/estimator-config/active")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body?.kind).toBe("deep_clean_estimator_config_active");
    expect(res.body?.row?.version).toBe(1);
    expect(res.body?.row?.status).toBe("active");
    expect(res.body?.row?.config?.globalDurationMultiplier).toBe(1);
  });

  it("Case 2 — update draft: valid accepted, invalid rejected", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/deep-clean/estimator-config/draft")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const bad = await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/draft")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        label: "bad",
        config: { ...cfgBody(), globalDurationMultiplier: 99 },
      })
      .expect(400);

    expect(String(bad.body?.message ?? bad.text)).toMatch(/2|between|greater/i);

    const ok = await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/draft")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        label: "Tuned draft",
        config: cfgBody({ globalDurationMultiplier: 1.25 }),
      })
      .expect(200);

    expect(ok.body?.kind).toBe("deep_clean_estimator_config_draft_updated");
    expect(ok.body?.row?.config?.globalDurationMultiplier).toBe(1.25);
  });

  it("Case 3 — publish: draft becomes active, prior active archived, new draft created", async () => {
    const before = await prisma.deepCleanEstimatorConfig.findMany();
    const activeBefore = before.filter((r) => r.status === "active");
    expect(activeBefore).toHaveLength(1);

    const pub = await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/publish")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(pub.body?.kind).toBe("deep_clean_estimator_config_published");
    expect(pub.body?.published?.status).toBe("active");
    expect(pub.body?.newDraft?.status).toBe("draft");

    expect(pub.body?.published?.config?.globalDurationMultiplier).toBe(1.25);

    const rows = await prisma.deepCleanEstimatorConfig.findMany({
      orderBy: { version: "asc" },
    });
    const actives = rows.filter((r) => r.status === "active");
    const drafts = rows.filter((r) => r.status === "draft");
    const archived = rows.filter((r) => r.status === "archived");
    expect(actives).toHaveLength(1);
    expect(drafts).toHaveLength(1);
    expect(archived.length).toBeGreaterThanOrEqual(1);
  });

  it("Case 4 — preview: active vs draft both returned; draft change shifts preview", async () => {
    const preview1 = await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estimateInput: DEEP_INPUT })
      .expect(200);

    expect(preview1.body?.kind).toBe("deep_clean_estimator_preview");
    expect(preview1.body?.active?.version).toBeTruthy();
    expect(preview1.body?.draft?.version).toBeTruthy();
    expect(typeof preview1.body?.deltaMinutes).toBe("number");

    await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/draft")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        config: cfgBody({ globalDurationMultiplier: 1.5, bedroomAdditiveMinutes: 30 }),
      })
      .expect(200);

    const preview2 = await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estimateInput: DEEP_INPUT })
      .expect(200);

    expect(preview2.body?.draft?.totalEstimatedDurationMinutes).not.toBe(
      preview2.body?.active?.totalEstimatedDurationMinutes,
    );
  });

  it("Case 5 — new estimate after publish uses new active; prior booking snapshot frozen", async () => {
    await prisma.deepCleanEstimatorConfig.deleteMany({});

    const activeBoot = await request(app.getHttpServer())
      .get("/api/v1/admin/deep-clean/estimator-config/active")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(activeBoot.body?.row?.version).toBe(1);

    await request(app.getHttpServer())
      .get("/api/v1/admin/deep-clean/estimator-config/draft")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const createA = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "e2e est A", estimateInput: DEEP_INPUT })
      .expect(201);

    const bookingA = createA.body?.booking?.id as string;
    const snapA = await prisma.bookingEstimateSnapshot.findUnique({
      where: { bookingId: bookingA },
    });
    expect(snapA?.deepCleanEstimatorConfigVersion).toBe(1);
    const outA = JSON.parse(String(snapA?.outputJson ?? "{}"));
    const laborA = outA.adjustedLaborMinutes as number;

    await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/draft")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        config: cfgBody({ globalDurationMultiplier: 1.4 }),
      })
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/publish")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const createB = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "e2e est B", estimateInput: DEEP_INPUT })
      .expect(201);

    const bookingB = createB.body?.booking?.id as string;
    const snapB = await prisma.bookingEstimateSnapshot.findUnique({
      where: { bookingId: bookingB },
    });
    expect(snapB?.deepCleanEstimatorConfigVersion).toBe(2);
    const outB = JSON.parse(String(snapB?.outputJson ?? "{}"));
    const laborB = outB.adjustedLaborMinutes as number;
    expect(laborB).toBeGreaterThan(laborA);

    const snapAFrozen = await prisma.bookingEstimateSnapshot.findUnique({
      where: { bookingId: bookingA },
    });
    expect(snapAFrozen?.deepCleanEstimatorConfigVersion).toBe(1);
    const outAFrozen = JSON.parse(String(snapAFrozen?.outputJson ?? "{}"));
    expect(outAFrozen.adjustedLaborMinutes).toBe(laborA);
  });

  it("Case 6 — mixed classification preview rejects non-deep-clean", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/admin/deep-clean/estimator-config/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        estimateInput: { ...DEEP_INPUT, service_type: "maintenance" },
      })
      .expect(400);

    expect(String(res.body?.message ?? res.text)).toMatch(/deep_clean/i);
  });
});
