import { describe, expect, it } from "@jest/globals";
import { FoService } from "../src/modules/fo/fo.service";
import { PrismaService } from "../src/prisma";
import {
  MIN_DURATION_MINUTES,
  SOFT_LONG_DURATION_THRESHOLD_MINUTES,
  computeAssignedCrewSize,
  computeDurationRankScore,
  computeElapsedDurationMinutesFromLabor,
  computeMatchOpsRankScore,
} from "../src/modules/crew-capacity/assigned-crew-and-duration";
import { resolveFranchiseOwnerCrewRange } from "../src/modules/crew-capacity/franchise-owner-crew-range";
import { getWorkloadMinCrew } from "../src/modules/crew-capacity/workload-min-crew";
import { DispatchCandidateService } from "../src/modules/dispatch/dispatch-candidate.service";

describe("getWorkloadMinCrew", () => {
  it("200 labor → minCrew 1", () => {
    expect(
      getWorkloadMinCrew({
        estimatedLaborMinutes: 200,
        squareFootage: 1500,
        serviceType: "deep_clean",
      }),
    ).toBe(1);
  });

  it("350 labor → minCrew 2", () => {
    expect(
      getWorkloadMinCrew({
        estimatedLaborMinutes: 350,
        squareFootage: 1500,
      }),
    ).toBe(2);
  });

  it("700 labor → minCrew 3", () => {
    expect(
      getWorkloadMinCrew({
        estimatedLaborMinutes: 700,
        squareFootage: 1500,
      }),
    ).toBe(3);
  });

  it("3000 sqft forces minCrew ≥ 2 even with low labor", () => {
    expect(
      getWorkloadMinCrew({
        estimatedLaborMinutes: 100,
        squareFootage: 3000,
      }),
    ).toBe(2);
  });

  it("accepts serviceType for API stability without changing v1 result", () => {
    const a = getWorkloadMinCrew({
      estimatedLaborMinutes: 350,
      squareFootage: 1500,
      serviceType: "maintenance",
    });
    const b = getWorkloadMinCrew({
      estimatedLaborMinutes: 350,
      squareFootage: 1500,
      serviceType: "deep_clean",
    });
    expect(a).toBe(2);
    expect(b).toBe(2);
  });
});

describe("assigned crew with workload floor", () => {
  it("3- and 5-person rosters both satisfy min 2 and pass assignment", () => {
    const laborBandMin = 2;
    const rec = 3;
    const c3 = resolveFranchiseOwnerCrewRange({
      teamSize: 3,
      minCrewSize: null,
      preferredCrewSize: null,
      maxCrewSize: null,
    });
    const c5 = resolveFranchiseOwnerCrewRange({
      teamSize: 5,
      minCrewSize: null,
      preferredCrewSize: null,
      maxCrewSize: null,
    });
    const a3 = computeAssignedCrewSize({
      serviceType: "maintenance",
      serviceSegment: "residential",
      normalizedRecommendedCrewSize: rec,
      candidate: c3,
      workloadMinCrew: laborBandMin,
    });
    const a5 = computeAssignedCrewSize({
      serviceType: "maintenance",
      serviceSegment: "residential",
      normalizedRecommendedCrewSize: rec,
      candidate: c5,
      workloadMinCrew: laborBandMin,
    });
    expect(a3).toBeGreaterThanOrEqual(laborBandMin);
    expect(a5).toBeGreaterThanOrEqual(laborBandMin);
  });
});

describe("duration guardrails", () => {
  it("never returns wall-clock duration below MIN_DURATION_MINUTES", () => {
    expect(computeElapsedDurationMinutesFromLabor(20, 4)).toBe(
      MIN_DURATION_MINUTES,
    );
  });

  it("long effective duration is penalized in rank score but still a finite number", () => {
    const short = computeDurationRankScore(SOFT_LONG_DURATION_THRESHOLD_MINUTES);
    const long = computeDurationRankScore(SOFT_LONG_DURATION_THRESHOLD_MINUTES + 200);
    expect(short).toBeGreaterThan(long);
  });
});

