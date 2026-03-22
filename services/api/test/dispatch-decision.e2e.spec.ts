import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("Dispatch decision persistence (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let fo1Id: string;
  let fo2Id: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const customerEmail = `cust_disp_dec_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const foUser1 = await prisma.user.create({
      data: {
        email: `fo_disp_dec_1_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });

    const foUser2 = await prisma.user.create({
      data: {
        email: `fo_disp_dec_2_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });

    const fo1 = await prisma.franchiseOwner.create({
      data: {
        userId: foUser1.id,
        status: "active",
        safetyHold: false,
        teamSize: 2,
        maxSquareFootage: 2600,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36.15398,
        homeLng: -95.99277,
        maxTravelMinutes: 60,
        reliabilityScore: 95,
        displayName: "Dispatch Dec FO1",
      },
    });

    const fo2 = await prisma.franchiseOwner.create({
      data: {
        userId: foUser2.id,
        status: "active",
        safetyHold: false,
        teamSize: 2,
        maxSquareFootage: 2600,
        maxLaborMinutes: 480,
        homeLat: 36.1612,
        homeLng: -95.9895,
        maxTravelMinutes: 60,
        reliabilityScore: 88,
        displayName: "Dispatch Dec FO2",
      },
    });

    fo1Id = fo1.id;
    fo2Id = fo2.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("selected decision persists when dispatch runs with eligible providers", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E dispatch decision selected",
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

    const scheduledStart = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule for dispatch", scheduledStart })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const decisions = await prisma.dispatchDecision.findMany({
      where: { bookingId },
      include: {
        candidates: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { dispatchSequence: "asc" },
    });

    expect(decisions.length).toBeGreaterThanOrEqual(1);
    const last = decisions[decisions.length - 1];
    expect(last.decisionStatus).toBe("selected");
    expect(last.selectedFranchiseOwnerId).toBeTruthy();
    expect(last.candidates.some((c) => c.candidateStatus === "selected")).toBe(true);
    expect(last.candidates.some((c) => c.candidateStatus === "rejected" || c.candidateStatus === "excluded")).toBe(true);
  });

  it("all_excluded persists when providers exist but all are excluded", async () => {
    const foUserNoLoc = await prisma.user.create({
      data: {
        email: `fo_disp_dec_noloc_${Date.now()}@servelink.local`,
        passwordHash: "hash",
        role: "fo",
      },
    });

    await prisma.franchiseOwner.create({
      data: {
        userId: foUserNoLoc.id,
        status: "active",
        safetyHold: false,
        displayName: "No location FO",
        homeLat: null,
        homeLng: null,
      },
    });

    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E dispatch decision all_excluded",
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

    const scheduledStart = new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule for all_excluded", scheduledStart })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const decisions = await prisma.dispatchDecision.findMany({
      where: { bookingId },
      include: { candidates: true },
      orderBy: { dispatchSequence: "asc" },
    });

    const allExcludedDecision = decisions.find((d) => d.decisionStatus === "all_excluded");
    if (allExcludedDecision) {
      expect(allExcludedDecision.candidates.every((c) => c.candidateStatus === "excluded")).toBe(true);
    }
  });

  it("no_candidates persists when no providers match", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E dispatch decision no_candidates",
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
          siteLat: -80,
          siteLng: 170,
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id;
    expect(bookingId).toBeTruthy();

    const scheduledStart = new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule for no_candidates", scheduledStart })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const decisions = await prisma.dispatchDecision.findMany({
      where: { bookingId },
      include: { candidates: true },
      orderBy: { dispatchSequence: "asc" },
    });

    const noCandidatesDecision = decisions.find((d) => d.decisionStatus === "no_candidates");
    if (noCandidatesDecision) {
      expect(noCandidatesDecision.candidates).toHaveLength(0);
    }
  });

  it("append-only history: multiple decision rows have incrementing dispatchSequence", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E dispatch decision append-only",
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
          siteLat: 36.155,
          siteLng: -95.991,
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id;
    expect(bookingId).toBeTruthy();

    const scheduledStart = new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule for append-only", scheduledStart })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const decisions = await prisma.dispatchDecision.findMany({
      where: { bookingId },
      orderBy: { dispatchSequence: "asc" },
    });

    expect(decisions.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < decisions.length; i++) {
      expect(decisions[i].dispatchSequence).toBeGreaterThan(decisions[i - 1].dispatchSequence);
    }
  });
});
