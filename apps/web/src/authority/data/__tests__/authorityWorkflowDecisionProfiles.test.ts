import { describe, expect, it } from "vitest";
import { AUTHORITY_WORKFLOW_DECISION_PROFILES } from "../authorityWorkflowDecisionProfiles";
import {
  getAllWorkflowDecisionProfiles,
  getWorkflowDecisionProfileBySlug,
  getWorkflowDecisionProfilesForGuide,
  getWorkflowDecisionProfilesForMethod,
  getWorkflowDecisionProfilesForProblem,
  getWorkflowDecisionProfilesForSurface,
  workflowDecisionProfileSlugExists,
} from "../authorityWorkflowDecisionSelectors";
import { validateWorkflowDecisionProfilesOrThrow } from "../authorityWorkflowDecisionValidation";

const EXPECTED_PROFILE_SLUGS = [
  "restroom-maintenance-workflow",
  "high-traffic-floor-maintenance",
  "commercial-degreasing",
  "dilution-control",
  "peroxide-oxidizing-cleaning",
  "dwell-and-lift-cleaning",
  "soap-scum-removal",
  "hard-water-deposit-removal",
  "glass-cleaning",
  "neutral-surface-cleaning",
];

describe("authorityWorkflowDecisionProfiles", () => {
  it("defines the first-pass workflow science profiles", () => {
    expect(AUTHORITY_WORKFLOW_DECISION_PROFILES.map((profile) => profile.slug)).toEqual(
      EXPECTED_PROFILE_SLUGS,
    );
  });

  it("passes workflow decision validation", () => {
    expect(() =>
      validateWorkflowDecisionProfilesOrThrow(AUTHORITY_WORKFLOW_DECISION_PROFILES),
    ).not.toThrow();
  });

  it("requires science logic beyond checklist-only steps", () => {
    for (const profile of AUTHORITY_WORKFLOW_DECISION_PROFILES) {
      expect(profile.sequenceLogic.length).toBeGreaterThanOrEqual(4);
      expect(profile.requiredToolRoles.length).toBeGreaterThanOrEqual(3);
      expect(profile.failureAnalysis.length).toBeGreaterThanOrEqual(3);
      expect(profile.escalationLogic.length).toBeGreaterThanOrEqual(2);
      expect(profile.safetyLogic.length).toBeGreaterThanOrEqual(2);
      expect(profile.cadenceLogic.length).toBeGreaterThanOrEqual(2);
      expect(profile.chemicalLogic.soilFit).toMatch(/\b(soil|film|minerals?|grease|residue|routine|organic)\b/i);
      expect(profile.chemicalLogic.residueRecovery).toMatch(/\b(residue|recover|rinse|wipe|dry|film)\b/i);
    }
  });

  it("resolves profiles through selectors", () => {
    expect(getAllWorkflowDecisionProfiles()).toHaveLength(EXPECTED_PROFILE_SLUGS.length);
    expect(workflowDecisionProfileSlugExists("restroom-maintenance-workflow")).toBe(true);
    expect(getWorkflowDecisionProfileBySlug("commercial-degreasing")?.workflowFamily).toBe(
      "kitchen_grease",
    );
  });

  it("selects workflow profiles by graph-adjacent references", () => {
    expect(getWorkflowDecisionProfilesForProblem("soap-scum").map((profile) => profile.slug)).toContain(
      "soap-scum-removal",
    );
    expect(getWorkflowDecisionProfilesForSurface("shower-glass").map((profile) => profile.slug)).toContain(
      "hard-water-deposit-removal",
    );
    expect(getWorkflowDecisionProfilesForMethod("neutral-surface-cleaning").length).toBeGreaterThan(0);
    expect(getWorkflowDecisionProfilesForGuide("why-cleaning-fails").length).toBeGreaterThan(0);
  });
});
