import { describe, expect, it } from "vitest";

import type { ExpandedRawIndexCandidate } from "./build-expanded-index-candidates";
import {
  buildExpandedReviewedIndexCandidatesForExport,
  mapExpandedCandidateToReviewed,
  parseExpandedIndexCandidatesFile,
} from "./expanded-to-reviewed-index-candidates";

function seedComparison(): ExpandedRawIndexCandidate {
  return {
    id: "EXP-CMM-TEST",
    slug: "alpha-vs-beta",
    title: "Alpha vs Beta",
    category: "methods",
    cluster: "c",
    role: "supporting",
    status: "draft",
    generatedType: "comparison_seed",
    sourceFamily: "comparison_method_method",
    sourceParts: {
      leftMethod: { slug: "alpha", title: "Alpha" },
      rightMethod: { slug: "beta", title: "Beta" },
    },
  };
}

function seedQuestion(): ExpandedRawIndexCandidate {
  return {
    id: "EXP-QS-TEST",
    slug: "why-does-test-happen",
    title: "Why does test happen",
    category: "problems",
    cluster: "diagnostics",
    role: "supporting",
    status: "draft",
    generatedType: "question_seed",
    sourceFamily: "question_symptom_cause",
    sourceParts: { questionStem: "why does test happen" },
  };
}

describe("expanded-to-reviewed-index-candidates", () => {
  it("parseExpandedIndexCandidatesFile reads wrapper shape", () => {
    const parsed = parseExpandedIndexCandidatesFile({
      total: 1,
      candidates: [seedComparison()],
    });
    expect(parsed.candidates).toHaveLength(1);
    expect(parsed.total).toBe(1);
  });

  it("seed-only families get scorerRecommendation review and final review when normalization allows", () => {
    const comp = mapExpandedCandidateToReviewed(seedComparison());
    expect(comp.scorerRecommendation).toBe("review");
    expect(comp.recommendation).toBe("review");
    expect(comp.qualityScore).toBeUndefined();

    const q = mapExpandedCandidateToReviewed(seedQuestion());
    expect(q.scorerRecommendation).toBe("review");
    expect(q.recommendation).toBe("review");
  });

  it("problem_surface runs scorer and includes normalization fields", () => {
    const row: ExpandedRawIndexCandidate = {
      id: "EXP-P-TEST",
      slug: "dust-buildup-on-countertops",
      title: "Dust Buildup on Countertops",
      category: "problems",
      cluster: "dust-buildup",
      role: "supporting",
      status: "draft",
      generatedType: "problem_surface",
      sourceFamily: "problem_surface",
      sourceParts: {
        problem: { slug: "dust-buildup", title: "Dust Buildup" },
        surface: { inputSlug: "countertops", normalizedSlug: "countertops", label: "Countertops" },
      },
    };
    const out = mapExpandedCandidateToReviewed(row);
    expect(out.scorerRecommendation).toBeDefined();
    expect(typeof out.qualityScore).toBe("number");
    expect(Array.isArray(out.qualityFlags)).toBe(true);
    expect(out.normalizedTitle.length).toBeGreaterThan(0);
    expect(out.normalizedSlug.length).toBeGreaterThan(0);
    expect(out.normalizationAction).toBeDefined();
  });

  it("method_surface runs scorer", () => {
    const row: ExpandedRawIndexCandidate = {
      id: "EXP-M-TEST",
      slug: "degreasing-countertops",
      title: "Degreasing for Countertops",
      category: "methods",
      cluster: "degreasing",
      role: "supporting",
      status: "draft",
      generatedType: "method_surface",
      sourceFamily: "method_surface",
      sourceParts: {},
    };
    const out = mapExpandedCandidateToReviewed(row);
    expect(out.scorerRecommendation).toBeDefined();
    expect(typeof out.qualityScore).toBe("number");
  });

  it("intent problem×surface families force scorer review but still normalize", () => {
    const row: ExpandedRawIndexCandidate = {
      id: "EXP-I-WHY",
      slug: "why-does-grease-buildup-happen-on-cabinets",
      title: "Why Does Grease Buildup Happen on Cabinets?",
      category: "problems",
      cluster: "oil-and-kitchen-residue",
      role: "supporting",
      status: "draft",
      generatedType: "question_why_problem_surface",
      sourceFamily: "question_why_problem_surface",
      sourceParts: {
        intent: { slug: "why-does", title: "Why Does" },
        problem: { slug: "grease-buildup", title: "Grease Buildup" },
        surface: { normalizedSlug: "cabinets", label: "Cabinets" },
      },
    };
    const out = mapExpandedCandidateToReviewed(row);
    expect(out.scorerRecommendation).toBe("review");
    expect(out.qualityScore).toBeUndefined();
    expect(out.normalizedSlug).toBe("why-does-grease-buildup-happen-on-cabinets");
    expect(out.normalizedTitle).toBe("Why Does Grease Buildup Happen on Cabinets?");
    expect(out.recommendation).toBe("review");
  });

  it("method_surface_tool scores like method_surface", () => {
    const row: ExpandedRawIndexCandidate = {
      id: "EXP-MST-TEST",
      slug: "microfiber-cloth-dust-removal-cabinets",
      title: "Microfiber Cloth Dust Removal for Cabinets",
      category: "methods",
      cluster: "dust-removal",
      role: "supporting",
      status: "draft",
      generatedType: "method_surface_tool",
      sourceFamily: "method_surface_tool",
      sourceParts: {
        tool: { slug: "microfiber-cloth", title: "Microfiber Cloth" },
        method: { slug: "dust-removal", title: "Dust Removal" },
        surface: { normalizedSlug: "cabinets", label: "Cabinets" },
      },
    };
    const out = mapExpandedCandidateToReviewed(row);
    expect(typeof out.qualityScore).toBe("number");
    expect(out.normalizedTitle).toBe("Microfiber Cloth Dust Removal for Cabinets");
    expect(out.normalizedSlug).toBe("microfiber-cloth-dust-removal-cabinets");
  });

  it("buildExpandedReviewedIndexCandidatesForExport is deterministic by slug order", () => {
    const a = buildExpandedReviewedIndexCandidatesForExport([seedQuestion(), seedComparison()]);
    const b = buildExpandedReviewedIndexCandidatesForExport([seedComparison(), seedQuestion()]);
    expect(a.map((x) => x.slug)).toEqual(b.map((x) => x.slug));
  });

  it("preserves seedWarnings from expanded row", () => {
    const row = { ...seedComparison(), seedWarnings: ["WEAK_METHOD_SURFACE"] };
    const out = mapExpandedCandidateToReviewed(row);
    expect(out.seedWarnings).toEqual(["WEAK_METHOD_SURFACE"]);
  });
});
