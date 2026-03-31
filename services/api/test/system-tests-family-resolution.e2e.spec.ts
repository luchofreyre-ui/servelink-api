import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("Admin system-tests family resolution (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmail = `admin_st_family_resolution_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = loginRes.body?.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns diagnosis and fix recommendations for a failure family", async () => {
    const run = await prisma.systemTestRun.create({
      data: {
        source: "playwright",
        status: "failed",
        totalCount: 1,
        passedCount: 0,
        failedCount: 1,
        skippedCount: 0,
        flakyCount: 0,
        rawReportJson: {},
      },
    });

    const intelligence = await prisma.systemTestRunIntelligence.create({
      data: {
        runId: run.id,
        ingestionVersion: "v1",
        sourceContentHash: `family-resolution-e2e-${run.id}`,
        canonicalRunAt: new Date("2026-03-28T10:00:00.000Z"),
        status: "failed",
        totalCount: 1,
        passedCount: 0,
        failedCount: 1,
        skippedCount: 0,
        flakyCount: 0,
        passRate: 0,
        chronologyJson: [],
        ingestionWarningsJson: [],
        analysisStatus: "completed",
      },
    });

    const familyKey = `family-connection-refused-${Date.now()}`;
    const family = await prisma.systemTestFailureFamily.create({
      data: {
        familyKey,
        displayTitle: "Admin page unavailable",
        rootCauseSummary: "Playwright could not connect to localhost:3000",
        firstSeenRunId: run.id,
        lastSeenRunId: run.id,
      },
    });

    const canonicalKey = `canonical-cr-${run.id}`;
    const group = await prisma.systemTestFailureGroup.create({
      data: {
        runId: run.id,
        runIntelligenceId: intelligence.id,
        canonicalKey,
        canonicalFingerprint: "net::ERR_CONNECTION_REFUSED",
        file: "tests/playwright/regression/admin/admin-auth-dashboard.spec.ts",
        title: "page.goto connection refused",
        shortMessage: "page.goto failed with connection refused",
        fullMessage:
          "page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/admin",
        occurrences: 1,
        testTitlesJson: [],
        evidenceSummaryJson: {},
        diagnosticPreviewJson: {},
        richEvidenceJson: {
          artifacts: [
            {
              kind: "trace",
              text: "net::ERR_CONNECTION_REFUSED",
            },
          ],
        },
        sortOrder: 0,
      },
    });

    await prisma.systemTestFailureFamilyMembership.create({
      data: {
        familyId: family.id,
        familyVersion: "v1",
        failureGroupId: group.id,
        runId: run.id,
        canonicalKey,
        matchBasis: "e2e_fixture",
      },
    });

    try {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/system-tests/families/${family.id}/resolution`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        diagnosis: {
          familyId: family.id,
          category: "environment_unavailable",
        },
      });

      expect(response.body.diagnosis.rootCause).toMatch(/not reachable|unavailable|connect/i);
      expect(Array.isArray(response.body.diagnosis.signals)).toBe(true);
      expect(response.body.diagnosis.signals.length).toBeGreaterThan(0);

      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.recommendations.length).toBeGreaterThan(0);
      expect(response.body.recommendations[0]).toMatchObject({
        familyId: family.id,
        cursorReady: true,
      });
      expect(Array.isArray(response.body.recommendations[0].actions)).toBe(true);
      expect(response.body.recommendations[0].actions.length).toBeGreaterThan(0);
    } finally {
      await prisma.systemTestFailureFamily.delete({ where: { id: family.id } });
      await prisma.systemTestRun.delete({ where: { id: run.id } });
    }
  });

  it("returns 404 for a missing family", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/system-tests/families/family_missing/resolution")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });

  it("family list rows include resolutionPreview derived from Phase 10A resolution", async () => {
    const run = await prisma.systemTestRun.create({
      data: {
        source: "playwright",
        status: "failed",
        totalCount: 1,
        passedCount: 0,
        failedCount: 1,
        skippedCount: 0,
        flakyCount: 0,
        rawReportJson: {},
      },
    });

    const intelligence = await prisma.systemTestRunIntelligence.create({
      data: {
        runId: run.id,
        ingestionVersion: "v1",
        sourceContentHash: `family-list-preview-${run.id}`,
        canonicalRunAt: new Date("2026-03-28T10:00:00.000Z"),
        status: "failed",
        totalCount: 1,
        passedCount: 0,
        failedCount: 1,
        skippedCount: 0,
        flakyCount: 0,
        passRate: 0,
        chronologyJson: [],
        ingestionWarningsJson: [],
        analysisStatus: "completed",
      },
    });

    const familyKey = `family-list-preview-${Date.now()}`;
    const family = await prisma.systemTestFailureFamily.create({
      data: {
        familyKey,
        displayTitle: "List preview family",
        rootCauseSummary: "Playwright could not connect to localhost:3000",
        firstSeenRunId: run.id,
        lastSeenRunId: run.id,
      },
    });

    const canonicalKey = `canonical-lp-${run.id}`;
    const group = await prisma.systemTestFailureGroup.create({
      data: {
        runId: run.id,
        runIntelligenceId: intelligence.id,
        canonicalKey,
        canonicalFingerprint: "net::ERR_CONNECTION_REFUSED",
        file: "tests/playwright/regression/admin/admin-auth-dashboard.spec.ts",
        title: "page.goto connection refused",
        shortMessage: "page.goto failed with connection refused",
        fullMessage:
          "page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/admin",
        occurrences: 1,
        testTitlesJson: [],
        evidenceSummaryJson: {},
        diagnosticPreviewJson: {},
        richEvidenceJson: {
          artifacts: [{ kind: "trace", text: "net::ERR_CONNECTION_REFUSED" }],
        },
        sortOrder: 0,
      },
    });

    await prisma.systemTestFailureFamilyMembership.create({
      data: {
        familyId: family.id,
        familyVersion: "v1",
        failureGroupId: group.id,
        runId: run.id,
        canonicalKey,
        matchBasis: "e2e_fixture",
      },
    });

    try {
      const listRes = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/families")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(listRes.body)).toBe(true);
      const row = listRes.body.find((r: { id: string }) => r.id === family.id);
      expect(row).toBeDefined();
      expect(row.familyKey).toBe(familyKey);
      expect(row.resolutionPreview).not.toBeNull();
      expect(row.resolutionPreview.hasResolution).toBe(true);
      expect(row.resolutionPreview.category).toBe("environment_unavailable");
      expect(typeof row.resolutionPreview.confidence).toBe("number");
      expect(row.resolutionPreview.topRecommendationSummary).toBeTruthy();
      expect(row.operatorState).toBeDefined();
      expect(row.operatorState.state).toBe("open");
      expect(row.lifecycle).toBeDefined();
      expect(typeof row.lifecycle.lifecycleState).toBe("string");
      expect(typeof row.lifecycle.seenInRunCount).toBe("number");

      const sumRes = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/summary")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(sumRes.body.fixOpportunities)).toBe(true);
      expect(sumRes.body.fixOpportunities.length).toBeLessThanOrEqual(5);
      const opp = sumRes.body.fixOpportunities.find(
        (o: { familyId: string }) => o.familyId === family.id,
      );
      expect(opp).toBeDefined();
      expect(opp.familyKey).toBe(familyKey);
      expect(opp.title).toBe("List preview family");
      expect(opp.category).toBe("environment_unavailable");
      expect(typeof opp.confidence).toBe("number");
      expect(opp.topRecommendationSummary).toBeTruthy();
      expect(opp.operatorState.state).toBe("open");
      expect(opp.lifecycle).toBeDefined();
      expect(typeof opp.lifecycle.lifecycleState).toBe("string");

      const patchDismissed = await request(app.getHttpServer())
        .patch(`/api/v1/admin/system-tests/families/${family.id}/operator-state`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ state: "dismissed" })
        .expect(200);
      expect(patchDismissed.body.state).toBe("dismissed");
      expect(patchDismissed.body.updatedByUserId).toBeTruthy();

      const listHidden = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/families?limit=200")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(listHidden.body.some((r: { id: string }) => r.id === family.id)).toBe(false);

      const listShown = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/families?limit=200&showDismissed=true")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(listShown.body.some((r: { id: string }) => r.id === family.id)).toBe(true);

      const sumDefault = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/summary")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(
        sumDefault.body.fixOpportunities.some((o: { familyId: string }) => o.familyId === family.id),
      ).toBe(false);

      const sumDismissed = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/summary?showDismissed=true")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(
        sumDismissed.body.fixOpportunities.some((o: { familyId: string }) => o.familyId === family.id),
      ).toBe(true);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/system-tests/families/${family.id}/operator-state`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ state: "open" })
        .expect(200);

      const catMatch = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/families?diagnosisCategory=environment_unavailable&limit=200")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(catMatch.body)).toBe(true);
      expect(catMatch.body.some((r: { id: string }) => r.id === family.id)).toBe(true);

      const catMiss = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/families?diagnosisCategory=auth_state&limit=200")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(catMiss.body.some((r: { id: string }) => r.id === family.id)).toBe(false);

      const tierHigh = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/families?confidenceTier=high&limit=200")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(tierHigh.body.some((r: { id: string }) => r.id === family.id)).toBe(true);

      const tierLow = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/families?confidenceTier=low&limit=200")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(tierLow.body.some((r: { id: string }) => r.id === family.id)).toBe(false);

      const sortConfRes = await request(app.getHttpServer())
        .get("/api/v1/admin/system-tests/families?sortBy=confidence&sortDirection=desc&limit=200")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(sortConfRes.body)).toBe(true);
      expect(sortConfRes.body.length).toBeGreaterThanOrEqual(1);
    } finally {
      await prisma.systemTestFailureFamily.delete({ where: { id: family.id } });
      await prisma.systemTestRun.delete({ where: { id: run.id } });
    }
  });
});
