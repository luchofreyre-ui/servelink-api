import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { seedBookingPaymentAuthorized } from "./helpers/booking-payment-test-helpers";

jest.setTimeout(35000);

describe("Admin dispatch config (E2E)", () => {
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

    const customerEmail = `cust_dispatch_cfg_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const adminEmail = `admin_dispatch_cfg_${Date.now()}@servelink.local`;
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

  const base = "/api/v1/admin/dispatch-config";

  it("1. bootstrap returns active + draft", async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`${base}/active`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .get(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const active = activeRes.body;
    const draft = draftRes.body;

    expect(active).toBeTruthy();
    expect(draft).toBeTruthy();
    expect(active.status).toBe("active");
    expect(draft.status).toBe("draft");
    expect(typeof active.version).toBe("number");
    expect(typeof draft.version).toBe("number");
    expect(active.version).toBeLessThan(draft.version);
  });

  it("2. update draft works", async () => {
    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ acceptancePenaltyWeight: 2.5 })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const draftRes = await request(app.getHttpServer())
      .get(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Number(draftRes.body.acceptancePenaltyWeight)).toBe(2.5);
  });

  it("3. publish promotes draft to active", async () => {
    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ label: "E2E publish test", completionPenaltyWeight: 1.5 })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    await request(app.getHttpServer())
      .post(`${base}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ adminUserId: null })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const activeRes = await request(app.getHttpServer())
      .get(`${base}/active`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const draftRes = await request(app.getHttpServer())
      .get(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const active = activeRes.body;
    const draft = draftRes.body;

    expect(active.status).toBe("active");
    expect(Number(active.completionPenaltyWeight)).toBe(1.5);
    expect(draft.status).toBe("draft");
    expect(draft.version).toBeGreaterThan(active.version);
  });

  it("3b. compare returns no changes when draft matches active", async () => {
    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        label: "Compare no-change baseline",
        acceptancePenaltyWeight: 1.25,
        completionPenaltyWeight: 1.75,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    await request(app.getHttpServer())
      .post(`${base}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({})
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const compareRes = await request(app.getHttpServer())
      .get(`${base}/compare`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(compareRes.body.hasActive).toBe(true);
    expect(compareRes.body.hasChanges).toBe(false);
    expect(compareRes.body.summary.changeCount).toBe(0);
    expect(compareRes.body.summary.highImpactChangeCount).toBe(0);
    expect(compareRes.body.diffs).toEqual([]);

    const previewRes = await request(app.getHttpServer())
      .get(`${base}/publish-preview`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(previewRes.body.hasChanges).toBe(false);
    expect(previewRes.body.canPublish).toBe(false);
    expect(previewRes.body.warnings).toContain(
      "This draft has no changes compared with the active dispatch config.",
    );
    expect(previewRes.body.publishSummary).toBe(
      "This draft does not change live dispatch behavior.",
    );
  });

  it("3c. compare returns a high-impact timing diff", async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`${base}/active`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const activeOfferExpiryMinutes = activeRes.body.offerExpiryMinutes;

    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        offerExpiryMinutes: activeOfferExpiryMinutes + 1,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const compareRes = await request(app.getHttpServer())
      .get(`${base}/compare`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const diff = compareRes.body.diffs.find(
      (item: any) => item.field === "offerExpiryMinutes",
    );

    expect(diff).toBeTruthy();
    expect(diff.category).toBe("timing");
    expect(diff.impactLevel).toBe("high");
    expect(diff.before).toBe(activeOfferExpiryMinutes);
    expect(diff.after).toBe(activeOfferExpiryMinutes + 1);
    expect(diff.message).toContain("accept dispatch offers");

    const previewRes = await request(app.getHttpServer())
      .get(`${base}/publish-preview`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(previewRes.body.highlights).toContain(
      "Cleaners will have more time to accept offers.",
    );
  });

  it("3d. publish preview warns on contradictory response speed config", async () => {
    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        enableResponseSpeedWeighting: true,
        responseSpeedWeight: 0,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const previewRes = await request(app.getHttpServer())
      .get(`${base}/publish-preview`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(previewRes.body.hasChanges).toBe(true);
    expect(previewRes.body.warnings).toContain(
      "Response speed weighting is enabled, but response speed weight is 0, so the feature is effectively inactive.",
    );
  });

  it("3e. compare includes configJson diff when config changes", async () => {
    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        loadPenaltyWeight: 2.25,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const compareRes = await request(app.getHttpServer())
      .get(`${base}/compare`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const jsonDiff = compareRes.body.diffs.find(
      (item: any) => item.field === "configJson",
    );

    expect(jsonDiff).toBeTruthy();
    expect(jsonDiff.category).toBe("json");
    expect(jsonDiff.impactLevel).toBe("high");
  });

  it("3f. publish preview warns when reoffer after expiry is disabled", async () => {
    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        allowReofferAfterExpiry: false,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const previewRes = await request(app.getHttpServer())
      .get(`${base}/publish-preview`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(previewRes.body.warnings).toContain(
      "Reoffer after expiry is disabled, so expired offers will not be automatically reissued.",
    );
    const reofferHighlight = "Expired offers will no longer be reissued automatically.";
    if (previewRes.body.diffs?.some((d: { field: string }) => d.field === "allowReofferAfterExpiry")) {
      expect(previewRes.body.highlights).toContain(reofferHighlight);
    }
  });

  it("3g. publish writes an audit snapshot with diffs, warnings, highlights, and summary", async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`${base}/active`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const active = activeRes.body;

    const nextOfferExpiryMinutes =
      active.offerExpiryMinutes === 6 ? 7 : 6;

    const nextAllowReofferAfterExpiry = !active.allowReofferAfterExpiry;

    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        offerExpiryMinutes: nextOfferExpiryMinutes,
        allowReofferAfterExpiry: nextAllowReofferAfterExpiry,
        responseSpeedWeight: 0,
        enableResponseSpeedWeighting: true,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const publishRes = await request(app.getHttpServer())
      .post(`${base}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({})
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const publishedVersion = publishRes.body.version;
    const publishedId = publishRes.body.id;

    const historyRes = await request(app.getHttpServer())
      .get(`${base}/publish-history`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(historyRes.body.items)).toBe(true);
    expect(historyRes.body.items.length).toBeGreaterThan(0);

    const latest = historyRes.body.items[0];
    expect(latest.dispatchConfigId).toBe(publishedId);
    expect(latest.toVersion).toBe(publishedVersion);
    expect(typeof latest.publishSummary).toBe("string");
    expect(latest.publishSummary.length).toBeGreaterThan(0);
    expect(Array.isArray(latest.diffSnapshot)).toBe(true);
    expect(Array.isArray(latest.warningsSnapshot)).toBe(true);
    expect(Array.isArray(latest.highlightsSnapshot)).toBe(true);

    expect(
      latest.diffSnapshot.some((d: any) => d.field === "offerExpiryMinutes"),
    ).toBe(true);

    expect(latest.warningsSnapshot).toContain(
      "Response speed weighting is enabled, but response speed weight is 0, so the feature is effectively inactive.",
    );

    if (nextAllowReofferAfterExpiry === false) {
      expect(latest.warningsSnapshot).toContain(
        "Reoffer after expiry is disabled, so expired offers will not be automatically reissued.",
      );
      expect(latest.highlightsSnapshot).toContain(
        "Expired offers will no longer be reissued automatically.",
      );
    } else {
      expect(latest.highlightsSnapshot).toContain(
        "Expired offers can continue to be reissued automatically.",
      );
    }
  });

  it("3h. latest publish-history endpoint returns the newest audit snapshot", async () => {
    const latestRes = await request(app.getHttpServer())
      .get(`${base}/publish-history/latest`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(latestRes.body).toBeTruthy();
    expect(typeof latestRes.body.id).toBe("string");
    expect(typeof latestRes.body.toVersion).toBe("number");
    expect(Array.isArray(latestRes.body.diffSnapshot)).toBe(true);
    expect(Array.isArray(latestRes.body.warningsSnapshot)).toBe(true);
    expect(Array.isArray(latestRes.body.highlightsSnapshot)).toBe(true);
    expect(typeof latestRes.body.publishSummary).toBe("string");
  });

  it("3i. publish-history by id returns a specific audit snapshot", async () => {
    const historyRes = await request(app.getHttpServer())
      .get(`${base}/publish-history`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(historyRes.body.items)).toBe(true);
    expect(historyRes.body.items.length).toBeGreaterThan(0);

    const auditId = historyRes.body.items[0].id;

    const auditRes = await request(app.getHttpServer())
      .get(`${base}/publish-history/${auditId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(auditRes.body).toBeTruthy();
    expect(auditRes.body.id).toBe(auditId);
    expect(typeof auditRes.body.dispatchConfigId).toBe("string");
    expect(Array.isArray(auditRes.body.diffSnapshot)).toBe(true);
    expect(Array.isArray(auditRes.body.warningsSnapshot)).toBe(true);
    expect(Array.isArray(auditRes.body.highlightsSnapshot)).toBe(true);
    expect(typeof auditRes.body.publishSummary).toBe("string");
  });

  it("3j. rollback from audit restores the draft from the audited published config", async () => {
    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        acceptancePenaltyWeight: 3.5,
        completionPenaltyWeight: 2.25,
        loadPenaltyWeight: 1.75,
        offerExpiryMinutes: 7,
        assignedStartGraceMinutes: 11,
        allowReofferAfterExpiry: false,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const publishRes = await request(app.getHttpServer())
      .post(`${base}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({})
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const publishedVersion = publishRes.body.version;

    const historyRes = await request(app.getHttpServer())
      .get(`${base}/publish-history`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const matchingAudit = historyRes.body.items.find(
      (item: any) => item.toVersion === publishedVersion,
    );

    expect(matchingAudit).toBeTruthy();

    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        acceptancePenaltyWeight: 9,
        completionPenaltyWeight: 9,
        loadPenaltyWeight: 9,
        offerExpiryMinutes: 5,
        assignedStartGraceMinutes: 15,
        allowReofferAfterExpiry: true,
      })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const rollbackRes = await request(app.getHttpServer())
      .post(`${base}/rollback-from-audit`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ auditId: matchingAudit.id })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    expect(rollbackRes.body.label).toBe(`Rollback draft from v${publishedVersion}`);
    expect(Number(rollbackRes.body.acceptancePenaltyWeight)).toBe(3.5);
    expect(Number(rollbackRes.body.completionPenaltyWeight)).toBe(2.25);
    expect(Number(rollbackRes.body.loadPenaltyWeight)).toBe(1.75);
    expect(rollbackRes.body.offerExpiryMinutes).toBe(7);
    expect(rollbackRes.body.assignedStartGraceMinutes).toBe(11);
    expect(rollbackRes.body.allowReofferAfterExpiry).toBe(false);

    const draftRes = await request(app.getHttpServer())
      .get(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(draftRes.body.label).toBe(`Rollback draft from v${publishedVersion}`);
    expect(Number(draftRes.body.acceptancePenaltyWeight)).toBe(3.5);
    expect(Number(draftRes.body.completionPenaltyWeight)).toBe(2.25);
    expect(Number(draftRes.body.loadPenaltyWeight)).toBe(1.75);
    expect(draftRes.body.offerExpiryMinutes).toBe(7);
    expect(draftRes.body.assignedStartGraceMinutes).toBe(11);
    expect(draftRes.body.allowReofferAfterExpiry).toBe(false);
  });

  it("3k. rollback from a nonexistent audit returns 404", async () => {
    await request(app.getHttpServer())
      .post(`${base}/rollback-from-audit`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ auditId: "does-not-exist" })
      .expect(404);
  });

  it("4a. validation rejects negative weight", async () => {
    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ acceptancePenaltyWeight: -1 })
      .expect(400);
  });

  it("4b. validation rejects absurd offer expiry", async () => {
    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ offerExpiryMinutes: 999 })
      .expect(400);
  });

  it("5a. auth enforced: no token returns 401", async () => {
    await request(app.getHttpServer())
      .get(`${base}/active`)
      .expect(401);
  });

  it("5b. auth enforced: customer token returns 403", async () => {
    await request(app.getHttpServer())
      .get(`${base}/active`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });

  it("5c. auth enforced: no token cannot access publish history", async () => {
    await request(app.getHttpServer())
      .get(`${base}/publish-history`)
      .expect(401);
  });

  it("5d. auth enforced: customer token cannot access publish history", async () => {
    await request(app.getHttpServer())
      .get(`${base}/publish-history`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });

  it("5e. auth enforced: no token cannot access publish-history by id", async () => {
    const historyRes = await request(app.getHttpServer())
      .get(`${base}/publish-history`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const auditId = historyRes.body.items[0]?.id;
    expect(auditId).toBeTruthy();

    await request(app.getHttpServer())
      .get(`${base}/publish-history/${auditId}`)
      .expect(401);
  });

  it("5f. auth enforced: customer token cannot rollback from audit", async () => {
    const historyRes = await request(app.getHttpServer())
      .get(`${base}/publish-history`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const auditId = historyRes.body.items[0]?.id;
    expect(auditId).toBeTruthy();

    await request(app.getHttpServer())
      .post(`${base}/rollback-from-audit`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ auditId })
      .expect(403);
  });

  it("6. scoringVersion changes after publish", async () => {
    await request(app.getHttpServer())
      .post(`${base}/draft`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ label: "E2E scoringVersion test" })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const publishRes = await request(app.getHttpServer())
      .post(`${base}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({})
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const activeVersion = publishRes.body.version;
    const expectedScoringVersion = `dispatch-config-v${activeVersion}`;

    const createRes = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "E2E scoringVersion dispatch",
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

    const scheduledStart = new Date(
      Date.now() + 25 * 24 * 60 * 60 * 1000,
    ).toISOString();

    await seedBookingPaymentAuthorized(prisma, bookingId);

    await request(app.getHttpServer())
      .post(`/api/v1/bookings/${bookingId}/schedule`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "Schedule", scheduledStart })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
      });

    const decisions = await (prisma as any).dispatchDecision.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });

    expect(decisions.length).toBeGreaterThanOrEqual(1);
    const latest = decisions[0];
    expect(latest.scoringVersion).toBe(expectedScoringVersion);
  });
});
