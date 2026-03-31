import { describe, expect, it } from "vitest";

import { normalizeIndexCandidate } from "./normalizeIndexCandidate";

describe("normalizeIndexCandidate", () => {
  it("preserves tool prefix and rebuilds title for method_surface_tool slugs", () => {
    const out = normalizeIndexCandidate({
      id: "x",
      title: "Microfiber Cloth Dust Removal for Cabinets",
      slug: "microfiber-cloth-dust-removal-cabinets",
      category: "methods",
      cluster: "dust-removal",
    });
    expect(out.normalizedSlug).toBe("microfiber-cloth-dust-removal-cabinets");
    expect(out.normalizedTitle).toBe("Microfiber Cloth Dust Removal for Cabinets");
  });

  it("normalizes the method/surface body under a soft-bristle-brush prefix", () => {
    const out = normalizeIndexCandidate({
      id: "x",
      title: "Soft-Bristle Brush Agitation for Grout",
      slug: "soft-bristle-brush-agitation-grout",
      category: "methods",
      cluster: "agitation",
    });
    expect(out.normalizedSlug).toBe("soft-bristle-brush-agitation-grout");
    expect(out.normalizedTitle).toBe("Soft-Bristle Brush Agitation for Grout");
  });

  it("preserves intent why-does slug and title shape", () => {
    const out = normalizeIndexCandidate({
      id: "x",
      title: "Why Does Grease Buildup Happen on Cabinets?",
      slug: "why-does-grease-buildup-happen-on-cabinets",
      category: "problems",
      cluster: "c",
    });
    expect(out.normalizedSlug).toBe("why-does-grease-buildup-happen-on-cabinets");
    expect(out.normalizedTitle).toBe("Why Does Grease Buildup Happen on Cabinets?");
  });

  it("preserves intent how-to-prevent slug and title shape", () => {
    const out = normalizeIndexCandidate({
      id: "x",
      title: "How to Prevent Dust Buildup on Baseboards",
      slug: "how-to-prevent-dust-buildup-on-baseboards",
      category: "problems",
      cluster: "c",
    });
    expect(out.normalizedSlug).toBe("how-to-prevent-dust-buildup-on-baseboards");
    expect(out.normalizedTitle).toBe("How to Prevent Dust Buildup on Baseboards");
  });
});
