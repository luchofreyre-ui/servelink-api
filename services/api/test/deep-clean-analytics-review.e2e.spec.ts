import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import {
  BookingStatus,
  DeepCleanVisitExecutionStatus,
  Prisma,
} from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { buildDeepCleanProgramCalibrationFilter } from "../src/modules/bookings/deep-clean-analytics.service";
import type { DeepCleanAnalyticsQueryDto } from "../src/modules/bookings/dto/deep-clean-analytics.dto";

jest.setTimeout(60000);

const NOTE_PREFIX = "DC_ANALYTICS_REVIEW_E2E_";

async function seedBookingWithCalibration(
  prisma: PrismaService,
  opts: Partial<{
    programType: "single_visit_deep_clean" | "phased_deep_clean_program";
    visitCount: number;
    estimated: number;
    actual: number | null;
    varMin: number | null;
    varPct: number | null;
    isFullyCompleted: boolean;
    completedVisits: number;
    hasAnyOperatorNotes: boolean;
    usableForCalibrationAnalysis: boolean;
    /** Minimal visit row so booking screen exposes deepCleanCalibration */
    withVisitCalibrationRow: boolean;
  }> = {},
): Promise<string> {
  const o = {
    programType: "single_visit_deep_clean" as const,
    visitCount: 1,
    estimated: 100,
    actual: 130 as number | null,
    varMin: 30 as number | null,
    varPct: 30 as number | null,
    isFullyCompleted: true,
    completedVisits: 1,
    hasAnyOperatorNotes: false,
    usableForCalibrationAnalysis: true,
    withVisitCalibrationRow: false,
    ...opts,
  };
  const user = await prisma.user.create({
    data: {
      email: `dc_rev_${Date.now()}_${Math.random().toString(36).slice(2)}@e2e.local`,
      passwordHash: "x",
      role: "customer",
    },
  });
  const booking = await prisma.booking.create({
    data: {
      customerId: user.id,
      hourlyRateCents: 5000,
      estimatedHours: 2,
      notes: `${NOTE_PREFIX}${Date.now()}`,
      status: BookingStatus.assigned,
    },
  });
  const program = await prisma.bookingDeepCleanProgram.create({
    data: {
      bookingId: booking.id,
      programType: o.programType,
      visitCount: o.visitCount,
      visitsJson: "[]",
    },
  });
  await prisma.bookingDeepCleanProgramCalibration.create({
    data: {
      bookingId: booking.id,
      programId: program.id,
      programType: o.programType,
      estimatedTotalDurationMinutes: o.estimated,
      actualTotalDurationMinutes: o.actual,
      durationVarianceMinutes: o.varMin,
      durationVariancePercent:
        o.varPct != null
          ? new Prisma.Decimal(Number(o.varPct).toFixed(2))
          : null,
      totalVisits: o.visitCount,
      completedVisits: o.completedVisits,
      isFullyCompleted: o.isFullyCompleted,
      hasAnyOperatorNotes: o.hasAnyOperatorNotes,
      usableForCalibrationAnalysis: o.usableForCalibrationAnalysis,
    },
  });
  if (o.withVisitCalibrationRow) {
    await prisma.bookingDeepCleanVisitCalibration.create({
      data: {
        bookingId: booking.id,
        programId: program.id,
        visitNumber: 1,
        estimatedDurationMinutes: o.estimated,
        actualDurationMinutes: o.actual,
        durationVarianceMinutes: o.varMin,
        durationVariancePercent:
          o.varPct != null
            ? new Prisma.Decimal(Number(o.varPct).toFixed(2))
            : null,
        executionStatus: DeepCleanVisitExecutionStatus.completed,
        hasOperatorNote: o.hasAnyOperatorNotes,
        completedAt: new Date(),
      },
    });
  }
  return booking.id;
}

