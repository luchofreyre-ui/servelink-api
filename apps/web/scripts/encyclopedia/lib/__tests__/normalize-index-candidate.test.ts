import { describe, expect, it } from "vitest";

import {
  normalizeIndexCandidate,
  reconcileFinalRecommendation,
} from "@/lib/encyclopedia/normalizeIndexCandidate";

const base = {
  id: "TEST",
  category: "problems",
  cluster: "product-residue",
};

describe("normalizeIndexCandidate", () => {
  it("keep: degreasing-finished-wood (method)", () => {
    const r = normalizeIndexCandidate({
      ...base,
      id: "M-GEN-DEGREASING-FINISHED-WOOD",
      title: "Degreasing for Finished Wood",
      slug: "degreasing-finished-wood",
      category: "methods",
      cluster: "degreasing",
    });
    expect(r.normalizationAction).toBe("keep");
    expect(r.normalizedSlug).toBe("degreasing-finished-wood");
    expect(r.normalizedTitle).toBe("Degreasing for Finished Wood");
    expect(r.normalizationWarnings).not.toContain("SURFACE_NAME_NORMALIZED");
  });

  it("collapses duplicate method+surface when method slug already ends with that surface", () => {
    const r = normalizeIndexCandidate({
      ...base,
      id: "M-GEN-DUP",
      category: "methods",
      cluster: "degreasing",
      title: "Degreasing for Finished Wood for Finished Wood",
      slug: "degreasing-finished-wood-finished-wood",
    });
    expect(r.normalizedSlug).toBe("degreasing-finished-wood");
    expect(r.normalizedTitle).toBe("Degreasing for Finished Wood");
    expect(r.normalizationWarnings).toContain("DUPLICATE_SURFACE_SEGMENT");
    expect(r.normalizationAction).toBe("keep");
  });

  describe("Rule F — duplicate surface segment (methods)", () => {
    it("degreasing-glass-surfaces-glass -> degreasing-glass + DUPLICATE_SURFACE_SEGMENT", () => {
      const r = normalizeIndexCandidate({
        ...base,
        id: "M-1",
        category: "methods",
        cluster: "degreasing",
        title: "Degreasing Glass Surfaces Glass",
        slug: "degreasing-glass-surfaces-glass",
      });
      expect(r.normalizedSlug).toBe("degreasing-glass");
      expect(r.normalizedTitle).toBe("Degreasing for Glass");
      expect(r.normalizationWarnings).toContain("DUPLICATE_SURFACE_SEGMENT");
      expect(r.normalizationAction).toBe("keep");
    });

    it("neutral-surface-cleaning-glass-surfaces-glass -> neutral-surface-cleaning-glass", () => {
      const r = normalizeIndexCandidate({
        ...base,
        id: "M-2",
        category: "methods",
        cluster: "neutral-cleaning",
        title: "Neutral Surface Cleaning Glass Surfaces Glass",
        slug: "neutral-surface-cleaning-glass-surfaces-glass",
      });
      expect(r.normalizedSlug).toBe("neutral-surface-cleaning-glass");
      expect(r.normalizationWarnings).toContain("DUPLICATE_SURFACE_SEGMENT");
      expect(r.normalizationAction).toBe("keep");
    });

    it("hard-water-deposit-removal-glass-surfaces-glass -> hard-water-deposit-removal-glass", () => {
      const r = normalizeIndexCandidate({
        ...base,
        id: "M-3",
        category: "methods",
        cluster: "hard-water-removal",
        title: "Hard Water Deposit Removal Glass Surfaces Glass",
        slug: "hard-water-deposit-removal-glass-surfaces-glass",
      });
      expect(r.normalizedSlug).toBe("hard-water-deposit-removal-glass");
      expect(r.normalizationWarnings).toContain("DUPLICATE_SURFACE_SEGMENT");
      expect(r.normalizationAction).toBe("keep");
    });

    it("does not apply Rule F to problems category", () => {
      const r = normalizeIndexCandidate({
        ...base,
        category: "problems",
        cluster: "x",
        title: "Fake Problem on Grout",
        slug: "fake-problem-on-grout",
      });
      expect(r.normalizedSlug).toBe("fake-problem-on-grout");
      expect(r.normalizationWarnings).not.toContain("DUPLICATE_SURFACE_SEGMENT");
    });

    it("unclear short stem: does not collapse, LOW_CONFIDENCE_REWRITE and review", () => {
      const r = normalizeIndexCandidate({
        ...base,
        id: "M-X",
        category: "methods",
        cluster: "degreasing",
        title: "Xx Glass Surfaces Glass",
        slug: "xx-glass-surfaces-glass",
      });
      expect(r.normalizedSlug).toBe("xx-glass-surfaces-glass");
      expect(r.normalizationWarnings).toContain("LOW_CONFIDENCE_REWRITE");
      expect(r.normalizationWarnings).not.toContain("DUPLICATE_SURFACE_SEGMENT");
      expect(r.normalizationAction).toBe("review");
    });
  });

  it("keep: grease-buildup-on-grout", () => {
    const r = normalizeIndexCandidate({
      ...base,
      title: "Grease Buildup on Grout",
      slug: "grease-buildup-on-grout",
      cluster: "grease-buildup",
    });
    expect(r.normalizationAction).toBe("keep");
    expect(r.normalizedSlug).toBe("grease-buildup-on-grout");
  });

  it("rewrite on-cleaning can stay keep: floor-residue-after-mopping-on-cleaning-grout", () => {
    const r = normalizeIndexCandidate({
      ...base,
      title: "Floor Residue After Mopping on Cleaning Grout",
      slug: "floor-residue-after-mopping-on-cleaning-grout",
      cluster: "product-residue",
    });
    expect(r.normalizedSlug).toBe("floor-residue-after-mopping-on-grout");
    expect(r.normalizationWarnings).toContain("REDUNDANT_ON_CLEANING");
    expect(r.normalizationAction).toBe("keep");
  });

  it("review: floor-residue-after-mopping-on-glass-surfaces", () => {
    const r = normalizeIndexCandidate({
      ...base,
      title: "Floor Residue After Mopping on Glass Surfaces",
      slug: "floor-residue-after-mopping-on-glass-surfaces",
      cluster: "product-residue",
    });
    expect(r.normalizationAction).toBe("review");
    expect(r.normalizationWarnings).toContain("FLOOR_ONLY_PROBLEM_ON_NON_FLOOR_SURFACE");
    expect(r.normalizedSlug).toContain("glass");
  });

  it("review: floor-residue-after-mopping-on-stainless-steel", () => {
    const r = normalizeIndexCandidate({
      ...base,
      title: "Floor Residue After Mopping on Stainless Steel",
      slug: "floor-residue-after-mopping-on-stainless-steel",
      cluster: "product-residue",
    });
    expect(r.normalizationAction).toBe("review");
    expect(r.normalizationWarnings).toContain("FLOOR_ONLY_PROBLEM_ON_NON_FLOOR_SURFACE");
  });

  it("review: cleaner-film-on-countertops-on-cleaning-shower-glass", () => {
    const r = normalizeIndexCandidate({
      ...base,
      title: "Cleaner Film on Countertops on Cleaning Shower Glass",
      slug: "cleaner-film-on-countertops-on-cleaning-shower-glass",
      cluster: "product-residue",
    });
    expect(r.normalizationAction).toBe("review");
    expect(r.normalizationWarnings).toContain("COUNTERTOP_SURFACE_MISMATCH");
    expect(r.normalizedSlug).toBe("cleaner-film-on-shower-glass");
    expect(r.normalizedTitle).toMatch(/Shower Glass/i);
  });

  it("countertop + finished wood rewrite is reviewed and not identical to raw slug/title", () => {
    const rawSlug = "cleaner-film-on-countertops-on-cleaning-finished-wood";
    const r = normalizeIndexCandidate({
      ...base,
      title: "Cleaner Film on Countertops on Cleaning Finished Wood",
      slug: rawSlug,
      cluster: "product-residue",
    });
    expect(r.normalizedSlug).not.toBe(rawSlug);
    expect(r.normalizationAction).toBe("review");
    expect(r.normalizationWarnings).toContain("COUNTERTOP_SURFACE_MISMATCH");
  });
});

describe("reconcileFinalRecommendation", () => {
  it("scorer reject always wins", () => {
    expect(reconcileFinalRecommendation("reject", "keep")).toBe("reject");
    expect(reconcileFinalRecommendation("reject", "review")).toBe("reject");
  });

  it("normalization reject downgrades promote", () => {
    expect(reconcileFinalRecommendation("promote", "reject")).toBe("reject");
  });

  it("scorer review blocks promote even if normalization keep", () => {
    expect(reconcileFinalRecommendation("review", "keep")).toBe("review");
  });

  it("normalization review downgrades scorer promote", () => {
    expect(reconcileFinalRecommendation("promote", "review")).toBe("review");
  });

  it("both promote and keep stays promote", () => {
    expect(reconcileFinalRecommendation("promote", "keep")).toBe("promote");
  });
});
