import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { applyBodyParserMiddleware } from "../src/http/configure-body-parsers";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("Admin system-tests report ingest (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication({ bodyParser: false });
    applyBodyParserMiddleware(app.getHttpAdapter().getInstance());
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmail = `admin_system_tests_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = loginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("ingests a report and returns created run summary", async () => {
    const body = {
      source: "playwright-local",
      branch: "main",
      commitSha: "abc123",
      status: "passed",
      durationMs: 5000,
      summary: {
        totalCount: 2,
        passedCount: 2,
        failedCount: 0,
        skippedCount: 0,
        flakyCount: 0,
      },
      cases: [
        {
          filePath: "apps/web/tests/playwright/regression/customer/customer-smoke.spec.ts",
          title: "shows card",
          fullName: "customer > shows card",
          status: "passed",
          retryCount: 0,
          durationMs: 100,
          errorMessage: null,
          errorStack: null,
          expectedStatus: "passed",
          line: 10,
          column: 1,
          route: null,
          selector: null,
          artifactJson: { trace: null, video: null, screenshot: null },
          rawCaseJson: {},
        },
        {
          suite: "admin",
          filePath: "apps/web/tests/playwright/regression/admin/foo.spec.ts",
          title: "bar",
          fullName: "admin > bar",
          status: "passed",
          retryCount: 0,
          rawCaseJson: {},
        },
      ],
      rawReportJson: { version: 1 },
    };

    const res = await request(app.getHttpServer())
      .post("/api/v1/admin/system-tests/report")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(body)
      .expect(201);

    expect(res.body.run).toBeDefined();
    expect(res.body.run.id).toBeDefined();
    expect(res.body.run.source).toBe("playwright-local");
    expect(res.body.run.totalCount).toBe(2);

    const row = await prisma.systemTestCaseResult.findFirst({
      where: { filePath: body.cases[0].filePath },
    });
    expect(row).toBeTruthy();
    expect(row!.suite).toBe("customer");
  });

  it("accepts large report ingest with a trailing slash (pathname must still match)", async () => {
    const pad = "y".repeat(900);
    const cases = Array.from({ length: 120 }, (_, i) => ({
      filePath: `apps/web/tests/playwright/regression/slash/slash-${i}.spec.ts`,
      title: `slash ${i}`,
      fullName: `slash > ${i}`,
      status: "passed",
      retryCount: 0,
      durationMs: 1,
      errorMessage: null,
      errorStack: null,
      expectedStatus: "passed",
      line: 1,
      column: 1,
      route: null,
      selector: null,
      artifactJson: null,
      rawCaseJson: { pad },
    }));

    const body = {
      source: "playwright-trailing-slash-e2e",
      branch: "main",
      commitSha: "slash1",
      status: "passed",
      durationMs: 1,
      summary: {
        totalCount: cases.length,
        passedCount: cases.length,
        failedCount: 0,
        skippedCount: 0,
        flakyCount: 0,
      },
      cases,
      rawReportJson: { envelopeVersion: 1, padding: pad.repeat(30) },
    };

    const serialized = JSON.stringify(body);
    expect(Buffer.byteLength(serialized, "utf8")).toBeGreaterThan(100_000);

    const res = await request(app.getHttpServer())
      .post("/api/v1/admin/system-tests/report/")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("Content-Type", "application/json")
      .send(serialized)
      .expect(201);

    expect(res.body.run.totalCount).toBe(cases.length);
  });

  it("accepts a large report body (> default 100kb) on the ingest route", async () => {
    const pad = "x".repeat(900);
    const cases = Array.from({ length: 180 }, (_, i) => ({
      filePath: `apps/web/tests/playwright/regression/bulk/bulk-${i}.spec.ts`,
      title: `case ${i}`,
      fullName: `bulk > case ${i}`,
      status: "passed",
      retryCount: 0,
      durationMs: 1,
      errorMessage: null,
      errorStack: null,
      expectedStatus: "passed",
      line: 1,
      column: 1,
      route: null,
      selector: null,
      artifactJson: null,
      rawCaseJson: { note: pad },
    }));

    const body = {
      source: "playwright-large-payload-e2e",
      branch: "main",
      commitSha: "large1",
      status: "passed",
      durationMs: 1,
      summary: {
        totalCount: cases.length,
        passedCount: cases.length,
        failedCount: 0,
        skippedCount: 0,
        flakyCount: 0,
      },
      cases,
      rawReportJson: { envelopeVersion: 1, stats: { expected: cases.length }, padding: pad.repeat(40) },
    };

    const serialized = JSON.stringify(body);
    expect(Buffer.byteLength(serialized, "utf8")).toBeGreaterThan(120_000);

    const res = await request(app.getHttpServer())
      .post("/api/v1/admin/system-tests/report")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("Content-Type", "application/json")
      .send(serialized)
      .expect(201);

    expect(res.body.run.totalCount).toBe(cases.length);
  });

  it("keeps the default JSON limit on routes other than system-tests report ingest", async () => {
    const hugePassword = "x".repeat(150_000);
    await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "nope@example.com", password: hugePassword })
      .expect(413);
  });

  it("rejects non-admin callers", async () => {
    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const customerEmail = `cust_st_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    const token = loginRes.body?.accessToken;

    await request(app.getHttpServer())
      .post("/api/v1/admin/system-tests/report")
      .set("Authorization", `Bearer ${token}`)
      .send({
        source: "x",
        status: "failed",
        summary: {
          totalCount: 0,
          passedCount: 0,
          failedCount: 0,
          skippedCount: 0,
          flakyCount: 0,
        },
        cases: [],
        rawReportJson: {},
      })
      .expect(403);
  });
});
