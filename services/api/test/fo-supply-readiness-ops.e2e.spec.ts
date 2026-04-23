import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { ensureProviderForFranchiseOwner } from "../src/modules/fo/fo-provider-sync";
import { evaluateFoSupplyReadiness } from "../src/modules/fo/fo-supply-readiness";

jest.setTimeout(45000);

describe("GET /api/v1/system/ops/supply/franchise-owners (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let customerToken: string;
  const password = "test-password-ops-supply";
  const stamp = `fo_supply_ops_${Date.now()}`;

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

    const custEmail = `${stamp}_cust@servelink.local`;
    await prisma.user.create({
      data: { email: custEmail, passwordHash, role: Role.customer },
    });
    const custLogin = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: custEmail, password })
      .expect(201);
    customerToken = custLogin.body?.accessToken;
    expect(customerToken).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.foSchedule.deleteMany({
      where: {
        franchiseOwner: {
          user: { email: { startsWith: `${stamp}_fo_` } },
        },
      },
    });
    await prisma.franchiseOwner.deleteMany({
      where: { user: { email: { startsWith: `${stamp}_fo_` } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: stamp } },
    });
    await app.close();
  });

  async function createFoWithSchedule(
    suffix: string,
    overrides: {
      status?: "active" | "paused" | "onboarding";
      maxTravelMinutes?: number;
      skipSchedule?: boolean;
      matchableServiceTypes?: string[];
    },
  ) {
    const email = `${stamp}_fo_${suffix}@servelink.local`;
    const user = await prisma.user.create({
      data: {
        email,
        phone: `+1777${String(Math.random()).slice(2, 11)}`,
        passwordHash: await bcrypt.hash(password, 10),
        role: Role.fo,
      },
    });
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: user.id,
        status: (overrides.status ?? "active") as "active" | "paused" | "onboarding",
        safetyHold: false,
        teamSize: 3,
        maxSquareFootage: 5000,
        maxLaborMinutes: 960,
        maxDailyLaborMinutes: 960,
        homeLat: 36.12,
        homeLng: -115.08,
        maxTravelMinutes:
          overrides.maxTravelMinutes !== undefined
            ? overrides.maxTravelMinutes
            : 60,
        reliabilityScore: 80,
        displayName: `Ops supply test ${suffix}`,
        matchableServiceTypes: overrides.matchableServiceTypes ?? [],
        ...(overrides.skipSchedule
          ? {}
          : {
              foSchedules: {
                create: {
                  dayOfWeek: 2,
                  startTime: "08:00",
                  endTime: "18:00",
                },
              },
            }),
      },
    });
    await ensureProviderForFranchiseOwner(prisma, fo.id);
    return fo;
  }

  it("returns 401 without auth", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/system/ops/supply/franchise-owners")
      .expect(401);
  });

  it("returns 403 for non-admin JWT", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/system/ops/supply/franchise-owners")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });

  it("lists diagnostics grounded in evaluateFoSupplyReadiness + eligibility", async () => {
    const ready = await createFoWithSchedule("ready", {});
    const noSched = await createFoWithSchedule("nosched", {
      skipSchedule: true,
      status: "onboarding",
    });
    const badGeo = await createFoWithSchedule("badgeo", {
      maxTravelMinutes: 0,
      status: "onboarding",
    });
    const paused = await createFoWithSchedule("paused", { status: "paused" });
    const moveOnly = await createFoWithSchedule("moveonly", {
      matchableServiceTypes: ["move_in"],
    });

    const res = await request(app.getHttpServer())
      .get("/api/v1/system/ops/supply/franchise-owners")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.ok).toBe(true);
    const items = res.body.items as Array<{
      franchiseOwnerId: string;
      supply: { ok: boolean; reasons: string[] };
      eligibility: { canAcceptBooking: boolean; reasons: string[] };
      opsCategory: string;
      configSummary: {
        scheduleRowCount: number;
        maxTravelMinutes: number | null;
        matchableServiceTypes: string[];
      };
    }>;

    const pick = (id: string) => items.find((i) => i.franchiseOwnerId === id);

    const rReady = pick(ready.id);
    expect(rReady?.supply.ok).toBe(true);
    expect(rReady?.eligibility.canAcceptBooking).toBe(true);
    expect((rReady as { execution?: { ok: boolean } })?.execution?.ok).toBe(true);
    expect(rReady?.opsCategory).toBe("ready");

    const rNo = pick(noSched.id);
    expect(rNo?.supply.reasons).toContain("FO_NO_SCHEDULING_SOURCE");
    expect(rNo?.opsCategory).toBe("inactive_or_restricted");
    const directNo = evaluateFoSupplyReadiness({
      homeLat: noSched.homeLat,
      homeLng: noSched.homeLng,
      maxTravelMinutes: noSched.maxTravelMinutes,
      maxDailyLaborMinutes: noSched.maxDailyLaborMinutes,
      maxLaborMinutes: noSched.maxLaborMinutes,
      maxSquareFootage: noSched.maxSquareFootage,
      scheduleRowCount: 0,
    });
    expect(rNo?.supply.ok).toBe(directNo.ok);
    expect(rNo?.supply.reasons).toEqual(directNo.reasons);

    const rGeo = pick(badGeo.id);
    expect(rGeo?.supply.reasons).toContain("FO_INVALID_TRAVEL_CONSTRAINT");
    expect(rGeo?.opsCategory).toBe("inactive_or_restricted");

    const rPaused = pick(paused.id);
    expect(rPaused?.eligibility.reasons).toContain("FO_NOT_ACTIVE");
    expect(rPaused?.opsCategory).toBe("inactive_or_restricted");

    const rMove = pick(moveOnly.id);
    expect(rMove?.supply.ok).toBe(true);
    expect(rMove?.eligibility.canAcceptBooking).toBe(true);
    expect(rMove?.configSummary.matchableServiceTypes).toEqual(["move_in"]);
    expect(rMove?.opsCategory).toBe("ready");
  });
});
