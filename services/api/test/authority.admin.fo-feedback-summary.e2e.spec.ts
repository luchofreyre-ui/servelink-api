import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(35000);

describe("Authority admin FO feedback summary (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
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
    const ts = Date.now();
    const adminEmail = `admin_fofb_${ts}@servelink.local`;
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

  it("returns fo_authority_feedback_admin_summary shape", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/fo-feedback-summary")
      .query({ windowHours: 8760 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.kind).toBe("fo_authority_feedback_admin_summary");
    expect(res.body.windowUsed).not.toBeNull();
    expect(typeof res.body.totalCount).toBe("number");
    expect(typeof res.body.helpfulCount).toBe("number");
    expect(typeof res.body.notHelpfulCount).toBe("number");
    expect(typeof res.body.undecidedCount).toBe("number");
    expect(Array.isArray(res.body.recent)).toBe(true);
    expect(Array.isArray(res.body.topSelectedKnowledgePaths)).toBe(true);
  });
});
