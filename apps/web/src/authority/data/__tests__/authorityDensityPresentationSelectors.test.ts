import { describe, expect, it } from "vitest";
import { getAuthorityDensityBridge } from "../authorityDensityBridgeSelectors";
import { getAuthorityDensityPresentation } from "../authorityDensityPresentationSelectors";
import type { AuthorityDensityRiskLabel } from "@/authority/types/authorityDensityPresentationTypes";

const RISK_LABELS: AuthorityDensityRiskLabel[] = [
  "Routine care",
  "Test first",
  "Use caution",
  "Stop and assess",
];

describe("authorityDensityPresentationSelectors", () => {
  it("translates soap scum on shower glass into expert judgment language", () => {
    const bridge = getAuthorityDensityBridge({
      surfaceSlug: "shower-glass",
      problemSlug: "soap-scum",
    });

    const presentation = getAuthorityDensityPresentation(bridge);

    expect(presentation.confidenceLabel).toBe("Strong match");
    expect(presentation.riskLabel).toBe("Test first");
    expect(presentation.actionLabels).toEqual(
      expect.arrayContaining(["Inspect", "Name the soil", "Test first"]),
    );
  });

  it("returns a valid user-facing risk label for hard water deposits on glass", () => {
    const bridge = getAuthorityDensityBridge({
      surfaceSlug: "glass",
      problemSlug: "hard-water-deposits",
    });

    const presentation = getAuthorityDensityPresentation(bridge);

    expect(RISK_LABELS).toContain(presentation.riskLabel);
  });

  it("translates critical escalation paths into stop guidance", () => {
    const bridge = getAuthorityDensityBridge({
      surfaceSlug: "finished-wood",
      problemSlug: "surface-haze",
    });

    const presentation = getAuthorityDensityPresentation({
      ...bridge,
      normalizedSeverity: "critical",
      normalizedEscalation: ["visual_stop"],
    });

    expect(presentation.riskLabel).toBe("Stop and assess");
    expect(presentation.stopGuidance).toBeTruthy();
  });

  it("does not expose raw bridge enums in presentation output", () => {
    const bridge = getAuthorityDensityBridge({
      surfaceSlug: "shower-glass",
      problemSlug: "soap-scum",
    });

    const serialized = JSON.stringify(getAuthorityDensityPresentation(bridge));

    expect(serialized).not.toContain("restoration_boundary");
    expect(serialized).not.toContain("visual_stop");
    expect(serialized).not.toContain("workflow_safety");
    expect(serialized).not.toContain("surface_risk");
    expect(serialized).not.toContain("unknown_material");
    expect(serialized).not.toMatch(/"high"|"medium"|"low"/);
    expect(serialized).not.toMatch(/"none"|"moderate"|"critical"/);
    expect(serialized).not.toMatch(/"inspect"|"identify"|"pretest"/);
  });
});
