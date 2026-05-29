import { describe, expect, it } from "vitest";
import { AUTHORITY_PROBLEM_SLUGS } from "../authorityTaxonomy";
import {
  getAllAuthorityProblemScienceProfiles,
  getAuthorityProblemScienceProfile,
  getAuthorityProblemScienceProfilesByEscalationType,
  getAuthorityProblemScienceProfilesByRemediationMode,
  getAuthorityProblemScienceProfileSlugs,
} from "../authorityProblemScienceSelectors";

const FIRST_PASS_PROFILE_SLUGS = [
  "soap-scum",
  "grease-buildup",
  "hard-water-deposits",
  "dust-buildup",
  "light-mildew",
  "mold-growth",
  "surface-haze",
  "product-residue-buildup",
  "odor-retention",
  "cloudy-glass",
  "mineral-film",
  "bathroom-buildup",
] as const;

describe("authorityProblemScienceProfiles", () => {
  it("provides explicit first-pass profiles", () => {
    expect(getAuthorityProblemScienceProfileSlugs()).toEqual(
      [...FIRST_PASS_PROFILE_SLUGS].sort((a, b) => a.localeCompare(b)),
    );

    for (const slug of FIRST_PASS_PROFILE_SLUGS) {
      expect(getAuthorityProblemScienceProfile(slug)).toBeDefined();
    }
  });

  it("only references canonical authority problem slugs", () => {
    const known = new Set<string>(AUTHORITY_PROBLEM_SLUGS);

    for (const profile of getAllAuthorityProblemScienceProfiles()) {
      expect(known.has(profile.problemSlug)).toBe(true);
    }
  });

  it("requires every profile to cover the full Diagnostic Cause Ladder", () => {
    for (const profile of getAllAuthorityProblemScienceProfiles()) {
      expect(profile.observablePattern.length).toBeGreaterThanOrEqual(2);
      expect(profile.rootMechanism).toContain(" ");
      expect(profile.causeDrivers.length).toBeGreaterThanOrEqual(3);
      expect(profile.severityLadder.length).toBeGreaterThanOrEqual(3);
      expect(profile.misidentificationTraps.length).toBeGreaterThanOrEqual(2);
      expect(profile.diagnosticChecks.length).toBeGreaterThanOrEqual(2);
      expect(profile.remediationLadder.length).toBeGreaterThanOrEqual(2);
      expect(profile.preventionLevers.length).toBeGreaterThanOrEqual(2);
      expect(profile.expertNotes.length).toBeGreaterThanOrEqual(2);
      expect(["low", "medium", "high"]).toContain(profile.confidence);
      expect(profile.escalationType.length).toBeGreaterThan(0);
      expect(profile.remediationMode.length).toBeGreaterThan(0);
    }
  });

  it("keeps remediation science-led instead of product-only", () => {
    for (const profile of getAllAuthorityProblemScienceProfiles()) {
      for (const step of profile.remediationLadder) {
        expect(step.scienceReason).toContain(" ");
        expect(step.stopCondition).toContain(" ");
      }
      expect(profile.preventionLevers.map((lever) => lever.whyItPreventsRecurrence).join(" ")).toContain(" ");
      expect(profile.causeDrivers.length).toBeGreaterThan(0);
    }
  });

  it("supports escalation and remediation selectors", () => {
    expect(getAuthorityProblemScienceProfilesByEscalationType("moisture_source").map((p) => p.problemSlug)).toEqual(
      expect.arrayContaining(["light-mildew", "mold-growth", "bathroom-buildup"]),
    );
    expect(getAuthorityProblemScienceProfilesByRemediationMode("source_control").map((p) => p.problemSlug)).toEqual(
      expect.arrayContaining(["grease-buildup", "hard-water-deposits", "odor-retention"]),
    );
  });
});
