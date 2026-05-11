import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { BookingStatus } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { weeklyStableHome } from "../src/estimating/maintenance-state/maintenance-state-fixtures";

jest.setTimeout(90000);

function domain(cls: string, drivers: string[] = []) {
  return {
    score: cls === "critical" ? 0.15 : cls === "low" ? 0.35 : 0.85,
    classification: cls,
    reasoning: [] as string[],
    evidenceSignals: [] as string[],
    uncertaintyDrivers: drivers,
  };
}

function maintenanceReplaySnapshotOutputJson() {
  return JSON.stringify({
    rawNormalizedIntake: {
      property_type: "house",
      sqft_band: "1200_1599",
      bedrooms: "2",
      bathrooms: "2",
      floors: "1",
      service_type: "maintenance",
      first_time_with_servelink: "no",
      clutter_level: "light",
      kitchen_condition: "light",
      bathroom_condition: "light",
      pet_presence: "none",
      recurring_cadence_intent: "weekly",
      last_professional_clean: "under_2_weeks",
    },
    confidenceBreakdown: {
      schemaVersion: "estimate_confidence_breakdown_v1",
      overallConfidence: 0.55,
      confidenceClassification: "medium",
      conditionConfidence: domain("high"),
      clutterConfidence: domain("high"),
      kitchenConfidence: domain("high"),
      bathroomConfidence: domain("high"),
      petConfidence: domain("high"),
      recencyConfidence: domain("high"),
      recurringTransitionConfidence: domain("high"),
      customerConsistencyConfidence: domain("high"),
      scopeCompletenessConfidence: domain("high"),
    },
    escalationGovernance: {
      schemaVersion: "estimate_escalation_governance_v1",
      sourceConfidenceSchemaVersion: "estimate_confidence_breakdown_v1",
      escalationLevel: "review",
      escalationReasons: [],
      recommendedActions: ["admin_review_required"],
      blockingReasons: [],
      affectedDomains: [],
      severityScore: 61,
      customerSafeSummary: [],
      adminSummary: [],
      confidenceInputs: {
        overallConfidence: 0.55,
        confidenceClassification: "medium",
        domainScores: {},
        domainClassifications: {},
        distinctUncertaintyDriverCount: 2,
      },
      auditSignals: [],
    },
    estimatorVersion: "maintenance_timeline_replay_e2e_v1",
  });
}

async function seedBookingWithMaintenanceSnapshot(prisma: PrismaService) {
  const customer = await prisma.user.create({
    data: {
      email: `mt_replay_c_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
      passwordHash: "x",
      role: "customer",
    },
  });
  const outputJson = maintenanceReplaySnapshotOutputJson();
  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      hourlyRateCents: 5000,
      estimatedHours: 2,
      notes: `MT_REPLAY_${Date.now()}`,
      status: BookingStatus.assigned,
      estimateSnapshot: {
        create: {
          estimatorVersion: "maintenance_timeline_replay_e2e_v1",
          mode: "v2",
          confidence: 0.82,
          riskPercentUncapped: 12,
          riskPercentCappedForRange: 12,
          riskCapped: false,
          inputJson: "{}",
          outputJson,
        },
      },
    },
  });
  return { bookingId: booking.id, customerId: customer.id };
}

async function seedBookingWithoutSnapshot(prisma: PrismaService) {
  const customer = await prisma.user.create({
    data: {
      email: `mt_replay_ns_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
      passwordHash: "x",
      role: "customer",
    },
  });
  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      hourlyRateCents: 5000,
      estimatedHours: 2,
      notes: `MT_REPLAY_NS_${Date.now()}`,
      status: BookingStatus.assigned,
    },
  });
  return { bookingId: booking.id, customerId: customer.id };
}

async function cleanupBookingAndCustomer(
  prisma: PrismaService,
  bookingId: string,
  customerId: string,
) {
  await prisma.maintenanceStateCheckpoint.deleteMany({
    where: { bookingId },
  });
  await prisma.booking.delete({ where: { id: bookingId } }).catch(() => undefined);
  await prisma.user.delete({ where: { id: customerId } }).catch(() => undefined);
}

