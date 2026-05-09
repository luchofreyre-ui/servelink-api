jest.mock("../src/modules/service-matrix/service-matrix.evaluator", () => ({
  evaluateServiceMatrixCandidate: jest.fn(),
}));

import { Logger } from "@nestjs/common";
import { FoService, JobMatchInput } from "../src/modules/fo/fo.service";
import { PrismaService } from "../src/prisma";
import { evaluateServiceMatrixCandidate } from "../src/modules/service-matrix/service-matrix.evaluator";
import * as ShadowPayload from "../src/modules/service-matrix/service-matrix-shadow-payload";

const evalMock = evaluateServiceMatrixCandidate as jest.MockedFunction<
  typeof evaluateServiceMatrixCandidate
>;

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

function baseMatchInput(
  overrides: Partial<JobMatchInput> = {},
): JobMatchInput {
  return {
    lat: 36.154,
    lng: -95.993,
    squareFootage: 1500,
    estimatedLaborMinutes: 200,
    recommendedTeamSize: 2,
    serviceType: "maintenance",
    limit: 10,
    bookingMatchMode: "public_one_time",
    ...overrides,
  };
}

function shadowOkResult(foId: string) {
  return {
    candidate: {
      foId,
      travelMinutesRounded: 10,
      workloadMinCrew: 1,
      assignedCrewSize: 2,
    },
    decision: "eligible" as const,
    eligible: true,
    mode: "enforce" as const,
    checks: [],
    advisory: [],
  };
}

const FORBIDDEN_LOG_KEYS = new Set([
  "lat",
  "lng",
  "siteLat",
  "siteLng",
  "customerEmail",
  "email",
  "phone",
  "street",
  "address",
  "fullEstimatePayload",
]);

function collectKeys(value: unknown, out: Set<string>): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, out);
    return;
  }
  if (typeof value === "object") {
    for (const k of Object.keys(value as object)) {
      out.add(k);
      collectKeys((value as Record<string, unknown>)[k], out);
    }
  }
}

