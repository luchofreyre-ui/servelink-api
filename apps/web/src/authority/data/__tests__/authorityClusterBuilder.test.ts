import { describe, expect, it } from "vitest";
import { buildClusterPage } from "../authorityClusterBuilder";

describe("authorityClusterBuilder", () => {
  it("builds a problem cluster page", () => {
    const page = buildClusterPage("mineral-buildup-and-hard-water");
    expect(page).not.toBeNull();
    expect(page?.relatedProblems.length).toBeGreaterThan(0);
  });

  it("builds a method cluster page", () => {
    const page = buildClusterPage("targeted-removal-methods");
    expect(page).not.toBeNull();
    expect(page?.relatedMethods.length).toBeGreaterThan(0);
  });

  it("builds a surface cluster page", () => {
    const page = buildClusterPage("high-visibility-finish-sensitive-surfaces");
    expect(page).not.toBeNull();
    expect(page?.relatedSurfaces.length).toBeGreaterThan(0);
  });
});