describe("Deep clean analytics review (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  const createdBookingIds: string[] = [];

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmail = `admin_dc_rev_${Date.now()}@servelink.local`;
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

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    for (const id of createdBookingIds.splice(0)) {
      await prisma.booking.deleteMany({ where: { id } });
    }
  });

  async function postReview(
    bookingId: string,
    body: Record<string, unknown>,
    expectStatus: number,
  ) {
    return request(app.getHttpServer())
      .post(`/api/v1/admin/deep-clean/analytics/${encodeURIComponent(bookingId)}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(body)
      .expect(expectStatus);
  }

  it("Case 1 — review a booking: status, tags, note in response", async () => {
    const id = await seedBookingWithCalibration(prisma);
    createdBookingIds.push(id);

    const res = await postReview(
      id,
      {
        reviewStatus: "reviewed",
        reviewReasonTags: ["underestimation", "scope_anomaly"],
        reviewNote: "Looks like scope + estimate miss.",
      },
      200,
    );
    expect(res.body?.kind).toBe("deep_clean_calibration_review_updated");
    const row = res.body?.row;
    expect(row?.reviewStatus).toBe("reviewed");
    expect(row?.reviewReasonTags).toEqual(
      expect.arrayContaining(["scope_anomaly", "underestimation"]),
    );
    expect(row?.reviewReasonTags.length).toBe(2);
    expect(row?.reviewNote).toBe("Looks like scope + estimate miss.");
    expect(row?.reviewedAt).toBeTruthy();

    const rowDb = await prisma.bookingDeepCleanProgramCalibration.findUnique({
      where: { bookingId: id },
    });
    expect(rowDb?.reviewStatus).toBe("reviewed");
    expect(rowDb?.reviewedByUserId).toBeTruthy();
  });

  it("Case 2 — invalid tag rejected", async () => {
    const id = await seedBookingWithCalibration(prisma);
    createdBookingIds.push(id);

    const res = await postReview(
      id,
      {
        reviewStatus: "reviewed",
        reviewReasonTags: ["not_a_real_tag"],
      },
      400,
    );
    expect(String(res.body?.message ?? res.text)).toMatch(/invalid|tag/i);
  });

  it("Case 3 — unreview clears fields", async () => {
    const id = await seedBookingWithCalibration(prisma);
    createdBookingIds.push(id);

    await postReview(
      id,
      {
        reviewStatus: "reviewed",
        reviewReasonTags: ["other"],
        reviewNote: "tmp",
      },
      200,
    );

    const res = await postReview(
      id,
      {
        reviewStatus: "unreviewed",
      },
      200,
    );
    expect(res.body?.row?.reviewStatus).toBe("unreviewed");
    expect(res.body?.row?.reviewReasonTags).toEqual([]);
    expect(res.body?.row?.reviewNote).toBeNull();
    expect(res.body?.row?.reviewedAt).toBeNull();

    const rowDb = await prisma.bookingDeepCleanProgramCalibration.findUnique({
      where: { bookingId: id },
    });
    expect(rowDb?.reviewedAt).toBeNull();
    expect(rowDb?.reviewedByUserId).toBeNull();
    expect(rowDb?.reviewNote).toBeNull();
  });

  it("Case 4 — analytics filter by reviewed", async () => {
    const a = await seedBookingWithCalibration(prisma);
    const b = await seedBookingWithCalibration(prisma);
    createdBookingIds.push(a, b);

    await postReview(a, { reviewStatus: "reviewed", reviewReasonTags: ["other"] }, 200);

    const analyticsRes = await request(app.getHttpServer())
      .get("/api/v1/admin/deep-clean/analytics")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ reviewStatus: "reviewed" })
      .expect(200);

    expect(analyticsRes.body?.kind).toBe("deep_clean_analytics");
    const ids = analyticsRes.body.rows.map((r: { bookingId: string }) => r.bookingId);
    expect(ids).toContain(a);
    expect(ids).not.toContain(b);

    const q: DeepCleanAnalyticsQueryDto = { reviewStatus: "reviewed" };
    const where = buildDeepCleanProgramCalibrationFilter(q);
    const c = await prisma.bookingDeepCleanProgramCalibration.count({ where });
    expect(analyticsRes.body.summary.totalProgramCalibrations).toBe(c);
  });

  it("Case 5 — analytics filter by reason tag", async () => {
    const x = await seedBookingWithCalibration(prisma);
    const y = await seedBookingWithCalibration(prisma);
    createdBookingIds.push(x, y);

    await postReview(
      x,
      { reviewStatus: "reviewed", reviewReasonTags: ["operator_inefficiency"] },
      200,
    );
    await postReview(
      y,
      { reviewStatus: "reviewed", reviewReasonTags: ["underestimation"] },
      200,
    );

    const tagRes = await request(app.getHttpServer())
      .get("/api/v1/admin/deep-clean/analytics")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ reasonTag: "operator_inefficiency", reviewStatus: "reviewed" })
      .expect(200);

    const ids = tagRes.body.rows.map((r: { bookingId: string }) => r.bookingId);
    expect(ids).toContain(x);
    expect(ids).not.toContain(y);
  });

  it("Case 6 — booking screen includes review data", async () => {
    const id = await seedBookingWithCalibration(prisma, {
      withVisitCalibrationRow: true,
    });
    createdBookingIds.push(id);

    await postReview(
      id,
      {
        reviewStatus: "reviewed",
        reviewReasonTags: ["note_follow_up_required"],
        reviewNote: "Follow up on note",
      },
      200,
    );

    const screenRes = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${id}/screen`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const p = screenRes.body?.screen?.deepCleanCalibration?.program;
    expect(p?.reviewStatus).toBe("reviewed");
    expect(p?.reviewReasonTags).toEqual(["note_follow_up_required"]);
    expect(p?.reviewNote).toBe("Follow up on note");
    expect(p?.reviewedAt).toBeTruthy();
  });

  it("Case 7 — reviewed requires at least one tag", async () => {
    const id = await seedBookingWithCalibration(prisma);
    createdBookingIds.push(id);

    const res = await postReview(
      id,
      {
        reviewStatus: "reviewed",
        reviewReasonTags: [],
      },
      400,
    );
    expect(String(res.body?.message ?? JSON.stringify(res.body))).toMatch(
      /reason tag|reviewReasonTags|At least one/i,
    );
  });
});
