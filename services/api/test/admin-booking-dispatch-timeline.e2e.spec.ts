import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("Admin booking dispatch timeline (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const customerEmail = `cust_admin_timeline_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `admin_timeline_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = adminLoginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();

    const foUser1 = await prisma.user.create({
      data: {
        email: `fo_timeline_1_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });

    const foUser2 = await prisma.user.create({
      data: {
        email: `fo_timeline_2_${Date.now()}@servelink.local`,
        passwordHash,
        role: "fo",
      },
    });

    await prisma.franchiseOwner.create({
      data: {
        userId: foUser1.id,
        status: "active",
        safetyHold: false,
        teamSize: 2,
        maxSquareFootage: 2600,
        maxLaborMinutes: 480,
        homeLat: 36.15398,
        homeLng: -95.99277,
        maxTravelMinutes: 60,
        reliabilityScore: 95,
        displayName: "Timeline FO1",
      },
    });

    await prisma.franchiseOwner.create({
      data: {
        userId: foUser2.id,
        status: "active",
        safetyHold: false,
        teamSize: 2,
        maxSquareFootage: 2600,
        homeLat: 36.1612,
        homeLng: -95.9895,
        maxTravelMinutes: 60,
        reliabilityScore: 88,
        displayName: "Timeline FO2",
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns selected timeline when booking went through provider-aware dispatch", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E admin timeline selected",
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

    const scheduledStart = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule for timeline", scheduledStart })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/dispatch-timeline`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.bookingId).toBe(bookingId);
    expect(res.body.totalDispatchPasses).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.decisions)).toBe(true);
    const selectedDecision = res.body.decisions.find((d: any) => d.decisionStatus === "selected");
    expect(selectedDecision).toBeTruthy();
    expect(
      selectedDecision.candidates.some((c: any) => c.candidateStatus === "selected"),
    ).toBe(true);
    expect(
      selectedDecision.selectedScore === null ||
        typeof selectedDecision.selectedScore === "string",
    ).toBe(true);

    const statuses = selectedDecision.candidates.map((c: any) => c.candidateStatus);
    const selectedIndex = statuses.indexOf("selected");
    const excludedIndex = statuses.indexOf("excluded");
    if (selectedIndex !== -1 && excludedIndex !== -1) {
      expect(selectedIndex).toBeLessThan(excludedIndex);
    }
  });

  it("returns empty decisions for booking with no dispatch history", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E admin timeline no dispatch",
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

    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/dispatch-timeline`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.bookingId).toBe(bookingId);
    expect(res.body.decisions).toEqual([]);
    expect(res.body.totalDispatchPasses).toBe(0);
  });

  it("returns append-only multi-pass history in order", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E admin timeline append-only",
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

    const scheduledStart = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule", scheduledStart })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/dispatch-timeline`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const sequences = res.body.decisions.map((d: any) => d.dispatchSequence);
    expect(sequences).toEqual([...sequences].sort((a: number, b: number) => a - b));
    expect(new Set(sequences).size).toBe(sequences.length);
  });

  it("returns 404 when booking is missing", async () => {
    const fakeId = "clxxxxxxxxxxxxxxxxxxxxxxxxx";

    await request(app.getHttpServer())
      .get(`/api/v1/bookings/${fakeId}/dispatch-timeline`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });

  it("candidate ordering: selected comes before excluded/rejected", async () => {
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E admin timeline ordering",
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
          siteLat: 36.156,
          siteLng: -95.99,
        },
      })
      .expect(201);

    const bookingId = createRes.body?.booking?.id;
    expect(bookingId).toBeTruthy();

    const scheduledStart = new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString();

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule", scheduledStart })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/bookings/${bookingId}/dispatch-timeline`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const selectedDecision = res.body.decisions?.find((d: any) => d.decisionStatus === "selected");
    if (selectedDecision?.candidates?.length) {
      const statuses = selectedDecision.candidates.map((c: any) => c.candidateStatus);
      const selectedIndex = statuses.indexOf("selected");
      const excludedIndex = statuses.indexOf("excluded");
      const rejectedIndex = statuses.indexOf("rejected");
      if (selectedIndex !== -1 && excludedIndex !== -1) {
        expect(selectedIndex).toBeLessThan(excludedIndex);
      }
      if (selectedIndex !== -1 && rejectedIndex !== -1) {
        expect(selectedIndex).toBeLessThan(rejectedIndex);
      }
    }
  });
});
