import { describe, expect, it } from "vitest";

import { buildExpandedIndexCandidates } from "./build-expanded-index-candidates";
import {
  ALL_INTENT_PROBLEM_SURFACE_TEMPLATES,
  GENERATION_EXPANSION_CONFIG,
  INTENT_EXPANDABLE_PROBLEMS,
  SEVERITY_EXCLUDED_IDENTITY_ENTITY_SLUGS,
  SEVERITY_EXCLUDED_IDENTITY_SURFACE_SLUGS,
  SEVERITY_EXPANDABLE_METHODS,
  SEVERITY_EXPANDABLE_PROBLEMS,
  TOOL_EXPANDABLE_METHODS,
  TOOL_LEVELS,
  type GenerationExpansionConfig,
} from "./generation-expansion-config";
import { cleanupSurfaceTaxonomy } from "../../../src/lib/encyclopedia/taxonomyCleanup";
import {
  evaluateMethodSurfaceCompatibility,
  evaluateProblemSurfaceCompatibility,
  evaluateToolMethodSurfaceCompatibility,
} from "../../../src/lib/encyclopedia/surfaceCompatibility";

/** Guard excludes only apply to pairs that pass surface compatibility (compat runs first). */
function countGuardExcludedProblemSurfaceAmongCompatible(cfg: GenerationExpansionConfig): number {
  let n = 0;
  for (const p of cfg.problems) {
    for (const s of cfg.surfaces) {
      const norm = cleanupSurfaceTaxonomy(s.slug).normalizedSurfaceSlug;
      if (!evaluateProblemSurfaceCompatibility(p.slug, norm).ok) {
        continue;
      }
      const exclude = cfg.guardRules.some(
        (r) =>
          r.appliesTo === "problem_surface" &&
          r.problemSlug === p.slug &&
          r.surfaceSlug === norm &&
          r.action === "exclude",
      );
      if (exclude) {
        n += 1;
      }
    }
  }
  return n;
}

function countExcludedSymptomStems(cfg: GenerationExpansionConfig): number {
  return cfg.symptomQuestionStems.filter((stem) => {
    const lower = stem.toLowerCase();
    return cfg.guardRules.some(
      (r) =>
        r.appliesTo === "question_symptom_cause" &&
        r.action === "exclude" &&
        r.stemIncludesAll.every((frag) => lower.includes(frag)),
    );
  }).length;
}

function countIncompatibleProblemSurfacePairs(cfg: GenerationExpansionConfig): number {
  let n = 0;
  for (const p of cfg.problems) {
    for (const s of cfg.surfaces) {
      const norm = cleanupSurfaceTaxonomy(s.slug).normalizedSurfaceSlug;
      if (!evaluateProblemSurfaceCompatibility(p.slug, norm).ok) {
        n += 1;
      }
    }
  }
  return n;
}

function countIncompatibleMethodSurfacePairs(cfg: GenerationExpansionConfig): number {
  let n = 0;
  for (const m of cfg.methods) {
    for (const s of cfg.surfaces) {
      const norm = cleanupSurfaceTaxonomy(s.slug).normalizedSurfaceSlug;
      if (!evaluateMethodSurfaceCompatibility(m.slug, norm).ok) {
        n += 1;
      }
    }
  }
  return n;
}

const SEVERITY_PROBLEM_SET = new Set<string>(SEVERITY_EXPANDABLE_PROBLEMS);
const SEVERITY_METHOD_SET = new Set<string>(SEVERITY_EXPANDABLE_METHODS);

function countIncompatibleSeverityProblemPairs(cfg: GenerationExpansionConfig): number {
  let n = 0;
  for (const p of cfg.problems) {
    if (!SEVERITY_PROBLEM_SET.has(p.slug)) {
      continue;
    }
    if (SEVERITY_EXCLUDED_IDENTITY_ENTITY_SLUGS.has(p.slug)) {
      continue;
    }
    for (const s of cfg.surfaces) {
      const norm = cleanupSurfaceTaxonomy(s.slug).normalizedSurfaceSlug;
      if (SEVERITY_EXCLUDED_IDENTITY_SURFACE_SLUGS.has(norm)) {
        continue;
      }
      if (!evaluateProblemSurfaceCompatibility(p.slug, norm).ok) {
        n += 1;
      }
    }
  }
  return n;
}

