import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("Authority admin routes (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let foToken: string;
  let adminToken: string;

  const password = "test-password";
  const resolvePath = "/api/v1/admin/authority/resolve-booking-tags";
  const body = { notes: "Kitchen tile backsplash has heavy grease buildup" };

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();

    const customerEmail = `cust_auth_admin_${ts}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: "customer" },
    });
    const custLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password })
      .expect(201);
    customerToken = custLogin.body?.accessToken;
    expect(customerToken).toBeTruthy();

    const foUserEmail = `fo_auth_admin_${ts}@servelink.local`;
    const foUser = await prisma.user.create({
      data: { email: foUserEmail, passwordHash, role: "fo" },
    });
    await prisma.franchiseOwner.create({
      data: {
        userId: foUser.id,
        status: "active",
        safetyHold: false,
        teamSize: 1,
        maxSquareFootage: 2000,
        maxLaborMinutes: 480,
        maxDailyLaborMinutes: 600,
        homeLat: 36.15,
        homeLng: -95.99,
        maxTravelMinutes: 45,
        reliabilityScore: 90,
        displayName: "E2E FO",
        photoUrl: "https://example.com/p.jpg",
        bio: "Test",
        yearsExperience: 1,
        completedJobsCount: 0,
      },
    });
    const foLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: foUserEmail, password })
      .expect(201);
    foToken = foLogin.body?.accessToken;
    expect(foToken).toBeTruthy();

    const adminEmail = `admin_auth_authority_${ts}@servelink.local`;
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "admin" },
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

  it("blocks unauthenticated requests with 401", async () => {
    await request(app.getHttpServer())
      .post(resolvePath)
      .send(body)
      .expect(401);
  });

  it("blocks customer role with 403", async () => {
    await request(app.getHttpServer())
      .post(resolvePath)
      .set("Authorization", `Bearer ${customerToken}`)
      .send(body)
      .expect(403);
  });

  it("blocks franchise-owner role with 403", async () => {
    await request(app.getHttpServer())
      .post(resolvePath)
      .set("Authorization", `Bearer ${foToken}`)
      .send(body)
      .expect(403);
  });

  it("allows admin with valid JWT", async () => {
    const res = await request(app.getHttpServer())
      .post(resolvePath)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(body)
      .expect(201);

    expect(res.body?.surfaces).toContain("tile");
    expect(res.body?.methods).toContain("degreasing");
    expect(Array.isArray(res.body?.reasons)).toBe(true);
  });
});
