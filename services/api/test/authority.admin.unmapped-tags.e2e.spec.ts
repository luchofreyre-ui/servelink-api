import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(35000);

describe("Authority admin unmapped tags (E2E)", () => {
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
    const adminEmail = `admin_umap_${ts}@servelink.local`;
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

  it("returns booking_authority_unmapped_tags shape", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/knowledge-unmapped-tags")
      .query({ maxRowsScan: 50, windowHours: 8760 })
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.kind).toBe("booking_authority_unmapped_tags");
    expect(res.body.maxRowsScan).toBe(50);
    expect(typeof res.body.rowsScanned).toBe("number");
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.windowUsed).not.toBeNull();
  });
});
