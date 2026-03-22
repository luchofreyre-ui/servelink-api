import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(35000);

describe("Admin dispatch ops (E2E)", () => {
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

    const customerEmail = `cust_ops_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `admin_ops_${Date.now()}@servelink.local`;
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
        note: overrides.note ?? "E2E dispatch ops",
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

    const scheduledStart = new Date(
      Date.now() + 25 * 24 * 60 * 60 * 1000,
    ).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule", scheduledStart })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    return bookingId as string;
  }

  async function createFranchiseOwner() {
    const passwordHash = await bcrypt.hash(password, 10);
    const foUser = await prisma.user.create({
      data: {
        email: `fo_ops_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: foUser.id,
        status: "active",
        safetyHold: false,
        displayName: "Ops E2E FO",
        homeLat: 36.154,
        homeLng: -95.992,
      },
    });
    return fo;
  }

  const badBookingId = "clxxxxxxxxxxxxxxxxxxxxxxxxx";

  it("manual redispatch: creates new decision with trigger redispatch_manual and incremented sequence", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E manual redispatch",
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
      .post(`/api/v1/admin/bookings/${bookingId}/dispatch/manual-redispatch`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ adminId: "admin-1" })
      .expect((r) => {
        expect([200, 201]).toContain(r.status);
      });

    const body = res.body;
    expect(body.id).toBeTruthy();
    expect(body.trigger).toBe("redispatch_manual");
    expect(body.dispatchSequence).toBe(2);
    expect(body.decisionStatus).toBe("deferred");

    const decisions = await (prisma as any).dispatchDecision.findMany({
      where: { bookingId },
      orderBy: { dispatchSequence: "asc" },
    });
    expect(decisions.length).toBe(2);
    const latest = decisions[decisions.length - 1];
    expect(latest.trigger).toBe("redispatch_manual");
    expect(latest.dispatchSequence).toBe(2);
    expect(latest.decisionStatus).toBe("deferred");
  });

  it("manual assign: updates booking to assigned and creates decision with manual_assign", async () => {
    const bookingId = await createAndScheduleBooking({
      note: "E2E manual assign",
    });
    const fo = await createFranchiseOwner();

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/dispatch/manual-assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        franchiseOwnerId: fo.id,
        adminId: "admin-1",
      })
      .expect((r) => {
        expect([200, 201]).toContain(r.status);
      });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    expect(booking).toBeTruthy();
    expect(booking!.status).toBe("assigned");
    expect(booking!.foId).toBe(fo.id);

    expect(res.body.trigger).toBe("manual_assign");
    expect(res.body.decisionStatus).toBe("manual_assigned");
    expect(res.body.selectedFranchiseOwnerId).toBe(fo.id);
  });

  it("exclude provider: creates decision and candidate with excluded and excluded_manual_block", async () => {
    const bookingId = await createAndScheduleBooking({
      note: "E2E exclude provider",
    });
    const fo = await createFranchiseOwner();

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/dispatch/exclude-provider`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        franchiseOwnerId: fo.id,
        adminId: "admin-1",
      })
      .expect((r) => {
        expect([200, 201]).toContain(r.status);
      });

    expect(res.body.id).toBeTruthy();

    const candidates = await (prisma as any).dispatchDecisionCandidate.findMany({
      where: { dispatchDecisionId: res.body.id },
    });
    expect(candidates.length).toBe(1);
    expect(candidates[0].candidateStatus).toBe("excluded");
    expect(candidates[0].reasonCode).toBe("excluded_manual_block");
  });

  it("auth enforced: no token returns 401", async () => {
    const bookingId = await createAndScheduleBooking();
    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/dispatch/manual-redispatch`)
      .send({ adminId: "admin-1" })
      .expect(401);
  });

  it("auth enforced: customer token returns 403", async () => {
    const bookingId = await createAndScheduleBooking();
    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${bookingId}/dispatch/manual-redispatch`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ adminId: "admin-1" })
      .expect(403);
  });

  it("booking not found: manual-redispatch returns 404", async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${badBookingId}/dispatch/manual-redispatch`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ adminId: "admin-1" })
      .expect(404);
  });

  it("booking not found: manual-assign returns 404", async () => {
    const fo = await createFranchiseOwner();
    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${badBookingId}/dispatch/manual-assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ franchiseOwnerId: fo.id, adminId: "admin-1" })
      .expect(404);
  });

  it("booking not found: exclude-provider returns 404", async () => {
    const fo = await createFranchiseOwner();
    await request(app.getHttpServer())
      .post(`/api/v1/admin/bookings/${badBookingId}/dispatch/exclude-provider`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ franchiseOwnerId: fo.id, adminId: "admin-1" })
      .expect(404);
  });
});
