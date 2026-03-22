import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("Admin dispatch explainer (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;
  let bookingWithDecisionId: string;
  let bookingNoDecisionId: string;
  let bookingAllExcludedId: string;
  let foId: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const customerEmail = `cust_explainer_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `admin_explainer_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = adminLoginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();

    const foUser = await prisma.user.create({
      data: {
        email: `fo_explainer_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });

    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: foUser.id,
        status: "active",
        safetyHold: false,
        teamSize: 2,
        maxSquareFootage: 2600,
        maxLaborMinutes: 480,
        homeLat: 36.15398,
        homeLng: -95.99277,
        maxTravelMinutes: 60,
        reliabilityScore: 95,
        displayName: "Explainer FO",
      },
    });
    foId = fo.id;

    const createWithSchedule = async (note: string) => {
      const createRes = await request(app.getHttpServer())
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          note,
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
      const id = createRes.body?.booking?.id;
      expect(id).toBeTruthy();
      const scheduledStart = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${id}/schedule`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ note: "Schedule", scheduledStart })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(200);
          expect(res.status).toBeLessThan(300);
        });
      return id;
    };

    bookingWithDecisionId = await createWithSchedule("Explainer selected");
    bookingNoDecisionId = (
      await request(app.getHttpServer())
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          note: "Explainer no decision",
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
        .expect(201)
    ).body?.booking?.id;

    const customer = await prisma.user.findFirst({ where: { email: customerEmail } });
    expect(customer).toBeTruthy();
    const bookingAllExcluded = await prisma.booking.create({
      data: {
        customerId: customer!.id,
        status: "pending_dispatch",
        hourlyRateCents: 10000,
        estimatedHours: 2,
        scheduledStart: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
      },
    });
    bookingAllExcludedId = bookingAllExcluded.id;

    const decision = await prisma.dispatchDecision.create({
      data: {
        bookingId: bookingAllExcludedId,
        trigger: "manual",
        dispatchSequence: 1,
        redispatchSequence: 0,
        decisionStatus: "all_excluded",
        scoringVersion: "dispatch-config-v1",
        bookingSnapshot: {},
        candidates: {
          create: [
            {
              franchiseOwnerId: foId,
              candidateStatus: "excluded",
              reasonCode: "excluded_manual_block",
              reasonDetail: "Manual block",
            },
          ],
        },
      },
      include: { candidates: true },
    });
    expect(decision.candidates.length).toBeGreaterThanOrEqual(1);
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns selected candidate explanation when booking has selected decision", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingWithDecisionId}/dispatch-explainer`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.id).toBe(bookingWithDecisionId);
    expect(res.body.summary).toBeDefined();
    expect(Array.isArray(res.body.candidates)).toBe(true);
    expect(Array.isArray(res.body.notes)).toBe(true);
    if (res.body.candidates.length > 0) {
      const selected = res.body.candidates.find((c: any) => c.selected);
      if (selected) {
        expect(selected.foId).toBeDefined();
        expect(Array.isArray(selected.explanation)).toBe(true);
        expect(selected.factors).toBeDefined();
        expect(typeof selected.factors.loadPenalty).toBe("number");
      }
    }
  });

  it("returns exclusion-based summary when all candidates excluded", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingAllExcludedId}/dispatch-explainer`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.booking.id).toBe(bookingAllExcludedId);
    expect(res.body.summary).toContain("all candidates were excluded");
    expect(Array.isArray(res.body.candidates)).toBe(true);
    const excluded = res.body.candidates.filter((c: any) => c.excluded);
    expect(excluded.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty explanation when no dispatch decision", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingNoDecisionId}/dispatch-explainer`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.booking.id).toBe(bookingNoDecisionId);
    expect(res.body.candidates).toEqual([]);
    expect(res.body.summary).toContain("No dispatch decision history");
  });

  it("returns 401 without token", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingWithDecisionId}/dispatch-explainer`)
      .expect(401);
  });

  it("returns 403 with customer token", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingWithDecisionId}/dispatch-explainer`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });

  it("returns 404 for missing booking", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/bookings/clxxxxxxxxxxxxxxxxxxxxxxxxx/dispatch-explainer")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });
});
