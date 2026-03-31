import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

async function ingestMinimal(
  app: INestApplication,
  token: string,
  source: string,
  status: string,
  failed: boolean,
) {
  await request(app.getHttpServer())
    .post("/api/v1/admin/system-tests/report")
    .set("Authorization", `Bearer ${token}`)
    .send({
      source,
      branch: "main",
      status,
      summary: {
        totalCount: 2,
        passedCount: failed ? 1 : 2,
        failedCount: failed ? 1 : 0,
        skippedCount: 0,
        flakyCount: 0,
      },
      cases: [
        {
          suite: "admin",
          filePath: "a.spec.ts",
          title: "t1",
          fullName: "t1",
          status: "passed",
          rawCaseJson: {},
        },
        {
          suite: "fo",
          filePath: "b.spec.ts",
          title: "t2",
          fullName: "t2",
          status: failed ? "failed" : "passed",
          errorMessage: failed ? "boom" : null,
          errorStack: failed ? "Error: boom\n  at x" : null,
          rawCaseJson: {},
        },
      ],
      rawReportJson: {},
    })
    .expect(201);
}

describe("Admin system-tests summary (E2E)", () => {
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
    const adminEmail = `admin_st_summary_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = loginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();

    await ingestMinimal(app, adminToken, "older", "partial", true);
    await new Promise((r) => setTimeout(r, 5));
    await ingestMinimal(app, adminToken, "newer", "passed", false);
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns summary shape with latest run and suite breakdown", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/system-tests/summary")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.latestRun).toBeDefined();
    expect(res.body.latestRun.source).toBe("newer");
    expect(typeof res.body.latestPassRate).toBe("number");
    expect(res.body.latestFailedCount).toBe(0);
    expect(res.body.latestRunAt).toBeDefined();
    expect(Array.isArray(res.body.suiteBreakdown)).toBe(true);
    expect(res.body.suiteBreakdown.length).toBeGreaterThan(0);
    const adminBucket = res.body.suiteBreakdown.find((s: { suite: string }) => s.suite === "admin");
    expect(adminBucket).toBeDefined();
    expect(adminBucket.total).toBe(1);
  });

  it("lists failures in latestFailures (capped)", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/system-tests/summary")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.latestFailures)).toBe(true);
  });

  it("includes fixOpportunities as an array (empty when no actionable families)", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/system-tests/summary")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.fixOpportunities)).toBe(true);
    expect(res.body.fixOpportunities.length).toBeLessThanOrEqual(5);
  });
});
