import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(35000);

describe("Admin dispatch exceptions triage (E2E)", () => {
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

    const customerEmail = `cust_triage_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `admin_triage_${Date.now()}@servelink.local`;
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
        note: "E2E triage",
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
    return (prisma as any).dispatchDecision.create({
      data: {
        bookingId: args.bookingId,
        trigger: args.trigger ?? "initial_dispatch",
        dispatchSequence: args.dispatchSequence,
        redispatchSequence: args.redispatchSequence ?? 0,
        decisionStatus: args.decisionStatus,
        scoringVersion: "provider-aware-dispatch-v1",
        bookingSnapshot: {},
        decisionMeta: args.decisionMeta ?? undefined,
        // Ensure this decision is among the most recent rows even in a non-isolated DB.
        createdAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  it("urgent priority when severity high and start < 60 min", async () => {
    const bookingId = await createBookingOnly();

    const startIn30Min = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.booking.update({
      where: { id: bookingId },
      data: { scheduledStart: startIn30Min },
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

    const item = res.body.items.find((i: any) => i.bookingId === bookingId);
    expect(item).toBeTruthy();
    expect(item.priorityBucket).toBe("urgent");
    expect(item.priorityScore).toBeGreaterThanOrEqual(150);
  });

  it("retry penalty increases score for many dispatch passes", async () => {
    const bookingId = await createBookingOnly();

    for (let seq = 1; seq <= 5; seq++) {
      await createDispatchDecision({
        bookingId,
        decisionStatus: "no_candidates",
        dispatchSequence: seq,
        trigger: seq > 1 ? "redispatch_system" : "initial_dispatch",
        redispatchSequence: seq > 1 ? seq - 1 : 0,
      });
    }

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "no_candidates", limit: "100", sortBy: "lastDecisionAt", sortOrder: "desc" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const item = res.body.items.find((i: any) => i.bookingId === bookingId);
    expect(item).toBeTruthy();
    expect(item.totalDispatchPasses).toBe(5);
    expect(item.priorityScore).toBeGreaterThanOrEqual(100 + 30);
  });

  it("manual intervention lowers priority", async () => {
    const bookingId = await createBookingOnly();

    await createDispatchDecision({
      bookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 1,
    });

    const resBefore = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "all", limit: "200", sortBy: "lastDecisionAt", sortOrder: "desc" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const itemBefore = resBefore.body.items.find((i: any) => i.bookingId === bookingId);
    expect(itemBefore).toBeTruthy();
    const scoreBefore = itemBefore.priorityScore;

    await createDispatchDecision({
      bookingId,
      decisionStatus: "deferred",
      dispatchSequence: 2,
      trigger: "redispatch_manual",
      redispatchSequence: 1,
      decisionMeta: { adminId: "admin-1" },
    });

    const resAfter = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "all", limit: "200", sortBy: "lastDecisionAt", sortOrder: "desc" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const itemAfter = resAfter.body.items.find((i: any) => i.bookingId === bookingId);
    expect(itemAfter).toBeTruthy();
    expect(itemAfter.priorityScore).toBeLessThan(scoreBefore);
  });

  it("stale follow-up detection when manual action was 45 minutes ago", async () => {
    const bookingId = await createBookingOnly();

    await createDispatchDecision({
      bookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 1,
    });

    const manualDecision = await createDispatchDecision({
      bookingId,
      decisionStatus: "deferred",
      dispatchSequence: 2,
      trigger: "redispatch_manual",
      redispatchSequence: 1,
      decisionMeta: { adminId: "admin-1" },
    });

    const fortyFiveMinAgo = new Date(Date.now() - 45 * 60 * 1000);
    await (prisma as any).dispatchDecision.update({
      where: { id: manualDecision.id },
      data: { createdAt: fortyFiveMinAgo },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ type: "all", limit: "200", sortBy: "lastDecisionAt", sortOrder: "desc" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const item = res.body.items.find((i: any) => i.bookingId === bookingId);
    expect(item).toBeTruthy();
    expect(item.requiresFollowUp).toBe(true);
    expect(item.staleSince).toBeTruthy();
  });

  it("follow-up filter returns only stale items", async () => {
    const bookingId = await createBookingOnly();

    await createDispatchDecision({
      bookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 1,
    });

    const manualDecision = await createDispatchDecision({
      bookingId,
      decisionStatus: "deferred",
      dispatchSequence: 2,
      trigger: "redispatch_manual",
      redispatchSequence: 1,
      decisionMeta: { adminId: "admin-1" },
    });

    const fortyFiveMinAgo = new Date(Date.now() - 45 * 60 * 1000);
    await (prisma as any).dispatchDecision.update({
      where: { id: manualDecision.id },
      data: { createdAt: fortyFiveMinAgo },
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({ requiresFollowUp: "1", limit: "100", sortBy: "lastDecisionAt", sortOrder: "desc" })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    for (const item of res.body.items) {
      expect(item.requiresFollowUp).toBe(true);
    }
    const ourItem = res.body.items.find((i: any) => i.bookingId === bookingId);
    expect(ourItem).toBeTruthy();
  });

  it("priority sorting: urgent then high then normal", async () => {
    const urgentBookingId = await createBookingOnly();
    const startIn30Min = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.booking.update({
      where: { id: urgentBookingId },
      data: { scheduledStart: startIn30Min },
    });
    await createDispatchDecision({
      bookingId: urgentBookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 1,
    });
    await createDispatchDecision({
      bookingId: urgentBookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 2,
      trigger: "redispatch_system",
      redispatchSequence: 1,
    });

    const highBookingId = await createBookingOnly();
    await createDispatchDecision({
      bookingId: highBookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 1,
    });
    await createDispatchDecision({
      bookingId: highBookingId,
      decisionStatus: "no_candidates",
      dispatchSequence: 2,
      trigger: "redispatch_system",
      redispatchSequence: 1,
    });

    const normalBookingId = await createBookingOnly();
    await createDispatchDecision({
      bookingId: normalBookingId,
      decisionStatus: "selected",
      dispatchSequence: 1,
    });
    await createDispatchDecision({
      bookingId: normalBookingId,
      decisionStatus: "selected",
      dispatchSequence: 2,
      trigger: "redispatch_system",
      redispatchSequence: 1,
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/dispatch/exceptions")
      .query({
        type: "all",
        minDispatchPasses: "2",
        limit: "300",
        sortBy: "lastDecisionAt",
        sortOrder: "desc",
      })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const urgentItem = res.body.items.find((i: any) => i.bookingId === urgentBookingId);
    const highItem = res.body.items.find((i: any) => i.bookingId === highBookingId);
    const normalItem = res.body.items.find((i: any) => i.bookingId === normalBookingId);

    expect(urgentItem).toBeTruthy();
    expect(highItem).toBeTruthy();
    expect(normalItem).toBeTruthy();

    expect(urgentItem.priorityBucket).toBe("urgent");
    expect(highItem.priorityBucket).toBe("high");
    expect(normalItem.priorityBucket).toBe("normal");

    expect(urgentItem.priorityScore).toBeGreaterThanOrEqual(highItem.priorityScore);
    expect(highItem.priorityScore).toBeGreaterThanOrEqual(normalItem.priorityScore);
  });
});
