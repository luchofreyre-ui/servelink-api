import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(45000);

describe("GET /api/v1/system/ops/summary", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  const password = "test-password-ops-summary";
  const stamp = `ops_summary_${Date.now()}`;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmail = `${stamp}_admin@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: Role.admin },
    });

    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = adminLogin.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: stamp } },
    });
    await app.close();
  });

  it("returns cron health and slot hold integrity shapes", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/system/ops/summary")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const summary = res.body?.summary;
    expect(res.body?.cron).toBeTruthy();
    expect(res.body?.slotHolds).toBeTruthy();
    expect(summary?.cron).toBeTruthy();
    expect(summary?.cron?.reconciliation).toBeTruthy();
    expect(summary?.cron?.remainingBalanceAuth).toBeTruthy();
    expect(res.body.cron).toEqual(summary.cron);
    expect(res.body.slotHolds).toEqual(summary.slotHolds);

    for (const snapshot of [
      summary.cron.reconciliation,
      summary.cron.remainingBalanceAuth,
    ]) {
      expect(
        snapshot.lastRunAt === null || typeof snapshot.lastRunAt === "string",
      ).toBe(true);
      expect(
        snapshot.lastSuccessAt === null ||
          typeof snapshot.lastSuccessAt === "string",
      ).toBe(true);
      expect(
        snapshot.lastFailureAt === null ||
          typeof snapshot.lastFailureAt === "string",
      ).toBe(true);
      expect(typeof snapshot.stale).toBe("boolean");
    }

    expect(summary?.slotHolds).toEqual(
      expect.objectContaining({
        active: expect.any(Number),
        expired: expect.any(Number),
        consumed: expect.any(Number),
      }),
    );
  });
});
