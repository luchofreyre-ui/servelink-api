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

jest.setTimeout(30000);

describe("Authority admin review workflow (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminUserId: string;
  const password = "test-password";

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();
    const adminEmail = `admin_auth_review_${ts}@servelink.local`;
    const admin = await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: Role.admin },
    });
    adminUserId = admin.id;

    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = adminLogin.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createBookingWithAuthorityRow(): Promise<{
    bookingId: string;
    surfacesJson: string;
    problemsJson: string;
    methodsJson: string;
    reasonsJson: string;
  }> {
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.user.create({
      data: {
        email: `cust_auth_rev_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
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
    const surfacesJson = JSON.stringify(["tile"]);
    const problemsJson = JSON.stringify(["grease-buildup"]);
    const methodsJson = JSON.stringify(["degreasing"]);
    const reasonsJson = JSON.stringify(["problem:grease-buildup:matched-keyword"]);
    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId: booking.id,
        surfacesJson,
        problemsJson,
        methodsJson,
        reasonsJson,
        resolutionVersion: 1,
        status: BookingAuthorityReviewStatus.auto,
      },
    });
    return {
      bookingId: booking.id,
      surfacesJson,
      problemsJson,
      methodsJson,
      reasonsJson,
    };
  }

  async function createBookingWithoutAuthorityRow(): Promise<string> {
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.user.create({
      data: {
        email: `cust_no_auth_${Date.now()}@servelink.local`,
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
    return booking.id;
  }

  it("GET persisted authority result by bookingId", async () => {
    const { bookingId, surfacesJson } = await createBookingWithAuthorityRow();

    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/authority/bookings/${bookingId}/result`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.bookingId).toBe(bookingId);
    expect(res.body.surfaces).toEqual(JSON.parse(surfacesJson));
    expect(res.body.status).toBe(BookingAuthorityReviewStatus.auto);
    expect(res.body.reviewedByUserId).toBeNull();
    expect(res.body.reviewedAt).toBeNull();
    expect(res.body.createdAt).toBeTruthy();
    expect(res.body.updatedAt).toBeTruthy();
  });

  it("POST review updates status and review metadata", async () => {
    const { bookingId } = await createBookingWithAuthorityRow();

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    expect(res.body.status).toBe(BookingAuthorityReviewStatus.reviewed);
    expect(res.body.reviewedByUserId).toBe(adminUserId);
    expect(res.body.reviewedAt).toBeTruthy();

    const row = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    expect(row?.status).toBe(BookingAuthorityReviewStatus.reviewed);
    expect(row?.reviewedByUserId).toBe(adminUserId);
    expect(row?.reviewedAt).toBeInstanceOf(Date);
  });

  it("POST review does not change stored tag JSON", async () => {
    const {
      bookingId,
      surfacesJson,
      problemsJson,
      methodsJson,
      reasonsJson,
    } = await createBookingWithAuthorityRow();

    await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    const row = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    expect(row?.surfacesJson).toBe(surfacesJson);
    expect(row?.problemsJson).toBe(problemsJson);
    expect(row?.methodsJson).toBe(methodsJson);
    expect(row?.reasonsJson).toBe(reasonsJson);
    expect(row?.resolutionVersion).toBe(1);
  });

  it("GET results lists persisted rows with tags and review fields", async () => {
    const { bookingId } = await createBookingWithAuthorityRow();

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/results")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.kind).toBe("booking_authority_results");
    expect(typeof res.body.total).toBe("number");
    expect(res.body.offset).toBe(0);
    expect(res.body.limit).toBe(50);
    expect(Array.isArray(res.body.items)).toBe(true);
    const hit = res.body.items.find(
      (row: { bookingId: string }) => row.bookingId === bookingId,
    );
    expect(hit).toBeTruthy();
    expect(Array.isArray(hit.surfaces)).toBe(true);
    expect(Array.isArray(hit.problems)).toBe(true);
    expect(Array.isArray(hit.methods)).toBe(true);
    expect(hit.status).toBe(BookingAuthorityReviewStatus.auto);
    expect(hit).toHaveProperty("reviewedByUserId");
    expect(hit).toHaveProperty("reviewedAt");
    expect(hit.createdAt).toBeTruthy();
    expect(hit.updatedAt).toBeTruthy();
  });

  it("GET results filters by status", async () => {
    const { bookingId: autoBid } = await createBookingWithAuthorityRow();
    const { bookingId: reviewedBid } = await createBookingWithAuthorityRow();
    await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${reviewedBid}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/results")
      .query({ status: BookingAuthorityReviewStatus.reviewed })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const ids = res.body.items.map((r: { bookingId: string }) => r.bookingId);
    expect(ids).toContain(reviewedBid);
    expect(ids).not.toContain(autoBid);
  });

  it("GET results paginates and orders newest-first", async () => {
    const { bookingId: first } = await createBookingWithAuthorityRow();
    await new Promise((r) => setTimeout(r, 50));
    const { bookingId: second } = await createBookingWithAuthorityRow();

    const page = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/results")
      .query({ limit: 200, offset: 0 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const idxFirst = page.body.items.findIndex(
      (r: { bookingId: string }) => r.bookingId === first,
    );
    const idxSecond = page.body.items.findIndex(
      (r: { bookingId: string }) => r.bookingId === second,
    );
    expect(idxFirst).toBeGreaterThanOrEqual(0);
    expect(idxSecond).toBeGreaterThanOrEqual(0);
    expect(idxSecond).toBeLessThan(idxFirst);

    const p0 = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/results")
      .query({ limit: 2, offset: 0 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const p1 = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/results")
      .query({ limit: 2, offset: 2 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(p0.body.total).toBe(p1.body.total);
    const a = p0.body.items.map((r: { bookingId: string }) => r.bookingId);
    const b = p1.body.items.map((r: { bookingId: string }) => r.bookingId);
    expect(a.some((id: string) => b.includes(id))).toBe(false);
  });

  it("GET returns 404 when no persisted authority result", async () => {
    const bookingId = await createBookingWithoutAuthorityRow();

    await request(app.getHttpServer())
      .get(`/api/v1/admin/authority/bookings/${bookingId}/result`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });

  it("POST review returns 404 when no persisted authority result", async () => {
    const bookingId = await createBookingWithoutAuthorityRow();

    await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });

  it("POST override updates tags and sets overridden status with review metadata", async () => {
    const { bookingId, reasonsJson } = await createBookingWithAuthorityRow();

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/override`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        surfaces: ["countertop"],
        problems: ["stains"],
        methods: ["spot-treatment"],
      })
      .expect(201);

    expect(res.body.surfaces).toEqual(["countertop"]);
    expect(res.body.problems).toEqual(["stains"]);
    expect(res.body.methods).toEqual(["spot-treatment"]);
    expect(res.body.status).toBe(BookingAuthorityReviewStatus.overridden);
    expect(res.body.reviewedByUserId).toBe(adminUserId);
    expect(res.body.reviewedAt).toBeTruthy();
    expect(res.body.reasons).toEqual(JSON.parse(reasonsJson));

    const row = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    expect(row?.reasonsJson).toBe(reasonsJson);
    expect(row?.status).toBe(BookingAuthorityReviewStatus.overridden);
    expect(row?.reviewedByUserId).toBe(adminUserId);
  });

  it("POST override preserves reasonsJson and stores overrideReasons when provided", async () => {
    const { bookingId, reasonsJson } = await createBookingWithAuthorityRow();

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/override`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        surfaces: ["s"],
        problems: ["p"],
        methods: ["m"],
        overrideReasons: ["Customer confirmed marble"],
      })
      .expect(201);

    expect(res.body.overrideReasons).toEqual(["Customer confirmed marble"]);
    const row = await prisma.bookingAuthorityResult.findUnique({
      where: { bookingId },
    });
    expect(row?.reasonsJson).toBe(reasonsJson);
    expect(row?.overrideReasonsJson).toBe(
      JSON.stringify(["Customer confirmed marble"]),
    );
  });

  it("POST override returns 404 when no persisted authority result", async () => {
    const bookingId = await createBookingWithoutAuthorityRow();

    await request(app.getHttpServer())
      .post(`/api/v1/admin/authority/bookings/${bookingId}/override`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        surfaces: [],
        problems: [],
        methods: [],
      })
      .expect(404);
  });
});
