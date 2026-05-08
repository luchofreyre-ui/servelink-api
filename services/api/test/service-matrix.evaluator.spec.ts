import type { JobContext, MatrixCandidateInput } from "../src/modules/service-matrix";
import {
  evaluateServiceMatrixCandidate,
  ServiceMatrixEvaluator,
} from "../src/modules/service-matrix";

function baseCandidate(
  overrides: Partial<MatrixCandidateInput> = {},
): MatrixCandidateInput {
  return {
    foId: "fo_1",
    franchiseOwnerUserId: "u1",
    providerId: "prov_1",
    providerUserId: "u1",
    status: "active",
    safetyHold: false,
    homeLat: 36.15398,
    homeLng: -95.99277,
    maxTravelMinutes: 60,
    maxDailyLaborMinutes: 960,
    maxLaborMinutes: 960,
    maxSquareFootage: 5000,
    scheduleRowCount: 7,
    teamSize: 3,
    minCrewSize: null,
    preferredCrewSize: null,
    maxCrewSize: 4,
    matchableServiceTypes: [],
    ...overrides,
  };
}

function baseJob(
  overrides: Partial<JobContext> = {},
): JobContext {
  return {
    lat: 36.154,
    lng: -95.993,
    squareFootage: 1500,
    estimatedLaborMinutes: 200,
    recommendedTeamSize: 2,
    serviceType: "maintenance",
    serviceSegment: "residential",
    bookingMatchMode: "public_one_time",
    ...overrides,
  };
}

describe("ServiceMatrixEvaluator (S1 parity façade)", () => {
  it("returns eligible when legacy-equivalent gates pass", () => {
    const res = evaluateServiceMatrixCandidate(baseJob(), baseCandidate(), {
      mode: "enforce",
    });
    expect(res.eligible).toBe(true);
    expect(res.decision).toBe("eligible");
    expect(res.primaryFailureCode).toBeUndefined();
    expect(res.checks.every((c) => c.pass)).toBe(true);
  });

  it("returns ineligible with daily capacity reason when cap would be exceeded", () => {
    const res = evaluateServiceMatrixCandidate(
      baseJob({ estimatedLaborMinutes: 120 }),
      baseCandidate({
        maxDailyLaborMinutes: 100,
        committedLaborMinutesToday: 50,
      }),
      { mode: "enforce" },
    );
    expect(res.eligible).toBe(false);
    expect(res.decision).toBe("ineligible");
    expect(res.primaryFailureCode).toBe("DAILY_LABOR_CAP_EXCEEDED");
  });

  it("returns ineligible when travel exceeds FO max", () => {
    const res = evaluateServiceMatrixCandidate(
      baseJob({ lat: 40.7128, lng: -74.006 }),
      baseCandidate({
        homeLat: 36.15398,
        homeLng: -95.99277,
        maxTravelMinutes: 30,
      }),
      { mode: "enforce" },
    );
    expect(res.eligible).toBe(false);
    expect(res.decision).toBe("ineligible");
    expect(res.primaryFailureCode).toBe("TRAVEL_EXCEEDS_MAX");
  });

  it("returns ineligible when service is not in commercial allow-list", () => {
    const res = evaluateServiceMatrixCandidate(
      baseJob({
        serviceType: "deep_clean",
        serviceSegment: "commercial",
        bookingMatchMode: "authenticated_one_time",
      }),
      baseCandidate({
        matchableServiceTypes: ["maintenance"],
      }),
      { mode: "enforce" },
    );
    expect(res.eligible).toBe(false);
    expect(res.decision).toBe("ineligible");
    expect(res.primaryFailureCode).toBe("COMMERCIAL_SERVICE_WHITELIST_REQUIRED");
  });

  it("returns review_required when risk flags present but hard gates pass", () => {
    const res = evaluateServiceMatrixCandidate(
      baseJob({ riskFlags: ["suspected_mold"] }),
      baseCandidate(),
      { mode: "enforce" },
    );
    expect(res.eligible).toBe(true);
    expect(res.decision).toBe("review_required");
    expect(res.advisory.some((a) => a.code === "MANUAL_REVIEW_SUGGESTED")).toBe(true);
  });

  it("is deterministic for identical inputs", () => {
    const job = baseJob();
    const cand = baseCandidate();
    const a = evaluateServiceMatrixCandidate(job, cand);
    const b = evaluateServiceMatrixCandidate(job, cand);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("does not mutate candidate or job objects", () => {
    const job = baseJob();
    const candidate = baseCandidate();
    const jobSnap = JSON.stringify(job);
    const candSnap = JSON.stringify(candidate);
    evaluateServiceMatrixCandidate(job, candidate, { mode: "shadow" });
    expect(JSON.stringify(job)).toBe(jobSnap);
    expect(JSON.stringify(candidate)).toBe(candSnap);
  });

  it("exposes injectable evaluator mirroring pure function", () => {
    const svc = new ServiceMatrixEvaluator();
    const job = baseJob();
    const cand = baseCandidate();
    expect(svc.evaluate(job, cand)).toEqual(evaluateServiceMatrixCandidate(job, cand));
  });
});
