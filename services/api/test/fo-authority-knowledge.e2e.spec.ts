import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

jest.setTimeout(25000);

describe("FO authority knowledge links (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let foToken: string;
  let adminToken: string;
  const password = "test-password";
  const path = "/api/v1/fo/authority/knowledge-links";

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = Date.now();

    const foUser = await prisma.user.create({
      data: {
        email: `fo_know_${ts}@servelink.local`,
        passwordHash,
        role: "fo",
      },
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
        displayName: "E2E FO Know",
        photoUrl: "https://example.com/p.jpg",
        bio: "Test",
        yearsExperience: 1,
        completedJobsCount: 0,
      },
    });
    const foLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: foUser.email, password })
      .expect(201);
    foToken = foLogin.body?.accessToken;
    expect(foToken).toBeTruthy();

    await prisma.user.create({
      data: {
        email: `admin_know_${ts}@servelink.local`,
        passwordHash,
        role: "admin",
      },
    });
    const adminLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: `admin_know_${ts}@servelink.local`, password })
      .expect(201);
    adminToken = adminLogin.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns knowledge links for FO", async () => {
    const res = await request(app.getHttpServer())
      .post(path)
      .set("Authorization", `Bearer ${foToken}`)
      .send({
        problems: ["grease-buildup", "limescale", "hard-water-deposits"],
        surfaces: ["tile"],
        methods: ["degreasing"],
      })
      .expect(201);

    expect(res.body.kind).toBe("fo_authority_knowledge_links");
    expect(Array.isArray(res.body.links)).toBe(true);
    const paths = res.body.links.map((l: { pathname: string }) => l.pathname);
    expect(paths).toContain("/problems/grease-buildup");
    expect(paths).toContain("/problems/hard-water-deposits");
    expect(paths).toContain("/surfaces/tile");
    expect(paths).toContain("/methods/degreasing");
    const hw = res.body.links.find(
      (l: { pathname: string }) => l.pathname === "/problems/hard-water-deposits",
    );
    expect(hw.sourceTags.sort()).toEqual(["hard-water-deposits", "limescale"].sort());
  });

  it("blocks non-FO roles", async () => {
    await request(app.getHttpServer())
      .post(path)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ problems: ["soap-scum"] })
      .expect(403);
  });

  it("requires authentication", async () => {
    await request(app.getHttpServer())
      .post(path)
      .send({ problems: ["soap-scum"] })
      .expect(401);
  });
});
