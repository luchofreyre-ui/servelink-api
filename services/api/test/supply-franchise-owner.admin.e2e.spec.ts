import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { FO_ACTIVATION_BLOCKED_CODE } from "../src/modules/fo/fo-activation-guard";

jest.setTimeout(45000);

function parseBlockedBody(res: { body: Record<string, unknown> }) {
  const msg = res.body.message;
  if (msg && typeof msg === "object" && "code" in msg) {
    return msg as { code: string; reasons?: string[]; message?: string };
  }
  if (typeof res.body === "object" && "code" in res.body) {
    return res.body as { code: string; reasons?: string[] };
  }
  return null;
}

describe("Admin supply franchise-owner workflow (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  const password = "supply-admin-test-pw";
  const stamp = `supply_adm_${Date.now()}`;

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
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = login.body?.accessToken;
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.foSchedule.deleteMany({
      where: {
        franchiseOwner: {
          user: { email: { startsWith: `${stamp}_fo` } },
        },
      },
    });
    await prisma.franchiseOwner.deleteMany({
      where: { user: { email: { startsWith: `${stamp}_fo` } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: stamp } },
    });
    await app.close();
  });

  async function createDraftFo() {
    const email = `${stamp}_fo_${Date.now()}@servelink.local`;
    const u = await prisma.user.create({
      data: {
        email,
        phone: `+1999${String(Math.random()).slice(2, 11)}`,
        passwordHash: await bcrypt.hash(password, 10),
        role: Role.fo,
      },
    });
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: u.id,
        status: "onboarding",
        displayName: "Draft supply FO",
      },
    });
    return fo.id;
  }

  async function createPausedReadyFo() {
    const email = `${stamp}_fo_${Date.now()}@servelink.local`;
    const u = await prisma.user.create({
      data: {
        email,
        phone: `+1999${String(Math.random()).slice(2, 11)}`,
        passwordHash: await bcrypt.hash(password, 10),
        role: Role.fo,
      },
    });
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: u.id,
        status: "paused",
        displayName: "Paused ready supply FO",
        homeLat: 36.6,
        homeLng: -115.6,
        maxTravelMinutes: 60,
        maxDailyLaborMinutes: 960,
        maxLaborMinutes: 960,
        maxSquareFootage: 5000,
        foSchedules: {
          create: {
            dayOfWeek: 1,
            startTime: "08:00",
            endTime: "18:00",
          },
        },
      },
    });
    return fo.id;
  }

  /**
   * Prisma FO activation guard blocks creating/updating `active` without readiness.
   * Simulate migration residue: activate through the API, then clear coordinates with raw SQL
   * (extensions do not run on `$executeRaw`).
   */
  async function createActiveFoWithCorruptedCoordsBypassingGuard() {
    const foId = await createDraftFo();
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/supply/franchise-owners/${foId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        homeLat: 36.6,
        homeLng: -115.6,
        maxTravelMinutes: 60,
        maxDailyLaborMinutes: 960,
        maxLaborMinutes: 960,
        maxSquareFootage: 5000,
      })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/v1/admin/supply/franchise-owners/${foId}/weekly-schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        schedule: [{ dayOfWeek: 1, startTime: "08:00", endTime: "18:00" }],
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/supply/franchise-owners/${foId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "active" })
      .expect(200);

    await prisma.$executeRawUnsafe(
      'UPDATE "FranchiseOwner" SET "homeLat" = NULL, "homeLng" = NULL WHERE id = $1',
      foId,
    );
    return foId;
  }

  it("GET detail includes server readiness snapshot", async () => {
    const foId = await createDraftFo();
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/supply/franchise-owners/${foId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.foId).toBe(foId);
    expect(res.body.readiness).toBeTruthy();
    expect(res.body.readiness.supply).toBeTruthy();
    expect(res.body.readiness.execution).toBeTruthy();
    expect(res.body.readiness.execution.ok).toBe(true);
    expect(res.body.queueState).toBe("BLOCKED_CONFIGURATION");
    expect(Array.isArray(res.body.mergedReasonCodes)).toBe(true);
    expect(Array.isArray(res.body.schedules)).toBe(true);
  });

  it("draft save: PATCH non-active FO with partial coordinates is allowed", async () => {
    const foId = await createDraftFo();
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/supply/franchise-owners/${foId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        homeLat: 36.5,
        homeLng: -115.5,
        maxTravelMinutes: 45,
      })
      .expect(200);

    const row = await prisma.franchiseOwner.findUnique({ where: { id: foId } });
    expect(row?.homeLat).toBe(36.5);
    expect(row?.status).toBe("onboarding");
  });

  it("activation blocked returns FO_ACTIVATION_BLOCKED with supply reason codes", async () => {
    const foId = await createDraftFo();
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/supply/franchise-owners/${foId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "active" })
      .expect(400);

    const blocked = parseBlockedBody(res);
    expect(blocked?.code ?? (res.body as { code?: string }).code).toBe(
      FO_ACTIVATION_BLOCKED_CODE,
    );
    const reasons =
      blocked?.reasons ??
      (Array.isArray((res.body as { reasons?: string[] }).reasons)
        ? (res.body as { reasons: string[] }).reasons
        : []);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.some((r) => String(r).includes("FO_"))).toBe(true);
  });

  it("valid activation path: schedule then activate", async () => {
    const foId = await createDraftFo();
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/supply/franchise-owners/${foId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        homeLat: 36.6,
        homeLng: -115.6,
        maxTravelMinutes: 60,
        maxDailyLaborMinutes: 960,
        maxLaborMinutes: 960,
        maxSquareFootage: 5000,
      })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/v1/admin/supply/franchise-owners/${foId}/weekly-schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        schedule: [
          { dayOfWeek: 1, startTime: "08:00", endTime: "18:00" },
        ],
      })
      .expect(200);

    const act = await request(app.getHttpServer())
      .patch(`/api/v1/admin/supply/franchise-owners/${foId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "active" })
      .expect(200);

    expect(act.body.readiness.status).toBe("active");
    expect(act.body.readiness.opsCategory).toBe("ready");
  });

  it("schedule clear while active is blocked with FO_ACTIVATION_BLOCKED", async () => {
    const email = `${stamp}_fo_active_clear_${Date.now()}@servelink.local`;
    const u = await prisma.user.create({
      data: {
        email,
        phone: `+1888${String(Math.random()).slice(2, 11)}`,
        passwordHash: await bcrypt.hash(password, 10),
        role: Role.fo,
      },
    });
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: u.id,
        status: "active",
        displayName: "Active schedule clear",
        homeLat: 36.7,
        homeLng: -115.7,
        maxTravelMinutes: 60,
        maxDailyLaborMinutes: 960,
        maxLaborMinutes: 960,
        maxSquareFootage: 5000,
        foSchedules: {
          create: {
            dayOfWeek: 2,
            startTime: "07:00",
            endTime: "19:00",
          },
        },
      },
    });

    const res = await request(app.getHttpServer())
      .put(`/api/v1/admin/supply/franchise-owners/${fo.id}/weekly-schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ schedule: [] })
      .expect(400);

    const blocked = parseBlockedBody(res);
    expect(
      blocked?.code ?? (res.body as { code?: string }).code,
    ).toBeTruthy();
    const reasons =
      blocked?.reasons ??
      (Array.isArray((res.body as { reasons?: string[] }).reasons)
        ? (res.body as { reasons: string[] }).reasons
        : []);
    expect(reasons.join(",")).toMatch(/FO_NO_SCHEDULING_SOURCE|FO_ACTIVATION/);
  });

  it("GET fleet list returns readiness-backed rows with merged reason codes", async () => {
    const foId = await createDraftFo();
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/supply/franchise-owners")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    const row = res.body.items.find((r: { id: string }) => r.id === foId);
    expect(row).toBeTruthy();
    expect(typeof row.supplyOk).toBe("boolean");
    expect(typeof row.bookingEligible).toBe("boolean");
    expect(Array.isArray(row.mergedReasonCodes)).toBe(true);
    expect(row.mergedReasonCodes.length).toBeGreaterThan(0);
    expect(row.queueState).toBe("BLOCKED_CONFIGURATION");
    expect(typeof row.executionOk).toBe("boolean");
  });

  it("GET fleet list marks paused configured FO as READY_TO_ACTIVATE", async () => {
    const foId = await createPausedReadyFo();
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/supply/franchise-owners")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const row = res.body.items.find((r: { id: string }) => r.id === foId);
    expect(row?.queueState).toBe("READY_TO_ACTIVATE");
    expect(row?.supplyOk).toBe(true);
  });

  it("GET fleet list marks active valid FO as ACTIVE_AND_READY", async () => {
    const foId = await createDraftFo();
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/supply/franchise-owners/${foId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        homeLat: 36.6,
        homeLng: -115.6,
        maxTravelMinutes: 60,
        maxDailyLaborMinutes: 960,
        maxLaborMinutes: 960,
        maxSquareFootage: 5000,
      })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/v1/admin/supply/franchise-owners/${foId}/weekly-schedule`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        schedule: [{ dayOfWeek: 1, startTime: "08:00", endTime: "18:00" }],
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/supply/franchise-owners/${foId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "active" })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/supply/franchise-owners")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const row = res.body.items.find((r: { id: string }) => r.id === foId);
    expect(row?.queueState).toBe("ACTIVE_AND_READY");
  });

  it("GET fleet list surfaces legacy active-but-misconfigured as ACTIVE_BUT_BLOCKED", async () => {
    const foId = await createActiveFoWithCorruptedCoordsBypassingGuard();
    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/supply/franchise-owners")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const row = res.body.items.find((r: { id: string }) => r.id === foId);
    expect(row?.queueState).toBe("ACTIVE_BUT_BLOCKED");
    expect(row?.mergedReasonCodes?.length).toBeGreaterThan(0);
  });

  it("GET fleet list ?queue=READY_TO_ACTIVATE filters rows", async () => {
    const readyId = await createPausedReadyFo();
    await createDraftFo();

    const res = await request(app.getHttpServer())
      .get("/api/v1/admin/supply/franchise-owners?queue=READY_TO_ACTIVATE")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.items.every((r: { queueState: string }) => r.queueState === "READY_TO_ACTIVATE")).toBe(
      true,
    );
    expect(res.body.items.some((r: { id: string }) => r.id === readyId)).toBe(true);
  });

  it("GET fleet list rejects invalid queue filter", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/admin/supply/franchise-owners?queue=not_a_queue")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);
  });

  it("POST franchise-owners creates draft onboarding FO with queueState", async () => {
    const email = `${stamp}_create_${Date.now()}@servelink.local`;
    const res = await request(app.getHttpServer())
      .post("/api/v1/admin/supply/franchise-owners")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ displayName: "Posted draft FO", email })
      .expect(201);

    expect(res.body.foId).toBeTruthy();
    expect(res.body.readiness.status).toBe("onboarding");
    expect(res.body.queueState).toBe("BLOCKED_CONFIGURATION");
    expect(Array.isArray(res.body.mergedReasonCodes)).toBe(true);
    expect(res.body.mergedReasonCodes.length).toBeGreaterThan(0);
  });

  it("POST franchise-owners rejects duplicate email", async () => {
    const email = `${stamp}_dup_${Date.now()}@servelink.local`;
    await request(app.getHttpServer())
      .post("/api/v1/admin/supply/franchise-owners")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ displayName: "First", email })
      .expect(201);

    await request(app.getHttpServer())
      .post("/api/v1/admin/supply/franchise-owners")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ displayName: "Second", email })
      .expect(409);
  });
});