function countIncompatibleSeverityMethodPairs(cfg: GenerationExpansionConfig): number {
  let n = 0;
  for (const m of cfg.methods) {
    if (!SEVERITY_METHOD_SET.has(m.slug)) {
      continue;
    }
    if (SEVERITY_EXCLUDED_IDENTITY_ENTITY_SLUGS.has(m.slug)) {
      continue;
    }
    for (const s of cfg.surfaces) {
      const norm = cleanupSurfaceTaxonomy(s.slug).normalizedSurfaceSlug;
      if (SEVERITY_EXCLUDED_IDENTITY_SURFACE_SLUGS.has(norm)) {
        continue;
      }
      if (!evaluateMethodSurfaceCompatibility(m.slug, norm).ok) {
        n += 1;
      }
    }
  }
  return n;
}

const TOOL_METHOD_SET = new Set<string>(TOOL_EXPANDABLE_METHODS);

function countToolFamilyCompatibilitySkips(cfg: GenerationExpansionConfig): number {
  let n = 0;
  for (const m of cfg.methods) {
    if (!TOOL_METHOD_SET.has(m.slug)) {
      continue;
    }
    for (const s of cfg.surfaces) {
      const norm = cleanupSurfaceTaxonomy(s.slug).normalizedSurfaceSlug;
      if (!evaluateMethodSurfaceCompatibility(m.slug, norm).ok) {
        n += 1;
        continue;
      }
      for (const t of TOOL_LEVELS) {
        if (!evaluateToolMethodSurfaceCompatibility(t.slug, m.slug, norm).ok) {
          n += 1;
        }
      }
    }
  }
  return n;
}

const INTENT_TEMPLATE_COUNT = ALL_INTENT_PROBLEM_SURFACE_TEMPLATES.length;
const INTENT_ELIGIBLE_PROBLEM_SET = new Set<string>(INTENT_EXPANDABLE_PROBLEMS);

function countIntentCompatibilitySkips(cfg: GenerationExpansionConfig): number {
  let n = 0;
  for (const p of cfg.problems) {
    if (!INTENT_ELIGIBLE_PROBLEM_SET.has(p.slug)) {
      continue;
    }
    for (const s of cfg.surfaces) {
      const norm = cleanupSurfaceTaxonomy(s.slug).normalizedSurfaceSlug;
      if (!evaluateProblemSurfaceCompatibility(p.slug, norm).ok) {
        n += INTENT_TEMPLATE_COUNT;
      }
    }
  }
  return n;
}

function countIntentGuardExcludesAmongCompatible(cfg: GenerationExpansionConfig): number {
  let n = 0;
  for (const p of cfg.problems) {
    if (!INTENT_ELIGIBLE_PROBLEM_SET.has(p.slug)) {
      continue;
    }
    for (const s of cfg.surfaces) {
      const norm = cleanupSurfaceTaxonomy(s.slug).normalizedSurfaceSlug;
      if (!evaluateProblemSurfaceCompatibility(p.slug, norm).ok) {
        continue;
      }
      const exclude = cfg.guardRules.some(
        (r) =>
          r.appliesTo === "problem_surface" &&
          r.problemSlug === p.slug &&
          r.surfaceSlug === norm &&
          r.action === "exclude",
      );
      if (exclude) {
        n += INTENT_TEMPLATE_COUNT;
      }
    }
  }
  return n;
}

