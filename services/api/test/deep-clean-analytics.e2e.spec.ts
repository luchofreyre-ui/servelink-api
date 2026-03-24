import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { BookingStatus, Prisma } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { buildDeepCleanProgramCalibrationFilter } from "../src/modules/bookings/deep-clean-analytics.service";
import type { DeepCleanAnalyticsQueryDto } from "../src/modules/bookings/dto/deep-clean-analytics.dto";

jest.setTimeout(60000);

const NOTE_PREFIX = "DC_ANALYTICS_E2E_";

async function seedBookingWithCalibration(
  prisma: PrismaService,
  opts: {
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
  },
): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: `dc_an_${Date.now()}_${Math.random().toString(36).slice(2)}@e2e.local`,
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
      programType: opts.programType,
      visitCount: opts.visitCount,
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
      durationVariancePercent:
        opts.varPct != null
          ? new Prisma.Decimal(Number(opts.varPct).toFixed(2))
          : null,
      totalVisits: opts.visitCount,
      completedVisits: opts.completedVisits,
      isFullyCompleted: opts.isFullyCompleted,
      hasAnyOperatorNotes: opts.hasAnyOperatorNotes,
      usableForCalibrationAnalysis: opts.usableForCalibrationAnalysis,
    },
  });
  return booking.id;
}