describe("Maintenance timeline replay API (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let customerToken: string;
  const password = "test-password";

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const passwordHash = await bcrypt.hash(password, 10);

    const customerEmail = `mt_replay_customer_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });
    const custLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);
    customerToken = custLogin.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `mt_replay_admin_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });
    const admLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = admLogin.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("customer cannot call maintenance replay API (403)", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/admin/maintenance-state/replay")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId: "any" })
      .expect(403);
  });

  it("replay booking dry-run writes no checkpoint rows", async () => {
    const { bookingId, customerId } =
      await seedBookingWithMaintenanceSnapshot(prisma);
    const before = await prisma.maintenanceStateCheckpoint.count({
      where: { bookingId },
    });
    const res = await request(app.getHttpServer())
      .post("/api/v1/admin/maintenance-state/replay")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ bookingId })
      .expect(200);

    expect(res.body.replay?.currentState).toBeTruthy();
    expect(res.body.checkpointPreview?.inputFingerprint).toBeTruthy();
    expect(res.body.persistedCheckpoint).toBeUndefined();
    expect(res.body.idempotencyResult).toBeUndefined();

    const after = await prisma.maintenanceStateCheckpoint.count({
      where: { bookingId },
    });
    expect(after).toBe(before);

    await cleanupBookingAndCustomer(prisma, bookingId, customerId);
  });

  it("replay booking missing snapshot returns controlled error", async () => {
    const { bookingId, customerId } = await seedBookingWithoutSnapshot(prisma);
    const res = await request(app.getHttpServer())
      .post("/api/v1/admin/maintenance-state/replay")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ bookingId })
      .expect(400);
    expect(String(res.body?.message ?? "")).toMatch(
      /MAINTENANCE_REPLAY_BOOKING_SNAPSHOT_MISSING/,
    );

    await cleanupBookingAndCustomer(prisma, bookingId, customerId);
  });

  it("persistCheckpoint creates one row; repeat is idempotent", async () => {
    const { bookingId, customerId } =
      await seedBookingWithMaintenanceSnapshot(prisma);

    const r1 = await request(app.getHttpServer())
      .post("/api/v1/admin/maintenance-state/replay")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ bookingId, persistCheckpoint: true })
      .expect(200);
    const r2 = await request(app.getHttpServer())
      .post("/api/v1/admin/maintenance-state/replay")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ bookingId, persistCheckpoint: true })
      .expect(200);

    expect(r1.body.idempotencyResult?.idempotentHit).toBe(false);
    expect(r2.body.idempotencyResult?.idempotentHit).toBe(true);
    expect(r1.body.persistedCheckpoint?.id).toBe(r2.body.persistedCheckpoint?.id);

    const count = await prisma.maintenanceStateCheckpoint.count({
      where: { bookingId },
    });
    expect(count).toBe(1);

    await cleanupBookingAndCustomer(prisma, bookingId, customerId);
  });

  it("lists checkpoints with ordering", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `mt_list_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });
    const subjectId = customer.id;

    const base = weeklyStableHome();
    await request(app.getHttpServer())
      .post("/api/v1/admin/maintenance-state/replay")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        evolutionInput: { ...base, evaluationAnchor: "e2e:list:a" },
        subjectType: "customer",
        subjectId,
        persistCheckpoint: true,
        effectiveAt: "2025-01-02T00:00:00.000Z",
      })
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/v1/admin/maintenance-state/replay")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        evolutionInput: { ...base, evaluationAnchor: "e2e:list:b" },
        subjectType: "customer",
        subjectId,
        persistCheckpoint: true,
        effectiveAt: "2025-06-02T00:00:00.000Z",
      })
      .expect(200);

    const asc = await request(app.getHttpServer())
      .get(
        `/api/v1/admin/maintenance-state/checkpoints?subjectType=customer&subjectId=${subjectId}&order=asc&limit=10`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const desc = await request(app.getHttpServer())
      .get(
        `/api/v1/admin/maintenance-state/checkpoints?subjectType=customer&subjectId=${subjectId}&order=desc&limit=10`,
      )
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(asc.body.length).toBeGreaterThanOrEqual(2);
    expect(new Date(asc.body[0].effectiveAt).getTime()).toBeLessThanOrEqual(
      new Date(asc.body[1].effectiveAt).getTime(),
    );
    expect(new Date(desc.body[0].effectiveAt).getTime()).toBeGreaterThanOrEqual(
      new Date(desc.body[1].effectiveAt).getTime(),
    );

    await prisma.maintenanceStateCheckpoint.deleteMany({
      where: { subjectType: "customer", subjectId },
    });
    await prisma.user.delete({ where: { id: subjectId } });
  });
});
