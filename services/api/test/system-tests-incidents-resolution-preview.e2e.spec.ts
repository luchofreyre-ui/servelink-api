import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { SYSTEM_TEST_INCIDENT_VERSION } from "@servelink/system-test-intelligence";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("Admin system-tests incidents resolutionPreview (E2E)", () => {
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
    const adminEmail = `admin_st_inc_preview_${Date.now()}@servelink.local`;
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

  it("incident with leadFamilyId inherits family resolutionPreview; without leadFamilyId is null", async () => {
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
        sourceContentHash: `inc-preview-${run.id}`,
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

    const familyKey = `inc-lead-family-${Date.now()}`;
    const family = await prisma.systemTestFailureFamily.create({
      data: {
        familyKey,
        displayTitle: "Lead family for incident",
        rootCauseSummary: "Playwright could not connect to localhost:3000",
        firstSeenRunId: run.id,
        lastSeenRunId: run.id,
      },
    });

    const canonicalKey = `canonical-inc-${run.id}`;
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

    const withLead = await prisma.systemTestIncident.create({
      data: {
        runId: run.id,
        incidentKey: `inc-with-lead-${Date.now()}`,
        incidentVersion: SYSTEM_TEST_INCIDENT_VERSION,
        displayTitle: "With lead",
        rootCauseCategory: "environment",
        summary: "s",
        severity: "high",
        status: "active",
        leadFamilyId: family.id,
      },
    });

    const withoutLead = await prisma.systemTestIncident.create({
      data: {
        runId: run.id,
        incidentKey: `inc-no-lead-${Date.now()}`,
        incidentVersion: SYSTEM_TEST_INCIDENT_VERSION,
        displayTitle: "No lead",
        rootCauseCategory: "unknown",
        summary: "s",
        severity: "medium",
        status: "active",
        leadFamilyId: null,
      },
    });

    try {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/system-tests/incidents?runId=${run.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const leadRow = res.body.find(
        (r: { incidentKey: string }) => r.incidentKey === withLead.incidentKey,
      );
      const noLeadRow = res.body.find(
        (r: { incidentKey: string }) => r.incidentKey === withoutLead.incidentKey,
      );
      expect(leadRow.resolutionPreview).not.toBeNull();
      expect(leadRow.resolutionPreview.hasResolution).toBe(true);
      expect(leadRow.resolutionPreview.category).toBe("environment_unavailable");

      expect(noLeadRow.resolutionPreview).toBeNull();

      expect(leadRow.familyOperatorState).not.toBeNull();
      expect(leadRow.familyOperatorState.state).toBe("open");
      expect(leadRow.leadFamilyTitle).toBe("Lead family for incident");
      expect(leadRow.familyLifecycle).not.toBeNull();
      expect(typeof leadRow.familyLifecycle.lifecycleState).toBe("string");
      expect(noLeadRow.familyOperatorState).toBeNull();
      expect(noLeadRow.leadFamilyTitle).toBeNull();
      expect(noLeadRow.familyLifecycle).toBeNull();

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/system-tests/families/${family.id}/operator-state`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ state: "dismissed" })
        .expect(200);

      const incHidden = await request(app.getHttpServer())
        .get(`/api/v1/admin/system-tests/incidents?runId=${run.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(
        incHidden.body.some((r: { incidentKey: string }) => r.incidentKey === withLead.incidentKey),
      ).toBe(false);

      const incShown = await request(app.getHttpServer())
        .get(`/api/v1/admin/system-tests/incidents?runId=${run.id}&showDismissed=true`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(
        incShown.body.some((r: { incidentKey: string }) => r.incidentKey === withLead.incidentKey),
      ).toBe(true);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/system-tests/families/${family.id}/operator-state`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ state: "open" })
        .expect(200);

      const filtered = await request(app.getHttpServer())
        .get(
          `/api/v1/admin/system-tests/incidents?runId=${run.id}&diagnosisCategory=environment_unavailable`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(filtered.body.some((r: { incidentKey: string }) => r.incidentKey === withLead.incidentKey)).toBe(
        true,
      );
      expect(
        filtered.body.some((r: { incidentKey: string }) => r.incidentKey === withoutLead.incidentKey),
      ).toBe(false);

      const tierFiltered = await request(app.getHttpServer())
        .get(`/api/v1/admin/system-tests/incidents?runId=${run.id}&confidenceTier=high`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(
        tierFiltered.body.some((r: { incidentKey: string }) => r.incidentKey === withLead.incidentKey),
      ).toBe(true);
    } finally {
      await prisma.systemTestIncident.deleteMany({
        where: { id: { in: [withLead.id, withoutLead.id] } },
      });
      await prisma.systemTestFailureFamily.delete({ where: { id: family.id } });
      await prisma.systemTestRun.delete({ where: { id: run.id } });
    }
  });
});
