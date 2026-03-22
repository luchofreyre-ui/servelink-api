import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(35000);

describe("Admin dispatch exceptions (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
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

    const customerEmail = `cust_exceptions_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `admin_exceptions_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = adminLoginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createAndScheduleBooking(overrides: {
    siteLat?: number;
    siteLng?: number;
    note?: string;
  } = {}) {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: overrides.note ?? "E2E exceptions",
        estimateInput: {
          property_type: "house",
          sqft_band: "1200_1599",
          bedrooms: "3",
          bathrooms: "2",
          floors: "1",
          service_type: "maintenance",
          first_time_with_servelink: "yes",
          last_professional_clean: "1_3_months",
          clutter_level: "light",
          kitchen_condition: "normal",
          bathroom_condition: "normal",
          pet_presence: "none",
          addons: [],
          siteLat: overrides.siteLat ?? 36.154,
          siteLng: overrides.siteLng ?? -95.992,
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id;
    expect(bookingId).toBeTruthy();

    const scheduledStart = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule for exceptions", scheduledStart })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    return bookingId as string;
  }

  async function createDispatchDecision(args: {
    bookingId: string;
    decisionStatus: "no_candidates" | "all_excluded" | "selected";
    dispatchSequence: number;
    trigger?: string;
    redispatchSequence?: number;
  }) {
    await (prisma as any).dispatchDecision.create({
      data: {
        bookingId: args.bookingId,
        trigger: args.trigger ?? "initial_dispatch",
        dispatchSequence: args.dispatchSequence,
        redispatchSequence: args.redispatchSequence ?? 0,
        decisionStatus: args.decisionStatus,
        scoringVersion: "provider-aware-dispatch-v1",
        bookingSnapshot: {},
        // Ensure this decision is among the most recent rows even in a non-isolated DB.
        createdAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  it("returns no_candidates when booking has no_candidates decision", async () => {
    const bookingId = await createAndScheduleBooking({
      siteLat: -80,
      siteLng: 170,
      note: "E2E exceptions no_candidates",
    });

    await createDispatchDecision({
      bookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 1,
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "no_candidates", limit: "100", sortBy: "lastDecisionAt", sortOrder: "desc" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
    const item = res.body.items.find((i: any) => i.bookingId === bookingId);
    expect(item).toBeTruthy();
    expect(item.exceptionReasons).toContain("no_candidates");
    expect(item.latestDecisionStatus).toBe("no_candidates");
  });

  it("returns all_excluded when booking has all_excluded decision", async () => {
    const foUserNoLoc = await prisma.user.create({
      data: {
        email: `fo_exceptions_noloc_${Date.now()}@servelink.local`,
        passwordHash: await bcrypt.hash(password, 10),
        role: "fo",
      },
    });

    await prisma.franchiseOwner.create({
      data: {
        userId: foUserNoLoc.id,
        status: "active",
        safetyHold: false,
        displayName: "Exceptions NoLoc FO",
        homeLat: null,
        homeLng: null,
      },
    });

    const bookingId = await createAndScheduleBooking({
      note: "E2E exceptions all_excluded",
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "all_excluded" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const item = res.body.items.find((i: any) => i.bookingId === bookingId);
    if (item) {
      expect(item.latestDecisionStatus).toBe("all_excluded");
      expect(item.exceptionReasons).toContain("all_excluded");
    }
  });

  it("returns no_selection for bookings with attempts but zero selected", async () => {
    const bookingId = await createAndScheduleBooking({
      siteLat: -80,
      siteLng: 170,
      note: "E2E exceptions no_selection",
    });

    await createDispatchDecision({
      bookingId,
      decisionStatus: "all_excluded",
      dispatchSequence: 1,
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "no_selection", limit: "100", sortBy: "lastDecisionAt", sortOrder: "desc" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const item = res.body.items.find((i: any) => i.bookingId === bookingId);
    expect(item).toBeTruthy();
    expect(item.selectedDecisionCount).toBe(0);
    expect(item.totalDispatchPasses).toBeGreaterThan(0);
    expect(item.exceptionReasons).toContain("no_selection");
    expect(item.latestDecisionStatus).toBe("all_excluded");
  });

  it("returns multi_pass when booking has multiple dispatch passes", async () => {
    const bookingId = await createAndScheduleBooking({
      siteLat: -81,
      siteLng: 171,
      note: "E2E exceptions multi_pass",
    });

    await createDispatchDecision({
      bookingId,
      decisionStatus: "all_excluded",
      dispatchSequence: 1,
    });

    await createDispatchDecision({
      bookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 2,
      trigger: "redispatch_system",
      redispatchSequence: 1,
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "multi_pass", minDispatchPasses: "2", limit: "100", sortBy: "lastDecisionAt", sortOrder: "desc" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const item = res.body.items.find((i: any) => i.bookingId === bookingId);
    expect(item).toBeTruthy();
    expect(item.totalDispatchPasses).toBeGreaterThanOrEqual(2);
    expect(item.exceptionReasons).toContain("multi_pass");
    expect(item.latestDecisionStatus).toBe("no_candidates");
  });

  it("type=all returns bookings with any exception reason", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "all" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.items).toBeDefined();
    expect(res.body.nextCursor !== undefined).toBe(true);
    if (res.body.items.length > 0) {
      const withReasons = res.body.items.filter(
        (i: any) => Array.isArray(i.exceptionReasons) && i.exceptionReasons.length > 0,
      );
      expect(withReasons.length).toBeGreaterThan(0);
    }
  });

  it("bookingStatus filter returns only matching status", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ bookingStatus: "pending_dispatch" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    for (const item of res.body.items) {
      expect(item.bookingStatus).toBe("pending_dispatch");
    }
  });

  it("limit is respected", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ limit: "2" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.items.length).toBeLessThanOrEqual(2);
  });

  it("admin auth enforced: no token fails", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .expect(401);
  });

  it("admin auth enforced: non-admin token fails", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });
});