describe("FoService.matchFOs — public_booking shadow runtime", () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  const cleanEnv = () => {
    delete process.env.ENABLE_SERVICE_MATRIX_SHADOW;
    delete process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE;
    delete process.env.SERVICE_MATRIX_SHADOW_SURFACES;
  };

  beforeEach(() => {
    cleanEnv();
    logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => {
      /* mute */
    });
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {
      /* mute */
    });
    evalMock.mockReset();
    evalMock.mockImplementation((_, cand) => shadowOkResult(cand.foId));
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    cleanEnv();
  });

  it("flags off: evaluator not called and legacy result unchanged", async () => {
    const bookingFindMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([
          baseFo({ id: "fo_a" }),
          baseFo({
            id: "fo_b",
            userId: "u2",
            providerId: "p2",
            provider: { userId: "u2" },
            reliabilityScore: 80,
          }),
        ]),
      },
      booking: { findMany: bookingFindMany },
    } as unknown as PrismaService;

    const svc = new FoService(prisma);
    const input = baseMatchInput();
    const out = await svc.matchFOs(input);
    expect(evalMock).not.toHaveBeenCalled();
    expect(out.map((m) => m.id)).toEqual(["fo_a", "fo_b"]);
  });

  it("sample rate 0: evaluator not called", async () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "0";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = "public_booking";
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([baseFo({ id: "fo_x" })]),
      },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const svc = new FoService(prisma);
    await svc.matchFOs(baseMatchInput());
    expect(evalMock).not.toHaveBeenCalled();
  });

  it("surface excluded: evaluator not called", async () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = "dispatch";
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([baseFo({ id: "fo_x" })]),
      },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const svc = new FoService(prisma);
    await svc.matchFOs(baseMatchInput());
    expect(evalMock).not.toHaveBeenCalled();
  });

  it("non-public_one_time: shadow not run", async () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = "public_booking";
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([baseFo({ id: "fo_x" })]),
      },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const svc = new FoService(prisma);
    await svc.matchFOs(baseMatchInput({ bookingMatchMode: "authenticated_one_time" }));
    expect(evalMock).not.toHaveBeenCalled();
  });

  it("shadow enabled: legacy result unchanged and shadow event emitted", async () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = "public_booking";
    const bookingFindMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([baseFo({ id: "fo_only" })]),
      },
      booking: { findMany: bookingFindMany },
    } as unknown as PrismaService;
    const svc = new FoService(prisma);
    const input = baseMatchInput();
    const buildSpy = jest.spyOn(ShadowPayload, "buildServiceMatrixShadowPayload");
    const out = await svc.matchFOs(input);
    expect(out.map((m) => m.id)).toEqual(["fo_only"]);
    expect(evalMock).toHaveBeenCalledTimes(1);
    expect(buildSpy).toHaveBeenCalledTimes(1);
    const payloadCalls = logSpy.mock.calls
      .map((c) => c[0])
      .filter(
        (x) =>
          x &&
          typeof x === "object" &&
          (x as { event?: string }).event ===
            "service_matrix_shadow_public_booking",
      );
    expect(payloadCalls.length).toBe(1);
    buildSpy.mockRestore();
  });

  it("evaluator throws: legacy unchanged and failure warn emitted", async () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = "public_booking";
    evalMock.mockImplementation(() => {
      throw new Error("matrix-boom");
    });
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([baseFo({ id: "fo_only" })]),
      },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const svc = new FoService(prisma);
    const out = await svc.matchFOs(baseMatchInput());
    expect(out.map((m) => m.id)).toEqual(["fo_only"]);
    const failures = warnSpy.mock.calls
      .map((c) => c[0])
      .filter(
        (x) =>
          x &&
          typeof x === "object" &&
          (x as { event?: string }).event === "service_matrix_shadow_failure",
      );
    expect(failures.length).toBeGreaterThanOrEqual(1);
  });

  it("emitted shadow payload has no forbidden PII/geo raw keys", async () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = "public_booking";
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([baseFo({ id: "fo_only" })]),
      },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const svc = new FoService(prisma);
    await svc.matchFOs(baseMatchInput());
    const evt = logSpy.mock.calls
      .map((c) => c[0])
      .find(
        (x) =>
          x &&
          typeof x === "object" &&
          (x as { event?: string }).event ===
            "service_matrix_shadow_public_booking",
      ) as { payload?: unknown } | undefined;
    expect(evt?.payload).toBeDefined();
    const keys = new Set<string>();
    collectKeys(evt?.payload, keys);
    for (const k of FORBIDDEN_LOG_KEYS) {
      expect(keys.has(k)).toBe(false);
    }
    const json = JSON.stringify(evt?.payload);
    expect(json).not.toMatch(/36\.154/);
    expect(json).not.toMatch(/-95\.993/);
  });

  it("real buildServiceMatrixShadowPayload receives redacted jobContextHash only", async () => {
    process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
    process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1";
    process.env.SERVICE_MATRIX_SHADOW_SURFACES = "public_booking";
    const buildSpy = jest.spyOn(ShadowPayload, "buildServiceMatrixShadowPayload");
    const prisma = {
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([baseFo({ id: "fo_only" })]),
      },
      booking: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const svc = new FoService(prisma);
    await svc.matchFOs(baseMatchInput());
    expect(buildSpy).toHaveBeenCalledTimes(1);
    const arg = buildSpy.mock.calls[0][0];
    expect(typeof arg.jobContextHash).toBe("string");
    expect(arg.jobContextHash.length).toBeGreaterThan(20);
    buildSpy.mockRestore();
  });

  it("no extra booking.findMany when shadow enabled vs disabled", async () => {
    const mkPrisma = () =>
      ({
        franchiseOwner: {
          findMany: jest.fn().mockResolvedValue([
            baseFo({ id: "fo_a", maxDailyLaborMinutes: 480 }),
            baseFo({
              id: "fo_b",
              maxDailyLaborMinutes: 480,
              userId: "u2",
              providerId: "p2",
              provider: { userId: "u2" },
              reliabilityScore: 70,
            }),
          ]),
        },
        booking: { findMany: jest.fn().mockResolvedValue([]) },
      }) as unknown as PrismaService;

    const run = async (shadow: boolean) => {
      cleanEnv();
      if (shadow) {
        process.env.ENABLE_SERVICE_MATRIX_SHADOW = "true";
        process.env.SERVICE_MATRIX_SHADOW_SAMPLE_RATE = "1";
        process.env.SERVICE_MATRIX_SHADOW_SURFACES = "public_booking";
      }
      const p = mkPrisma();
      const svc = new FoService(p);
      await svc.matchFOs(baseMatchInput());
      return (p.booking.findMany as jest.Mock).mock.calls.length;
    };

    const offCount = await run(false);
    evalMock.mockClear();
    const onCount = await run(true);
    expect(onCount).toBe(offCount);
  });
});

describe("buildServiceMatrixShadowPayload parity fields (sanity)", () => {
  it("includes added/removed when legacy and matrix differ", () => {
    const p = ShadowPayload.buildServiceMatrixShadowPayload({
      requestId: "r",
      sourceSurface: "public_booking",
      evaluatedAt: "2020-01-01T00:00:00.000Z",
      jobContextHash: "h",
      legacyCandidateIds: ["a"],
      matrixCandidateIds: ["b"],
      perCandidate: {
        a: { legacyEligible: true, matrixEligible: false },
        b: { legacyEligible: false, matrixEligible: true },
      },
      durationInputSummary: {
        laborMinutes: 1,
        recommendedTeamSize: 2,
        source: "booking_derived",
      },
      capacityInputSummary: {
        maxDailyLaborMinutes: null,
        committedLaborMinutesToday: null,
        committedInputStatus: "not_applicable",
      },
      geographyInputSummary: {
        siteLatPresent: true,
        siteLngPresent: true,
        foHomeLatLngPresent: true,
        maxTravelMinutes: null,
      },
      safeRedactions: [],
    });
    expect(p.addedByMatrix).toEqual(["b"]);
    expect(p.removedByMatrix).toEqual(["a"]);
    expect(p.decisionDiffs.length).toBeGreaterThan(0);
  });
});
