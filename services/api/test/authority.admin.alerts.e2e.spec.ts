import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(35000);

describe("Authority admin alerts (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  const password = "test-password";
  const bookingIds: string[] = [];

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();
    const adminEmail = `admin_alerts_${ts}@servelink.local`;
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
    await app.close();
  });

  it("returns deterministic alert payload shape", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/alerts")
      .query({
        windowHours: 1,
        minSampleSize: 5000,
        mismatchTypeMinCount: 10000,
        unstableTagScoreMin: 10000,
        overrideRateHighThreshold: 0.99,
        reviewRateLowThreshold: 0,
      })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.kind).toBe("booking_authority_alerts");
    expect(res.body.generatedAt).toBeTruthy();
    expect(res.body.windowUsed.fromIso).toBeTruthy();
    expect(res.body.windowUsed.toIso).toBeTruthy();
    expect(typeof res.body.thresholdsUsed).toBe("object");
    expect(Array.isArray(res.body.alerts)).toBe(true);
    for (const a of res.body.alerts) {
      expect(typeof a.alertType).toBe("string");
      expect(["low", "medium", "high"]).toContain(a.severity);
      expect(typeof a.evidenceSummary).toBe("string");
      expect(a.windowUsed.fromIso).toBeTruthy();
      expect(typeof a.details).toBe("object");
    }
  });

});
