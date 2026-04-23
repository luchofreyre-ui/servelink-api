import { FoService } from "../src/modules/fo/fo.service";
import { PrismaService } from "../src/prisma";

function baseFo(overrides: Record<string, unknown> = {}) {
  return {
    id: "fo_1",
    userId: "u1",
    providerId: "prov_1",
    provider: { userId: "u1" },
    status: "active",
    safetyHold: false,
    isDeleted: false,
    isBanned: false,
    teamSize: 3,
    maxSquareFootage: 5000,
    maxLaborMinutes: 960,
    maxDailyLaborMinutes: 960,
    homeLat: 36.15398,
    homeLng: -95.99277,
    maxTravelMinutes: 60,
    reliabilityScore: 90,
    displayName: "T",
    photoUrl: null,
    bio: null,
    yearsExperience: 1,
    completedJobsCount: 1,
    matchableServiceTypes: [] as string[],
    _count: { foSchedules: 7 },
    ...overrides,
  };
}

describe("FoService.matchFOs — matchableServiceTypes whitelist", () => {
  it("returns only FOs whose whitelist includes the requested serviceType", async () => {
    const bookingFindMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      franchiseOwner: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            baseFo({ id: "fo_open", matchableServiceTypes: [] }),
            baseFo({
              id: "fo_move_only",
              userId: "u2",
              providerId: "prov_2",
              provider: { userId: "u2" },
              matchableServiceTypes: ["move_in", "move_out"],
              reliabilityScore: 99,
            }),
          ]),
      },
      booking: { findMany: bookingFindMany },
    } as unknown as PrismaService;

    const svc = new FoService(prisma);
    const maintenance = await svc.matchFOs({
      lat: 36.154,
      lng: -95.993,
      squareFootage: 1500,
      estimatedLaborMinutes: 200,
      recommendedTeamSize: 2,
      serviceType: "maintenance",
      limit: 10,
    });
    expect(maintenance.map((m) => m.id)).toEqual(["fo_open"]);

    const moveIn = await svc.matchFOs({
      lat: 36.154,
      lng: -95.993,
      squareFootage: 1500,
      estimatedLaborMinutes: 200,
      recommendedTeamSize: 2,
      serviceType: "move_in",
      limit: 10,
    });
    expect(moveIn.map((m) => m.id).sort()).toEqual(["fo_move_only", "fo_open"]);
  });

  it("excludes whitelisted FOs when serviceType is omitted (strict whitelist)", async () => {
    const prisma = {
      franchiseOwner: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            baseFo({ id: "fo_open", matchableServiceTypes: [] }),
            baseFo({
              id: "fo_move_only",
              userId: "u2",
              providerId: "prov_2",
              provider: { userId: "u2" },
              matchableServiceTypes: ["move_in"],
            }),
          ]),
      },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const svc = new FoService(prisma);
    const withoutType = await svc.matchFOs({
      lat: 36.154,
      lng: -95.993,
      squareFootage: 1500,
      estimatedLaborMinutes: 200,
      recommendedTeamSize: 2,
      limit: 10,
    });
    expect(withoutType.map((m) => m.id)).toEqual(["fo_open"]);
  });

  it("excludes active FOs without a valid provider link from matching", async () => {
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([
          baseFo({ id: "fo_ok" }),
          baseFo({
            id: "fo_no_provider",
            userId: "u_np",
            providerId: null,
            provider: null,
          }),
        ]),
      },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const svc = new FoService(prisma);
    const out = await svc.matchFOs({
      lat: 36.154,
      lng: -95.993,
      squareFootage: 1500,
      estimatedLaborMinutes: 200,
      recommendedTeamSize: 2,
      limit: 10,
    });
    expect(out.map((m) => m.id)).toEqual(["fo_ok"]);
  });
});
