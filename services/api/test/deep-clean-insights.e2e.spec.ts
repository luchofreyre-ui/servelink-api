/**
 * Isolation rules:
 * - Every seeded row must include the suite prefix in a searchable field.
 * - Every request passes an explicit date window (reviewedAtFrom / reviewedAtTo).
 * - No assertions may depend on ambient DB totals.
 * - No assertions may depend on row insertion order.
 */
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { DeepCleanCalibrationReviewStatus } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { classifyBookingFeedbackBucket } from "../src/modules/bookings/deep-clean-feedback-buckets";
import { seedDeepCleanInsightsCalibration } from "./utils/deep-clean-insights-fixtures";
import { cleanupDeepCleanArtifactsByPrefix } from "./utils/deep-clean-test-cleanup";
import { createE2eIsolationContext } from "./utils/e2e-isolation";

jest.setTimeout(60000);

const isolation = createE2eIsolationContext("DC_INSIGHTS_E2E");

const REVIEWED_AT_WINDOW_START = "2026-02-25T00:00:00.000Z";
const REVIEWED_AT_WINDOW_END = "2026-03-10T23:59:59.999Z";

const T_CREATED = new Date("2026-03-01T12:00:00.000Z");
const T_REVIEW_A = new Date("2026-03-04T15:00:00.000Z");
const T_REVIEW_B = new Date("2026-03-05T15:00:00.000Z");
const T_REVIEW_C = new Date("2026-03-06T15:00:00.000Z");

