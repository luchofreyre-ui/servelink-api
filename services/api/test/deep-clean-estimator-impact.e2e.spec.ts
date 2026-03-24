import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import {
  BookingStatus,
  DeepCleanCalibrationReviewStatus,
  Prisma,
} from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { cleanupDeepCleanArtifactsByPrefix } from "./utils/deep-clean-test-cleanup";
import { createE2eIsolationContext } from "./utils/e2e-isolation";

jest.setTimeout(90000);

const isolation = createE2eIsolationContext("DC_IMPACT_E2E");

async function seedCalibration(
  prisma: PrismaService,
  opts: {
    programType: "single_visit_deep_clean" | "phased_deep_clean_program";
    estimatorVersion: number | null;
    estimatorLabel?: string | null;
    estimated: number;
    actual: number;
    varMin: number;
    varPct: number;
    usable: boolean;
    reviewStatus: DeepCleanCalibrationReviewStatus;
    tags?: string[];
    /** Override row creation time (trend bucketing uses reviewedAt ?? createdAt). */
    createdAt?: Date;
    /** Override review timestamp when reviewed. */
    reviewedAt?: Date | null;
  },
): Promise<void> {
  const user = await prisma.user.create({
    data: {
      email: `${isolation.prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}@e2e.local`,
      passwordHash: "x",
      role: "customer",
    },
  });
  const booking = await prisma.booking.create({
    data: {
      customerId: user.id,
      hourlyRateCents: 5000,
      estimatedHours: 2,
      notes: isolation.tag(`bk_${Date.now()}_${Math.random().toString(36).slice(2)}`),
      status: BookingStatus.assigned,
    },
  });
  const program = await prisma.bookingDeepCleanProgram.create({
    data: {
      bookingId: booking.id,
      programType: opts.programType,
      visitCount: opts.programType === "single_visit_deep_clean" ? 1 : 3,
      visitsJson: "[]",
    },
  });
  await prisma.bookingDeepCleanProgramCalibration.create({
    data: {
      bookingId: booking.id,
      programId: program.id,
      programType: opts.programType,
      estimatedTotalDurationMinutes: opts.estimated,
      actualTotalDurationMinutes: opts.actual,
      durationVarianceMinutes: opts.varMin,
      durationVariancePercent: new Prisma.Decimal(Number(opts.varPct).toFixed(2)),
      totalVisits: opts.programType === "single_visit_deep_clean" ? 1 : 3,
      completedVisits: opts.programType === "single_visit_deep_clean" ? 1 : 3,
      isFullyCompleted: true,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: opts.usable,
      reviewStatus: opts.reviewStatus,
      createdAt: opts.createdAt ?? new Date(),
      reviewedAt:
        opts.reviewedAt !== undefined
          ? opts.reviewedAt
          : opts.reviewStatus === DeepCleanCalibrationReviewStatus.reviewed
            ? new Date()
            : null,
      reviewedByUserId:
        opts.reviewStatus === DeepCleanCalibrationReviewStatus.reviewed ? user.id : null,
      reviewReasonTagsJson:
        opts.tags && opts.tags.length > 0 ? opts.tags : Prisma.DbNull,
      reviewNote: null,
      deepCleanEstimatorConfigId:
        opts.estimatorVersion != null ? `cfg_${opts.estimatorVersion}` : null,
      deepCleanEstimatorConfigVersion: opts.estimatorVersion,
      deepCleanEstimatorConfigLabel: opts.estimatorLabel ?? `v${opts.estimatorVersion ?? "?"}`,
    },
  });
}

function getImpact(
  app: INestApplication,
  token: string,
  q: Record<string, string> = {},
) {
  const qs = new URLSearchParams(q).toString();
  const suffix = qs ? `?${qs}` : "";
  return request(app.getHttpServer())
    .get(`/api/v1/admin/deep-clean/estimator-impact${suffix}`)
    .set("Authorization", `Bearer ${token}`);
}