describe("Deep clean analytics (E2E)", () => {
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
    const adminEmail = `admin_dc_an_${Date.now()}@servelink.local`;
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

  async function getAnalytics(query: Record<string, string | undefined>) {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/deep-clean/analytics")
      .set("Authorization", `Bearer ${adminToken}`)
      .query(query)
      .expect(200);
    expect(res.body?.kind).toBe("deep_clean_analytics");
    return res.body as {
      summary: Record<string, unknown>;
      rows: Array<Record<string, unknown>>;
    };
  }

  function expectCountMatch(
    q: DeepCleanAnalyticsQueryDto,
    summary: { totalProgramCalibrations: number },
  ) {
    const where = buildDeepCleanProgramCalibrationFilter(q);
    return prisma.bookingDeepCleanProgramCalibration
      .count({ where })
      .then((c) => {
        expect(summary.totalProgramCalibrations).toBe(c);
      });
  }

  it("Case 1 — empty-shaped summary when no rows match a tight filter", async () => {
    const q: DeepCleanAnalyticsQueryDto = {
      usableOnly: true,
      withOperatorNotesOnly: true,
      fullyCompletedOnly: true,
      programType: "three_visit",
    };
    const where = buildDeepCleanProgramCalibrationFilter(q);
    const count = await prisma.bookingDeepCleanProgramCalibration.count({
      where,
    });
    const body = await getAnalytics({
      usableOnly: "true",
      withOperatorNotesOnly: "true",
      fullyCompletedOnly: "true",
      programType: "three_visit",
    });
    expect(body.summary.totalProgramCalibrations).toBe(count);
    expect(body.rows.length).toBeLessThanOrEqual(count);
    if (count === 0) {
      expect(body.summary.usableProgramCalibrations).toBe(0);
      expect(body.summary.fullyCompletedPrograms).toBe(0);
      expect(body.summary.programsWithOperatorNotes).toBe(0);
      expect(body.summary.averageVarianceMinutes).toBeNull();
      expect(body.summary.averageVariancePercent).toBeNull();
      expect(body.summary.averageEstimatedTotalDurationMinutes).toBeNull();
      expect(body.summary.averageActualTotalDurationMinutes).toBeNull();
    }
  });

  it("Case 2 — mixed rows: summary matches Prisma count; averages are numbers or null", async () => {
    const id1 = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 100,
      actual: 130,
      varMin: 30,
      varPct: 30,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: true,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(id1);
    const id2 = await seedBookingWithCalibration(prisma, {
      programType: "phased_deep_clean_program",
      visitCount: 3,
      estimated: 300,
      actual: 240,
      varMin: -60,
      varPct: -20,
      isFullyCompleted: true,
      completedVisits: 3,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(id2);
    const id3 = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 90,
      actual: 90,
      varMin: 0,
      varPct: 0,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: false,
    });
    createdBookingIds.push(id3);

    const body = await getAnalytics({ limit: "200", sortBy: "createdAt_desc" });
    await expectCountMatch({}, body.summary as { totalProgramCalibrations: number });
    expect(body.summary.totalProgramCalibrations).toBeGreaterThanOrEqual(3);
    expect(
      [id1, id2, id3].every((id) =>
        body.rows.some((r) => r.bookingId === id),
      ),
    ).toBe(true);
    expect(typeof body.summary.averageEstimatedTotalDurationMinutes).toBe(
      "number",
    );
  });

  it("Case 3 — usableOnly: summary and rows align with Prisma", async () => {
    const bad = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 50,
      actual: 50,
      varMin: 0,
      varPct: 0,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: false,
    });
    createdBookingIds.push(bad);
    const good = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 60,
      actual: 80,
      varMin: 20,
      varPct: 33.33,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(good);

    const body = await getAnalytics({ usableOnly: "true", limit: "200" });
    const q: DeepCleanAnalyticsQueryDto = { usableOnly: true };
    await expectCountMatch(q, body.summary as { totalProgramCalibrations: number });
    expect(body.rows.every((r) => r.usableForCalibrationAnalysis === true)).toBe(
      true,
    );
    expect(body.rows.some((r) => r.bookingId === bad)).toBe(false);
    expect(body.rows.some((r) => r.bookingId === good)).toBe(true);
  });

  it("Case 4 — withOperatorNotesOnly", async () => {
    const quiet = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 40,
      actual: 40,
      varMin: 0,
      varPct: 0,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(quiet);
    const loud = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 40,
      actual: 50,
      varMin: 10,
      varPct: 25,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: true,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(loud);

    const body = await getAnalytics({
      withOperatorNotesOnly: "true",
      limit: "200",
    });
    await expectCountMatch(
      { withOperatorNotesOnly: true },
      body.summary as { totalProgramCalibrations: number },
    );
    expect(body.rows.every((r) => r.hasAnyOperatorNotes === true)).toBe(true);
    expect(body.rows.some((r) => r.bookingId === quiet)).toBe(false);
    expect(body.rows.some((r) => r.bookingId === loud)).toBe(true);
  });

  it("Case 5 — sort variance_minutes_desc", async () => {
    const low = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 100,
      actual: 105,
      varMin: 5,
      varPct: 5,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(low);
    const high = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 100,
      actual: 200,
      varMin: 100,
      varPct: 100,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(high);

    const body = await getAnalytics({
      sortBy: "variance_minutes_desc",
      limit: "200",
    });
    const idxHigh = body.rows.findIndex((r) => r.bookingId === high);
    const idxLow = body.rows.findIndex((r) => r.bookingId === low);
    expect(idxHigh).toBeGreaterThanOrEqual(0);
    expect(idxLow).toBeGreaterThanOrEqual(0);
    expect(idxHigh).toBeLessThan(idxLow);
  });

  it("Case 5b — sort variance_minutes_asc", async () => {
    const low = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 100,
      actual: 102,
      varMin: 2,
      varPct: 2,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(low);
    const high = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 100,
      actual: 150,
      varMin: 50,
      varPct: 50,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(high);

    const body = await getAnalytics({
      sortBy: "variance_minutes_asc",
      limit: "200",
    });
    const idxHigh = body.rows.findIndex((r) => r.bookingId === high);
    const idxLow = body.rows.findIndex((r) => r.bookingId === low);
    expect(idxLow).toBeLessThan(idxHigh);
  });

  it("Case 6 — programType single_visit", async () => {
    const singleId = await seedBookingWithCalibration(prisma, {
      programType: "single_visit_deep_clean",
      visitCount: 1,
      estimated: 80,
      actual: 80,
      varMin: 0,
      varPct: 0,
      isFullyCompleted: true,
      completedVisits: 1,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(singleId);
    const phasedId = await seedBookingWithCalibration(prisma, {
      programType: "phased_deep_clean_program",
      visitCount: 3,
      estimated: 200,
      actual: 200,
      varMin: 0,
      varPct: 0,
      isFullyCompleted: true,
      completedVisits: 3,
      hasAnyOperatorNotes: false,
      usableForCalibrationAnalysis: true,
    });
    createdBookingIds.push(phasedId);

    const body = await getAnalytics({
      programType: "single_visit",
      limit: "200",
    });
    await expectCountMatch(
      { programType: "single_visit" },
      body.summary as { totalProgramCalibrations: number },
    );
    expect(
      body.rows.every((r) => r.programType === "single_visit_deep_clean"),
    ).toBe(true);
    expect(body.rows.some((r) => r.bookingId === phasedId)).toBe(false);
    expect(body.rows.some((r) => r.bookingId === singleId)).toBe(true);
  });

  it("Case 7 — limit slices rows only; summary uses full filtered set", async () => {
    for (let i = 0; i < 3; i++) {
      const id = await seedBookingWithCalibration(prisma, {
        programType: "single_visit_deep_clean",
        visitCount: 1,
        estimated: 50 + i,
        actual: 50 + i,
        varMin: 0,
        varPct: 0,
        isFullyCompleted: true,
        completedVisits: 1,
        hasAnyOperatorNotes: false,
        usableForCalibrationAnalysis: true,
      });
      createdBookingIds.push(id);
    }
    const q: DeepCleanAnalyticsQueryDto = {};
    const fullCount = await prisma.bookingDeepCleanProgramCalibration.count({
      where: buildDeepCleanProgramCalibrationFilter(q),
    });
    const body = await getAnalytics({ limit: "2", sortBy: "createdAt_desc" });
    expect(body.summary.totalProgramCalibrations).toBe(fullCount);
    expect(body.rows.length).toBe(2);
  });
});