describe("Deep clean insights (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    await cleanupDeepCleanArtifactsByPrefix(prisma, isolation.prefix);
    await prisma.booking.deleteMany({
      where: { notes: { startsWith: "DC_INSIGHTS_E2E_" } },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: { startsWith: isolation.prefix } }, { email: { startsWith: "DC_INSIGHTS_E2E_" } }],
      },
    });

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmail = `admin_dc_ins_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });
    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = loginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterEach(async () => {
    await prisma.booking.deleteMany({
      where: { notes: { startsWith: "DC_INSIGHTS_E2E_" } },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: { startsWith: isolation.prefix } }, { email: { startsWith: "DC_INSIGHTS_E2E_" } }],
      },
    });
  });

  afterAll(async () => {
    await cleanupDeepCleanArtifactsByPrefix(prisma, isolation.prefix);
    await prisma.booking.deleteMany({
      where: { notes: { startsWith: "DC_INSIGHTS_E2E_" } },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: { startsWith: isolation.prefix } }, { email: { startsWith: "DC_INSIGHTS_E2E_" } }],
      },
    });
    await app.close();
  });

  function baseQuery(extra: Record<string, string> = {}) {
    return {
      bookingNotesStartsWith: isolation.prefix,
      reviewedAtFrom: REVIEWED_AT_WINDOW_START,
      reviewedAtTo: REVIEWED_AT_WINDOW_END,
      ...extra,
    };
  }

  async function getInsights(query: Record<string, string>) {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/deep-clean/insights")
      .set("Authorization", `Bearer ${adminToken}`)
      .query(query)
      .expect(200);
    expect(res.body?.kind).toBe("deep_clean_insights");
    return res.body as {
      summary: Record<string, unknown>;
      reasonTagRows: Array<{ reasonTag: string; reviewedCount: number }>;
      programTypeRows: Array<{
        programType: string;
        reviewedCount: number;
        usableCount: number;
        averageVarianceMinutes: number | null;
        averageVariancePercent: number | null;
      }>;
      feedbackBuckets: Array<{ bucket: string; count: number }>;
    };
  }

  it("Case 1 — empty reviewed set: unreviewed seed excluded", async () => {
    await seedDeepCleanInsightsCalibration(prisma, isolation, "case1_unreviewed", {
      programType: "single_visit_deep_clean",
      estimated: 100,
      actual: 100,
      varMin: 0,
      varPct: 0,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.unreviewed,
      createdAt: T_CREATED,
    });

    const body = await getInsights(baseQuery());

    expect(body.summary.totalReviewedPrograms).toBe(0);
    expect(body.summary.reviewedEstimatorIssuePrograms).toBe(0);
    expect(body.summary.reviewedOperationalIssuePrograms).toBe(0);
    expect(body.summary.reviewedScopeIssuePrograms).toBe(0);
    expect(body.summary.averageReviewedVarianceMinutes).toBeNull();
    expect(body.summary.averageReviewedVariancePercent).toBeNull();
    expect(body.feedbackBuckets.every((b) => b.count === 0)).toBe(true);
    expect(body.reasonTagRows.every((r) => r.reviewedCount === 0)).toBe(true);
  });

  it("Case 2 — tag distributions and buckets", async () => {
    await seedDeepCleanInsightsCalibration(prisma, isolation, "case2_under", {
      programType: "single_visit_deep_clean",
      estimated: 100,
      actual: 130,
      varMin: 30,
      varPct: 30,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["underestimation"],
      createdAt: T_CREATED,
      reviewedAt: T_REVIEW_A,
    });
    await seedDeepCleanInsightsCalibration(prisma, isolation, "case2_ops", {
      programType: "single_visit_deep_clean",
      estimated: 100,
      actual: 80,
      varMin: -20,
      varPct: -20,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["operator_inefficiency"],
      createdAt: T_CREATED,
      reviewedAt: T_REVIEW_B,
    });
    await seedDeepCleanInsightsCalibration(prisma, isolation, "case2_scope", {
      programType: "phased_deep_clean_program",
      estimated: 300,
      actual: 400,
      varMin: 100,
      varPct: 33,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["scope_anomaly"],
      createdAt: T_CREATED,
      reviewedAt: T_REVIEW_C,
    });

    const body = await getInsights(baseQuery());

    expect(body.summary.totalReviewedPrograms).toBe(3);
    expect(body.summary.reviewedEstimatorIssuePrograms).toBe(1);
    expect(body.summary.reviewedOperationalIssuePrograms).toBe(1);
    expect(body.summary.reviewedScopeIssuePrograms).toBe(1);

    const under = body.reasonTagRows.find((r) => r.reasonTag === "underestimation");
    expect(under?.reviewedCount).toBe(1);

    const bucketMap = Object.fromEntries(
      body.feedbackBuckets.map((x) => [x.bucket, x.count]),
    );
    expect(bucketMap.estimator_issue).toBe(1);
    expect(bucketMap.operational_issue).toBe(1);
    expect(bucketMap.scope_issue).toBe(1);
    expect(bucketMap.mixed).toBe(0);
  });

  it("Case 3 — program type grouping", async () => {
    await seedDeepCleanInsightsCalibration(prisma, isolation, "case3_single", {
      programType: "single_visit_deep_clean",
      estimated: 60,
      actual: 90,
      varMin: 30,
      varPct: 50,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["other"],
      createdAt: T_CREATED,
      reviewedAt: T_REVIEW_A,
    });
    await seedDeepCleanInsightsCalibration(prisma, isolation, "case3_phased", {
      programType: "phased_deep_clean_program",
      estimated: 200,
      actual: 300,
      varMin: 100,
      varPct: 50,
      usable: false,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["other"],
      createdAt: T_CREATED,
      reviewedAt: T_REVIEW_B,
    });

    const body = await getInsights(baseQuery());
    const single = body.programTypeRows.find((r) => r.programType === "single_visit_deep_clean");
    const three = body.programTypeRows.find((r) => r.programType === "phased_deep_clean_program");
    expect(single?.reviewedCount).toBe(1);
    expect(single?.usableCount).toBe(1);
    expect(single?.averageVarianceMinutes).toBe(30);
    expect(three?.reviewedCount).toBe(1);
    expect(three?.usableCount).toBe(0);
    expect(three?.averageVarianceMinutes).toBe(100);
  });

  it("Case 4 — filters", async () => {
    await seedDeepCleanInsightsCalibration(prisma, isolation, "case4_single", {
      programType: "single_visit_deep_clean",
      estimated: 100,
      actual: 150,
      varMin: 50,
      varPct: 50,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["underestimation"],
      createdAt: T_CREATED,
      reviewedAt: T_REVIEW_A,
    });
    await seedDeepCleanInsightsCalibration(prisma, isolation, "case4_phased", {
      programType: "phased_deep_clean_program",
      estimated: 100,
      actual: 150,
      varMin: 50,
      varPct: 50,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["underestimation"],
      createdAt: T_CREATED,
      reviewedAt: T_REVIEW_B,
    });

    const byTag = await getInsights(baseQuery({ reasonTag: "underestimation" }));
    expect(byTag.summary.totalReviewedPrograms).toBe(2);

    const byPt = await getInsights(
      baseQuery({ reasonTag: "underestimation", programType: "single_visit" }),
    );
    expect(byPt.summary.totalReviewedPrograms).toBe(1);

    const byBucket = await getInsights(
      baseQuery({ reasonTag: "underestimation", feedbackBucket: "estimator_issue" }),
    );
    expect(byBucket.summary.totalReviewedPrograms).toBe(2);
  });

  it("Case 5 — mixed classification", async () => {
    await seedDeepCleanInsightsCalibration(prisma, isolation, "case5_mixed", {
      programType: "single_visit_deep_clean",
      estimated: 100,
      actual: 120,
      varMin: 20,
      varPct: 20,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["underestimation", "operator_inefficiency"],
      createdAt: T_CREATED,
      reviewedAt: T_REVIEW_A,
    });

    expect(classifyBookingFeedbackBucket(["underestimation", "operator_inefficiency"])).toBe(
      "mixed",
    );

    const body = await getInsights(baseQuery());
    const bucketMap = Object.fromEntries(
      body.feedbackBuckets.map((x) => [x.bucket, x.count]),
    );
    expect(bucketMap.mixed).toBeGreaterThanOrEqual(1);
    expect(body.summary.reviewedEstimatorIssuePrograms).toBe(0);
    expect(body.summary.reviewedOperationalIssuePrograms).toBe(0);
    expect(body.summary.reviewedScopeIssuePrograms).toBe(0);
  });
});
