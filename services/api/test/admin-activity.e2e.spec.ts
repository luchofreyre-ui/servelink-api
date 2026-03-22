import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("Admin activity feed (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const password = "test-password";
    const passwordHash = await bcrypt.hash(password, 10);

    const adminEmail = `admin_activity_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);

    adminToken = adminLoginRes.body?.accessToken;
    expect(adminToken).toBeTruthy();

    const customerEmail = `cust_activity_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });

    const customerLoginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);

    customerToken = customerLoginRes.body?.accessToken;
    expect(customerToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns items and nextCursor shape", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/activity")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.nextCursor !== undefined).toBe(true);
    res.body.items.forEach((item: any) => {
      expect(item.id).toBeDefined();
      expect(item.type).toBeDefined();
      expect(item.createdAt).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.description).toBeDefined();
      expect(item.metadata !== undefined).toBe(true);
      expect(item).toHaveProperty("summary");
      expect(item).toHaveProperty("detailPath");
      expect(item).toHaveProperty("anomalyId");
    });
  });

  it("accepts cursor offset for paging", async () => {
    const first = await request(app.getHttpServer())
      .get("/api/v1/admin/activity?limit=5")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const cursor = first.body.nextCursor;
    if (cursor != null) {
      const second = await request(app.getHttpServer())
        .get(`/api/v1/admin/activity?limit=5&cursor=${encodeURIComponent(String(cursor))}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(second.body.items)).toBe(true);
    }
  });

  it("returns dispatch config publish activity after publish", async () => {
    const config = await prisma.dispatchConfig.findFirst({
      where: { status: "active" },
      orderBy: { version: "desc" },
    });
    if (config) {
      const audit = await prisma.dispatchConfigPublishAudit.findFirst({
        where: { dispatchConfigId: config.id },
        orderBy: { publishedAt: "desc" },
      });
      if (audit) {
        const res = await request(app.getHttpServer())
          .get("/api/v1/admin/activity")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        const publishItem = res.body.items.find(
          (i: any) => i.type === "dispatch_config_published" && i.id === audit.id,
        );
        if (publishItem) {
          expect(publishItem.title).toContain("Dispatch config published");
          expect(publishItem.dispatchConfigId).toBe(config.id);
        }
      }
    }
  });

  it("sorted newest-first", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/activity")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const dates = res.body.items.map((i: any) => new Date(i.createdAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
  });

  it("returns 401 without token", async () => {
    await request(app.getHttpServer()).get("/api/v1/admin/activity").expect(401);
  });

  it("returns 403 with customer token", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/activity")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });
});
