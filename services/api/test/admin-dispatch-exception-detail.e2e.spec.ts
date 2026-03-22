import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(35000);

describe("Admin dispatch exception detail (E2E)", () => {
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

    const customerEmail = `cust_detail_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `admin_detail_${Date.now()}@servelink.local`;
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
        note: "E2E exception detail",
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

  const badBookingId = "clxxxxxxxxxxxxxxxxxxxxxxxxx";

  it("returns exception detail with decision history", async () => {
    const bookingId = await createBookingOnly();

    await (prisma as any).dispatchDecision.create({
      data: {
        bookingId,
        trigger: "initial_dispatch",
        dispatchSequence: 1,
        redispatchSequence: 0,
        decisionStatus: "no_candidates",
        scoringVersion: "provider-aware-dispatch-v1",
        bookingSnapshot: {},
      },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/dispatch-exception-detail`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.bookingId).toBe(bookingId);
    expect(res.body.latestDecisionStatus).toBe("no_candidates");
    expect(res.body.exceptionReasons).toContain("no_candidates");
    expect(res.body.decisions.length).toBe(1);
  });

  it("returns manual intervention info", async () => {
    const bookingId = await createBookingOnly();

    await (prisma as any).dispatchDecision.create({
      data: {
        bookingId,
        trigger: "initial_dispatch",
        dispatchSequence: 1,
        redispatchSequence: 0,
        decisionStatus: "no_candidates",
        scoringVersion: "provider-aware-dispatch-v1",
        bookingSnapshot: {},
      },
    });

    await (prisma as any).dispatchDecision.create({
      data: {
        bookingId,
        trigger: "redispatch_manual",
        dispatchSequence: 2,
        redispatchSequence: 1,
        decisionStatus: "deferred",
        scoringVersion: "provider-aware-dispatch-v1",
        bookingSnapshot: {},
        decisionMeta: { adminId: "admin-1" },
      },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/dispatch-exception-detail`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.hasManualIntervention).toBe(true);
    expect(res.body.latestManualActionBy).toBe("admin-1");
    expect(res.body.latestManualActionAt).toBeTruthy();
  });

  it("operator notes are returned", async () => {
    const bookingId = await createBookingOnly();
    const noteText = "Ops note for E2E";

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/dispatch-operator-notes`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ note: noteText })
      .expect((r) => {
        expect([200, 201]).toContain(r.status);
      });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/dispatch-exception-detail`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.notes.length).toBe(1);
    expect(res.body.notes[0].note).toBe(noteText);
  });

  it("note endpoint rejects blank note", async () => {
    const bookingId = await createBookingOnly();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/dispatch-operator-notes`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ note: "" })
      .expect(400);
  });

  it("auth enforced: GET detail without token returns 401", async () => {
    const bookingId = await createBookingOnly();
    await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/dispatch-exception-detail`)
      .expect(401);
  });

  it("auth enforced: POST note without token returns 401", async () => {
    const bookingId = await createBookingOnly();
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/dispatch-operator-notes`)
      .send({ note: "x" })
      .expect(401);
  });

  it("auth enforced: customer token returns 403", async () => {
    const bookingId = await createBookingOnly();
    await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/dispatch-exception-detail`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });

  it("404 when booking missing: GET detail", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/bookings/${badBookingId}/dispatch-exception-detail`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });

  it("404 when booking missing: POST note", async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${badBookingId}/dispatch-operator-notes`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ note: "x" })
      .expect(404);
  });
});