describe("buildExpandedIndexCandidates", () => {
  it("problem × surface yields expected candidate count vs config cross product minus exclusions", () => {
    const cfg = GENERATION_EXPANSION_CONFIG;
    const guardEx = countGuardExcludedProblemSurfaceAmongCompatible(cfg);
    const compatEx = countIncompatibleProblemSurfacePairs(cfg);
    const expected = cfg.problems.length * cfg.surfaces.length - guardEx - compatEx;
    const result = buildExpandedIndexCandidates({ families: ["problem_surface"] });
    expect(result.countsByFamily.problem_surface).toBe(expected);
    expect(result.excludedCount).toBe(guardEx);
    expect(result.compatibilityExcludedCount).toBe(compatEx);
  });

  it("method × surface yields expected candidate count (no method_surface exclusions in default config)", () => {
    const cfg = GENERATION_EXPANSION_CONFIG;
    const compatEx = countIncompatibleMethodSurfacePairs(cfg);
    const expected = cfg.methods.length * cfg.surfaces.length - compatEx;
    const result = buildExpandedIndexCandidates({ families: ["method_surface"] });
    expect(result.countsByFamily.method_surface).toBe(expected);
    expect(result.compatibilityExcludedCount).toBe(compatEx);
  });

  it("applies guard exclusion when compatibility allows the pair", () => {
    const cfg: GenerationExpansionConfig = {
      problems: [{ slug: "degreasing", title: "Degreasing", cluster: "degreasing" }],
      surfaces: [{ slug: "finished-wood" }],
      methods: [],
      symptomQuestionStems: [],
      preventionQuestionStems: [],
      comparisonMethodPairs: [],
      comparisonProblemPairs: [],
      comparisonSurfacePairs: [],
      guardRules: [
        {
          appliesTo: "problem_surface",
          problemSlug: "degreasing",
          surfaceSlug: "finished-wood",
          action: "exclude",
          warningCode: "WEAK_PROBLEM_SURFACE",
        },
      ],
    };
    const result = buildExpandedIndexCandidates({ families: ["problem_surface"], config: cfg });
    expect(result.candidates).toHaveLength(0);
    expect(result.excludedCount).toBe(1);
    expect(result.compatibilityExcludedCount).toBe(0);
  });

  it("skips mineral problem × surface when compatibility rejects before guard", () => {
    const cfg: GenerationExpansionConfig = {
      problems: [{ slug: "soap-scum", title: "Soap Scum", cluster: "c" }],
      surfaces: [{ slug: "finished-wood" }],
      methods: [],
      symptomQuestionStems: [],
      preventionQuestionStems: [],
      comparisonMethodPairs: [],
      comparisonProblemPairs: [],
      comparisonSurfacePairs: [],
      guardRules: [],
    };
    const r = buildExpandedIndexCandidates({ families: ["problem_surface"], config: cfg });
    expect(r.candidates).toHaveLength(0);
    expect(r.compatibilityExcludedCount).toBe(1);
    expect(r.excludedCount).toBe(0);
  });

  it("compatibility excludes glass-care method on non-glass surfaces before guard", () => {
    const cfg: GenerationExpansionConfig = {
      problems: [],
      surfaces: [{ slug: "grout" }],
      methods: [{ slug: "streak-free-glass-cleaning", title: "Streak-Free Glass Cleaning", cluster: "g" }],
      symptomQuestionStems: [],
      preventionQuestionStems: [],
      comparisonMethodPairs: [],
      comparisonProblemPairs: [],
      comparisonSurfacePairs: [],
      guardRules: [
        {
          appliesTo: "method_surface",
          methodSlug: "streak-free-glass-cleaning",
          surfaceSlug: "grout",
          action: "flag",
          warningCode: "WEAK_METHOD_SURFACE",
        },
      ],
    };
    const result = buildExpandedIndexCandidates({ families: ["method_surface"], config: cfg });
    expect(result.candidates).toHaveLength(0);
    expect(result.compatibilityExcludedCount).toBe(1);
    expect(result.excludedCount).toBe(0);
  });

  it("symptom stem matching floors+glass is excluded when rule present", () => {
    const cfg: GenerationExpansionConfig = {
      problems: [],
      methods: [],
      surfaces: [],
      symptomQuestionStems: ["why glass floors look hazy after cleaning"],
      preventionQuestionStems: [],
      comparisonMethodPairs: [],
      comparisonProblemPairs: [],
      comparisonSurfacePairs: [],
      guardRules: [
        {
          appliesTo: "question_symptom_cause",
          stemIncludesAll: ["floors", "glass"],
          action: "exclude",
          warningCode: "IMPLAUSIBLE_SUBSTRATE",
        },
      ],
    };
    const result = buildExpandedIndexCandidates({ families: ["question_symptom_cause"], config: cfg });
    expect(result.candidates).toHaveLength(0);
    expect(result.excludedCount).toBe(1);
  });

  it("comparison_method_method produces stable title, slug, category, and generatedType", () => {
    const result = buildExpandedIndexCandidates({ families: ["comparison_method_method"] });
    const row = result.candidates.find((c) => c.sourceFamily === "comparison_method_method");
    expect(row).toBeDefined();
    expect(row!.slug).toBe("degreasing-vs-neutral-surface-cleaning");
    expect(row!.title).toBe("Degreasing vs Neutral Surface Cleaning");
    expect(row!.category).toBe("methods");
    expect(row!.generatedType).toBe("comparison_seed");
    expect(row!.sourceParts).toMatchObject({
      leftMethod: { slug: "degreasing", title: "Degreasing" },
      rightMethod: { slug: "neutral-surface-cleaning", title: "Neutral Surface Cleaning" },
    });
  });

  it("question_symptom_cause seeds have expected shape", () => {
    const result = buildExpandedIndexCandidates({ families: ["question_symptom_cause"] });
    const row = result.candidates.find((c) => c.slug === "why-does-glass-look-hazy-after-cleaning");
    expect(row).toBeDefined();
    expect(row!.generatedType).toBe("question_seed");
    expect(row!.category).toBe("problems");
    expect(row!.cluster).toBe("diagnostics");
    expect(row!.sourceParts).toEqual({
      questionStem: "why does glass look hazy after cleaning",
    });
  });

  it("repeated runs produce identical ids and slugs for the same config", () => {
    const a = buildExpandedIndexCandidates();
    const b = buildExpandedIndexCandidates();
    expect(a.candidates.map((c) => ({ id: c.id, slug: c.slug }))).toEqual(
      b.candidates.map((c) => ({ id: c.id, slug: c.slug })),
    );
  });

  it("default bundle aggregates exclusions across families", () => {
    const cfg = GENERATION_EXPANSION_CONFIG;
    const expectedExcluded =
      countGuardExcludedProblemSurfaceAmongCompatible(cfg) +
      countExcludedSymptomStems(cfg) +
      countIntentGuardExcludesAmongCompatible(cfg);
    const result = buildExpandedIndexCandidates();
    expect(result.excludedCount).toBe(expectedExcluded);
    expect(result.compatibilityExcludedCount).toBe(
      countIncompatibleProblemSurfacePairs(cfg) +
        countIncompatibleMethodSurfacePairs(cfg) +
        countIncompatibleSeverityProblemPairs(cfg) +
        countIncompatibleSeverityMethodPairs(cfg) +
        countToolFamilyCompatibilitySkips(cfg) +
        countIntentCompatibilitySkips(cfg),
    );
  });

  it("emits problem_surface_severity for an eligible problem on a non-identity surface", () => {
    const cfg: GenerationExpansionConfig = {
      problems: [{ slug: "dust-buildup", title: "Dust Buildup", cluster: "dust-buildup" }],
      methods: [],
      surfaces: [{ slug: "cabinets" }],
      symptomQuestionStems: [],
      preventionQuestionStems: [],
      comparisonMethodPairs: [],
      comparisonProblemPairs: [],
      comparisonSurfacePairs: [],
      guardRules: [],
    };
    const r = buildExpandedIndexCandidates({ families: ["problem_surface_severity"], config: cfg });
    expect(r.countsByFamily.problem_surface_severity).toBe(3);
    const heavy = r.candidates.find((c) => c.slug === "heavy-dust-buildup-on-cabinets");
    expect(heavy).toMatchObject({
      sourceFamily: "problem_surface_severity",
      generatedType: "problem_surface_severity",
      title: "Heavy Dust Buildup on Cabinets",
    });
    expect(heavy?.sourceParts).toMatchObject({
      severity: { slug: "heavy", title: "Heavy" },
      problem: { slug: "dust-buildup", title: "Dust Buildup" },
    });
  });

  it("emits method_surface_severity for an eligible method on a non-identity surface", () => {
    const cfg: GenerationExpansionConfig = {
      problems: [],
      methods: [{ slug: "degreasing", title: "Degreasing", cluster: "degreasing" }],
      surfaces: [{ slug: "cabinets" }],
      symptomQuestionStems: [],
      preventionQuestionStems: [],
      comparisonMethodPairs: [],
      comparisonProblemPairs: [],
      comparisonSurfacePairs: [],
      guardRules: [],
    };
    const r = buildExpandedIndexCandidates({ families: ["method_surface_severity"], config: cfg });
    expect(r.countsByFamily.method_surface_severity).toBe(3);
    const light = r.candidates.find((c) => c.slug === "light-degreasing-cabinets");
    expect(light).toMatchObject({
      sourceFamily: "method_surface_severity",
      title: "Light Degreasing for Cabinets",
    });
  });

  it("does not emit severity variants for identity surfaces (e.g. grout)", () => {
    const cfg: GenerationExpansionConfig = {
      problems: [{ slug: "dust-buildup", title: "Dust Buildup", cluster: "dust-buildup" }],
      methods: [{ slug: "degreasing", title: "Degreasing", cluster: "degreasing" }],
      surfaces: [{ slug: "grout" }],
      symptomQuestionStems: [],
      preventionQuestionStems: [],
      comparisonMethodPairs: [],
      comparisonProblemPairs: [],
      comparisonSurfacePairs: [],
      guardRules: [],
    };
    const r = buildExpandedIndexCandidates({
      families: ["problem_surface_severity", "method_surface_severity"],
      config: cfg,
    });
    expect(r.candidates).toHaveLength(0);
  });

  it("compatibility still blocks severity rows when base pair is incompatible", () => {
    const cfg: GenerationExpansionConfig = {
      problems: [{ slug: "soap-scum", title: "Soap Scum", cluster: "c" }],
      methods: [],
      surfaces: [{ slug: "laminate" }],
      symptomQuestionStems: [],
      preventionQuestionStems: [],
      comparisonMethodPairs: [],
      comparisonProblemPairs: [],
      comparisonSurfacePairs: [],
      guardRules: [],
    };
    const r = buildExpandedIndexCandidates({ families: ["problem_surface_severity"], config: cfg });
    expect(r.candidates).toHaveLength(0);
    expect(r.compatibilityExcludedCount).toBe(1);
  });

  it("emits method_surface_tool rows with slug tool-method-surface and sourceParts", () => {
    const r = buildExpandedIndexCandidates({ families: ["method_surface_tool"] });
    const row = r.candidates.find((c) => c.slug === "microfiber-cloth-dust-removal-cabinets");
    expect(row).toMatchObject({
      sourceFamily: "method_surface_tool",
      generatedType: "method_surface_tool",
      title: "Microfiber Cloth Dust Removal for Cabinets",
      category: "methods",
    });
    expect(row?.sourceParts).toMatchObject({
      tool: { slug: "microfiber-cloth", title: "Microfiber Cloth" },
      method: { slug: "dust-removal", title: "Dust Removal" },
      surface: { normalizedSlug: "cabinets" },
    });
    const mopVinyl = r.candidates.find((c) => c.slug === "mop-neutral-surface-cleaning-vinyl");
    expect(mopVinyl?.title).toBe("Mop Neutral Surface Cleaning for Vinyl");
    const squeegeeDryingGlass = r.candidates.find(
      (c) => c.slug === "squeegee-drying-glass-surfaces",
    );
    expect(squeegeeDryingGlass?.title).toBe("Squeegee Drying for Glass Surfaces");
  });

  it("does not emit tool rows blocked by tool × surface rules", () => {
    const r = buildExpandedIndexCandidates({ families: ["method_surface_tool"] });
    const slugs = new Set(r.candidates.map((c) => c.slug));
    expect(slugs.has("squeegee-agitation-grout")).toBe(false);
    expect(slugs.has("mop-drying-cabinets")).toBe(false);
    expect(slugs.has("scrub-pad-buffing-finished-wood")).toBe(false);
    expect(slugs.has("soft-bristle-brush-neutral-surface-cleaning-painted-walls")).toBe(false);
  });

  it("emits intent problem×surface rows with templates, sourceParts, and problem_surface compatibility", () => {
    const r = buildExpandedIndexCandidates();
    const why = r.candidates.find((c) => c.slug === "why-does-grease-buildup-happen-on-cabinets");
    expect(why).toMatchObject({
      sourceFamily: "question_why_problem_surface",
      generatedType: "question_why_problem_surface",
      title: "Why Does Grease Buildup Happen on Cabinets?",
    });
    expect(why?.sourceParts).toMatchObject({
      intent: { slug: "why-does", title: "Why Does" },
      problem: { slug: "grease-buildup" },
      surface: { normalizedSlug: "cabinets" },
    });
    expect(
      r.candidates.find((c) => c.slug === "what-causes-streaking-on-glass"),
    ).toMatchObject({
      sourceFamily: "question_cause_problem_surface",
      title: "What Causes Streaking on Glass?",
    });
    expect(
      r.candidates.find((c) => c.slug === "how-to-prevent-dust-buildup-on-baseboards"),
    ).toMatchObject({
      sourceFamily: "prevention_problem_surface",
      title: "How to Prevent Dust Buildup on Baseboards",
    });
    expect(
      r.candidates.find(
        (c) =>
          c.slug === "how-to-maintain-glass-surfaces-to-prevent-soap-scum" &&
          c.sourceFamily === "maintenance_problem_surface",
      ),
    ).toMatchObject({
      title: "How to Maintain Glass Surfaces to Prevent Soap Scum",
    });
  });

  it("does not emit intent rows when problem×surface fails compatibility or problem is not intent-eligible", () => {
    const r = buildExpandedIndexCandidates();
    const slugs = new Set(r.candidates.map((c) => c.slug));
    expect(slugs.has("how-to-prevent-soap-scum-on-cabinets")).toBe(false);
    expect(slugs.has("why-does-glass-cleaning-happen-on-painted-walls")).toBe(false);
  });

  it("maps severity source families to problem/method scorers via expanded reviewed pipeline shape", async () => {
    const { mapExpandedCandidateToReviewed } = await import("./expanded-to-reviewed-index-candidates");
    const prob = mapExpandedCandidateToReviewed({
      id: "X",
      slug: "heavy-dust-buildup-on-cabinets",
      title: "Heavy Dust Buildup on Cabinets",
      category: "problems",
      cluster: "dust-buildup",
      role: "supporting",
      status: "draft",
      generatedType: "problem_surface_severity",
      sourceFamily: "problem_surface_severity",
      sourceParts: {},
    });
    expect(prob.scorerRecommendation).toBeDefined();
    const meth = mapExpandedCandidateToReviewed({
      id: "Y",
      slug: "light-degreasing-cabinets",
      title: "Light Degreasing for Cabinets",
      category: "methods",
      cluster: "degreasing",
      role: "supporting",
      status: "draft",
      generatedType: "method_surface_severity",
      sourceFamily: "method_surface_severity",
      sourceParts: {},
    });
    expect(meth.scorerRecommendation).toBeDefined();
  });
});
