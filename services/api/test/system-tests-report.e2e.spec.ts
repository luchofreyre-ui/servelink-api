import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
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

    app = modRef.createNestApplication();
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
