import { describe, expect, it } from "@jest/globals";
import {
  GLOBAL_MAX_CREW_SIZE,
  clampCrewSizeForService,
  clampCrewSizeToGlobalMax,
  getServiceMaxCrewSize,
} from "../src/modules/crew-capacity/crew-capacity-policy";
import { parseEstimateJobMatchFields } from "../src/modules/crew-capacity/parse-estimate-job-match-fields";
import { resolveFranchiseOwnerCrewRange } from "../src/modules/crew-capacity/franchise-owner-crew-range";
import {
  MIN_DURATION_MINUTES,
  computeAssignedCrewSize,
  computeElapsedDurationMinutesFromLabor,
} from "../src/modules/crew-capacity/assigned-crew-and-duration";

describe("crew-capacity policy", () => {
  it("clamps to global max 11", () => {
    expect(clampCrewSizeToGlobalMax(99)).toBe(11);
    expect(clampCrewSizeToGlobalMax(0)).toBe(1);
  });

  it("residential deep_clean max is 6", () => {
    expect(getServiceMaxCrewSize("deep_clean", "residential")).toBe(6);
    expect(clampCrewSizeForService("deep_clean", "residential", 11)).toBe(6);
  });

  it("residential maintenance max is 6", () => {
    expect(getServiceMaxCrewSize("maintenance", "residential")).toBe(6);
    expect(clampCrewSizeForService("maintenance", "residential", 11)).toBe(6);
  });

  it("commercial max is 11", () => {
    expect(getServiceMaxCrewSize("deep_clean", "commercial")).toBe(11);
    expect(clampCrewSizeForService("deep_clean", "commercial", 11)).toBe(11);
    expect(clampCrewSizeForService("maintenance", "commercial", 20)).toBe(
      GLOBAL_MAX_CREW_SIZE,
    );
  });
});

describe("parseEstimateJobMatchFields", () => {
  it("returns squareFootage, labor, clamped recommended, serviceType, segment", () => {
    const job = parseEstimateJobMatchFields({
      inputJson: JSON.stringify({
        sqft_band: "2000_2499",
        service_type: "deep_clean",
        job_site_class: "residential",
      }),
      outputJson: JSON.stringify({
        adjustedLaborMinutes: 600,
        recommendedTeamSize: 9,
        estimateMinutes: 600,
      }),
    });
    expect(job).not.toBeNull();
    expect(job!.squareFootage).toBe(2250);
    expect(job!.estimatedLaborMinutes).toBe(600);
    expect(job!.recommendedTeamSize).toBe(6);
    expect(job!.serviceType).toBe("deep_clean");
    expect(job!.serviceSegment).toBe("residential");
  });

  it("commercial segment does not clamp deep_clean to 6", () => {
    const job = parseEstimateJobMatchFields({
      inputJson: JSON.stringify({
        sqft_band: "1200_1599",
        service_type: "deep_clean",
        job_site_class: "commercial",
      }),
      outputJson: JSON.stringify({
        adjustedLaborMinutes: 800,
        recommendedTeamSize: 9,
      }),
    });
    expect(job!.recommendedTeamSize).toBe(9);
    expect(job!.serviceSegment).toBe("commercial");
  });
});

describe("assigned crew + duration", () => {
  it("residential never assigns above 6 even when FO max is 11", () => {
    const candidate = resolveFranchiseOwnerCrewRange({
      teamSize: 11,
      minCrewSize: null,
      preferredCrewSize: null,
      maxCrewSize: null,
    });
    const assigned = computeAssignedCrewSize({
      serviceType: "deep_clean",
      serviceSegment: "residential",
      normalizedRecommendedCrewSize: 5,
      candidate,
    });
    expect(assigned).toBeLessThanOrEqual(6);
  });

  it("commercial may assign above 6", () => {
    const candidate = resolveFranchiseOwnerCrewRange({
      teamSize: 11,
      minCrewSize: null,
      preferredCrewSize: null,
      maxCrewSize: null,
    });
    const assigned = computeAssignedCrewSize({
      serviceType: "deep_clean",
      serviceSegment: "commercial",
      normalizedRecommendedCrewSize: 8,
      candidate,
    });
    expect(assigned).toBe(8);
  });

  it("duration scales inversely with crew size (same labor), respecting MIN_DURATION", () => {
    const labor = 300;
    const d3 = computeElapsedDurationMinutesFromLabor(labor, 3);
    const d5 = computeElapsedDurationMinutesFromLabor(labor, 5);
    expect(d3).toBe(100);
    expect(d5).toBe(MIN_DURATION_MINUTES);
    expect(d3).toBeGreaterThan(d5);
  });

  it("legacy-only teamSize derives crew range (min 1, max = legacy teamSize)", () => {
    const r = resolveFranchiseOwnerCrewRange({
      teamSize: 4,
      minCrewSize: null,
      preferredCrewSize: null,
      maxCrewSize: null,
    });
    expect(r.minCrewSize).toBe(1);
    expect(r.preferredCrewSize).toBe(4);
    expect(r.maxCrewSize).toBe(4);
  });
});
