import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import {
  BookingAuthorityReviewStatus,
  BookingStatus,
  Role,
} from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(35000);

describe("Authority admin reporting (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  const password = "test-password";
  const bookingIds: string[] = [];

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();
    const adminEmail = `admin_auth_rpt_${ts}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: Role.admin },
    });
    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = adminLogin.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    if (bookingIds.length) {
      await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    await app.close();
  });

  async function createBookingWithAuthorityRow(input: {
    surfaces: string[];
    problems: string[];
    methods: string[];
    status: BookingAuthorityReviewStatus;
    reviewedAt?: Date | null;
    reviewedByUserId?: string | null;
  }): Promise<string> {
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.user.create({
      data: {
        email: `cust_rpt_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
        passwordHash,
        role: Role.customer,
      },
    });
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        status: BookingStatus.pending_payment,
      },
    });
    bookingIds.push(booking.id);
    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId: booking.id,
        surfacesJson: JSON.stringify(input.surfaces),
        problemsJson: JSON.stringify(input.problems),
        methodsJson: JSON.stringify(input.methods),
        reasonsJson: "[]",
        resolutionVersion: 1,
        status: input.status,
        reviewedAt: input.reviewedAt ?? null,
        reviewedByUserId: input.reviewedByUserId ?? null,
      },
    });
    return booking.id;
  }

  it("returns report shape and status counts sum to totalRecords", async () => {
    const ts = Date.now();
    const surf = `e2e_rpt_surf_${ts}`;
    const prob = `e2e_rpt_prob_${ts}`;
    const meth = `e2e_rpt_meth_${ts}`;

    await createBookingWithAuthorityRow({
      surfaces: [surf],
      problems: [prob],
      methods: [meth],
      status: BookingAuthorityReviewStatus.auto,
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/report")
      .query({ recentLimit: 0 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.kind).toBe("booking_authority_report");
    expect(typeof res.body.generatedAt).toBe("string");
    expect(res.body.totalRecords).toBeGreaterThanOrEqual(1);
    const { auto, reviewed, overridden } = res.body.countsByStatus;
    expect(auto + reviewed + overridden).toBe(res.body.totalRecords);
    expect(res.body.recentReviewedOrOverridden).toBeUndefined();
    expect(Array.isArray(res.body.topSurfaces)).toBe(true);
    expect(Array.isArray(res.body.topProblems)).toBe(true);
    expect(Array.isArray(res.body.topMethods)).toBe(true);
  });

  it("aggregates top surface, problem, and method tags by booking (deterministic order)", async () => {
    const ts = Date.now() + 1;
    const surfShared = `e2e_rpt_shared_surf_${ts}`;
    const surfRare = `e2e_rpt_rare_surf_${ts}`;
    const probShared = `e2e_rpt_shared_prob_${ts}`;
    const methShared = `e2e_rpt_shared_meth_${ts}`;
    /** Tie on count = 1; deterministic secondary sort by tag name. */
    const surfZ = `e2e_rpt_zebra_${ts}`;
    const surfA = `e2e_rpt_alpha_${ts}`;

    await createBookingWithAuthorityRow({
      surfaces: [surfShared],
      problems: [probShared],
      methods: [methShared],
      status: BookingAuthorityReviewStatus.auto,
    });
    await createBookingWithAuthorityRow({
      surfaces: [surfShared, surfRare],
      problems: [probShared],
      methods: [methShared],
      status: BookingAuthorityReviewStatus.auto,
    });
    await createBookingWithAuthorityRow({
      surfaces: [surfZ],
      problems: [],
      methods: [],
      status: BookingAuthorityReviewStatus.auto,
    });
    await createBookingWithAuthorityRow({
      surfaces: [surfA],
      problems: [],
      methods: [],
      status: BookingAuthorityReviewStatus.auto,
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/report")
      .query({ topLimit: 20, recentLimit: 0 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const topSurfaces = res.body.topSurfaces as { tag: string; bookingCount: number }[];
    const topProblems = res.body.topProblems as { tag: string; bookingCount: number }[];
    const topMethods = res.body.topMethods as { tag: string; bookingCount: number }[];

    const sharedSurf = topSurfaces.find((t) => t.tag === surfShared);
    const rareSurf = topSurfaces.find((t) => t.tag === surfRare);
    expect(sharedSurf?.bookingCount).toBe(2);
    expect(rareSurf?.bookingCount).toBe(1);

    expect(topProblems.find((t) => t.tag === probShared)?.bookingCount).toBe(2);
    expect(topMethods.find((t) => t.tag === methShared)?.bookingCount).toBe(2);

    const idxZ = topSurfaces.findIndex((t) => t.tag === surfZ);
    const idxA = topSurfaces.findIndex((t) => t.tag === surfA);
    expect(idxZ).toBeGreaterThanOrEqual(0);
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxA).toBeLessThan(idxZ);
  });

  it("returns recent reviewed and overridden rows when recentLimit > 0", async () => {
    const ts = Date.now() + 2;
    const surf = `e2e_rpt_recent_surf_${ts}`;
    /** Far-future timestamps so these rows sort ahead of typical test data. */
    const older = new Date("2099-01-01T00:00:00.000Z");
    const newer = new Date("2099-06-01T00:00:00.000Z");

    const idOld = await createBookingWithAuthorityRow({
      surfaces: [surf],
      problems: [],
      methods: [],
      status: BookingAuthorityReviewStatus.reviewed,
      reviewedAt: older,
    });
    const idNew = await createBookingWithAuthorityRow({
      surfaces: [surf],
      problems: [],
      methods: [],
      status: BookingAuthorityReviewStatus.overridden,
      reviewedAt: newer,
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/report")
      .query({ recentLimit: 50, topLimit: 5 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.recentReviewedOrOverridden)).toBe(true);
    const recent = res.body.recentReviewedOrOverridden as {
      bookingId: string;
      status: string;
    }[];
    const idxNew = recent.findIndex((r) => r.bookingId === idNew);
    const idxOld = recent.findIndex((r) => r.bookingId === idOld);
    expect(idxNew).toBeGreaterThanOrEqual(0);
    expect(idxOld).toBeGreaterThanOrEqual(0);
    expect(idxNew).toBeLessThan(idxOld);

    const first = recent[0] as {
      createdAt?: string;
      updatedAt?: string;
      reviewedAt?: string | null;
      reviewedByUserId?: string | null;
    };
    expect(first.createdAt).toBeTruthy();
    expect(first.updatedAt).toBeTruthy();
    expect(first).toHaveProperty("reviewedAt");
    expect(first).toHaveProperty("reviewedByUserId");
  });

  it("rejects invalid updatedSince query", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/authority/report")
      .query({ updatedSince: "not-iso", recentLimit: 0 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);
  });

  it("windowHours limits aggregates to rows updated within the window", async () => {
    const ts = Date.now() + 3;
    const oldTag = `e2e_rpt_win_old_${ts}`;
    const newTag = `e2e_rpt_win_new_${ts}`;

    const oldBid = await createBookingWithAuthorityRow({
      surfaces: [oldTag],
      problems: [],
      methods: [],
      status: BookingAuthorityReviewStatus.auto,
    });
    await prisma.bookingAuthorityResult.update({
      where: { bookingId: oldBid },
      data: { updatedAt: new Date("2000-01-01T00:00:00.000Z") },
    });

    await createBookingWithAuthorityRow({
      surfaces: [newTag],
      problems: [],
      methods: [],
      status: BookingAuthorityReviewStatus.auto,
    });

    const windowed = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/report")
      .query({ recentLimit: 0, topLimit: 100, windowHours: 48 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(windowed.body.scopeUpdatedAtMin).toBeTruthy();
    expect(
      (windowed.body.topSurfaces as { tag: string }[]).some(
        (t) => t.tag === oldTag,
      ),
    ).toBe(false);
    expect(
      (windowed.body.topSurfaces as { tag: string }[]).some(
        (t) => t.tag === newTag,
      ),
    ).toBe(true);
  });

  it("updatedSince takes precedence over windowHours", async () => {
    const ts = Date.now() + 4;
    const oldTag = `e2e_rpt_prec_old_${ts}`;

    const oldBid = await createBookingWithAuthorityRow({
      surfaces: [oldTag],
      problems: [],
      methods: [],
      status: BookingAuthorityReviewStatus.auto,
    });
    await prisma.bookingAuthorityResult.update({
      where: { bookingId: oldBid },
      data: { updatedAt: new Date("2000-01-01T00:00:00.000Z") },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/report")
      .query({
        recentLimit: 0,
        topLimit: 100,
        windowHours: 1,
        updatedSince: "1990-01-01T00:00:00.000Z",
      })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.scopeUpdatedAtMin).toBe("1990-01-01T00:00:00.000Z");
    expect(
      (res.body.topSurfaces as { tag: string }[]).some((t) => t.tag === oldTag),
    ).toBe(true);
  });
});