describe("Deep clean estimator impact (E2E)", () => {
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

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmail = `admin_dc_impact_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = login.body?.accessToken;
    expect(adminToken).toBeTruthy();

    await cleanupDeepCleanArtifactsByPrefix(prisma, isolation.prefix);
    await prisma.booking.deleteMany({
      where: { notes: { startsWith: "DC_IMPACT_E2E_" } },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: { startsWith: isolation.prefix } }, { email: { startsWith: "DC_IMPACT_E2E_" } }],
      },
    });
  });

  afterAll(async () => {
    await cleanupDeepCleanArtifactsByPrefix(prisma, isolation.prefix);
    await prisma.booking.deleteMany({
      where: { notes: { startsWith: "DC_IMPACT_E2E_" } },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: { startsWith: isolation.prefix } }, { email: { startsWith: "DC_IMPACT_E2E_" } }],
      },
    });
    await app.close();
  });

  it("Case 1 — empty state: no rows for impossible version filter", async () => {
    const res = await getImpact(app, adminToken, { version: "999999998" }).expect(
      200,
    );
    expect(res.body?.kind).toBe("deep_clean_estimator_impact");
    expect(res.body?.rows).toEqual([]);
    expect(res.body?.comparisons).toEqual([]);
  });

  it("Case 2 — multiple versions: grouped counts and averages", async () => {
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: 5601,
      estimated: 100,
      actual: 120,
      varMin: 20,
      varPct: 20,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["underestimation"],
    });
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: 5601,
      estimated: 100,
      actual: 130,
      varMin: 30,
      varPct: 30,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["underestimation"],
    });
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: 5602,
      estimated: 100,
      actual: 105,
      varMin: 5,
      varPct: 5,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["overestimation"],
    });
    await seedCalibration(prisma, {
      programType: "phased_deep_clean_program",
      estimatorVersion: 5603,
      estimated: 200,
      actual: 200,
      varMin: 0,
      varPct: 0,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["scope_anomaly", "underestimation"],
    });

    const res = await getImpact(app, adminToken).expect(200);
    expect(res.body?.kind).toBe("deep_clean_estimator_impact");
    const rows = res.body?.rows as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThanOrEqual(3);

    const r1 = rows.find((r) => r.estimatorConfigVersion === 5601);
    const r2 = rows.find((r) => r.estimatorConfigVersion === 5602);
    const r3 = rows.find((r) => r.estimatorConfigVersion === 5603);
    expect(r1).toBeTruthy();
    expect(r2).toBeTruthy();
    expect(r3).toBeTruthy();

    expect(r1?.programCount).toBe(2);
    expect(r1?.averageVarianceMinutes).toBe(25);
    expect(r1?.averageVariancePercent).toBe(25);
    expect(r1?.underestimationTagCount).toBe(2);
    expect(r1?.overestimationTagCount).toBe(0);
    expect(r1?.estimatorIssueCount).toBe(2);

    expect(r2?.programCount).toBe(1);
    expect(r2?.overestimationTagCount).toBe(1);
    expect(r2?.estimatorIssueCount).toBe(1);

    expect(r3?.mixedIssueCount).toBe(1);
    expect(r3?.underestimationTagCount).toBe(1);
  });

  it("Case 3 — reviewedOnly / usableOnly defaults and filters", async () => {
    const vCase3 = 589990;
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: vCase3,
      estimated: 100,
      actual: 110,
      varMin: 10,
      varPct: 10,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.unreviewed,
      tags: [],
    });
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: vCase3,
      estimated: 100,
      actual: 120,
      varMin: 20,
      varPct: 20,
      usable: false,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["underestimation"],
    });

    const def = await getImpact(app, adminToken, { version: String(vCase3) }).expect(200);
    expect((def.body?.rows as unknown[]).length).toBe(0);

    const noReviewed = await getImpact(app, adminToken, {
      version: String(vCase3),
      reviewedOnly: "false",
      usableOnly: "true",
    }).expect(200);
    const rowsA = noReviewed.body?.rows as Array<{ programCount: number }>;
    expect(rowsA.length).toBe(1);
    expect(rowsA[0]?.programCount).toBe(1);

    const noUsable = await getImpact(app, adminToken, {
      version: String(vCase3),
      reviewedOnly: "true",
      usableOnly: "false",
    }).expect(200);
    const rowsB = noUsable.body?.rows as Array<{ programCount: number }>;
    expect(rowsB.length).toBe(1);
    expect(rowsB[0]?.programCount).toBe(1);
  });

  it("Case 4 — tag and bucket counts", async () => {
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: 5620,
      estimated: 100,
      actual: 100,
      varMin: 0,
      varPct: 0,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["operator_inefficiency"],
    });
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: 5620,
      estimated: 100,
      actual: 100,
      varMin: 0,
      varPct: 0,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["incomplete_execution_data"],
    });

    const res = await getImpact(app, adminToken, { version: "5620" }).expect(200);
    const row = (res.body?.rows as Array<Record<string, unknown>>).find(
      (r) => r.estimatorConfigVersion === 5620,
    );
    expect(row?.operationalIssueCount).toBe(1);
    expect(row?.dataQualityIssueCount).toBe(1);
  });

  it("Case 5 — adjacent comparison deltas", async () => {
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: 5630,
      estimated: 100,
      actual: 120,
      varMin: 20,
      varPct: 20,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["other"],
    });
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: 5631,
      estimated: 100,
      actual: 110,
      varMin: 10,
      varPct: 10,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["other"],
    });

    const res = await getImpact(app, adminToken, {
      version: "5630",
    }).expect(200);
    expect((res.body?.rows as unknown[]).length).toBe(1);

    const res2 = await getImpact(app, adminToken).expect(200);
    const comps = res2.body?.comparisons as Array<{
      baselineVersion: number;
      comparisonVersion: number;
      deltaVariancePercent: number | null;
    }>;
    const pair = comps.find(
      (c) => c.baselineVersion === 5630 && c.comparisonVersion === 5631,
    );
    expect(pair).toBeTruthy();
    expect(pair?.deltaVariancePercent).toBe(-10);
  });

  it("Case 6 — programType filter", async () => {
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: 5640,
      estimated: 100,
      actual: 100,
      varMin: 0,
      varPct: 0,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["other"],
    });
    await seedCalibration(prisma, {
      programType: "phased_deep_clean_program",
      estimatorVersion: 5640,
      estimated: 200,
      actual: 200,
      varMin: 0,
      varPct: 0,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["other"],
    });

    const single = await getImpact(app, adminToken, {
      programType: "single_visit",
      version: "5640",
    }).expect(200);
    expect((single.body?.rows as Array<{ programCount: number }>)[0]?.programCount).toBe(1);
  });

  it("Case 7 — includeTrend is optional; trendRows when requested", async () => {
    const noTrend = await getImpact(app, adminToken).expect(200);
    expect(noTrend.body?.trendRows).toBeUndefined();

    const vTrend = 599_001;
    const d1 = new Date("2025-06-02T12:00:00.000Z");
    const d2 = new Date("2025-06-03T12:00:00.000Z");
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: vTrend,
      estimated: 100,
      actual: 120,
      varMin: 20,
      varPct: 10,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["underestimation"],
      createdAt: d1,
      reviewedAt: d1,
    });
    await seedCalibration(prisma, {
      programType: "single_visit_deep_clean",
      estimatorVersion: vTrend,
      estimated: 100,
      actual: 110,
      varMin: 10,
      varPct: 12,
      usable: true,
      reviewStatus: DeepCleanCalibrationReviewStatus.reviewed,
      tags: ["underestimation"],
      createdAt: d2,
      reviewedAt: d2,
    });

    const withTrend = await getImpact(app, adminToken, {
      includeTrend: "true",
      trendBucket: "week",
      trendWindowDays: "365",
      version: String(vTrend),
    }).expect(200);
    expect(Array.isArray(withTrend.body?.trendRows)).toBe(true);
    const trendRows = withTrend.body?.trendRows as Array<{ totalCount: number; bucketStartDate: string }>;
    expect(trendRows.length).toBeGreaterThanOrEqual(1);
    expect(trendRows.some((r) => r.totalCount >= 2)).toBe(true);

    const dayTrend = await getImpact(app, adminToken, {
      includeTrend: "true",
      trendBucket: "day",
      trendWindowDays: "365",
      version: String(vTrend),
    }).expect(200);
    const dayRows = dayTrend.body?.trendRows as unknown[];
    expect(dayRows.length).toBeGreaterThanOrEqual(2);
  });
});
