import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("Admin system-tests run detail (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let runId: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmail = `admin_st_detail_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = loginRes.body?.accessToken;

    const ingest = await request(app.getHttpServer())
      .post("/api/v1/admin/system-tests/report")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        source: "ci",
        status: "failed",
        summary: {
          totalCount: 3,
          passedCount: 1,
          failedCount: 2,
          skippedCount: 0,
          flakyCount: 0,
        },
        cases: [
          {
            suite: "public",
            filePath: "p.spec.ts",
            title: "ok",
            fullName: "public > ok",
            status: "passed",
            rawCaseJson: {},
          },
          {
            suite: "public",
            filePath: "p2.spec.ts",
            title: "bad",
            fullName: "public > bad",
            status: "failed",
            errorMessage: "nope",
            errorStack: "Error: nope\n  at test.ts:1:1",
            route: "/x",
            selector: "button",
            line: 9,
            column: 2,
            retryCount: 1,
            rawCaseJson: {},
          },
          {
            suite: "admin",
            filePath: "a.spec.ts",
            title: "also bad",
            fullName: "admin > also bad",
            status: "failed",
            rawCaseJson: {},
          },
        ],
        rawReportJson: {},
      })
      .expect(201);

    runId = ingest.body.run.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns detail with diagnostic report and failed cases first", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/system-tests/runs/${runId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.run.id).toBe(runId);
    expect(res.body.diagnosticReport).toContain("Run ID:");
    expect(res.body.diagnosticReport).toContain("public > bad");
    expect(Array.isArray(res.body.suiteBreakdown)).toBe(true);
    expect(Array.isArray(res.body.cases)).toBe(true);
    expect(res.body.cases.length).toBe(3);
    expect(res.body.cases[0].status).toBe("failed");
    expect(res.body.cases[1].status).toBe("failed");
    expect(res.body.cases[2].status).toBe("passed");
  });

  it("404s for missing run", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/system-tests/runs/cmissingid")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });

  it("lists runs newest-first", async () => {
    const ingestSecond = await request(app.getHttpServer())
      .post("/api/v1/admin/system-tests/report")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        source: "second-run",
        status: "passed",
        summary: {
          totalCount: 1,
          passedCount: 1,
          failedCount: 0,
          skippedCount: 0,
          flakyCount: 0,
        },
        cases: [
          {
            suite: "admin",
            filePath: "only.spec.ts",
            title: "only",
            fullName: "only",
            status: "passed",
            rawCaseJson: {},
          },
        ],
        rawReportJson: {},
      })
      .expect(201);

    const secondId = ingestSecond.body.run.id;

    const list = await request(app.getHttpServer())
      .get("/api/v1/admin/system-tests/runs?limit=10&page=1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(list.body.items[0].id).toBe(secondId);
    expect(list.body.total).toBeGreaterThanOrEqual(2);
  });

  it("cascade-deletes case rows when run is deleted", async () => {
    const ingest = await request(app.getHttpServer())
      .post("/api/v1/admin/system-tests/report")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        source: "cascade-test",
        status: "passed",
        summary: {
          totalCount: 1,
          passedCount: 1,
          failedCount: 0,
          skippedCount: 0,
          flakyCount: 0,
        },
        cases: [
          {
            suite: "admin",
            filePath: "cascade.spec.ts",
            title: "c",
            fullName: "c",
            status: "passed",
            rawCaseJson: {},
          },
        ],
        rawReportJson: {},
      })
      .expect(201);

    const id = ingest.body.run.id;
    const before = await prisma.systemTestCaseResult.count({ where: { runId: id } });
    expect(before).toBe(1);

    await prisma.systemTestRun.delete({ where: { id } });

    const after = await prisma.systemTestCaseResult.count({ where: { runId: id } });
    expect(after).toBe(0);
  });
});
