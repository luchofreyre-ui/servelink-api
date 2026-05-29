import { describe, expect, it } from "vitest";

import { VISUAL_DIAGNOSTIC_PROFILES } from "./visualDiagnosticProfiles";
import {
  getAllVisualDiagnosticProfiles,
  getInvalidVisualDiagnosticProfiles,
  getMisidentificationVisualDiagnosticProfiles,
  getVisualDiagnosticProfileBySlug,
  getVisualDiagnosticProfilesByPurpose,
  getVisualDiagnosticProfilesByWorkflowStage,
} from "./visualDiagnosticSelectors";
import { validateVisualDiagnosticProfile, validateVisualDiagnosticProfiles } from "./visualDiagnosticValidation";
import type { VisualDiagnosticProfile } from "./visualAuthorityTypes";

const EXPECTED_FIRST_PASS_SLUGS = [
  "soap-scum",
  "hard-water-stains",
  "surface-haze",
  "streaking",
  "grease-buildup",
  "product-residue",
  "mold-mildew",
  "rust-stains",
  "shower-glass",
  "grout",
  "stainless-steel",
  "finished-wood",
  "soap-scum-vs-hard-water",
  "haze-vs-etching",
  "streaking-vs-residue",
  "mildew-vs-soil-staining",
] as const;

function profileFixture(
  overrides: Partial<VisualDiagnosticProfile> = {},
): VisualDiagnosticProfile {
  const base = VISUAL_DIAGNOSTIC_PROFILES[0];
  if (!base) {
    throw new Error("Expected at least one visual diagnostic profile fixture.");
  }
  return {
    ...base,
    slug: "fixture-profile",
    assetId: "VDA-FIXTURE-001",
    ...overrides,
  };
}

describe("visual diagnostic governance profiles", () => {
  it("defines every requested first-pass profile", () => {
    expect(getAllVisualDiagnosticProfiles().map((profile) => profile.slug)).toEqual(
      EXPECTED_FIRST_PASS_SLUGS,
    );
  });

  it("keeps the first-pass profile set valid", () => {
    const result = validateVisualDiagnosticProfiles(VISUAL_DIAGNOSTIC_PROFILES);

    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(getInvalidVisualDiagnosticProfiles()).toEqual([]);
  });

  it("keeps first-pass records planned and image-free", () => {
    expect(
      VISUAL_DIAGNOSTIC_PROFILES.every(
        (profile) =>
          profile.assetStatus === "planned" &&
          profile.source === "not-yet-generated" &&
          profile.src === null,
      ),
    ).toBe(true);
  });

  it("requires diagnostic claims so decorative visuals are rejected", () => {
    const result = validateVisualDiagnosticProfile(
      profileFixture({
        diagnosticClaim: "",
        visibleMarkers: ["Attractive clean surface with no diagnostic signal"],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "diagnosticClaim",
          message: "decorative visuals are forbidden: diagnosticClaim is required",
        }),
      ]),
    );
  });

  it("requires misidentification profiles to include comparison reasoning", () => {
    const result = validateVisualDiagnosticProfile(
      profileFixture({
        authorityKind: "misidentification",
        visualPurpose: ["misidentification"],
        misidentifiedAs: [],
        distinguishFrom: [],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "misidentifiedAs",
        }),
      ]),
    );
  });

  it("selects profiles by slug, purpose, and workflow stage", () => {
    expect(getVisualDiagnosticProfileBySlug("soap-scum")?.assetId).toBe(
      "VDA-PROBLEM-SOAP-SCUM-001",
    );
    expect(getVisualDiagnosticProfileBySlug("missing-profile")).toBeNull();

    const misidentificationSlugs = getMisidentificationVisualDiagnosticProfiles().map(
      (profile) => profile.slug,
    );
    expect(misidentificationSlugs).toContain("haze-vs-etching");
    expect(misidentificationSlugs).toContain("soap-scum-vs-hard-water");

    expect(getVisualDiagnosticProfilesByPurpose("workflow").length).toBeGreaterThan(0);
    expect(getVisualDiagnosticProfilesByWorkflowStage("stop").length).toBeGreaterThan(0);
  });
});