describe("computeMatchOpsRankScore", () => {
  it("prefers shorter duration when base reliability/travel and crew fit match", () => {
    const base = {
      reliabilityScore: 10,
      travelMinutes: 5,
      assignedCrewSize: 4,
      normalizedRecommendedCrewSize: 4,
    };
    const shorter = computeMatchOpsRankScore({
      ...base,
      estimatedJobDurationMinutes: 120,
    });
    const longer = computeMatchOpsRankScore({
      ...base,
      estimatedJobDurationMinutes: 300,
    });
    expect(shorter).toBeGreaterThan(longer);
  });

  it("prefers assigned crew closer to recommendation when duration is equal", () => {
    const base = {
      reliabilityScore: 10,
      travelMinutes: 5,
      estimatedJobDurationMinutes: 200,
    };
    const closer = computeMatchOpsRankScore({
      ...base,
      assignedCrewSize: 5,
      normalizedRecommendedCrewSize: 5,
    });
    const farther = computeMatchOpsRankScore({
      ...base,
      assignedCrewSize: 2,
      normalizedRecommendedCrewSize: 5,
    });
    expect(closer).toBeGreaterThan(farther);
  });
});

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
    minCrewSize: null,
    preferredCrewSize: null,
    maxCrewSize: null,
    maxSquareFootage: 10000,
    maxLaborMinutes: 2000,
    maxDailyLaborMinutes: 2000,
    homeLat: 36.15398,
    homeLng: -95.99277,
    maxTravelMinutes: 60,
    reliabilityScore: 50,
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

describe("DispatchCandidateService — workload min", () => {
  it("marks solo roster ineligible when job workload requires 2+", async () => {
    const prisma = {
      booking: { findMany: jest.fn().mockResolvedValue([]) },
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "fo_x",
            providerId: "p1",
            userId: "u1",
            status: "active",
            safetyHold: false,
            homeLat: 36.15,
            homeLng: -95.99,
            maxTravelMinutes: 120,
            maxSquareFootage: null,
            maxLaborMinutes: null,
            maxDailyLaborMinutes: null,
            teamSize: 1,
            minCrewSize: null,
            preferredCrewSize: null,
            maxCrewSize: null,
            provider: { type: "individual", status: "active", userId: "u1" },
            dispatchStats: null,
            reliabilityStats: null,
          },
        ]),
      },
    } as unknown as PrismaService;

    const svc = new DispatchCandidateService(prisma);
    const rows = await svc.getCandidates({
      lat: 36.154,
      lng: -95.993,
      squareFootage: 1500,
      estimatedLaborMinutes: 300,
      recommendedTeamSize: 2,
    });
    expect(rows[0]?.canReceiveDispatch).toBe(false);
    expect(rows[0]?.ineligibilityReasons).toContain("WORKLOAD_MIN_CREW_NOT_MET");
  });
});

describe("FoService.matchFOs — workload min + ranking", () => {
  it("excludes a 1-person roster when workload requires 2+", async () => {
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([
          baseFo({ id: "fo_solo", teamSize: 1 }),
        ]),
      },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const svc = new FoService(prisma);
    const out = await svc.matchFOs({
      lat: 36.154,
      lng: -95.993,
      squareFootage: 1500,
      estimatedLaborMinutes: 300,
      recommendedTeamSize: 2,
      serviceType: "maintenance",
      limit: 10,
    });
    expect(out).toHaveLength(0);
  });

  it("ranks a larger roster ahead when it fits recommendation better (same reliability/travel)", async () => {
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([
          baseFo({
            id: "fo_small",
            teamSize: 2,
            reliabilityScore: 50,
          }),
          baseFo({
            id: "fo_big",
            userId: "u2",
            providerId: "prov_2",
            provider: { userId: "u2" },
            teamSize: 6,
            reliabilityScore: 50,
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
      estimatedLaborMinutes: 350,
      recommendedTeamSize: 5,
      serviceType: "deep_clean",
      serviceSegment: "residential",
      limit: 10,
    });
    expect(out.map((m) => m.id)).toEqual(["fo_big", "fo_small"]);
    expect(out[0]?.assignedCrewSize).toBe(5);
    expect(out[1]?.assignedCrewSize).toBe(2);
  });
});
