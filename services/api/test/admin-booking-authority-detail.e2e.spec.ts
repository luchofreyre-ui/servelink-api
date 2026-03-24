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

describe("Admin booking detail authority exposure (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

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
    const adminEmail = `admin_book_auth_${ts}@servelink.local`;
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
    await app.close();
  });

  async function createBookingWithNotes(notes: string | null): Promise<string> {
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.user.create({
      data: {
        email: `cust_bk_auth_${Date.now()}_${Math.random().toString(36).slice(2)}@servelink.local`,
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
        notes,
      },
    });
    return booking.id;
  }

  it("command-center includes persisted authority and omits derived", async () => {
    const bookingId = await createBookingWithNotes(
      "Kitchen tile with heavy grease buildup",
    );
    const surfacesJson = JSON.stringify(["tile"]);
    const problemsJson = JSON.stringify(["grease-buildup"]);
    const methodsJson = JSON.stringify(["degreasing"]);
    const reasonsJson = JSON.stringify(["problem:grease-buildup:matched-keyword"]);
    await prisma.bookingAuthorityResult.create({
      data: {
        bookingId,
        surfacesJson,
        problemsJson,
        methodsJson,
        reasonsJson,
        resolutionVersion: 1,
        status: BookingAuthorityReviewStatus.reviewed,
        reviewedByUserId: null,
        reviewedAt: new Date(),
      },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/bookings/${bookingId}/command-center`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.authority.persisted).not.toBeNull();
    expect(res.body.authority.persisted.surfaces).toEqual(["tile"]);
    expect(res.body.authority.persisted.problems).toEqual(["grease-buildup"]);
    expect(res.body.authority.persisted.methods).toEqual(["degreasing"]);
    expect(res.body.authority.persisted.status).toBe(
      BookingAuthorityReviewStatus.reviewed,
    );
    expect(res.body.authority.persisted.reviewedAt).toBeTruthy();
    expect(res.body.authority.persisted.createdAt).toBeTruthy();
    expect(res.body.authority.persisted.updatedAt).toBeTruthy();
    expect(typeof res.body.authority.persisted.createdAt).toBe("string");
    expect(typeof res.body.authority.persisted.updatedAt).toBe("string");
    expect(res.body.authority.derived).toBeNull();
    expect(res.body.authority.operatorHints).toEqual(
      expect.objectContaining({
        hasPersistedRow: true,
        persistedStatus: BookingAuthorityReviewStatus.reviewed,
        recomputeSkipsOverwrite: false,
        recomputeMayRefreshPersistedRow: true,
        recomputePreviewOnly: false,
      }),
    );
  });

  it("command-center uses derived resolver when no persisted row", async () => {
    const bookingId = await createBookingWithNotes(
      "Please deep clean shower glass and remove soap scum",
    );

    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/bookings/${bookingId}/command-center`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.authority.persisted).toBeNull();
    expect(res.body.authority.derived).not.toBeNull();
    expect(res.body.authority.derived.surfaces).toContain("shower-glass");
    expect(res.body.authority.derived.problems).toContain("soap-scum");
    expect(Array.isArray(res.body.authority.derived.methods)).toBe(true);
    expect(res.body.authority.operatorHints).toEqual(
      expect.objectContaining({
        hasPersistedRow: false,
        persistedStatus: null,
        recomputePreviewOnly: true,
        recomputeMayRefreshPersistedRow: false,
      }),
    );
  });

  it("command-center leaves both snapshots null when nothing matches and no row", async () => {
    const bookingId = await createBookingWithNotes("");

    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/bookings/${bookingId}/command-center`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.authority.persisted).toBeNull();
    expect(res.body.authority.derived).toBeNull();
    expect(res.body.authority.operatorHints?.recomputePreviewOnly).toBe(true);
  });

  it("operational-detail includes the same authority block shape", async () => {
    const bookingId = await createBookingWithNotes("greasy kitchen tile");
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/bookings/${bookingId}/operational-detail`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.authority).toBeDefined();
    expect(res.body.authority).toHaveProperty("persisted");
    expect(res.body.authority).toHaveProperty("derived");
    expect(res.body.authority.derived).not.toBeNull();
    expect(res.body.authority.derived.surfaces).toContain("tile");
  });

  it("command-center response keeps prior top-level fields stable", async () => {
    const bookingId = await createBookingWithNotes(null);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/bookings/${bookingId}/command-center`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.bookingId).toBe(bookingId);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("workflowState");
    expect(res.body).toHaveProperty("operatorNote");
    expect(res.body).toHaveProperty("anomaly");
    expect(res.body).toHaveProperty("availableActions");
    expect(Array.isArray(res.body.activityPreview)).toBe(true);
    expect(res.body).toHaveProperty("authority");
    expect(res.body.availableActions).toEqual(
      expect.objectContaining({
        canSaveOperatorNote: expect.any(Boolean),
        canHold: expect.any(Boolean),
        canMarkInReview: expect.any(Boolean),
        canApprove: expect.any(Boolean),
        canReassign: expect.any(Boolean),
      }),
    );
  });
});
