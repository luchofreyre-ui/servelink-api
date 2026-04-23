import { BadRequestException, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { AppModule } from "../src/app.module";
import {
  FO_ACTIVATION_BLOCKED_CODE,
} from "../src/modules/fo/fo-activation-guard";
import { PrismaService } from "../src/prisma";

jest.setTimeout(45000);

async function expectActivationBlocked(fn: () => Promise<unknown>) {
  try {
    await fn();
    throw new Error("expected activation guard to throw");
  } catch (e) {
    expect(e).toBeInstanceOf(BadRequestException);
    const body = (e as BadRequestException).getResponse() as {
      code?: string;
      reasons?: string[];
    };
    expect(body.code).toBe(FO_ACTIVATION_BLOCKED_CODE);
    expect(Array.isArray(body.reasons)).toBe(true);
    expect((body.reasons ?? []).length).toBeGreaterThan(0);
  }
}

describe("FO activation guard (PrismaService + supply truth)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const password = "fo-act-test-pw";
  const stamp = `fo_act_${Date.now()}`;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.foSchedule.deleteMany({
      where: {
        franchiseOwner: {
          user: { email: { startsWith: `${stamp}_` } },
        },
      },
    });
    await prisma.franchiseOwner.deleteMany({
      where: { user: { email: { startsWith: `${stamp}_` } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: `${stamp}_` } },
    });
    await app.close();
  });

  async function createFoUser(suffix: string) {
    const email = `${stamp}_${suffix}@servelink.local`;
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.user.create({
      data: {
        email,
        phone: `+1888${String(Math.random()).slice(2, 11)}`,
        passwordHash,
        role: Role.fo,
      },
    });
  }

  it("allows creating incomplete FO in onboarding", async () => {
    const user = await createFoUser("draft");
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: user.id,
        status: "onboarding",
        displayName: "Draft FO",
      },
    });
    expect(fo.id).toBeTruthy();
  });

  it("blocks creating active FO without supply primitives", async () => {
    const user = await createFoUser("bad_active");
    await expectActivationBlocked(() =>
      prisma.franchiseOwner.create({
        data: {
          userId: user.id,
          status: "active",
          displayName: "Bad active",
        },
      }),
    );
  });

  it("blocks activating an incomplete FO via update", async () => {
    const user = await createFoUser("to_active");
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: user.id,
        status: "onboarding",
        displayName: "Will activate",
      },
    });
    await expectActivationBlocked(() =>
      prisma.franchiseOwner.update({
        where: { id: fo.id },
        data: { status: "active" },
      }),
    );
  });

  it("allows creating an active FO when supply primitives + schedule exist", async () => {
    const user = await createFoUser("good_active");
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: user.id,
        status: "active",
        displayName: "Good active",
        homeLat: 36.2,
        homeLng: -115.2,
        maxTravelMinutes: 60,
        maxDailyLaborMinutes: 960,
        maxLaborMinutes: 960,
        maxSquareFootage: 5000,
        foSchedules: {
          create: {
            dayOfWeek: 1,
            startTime: "07:00",
            endTime: "19:00",
          },
        },
      },
    });
    expect(fo.status).toBe("active");
  });

  it("blocks update that leaves an active FO without coordinates", async () => {
    const user = await createFoUser("strip_coords");
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: user.id,
        status: "active",
        displayName: "Strip coords",
        homeLat: 36.21,
        homeLng: -115.21,
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
    await expectActivationBlocked(() =>
      prisma.franchiseOwner.update({
        where: { id: fo.id },
        data: { homeLat: null, homeLng: null },
      }),
    );
  });

  it("allows pausing an active FO even when config would fail supply for active", async () => {
    const user = await createFoUser("pause_escape");
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: user.id,
        status: "active",
        displayName: "Pause escape",
        homeLat: 36.22,
        homeLng: -115.22,
        maxTravelMinutes: 60,
        maxDailyLaborMinutes: 960,
        maxLaborMinutes: 960,
        maxSquareFootage: 5000,
        foSchedules: {
          create: {
            dayOfWeek: 3,
            startTime: "07:00",
            endTime: "19:00",
          },
        },
      },
    });
    const updated = await prisma.franchiseOwner.update({
      where: { id: fo.id },
      data: { status: "paused", homeLat: null, homeLng: null },
    });
    expect(updated.status).toBe("paused");
  });

  it("blocks foSchedule.deleteMany that would strip all schedules for an active FO", async () => {
    const user = await createFoUser("sched_del");
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: user.id,
        status: "active",
        displayName: "Sched del",
        homeLat: 36.23,
        homeLng: -115.23,
        maxTravelMinutes: 60,
        maxDailyLaborMinutes: 960,
        maxLaborMinutes: 960,
        maxSquareFootage: 5000,
        foSchedules: {
          create: {
            dayOfWeek: 4,
            startTime: "07:00",
            endTime: "19:00",
          },
        },
      },
    });
    await expectActivationBlocked(() =>
      prisma.foSchedule.deleteMany({
        where: { franchiseOwnerId: fo.id },
      }),
    );
  });
});
