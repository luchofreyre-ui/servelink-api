import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { AUTHORITY_SNAPSHOT_METADATA } from "../src/modules/authority/authority.snapshot";

jest.setTimeout(25000);

describe("Authority snapshot metadata (E2E)", () => {
  let app: INestApplication;
  let adminToken: string;
  const password = "test-password";

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    const prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();
    const adminEmail = `admin_snap_meta_${ts}@servelink.local`;
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

  it("returns fixed snapshot metadata shape and values", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/authority/snapshot-metadata")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.kind).toBe("authority_snapshot_metadata");
    expect(res.body.snapshotVersion).toBe(AUTHORITY_SNAPSHOT_METADATA.version);
    expect(res.body.snapshotSource).toBe(AUTHORITY_SNAPSHOT_METADATA.source);
    expect(res.body.updatedAt).toBeNull();
    expect(Object.keys(res.body).sort()).toEqual(
      ["kind", "snapshotSource", "snapshotVersion", "updatedAt"].sort(),
    );
  });

  it("rejects unauthenticated requests", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/authority/snapshot-metadata")
      .expect(401);
  });
});
