import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(35000);

describe("Admin dispatch exceptions prescriptive (E2E)", () => {
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

    const customerEmail = `cust_presc_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `admin_presc_${Date.now()}@servelink.local`;
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

  async function createBookingOnly() {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E prescriptive",
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
          siteLat: 36.154,
          siteLng: -95.992,
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id;
    expect(bookingId).toBeTruthy();
    return bookingId as string;
  }

  async function createDispatchDecision(args: {
    bookingId: string;
    decisionStatus: string;
    dispatchSequence: number;
    trigger?: string;
    redispatchSequence?: number;
    decisionMeta?: Record<string, unknown>;
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
        decisionMeta: args.decisionMeta ?? undefined,
        // Ensure this decision is among the most recent rows even in non-isolated test/dev DBs.
        createdAt: new Date(
          Date.now() +
            10 * 365 * 24 * 60 * 60 * 1000 +
            args.dispatchSequence * 1000,
        ),
      },
    });
  }

  it("no_candidates recommends manual_assign", async () => {
    const bookingId = await createBookingOnly();

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

    const item = res.body.items.find((i: any) => i.bookingId === bookingId);
    expect(item).toBeTruthy();
    expect(item.severity).toBe("high");
    expect(item.recommendedAction).toBe("manual_assign");
    expect(item.availableActions).toContain("manual_assign");
    expect(item.detailPath).toBe(
      `/api/v1/admin/bookings/${bookingId}/dispatch-exception-detail`,
    );
  });

  it("all_excluded recommends review_exclusions", async () => {
    const bookingId = await createBookingOnly();

    await createDispatchDecision({
      bookingId,
      decisionStatus: "all_excluded",
      dispatchSequence: 1,
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "all_excluded", limit: "100", sortBy: "lastDecisionAt", sortOrder: "desc" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const item = res.body.items.find((i: any) => i.bookingId === bookingId);
    expect(item).toBeTruthy();
    expect(item.recommendedAction).toBe("review_exclusions");
    expect(item.severity).toBe("high");
  });

  it("multi_pass recommends open_detail", async () => {
    const bookingId = await createBookingOnly();

    await createDispatchDecision({
      bookingId,
      decisionStatus: "selected",
      dispatchSequence: 1,
    });
    await createDispatchDecision({
      bookingId,
      decisionStatus: "selected",
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
    expect(item.recommendedAction).toBe("open_detail");
  });

  it("manual intervention changes recommendation bias", async () => {
    const bookingId = await createBookingOnly();

    await createDispatchDecision({
      bookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 1,
    });
    await createDispatchDecision({
      bookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 2,
      trigger: "redispatch_manual",
      redispatchSequence: 1,
      decisionMeta: { adminId: "admin-1" },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "all", limit: "200", sortBy: "lastDecisionAt", sortOrder: "desc" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const item = res.body.items.find((i: any) => i.bookingId === bookingId);
    expect(item).toBeTruthy();
    expect(item.hasManualIntervention).toBe(true);
    expect(item.latestManualActionBy).toBe("admin-1");
    expect(item.recommendedAction).toBe("open_detail");
  });

  it("detailPath is present on all returned items", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "all" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    for (const item of res.body.items) {
      expect(item.detailPath).toBeTruthy();
      expect(typeof item.detailPath).toBe("string");
      expect(item.detailPath.length).toBeGreaterThan(0);
      expect(item.detailPath).toContain("/dispatch-exception-detail");
    }
  });

  it("auth enforced: no token returns 401", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "all" })
      .expect(401);
  });

  it("auth enforced: customer token returns 403", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "all" })
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });
});
