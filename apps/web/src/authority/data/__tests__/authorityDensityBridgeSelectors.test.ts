import { describe, expect, it } from "vitest";
import { getAuthorityDensityBridge } from "../authorityDensityBridgeSelectors";
import {
  getAuthorityProblemSlugsForVisualSlug,
  getVisualDiagnosticSlugsForAuthorityProblem,
} from "../authorityDensitySlugMap";

function visualSlugsFor(problemSlug: string, surfaceSlug?: string): string[] {
  return getAuthorityDensityBridge({ problemSlug, surfaceSlug }).visualProfiles.map((profile) => profile.slug);
}

describe("authorityDensityBridgeSelectors", () => {
  it("bridges soap scum on shower glass across all foundation systems", () => {
    const bridge = getAuthorityDensityBridge({
      problemSlug: "soap-scum",
      surfaceSlug: "shower-glass",
    });

    expect(bridge.problemScience?.problemSlug).toBe("soap-scum");
    expect(bridge.surfaceScience?.material.family).toBe("glass");
    expect(bridge.workflowProfiles.map((profile) => profile.slug)).toEqual(
      expect.arrayContaining(["restroom-maintenance-workflow", "soap-scum-removal"]),
    );
    expect(bridge.visualProfiles.map((profile) => profile.slug)).toEqual(
      expect.arrayContaining(["soap-scum", "shower-glass", "soap-scum-vs-hard-water"]),
    );
    expect(bridge.normalizedConfidence).toBe("high");
    expect(bridge.normalizedSeverity).not.toBe("none");
    expect(bridge.recommendedWorkflowStages).toEqual(
      expect.arrayContaining(["inspect", "identify", "pretest", "treat", "rinse", "dry", "verify"]),
    );
  });

  it("bridges hard water deposits on glass through visual aliases", () => {
    const bridge = getAuthorityDensityBridge({
      problemSlug: "hard-water-deposits",
      surfaceSlug: "glass",
    });

    expect(bridge.problemScience?.problemSlug).toBe("hard-water-deposits");
    expect(bridge.surfaceScience?.material.family).toBe("glass");
    expect(bridge.workflowProfiles.map((profile) => profile.slug)).toContain("hard-water-deposit-removal");
    expect(bridge.visualProfiles.map((profile) => profile.slug)).toContain("hard-water-stains");
    expect(bridge.normalizedEscalation).toEqual(expect.arrayContaining(["surface_risk", "visual_stop"]));
  });

  it("bridges grease buildup on stainless steel into kitchen workflow logic", () => {
    const bridge = getAuthorityDensityBridge({
      problemSlug: "grease-buildup",
      surfaceSlug: "stainless-steel",
    });

    expect(bridge.problemScience?.problemSlug).toBe("grease-buildup");
    expect(bridge.surfaceScience?.material.family).toBe("metal");
    expect(bridge.workflowProfiles.map((profile) => profile.slug)).toContain("commercial-degreasing");
    expect(bridge.visualProfiles.map((profile) => profile.slug)).toEqual(
      expect.arrayContaining(["grease-buildup", "stainless-steel"]),
    );
    expect(bridge.normalizedConfidence).toBe("high");
  });

  it("bridges surface haze on finished wood with finish-risk stop logic", () => {
    const bridge = getAuthorityDensityBridge({
      problemSlug: "surface-haze",
      surfaceSlug: "finished-wood",
    });

    expect(bridge.problemScience?.problemSlug).toBe("surface-haze");
    expect(bridge.surfaceScience?.material.family).toBe("wood");
    expect(bridge.visualProfiles.map((profile) => profile.slug)).toEqual(
      expect.arrayContaining(["surface-haze", "finished-wood", "haze-vs-etching"]),
    );
    expect(bridge.normalizedEscalation).toEqual(expect.arrayContaining(["visual_stop", "restoration_boundary"]));
    expect(bridge.recommendedWorkflowStages).toContain("stop");
  });

  it("maps hard-water-stains visual aliases to hard-water-deposits", () => {
    expect(getAuthorityProblemSlugsForVisualSlug("hard-water-stains")).toEqual(["hard-water-deposits"]);
    expect(getVisualDiagnosticSlugsForAuthorityProblem("hard-water-deposits")).toContain("hard-water-stains");
    expect(visualSlugsFor("hard-water-deposits", "glass")).toContain("hard-water-stains");
  });

  it("maps product-residue visual aliases to product-residue-buildup", () => {
    expect(getAuthorityProblemSlugsForVisualSlug("product-residue")).toEqual(["product-residue-buildup"]);
    expect(getVisualDiagnosticSlugsForAuthorityProblem("product-residue-buildup")).toContain("product-residue");
    expect(visualSlugsFor("product-residue-buildup")).toContain("product-residue");
  });

  it("keeps decorative or ungoverned visual profiles out of bridge output", () => {
    const cases = [
      getAuthorityDensityBridge({ problemSlug: "soap-scum", surfaceSlug: "shower-glass" }),
      getAuthorityDensityBridge({ problemSlug: "hard-water-deposits", surfaceSlug: "glass" }),
      getAuthorityDensityBridge({ problemSlug: "grease-buildup", surfaceSlug: "stainless-steel" }),
      getAuthorityDensityBridge({ problemSlug: "surface-haze", surfaceSlug: "finished-wood" }),
    ];

    for (const bridge of cases) {
      expect(bridge.visualProfiles.length).toBeGreaterThan(0);
      for (const profile of bridge.visualProfiles) {
        expect(profile.diagnosticClaim.trim().length).toBeGreaterThan(0);
        expect(profile.visibleMarkers.length).toBeGreaterThan(0);
        expect(profile.visualPurpose.length).toBeGreaterThan(0);
        expect(profile.assetStatus).toBe("planned");
        expect(profile.source).toBe("not-yet-generated");
        expect(profile.src).toBeNull();
      }
    }
  });
});
