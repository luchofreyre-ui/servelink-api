/**
 * Data-only expansion inputs for encyclopedia index candidate generation.
 * Add rows here to grow supply; guard rules live in expansionGuardRules.
 */

export type ExpansionEntity = {
  slug: string;
  title: string;
  cluster: string;
};

export type ExpansionSurfaceRef = {
  /** Slug fragment passed through surface taxonomy cleanup (e.g. shower-glass, grout). */
  slug: string;
};

function expansionTitleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function expansionSurfaceRefsFromSlugs(slugs: readonly string[]): ExpansionSurfaceRef[] {
  return slugs.map((slug) => ({ slug }));
}

function dedupeExpansionSurfaces(surfaces: ExpansionSurfaceRef[]): ExpansionSurfaceRef[] {
  const seen = new Set<string>();
  const out: ExpansionSurfaceRef[] = [];
  for (const s of surfaces) {
    if (seen.has(s.slug)) {
      continue;
    }
    seen.add(s.slug);
    out.push(s);
  }
  return out;
}

export type ExpansionComparisonMethodPair = {
  leftMethodSlug: string;
  rightMethodSlug: string;
};

export type ExpansionComparisonProblemPair = {
  leftProblemSlug: string;
  rightProblemSlug: string;
};

export type ExpansionComparisonSurfacePair = {
  leftSurfaceSlug: string;
  rightSurfaceSlug: string;
  /** Short framing for the title, e.g. "for residue cleanup". */
  framing: string;
};

export type ExpansionSourceFamily =
  | "problem_surface"
  | "method_surface"
  | "problem_surface_severity"
  | "method_surface_severity"
  | "method_surface_tool"
  | "question_why_problem_surface"
  | "question_cause_problem_surface"
  | "prevention_problem_surface"
  | "maintenance_problem_surface"
  | "avoid_problem_surface"
  | "comparison_method_method"
  | "comparison_problem_problem"
  | "comparison_surface_surface"
  | "question_symptom_cause"
  | "question_prevention_troubleshooting";

/** Problem × surface intent pages (why / cause / prevent / maintain / avoid). */
export type IntentProblemSurfaceTemplate = {
  sourceFamily:
    | "question_why_problem_surface"
    | "question_cause_problem_surface"
    | "prevention_problem_surface"
    | "maintenance_problem_surface"
    | "avoid_problem_surface";
  /** Leading slug segment before problem/surface body (same value as intentSlug). */
  prefixSlug: string;
  /** Stored in sourceParts.intent.slug */
  intentSlug: string;
  /** Stored in sourceParts.intent.title */
  intentTitle: string;
  buildSlug: (problemSlug: string, surfaceSlug: string) => string;
  buildTitle: (problemTitle: string, surfaceTitle: string) => string;
};

export const QUESTION_INTENT_TEMPLATES = [
  {
    sourceFamily: "question_why_problem_surface",
    prefixSlug: "why-does",
    intentSlug: "why-does",
    intentTitle: "Why Does",
    buildSlug: (problemSlug: string, surfaceSlug: string) =>
      `why-does-${problemSlug}-happen-on-${surfaceSlug}`,
    buildTitle: (problemTitle: string, surfaceTitle: string) =>
      `Why Does ${problemTitle} Happen on ${surfaceTitle}?`,
  },
  {
    sourceFamily: "question_cause_problem_surface",
    prefixSlug: "what-causes",
    intentSlug: "what-causes",
    intentTitle: "What Causes",
    buildSlug: (problemSlug: string, surfaceSlug: string) => `what-causes-${problemSlug}-on-${surfaceSlug}`,
    buildTitle: (problemTitle: string, surfaceTitle: string) =>
      `What Causes ${problemTitle} on ${surfaceTitle}?`,
  },
] as const satisfies readonly IntentProblemSurfaceTemplate[];

export const PREVENTION_INTENT_TEMPLATES = [
  {
    sourceFamily: "prevention_problem_surface",
    prefixSlug: "how-to-prevent",
    intentSlug: "how-to-prevent",
    intentTitle: "How to Prevent",
    buildSlug: (problemSlug: string, surfaceSlug: string) =>
      `how-to-prevent-${problemSlug}-on-${surfaceSlug}`,
    buildTitle: (problemTitle: string, surfaceTitle: string) =>
      `How to Prevent ${problemTitle} on ${surfaceTitle}`,
  },
  {
    sourceFamily: "maintenance_problem_surface",
    prefixSlug: "how-to-maintain",
    intentSlug: "how-to-maintain",
    intentTitle: "How to Maintain",
    buildSlug: (problemSlug: string, surfaceSlug: string) =>
      `how-to-maintain-${surfaceSlug}-to-prevent-${problemSlug}`,
    buildTitle: (problemTitle: string, surfaceTitle: string) =>
      `How to Maintain ${surfaceTitle} to Prevent ${problemTitle}`,
  },
  {
    sourceFamily: "avoid_problem_surface",
    prefixSlug: "how-to-avoid",
    intentSlug: "how-to-avoid",
    intentTitle: "How to Avoid",
    buildSlug: (problemSlug: string, surfaceSlug: string) => `how-to-avoid-${problemSlug}-on-${surfaceSlug}`,
    buildTitle: (problemTitle: string, surfaceTitle: string) =>
      `How to Avoid ${problemTitle} on ${surfaceTitle}`,
  },
] as const satisfies readonly IntentProblemSurfaceTemplate[];

export const ALL_INTENT_PROBLEM_SURFACE_TEMPLATES: readonly IntentProblemSurfaceTemplate[] = [
  ...QUESTION_INTENT_TEMPLATES,
  ...PREVENTION_INTENT_TEMPLATES,
];

/** High-signal problems that receive intent variants (exclude identity/material cluster slugs). */
export const INTENT_EXPANDABLE_PROBLEMS = [
  "dust-buildup",
  "grease-buildup",
  "film-buildup",
  "discoloration",
  "dullness",
  "odor",
  "hard-water-deposits",
  "soap-scum",
  "limescale",
  "streaking",
  "surface-haze",
  "product-residue",
] as const;

/** Severity axis for expanded inventory (light / moderate / heavy). */
export const SEVERITY_LEVELS = [
  { slug: "light", title: "Light" },
  { slug: "moderate", title: "Moderate" },
  { slug: "heavy", title: "Heavy" },
] as const;

/** Problem families that receive severity × surface variants in expanded mode. */
export const SEVERITY_EXPANDABLE_PROBLEMS = [
  "dust-buildup",
  "grease-buildup",
  "film-buildup",
  "discoloration",
  "dullness",
  "product-residue",
  "hard-water-deposits",
  "soap-scum",
  "limescale",
  "odor",
  "streaking",
  "surface-haze",
] as const;

/** Method families that receive severity × surface variants in expanded mode. */
export const SEVERITY_EXPANDABLE_METHODS = [
  "degreasing",
  "soap-scum-removal",
  "hard-water-removal",
  "dust-removal",
  "neutral-surface-cleaning",
  "agitation",
  "buffing",
  "drying",
  "dwell-time",
] as const;

/** Tools axis for expanded method × surface inventory (slug + display title). */
export const TOOL_LEVELS = [
  { slug: "microfiber-cloth", title: "Microfiber Cloth" },
  { slug: "sponge", title: "Sponge" },
  { slug: "soft-bristle-brush", title: "Soft-Bristle Brush" },
  { slug: "scrub-pad", title: "Scrub Pad" },
  { slug: "mop", title: "Mop" },
  { slug: "squeegee", title: "Squeegee" },
] as const;

/** Method families that receive tool × surface variants in expanded mode (methods only for v1). */
export const TOOL_EXPANDABLE_METHODS = [
  "dust-removal",
  "neutral-surface-cleaning",
  "agitation",
  "drying",
  "buffing",
  "degreasing",
  "touchpoint-sanitization",
  "soap-scum-removal",
  "hard-water-removal",
] as const;

/** Do not attach severity when the problem/method anchor is a material-identity cluster slug. */
export const SEVERITY_EXCLUDED_IDENTITY_ENTITY_SLUGS = new Set<string>([
  "glass",
  "tile",
  "grout",
  "finished-wood",
  "stainless-steel",
  "shower-glass",
]);

/**
 * Do not attach severity when the normalized surface matches identity / material contexts
 * (same idea as identity substrate pages).
 */
export const SEVERITY_EXCLUDED_IDENTITY_SURFACE_SLUGS = new Set<string>([
  "glass",
  "glass-surfaces",
  "tile",
  "tile-floors",
  "grout",
  "finished-wood",
  "stainless-steel",
  "shower-glass",
]);

/**
 * Deterministic guardrails. `exclude` drops the seed; `flag` keeps it and sets seedWarnings.
 */
export type ExpansionGuardRule =
  | {
      appliesTo: "problem_surface";
      problemSlug: string;
      /** Matched against normalized surface slug from taxonomy cleanup. */
      surfaceSlug: string;
      action: "exclude" | "flag";
      warningCode: string;
    }
  | {
      appliesTo: "method_surface";
      methodSlug: string;
      surfaceSlug: string;
      action: "exclude" | "flag";
      warningCode: string;
    }
  | {
      appliesTo: "question_symptom_cause";
      /** Every substring must be present in the stem (lowercased) for the rule to fire. */
      stemIncludesAll: string[];
      action: "exclude" | "flag";
      warningCode: string;
    };

/** Curated problems for expansion (slug/title/cluster). */
const expansionProblemsBase: ExpansionEntity[] = [
  { slug: "soap-scum", title: "Soap Scum", cluster: "mineral-and-residue" },
  { slug: "grease-buildup", title: "Grease Buildup", cluster: "oil-and-kitchen-residue" },
  { slug: "hard-water-deposits", title: "Hard Water Stains", cluster: "mineral-and-residue" },
  { slug: "product-residue", title: "Product Residue Buildup", cluster: "product-residue" },
  { slug: "dust-buildup", title: "Dust Buildup", cluster: "dust-buildup" },
  { slug: "stuck-on-residue", title: "Stuck-On Residue", cluster: "oil-and-kitchen-residue" },
];

/** Extra problem families (combinatorial expansion); each uses `slug` as its cluster anchor. */
export const ADDITIONAL_PROBLEMS = [
  "odor",
  "discoloration",
  "dullness",
  "smearing",
  "water-spots",
  "film-buildup",
  "sticky-residue",
  "limescale",
  "streaking",
  "surface-haze",
] as const;

const additionalProblemEntities: ExpansionEntity[] = ADDITIONAL_PROBLEMS.map((slug) => ({
  slug,
  title: expansionTitleFromSlug(slug),
  cluster: slug,
}));

export const expansionProblems: ExpansionEntity[] = [...expansionProblemsBase, ...additionalProblemEntities];

/** Curated methods for expansion. */
const expansionMethodsBase: ExpansionEntity[] = [
  { slug: "degreasing", title: "Degreasing", cluster: "degreasing" },
  { slug: "neutral-surface-cleaning", title: "Neutral Surface Cleaning", cluster: "neutral-cleaning" },
  { slug: "touchpoint-sanitization", title: "Touchpoint Sanitization", cluster: "sanitization" },
  { slug: "soap-scum-removal", title: "Soap Scum Removal", cluster: "soap-scum" },
  { slug: "streak-free-glass-cleaning", title: "Streak-Free Glass Cleaning", cluster: "glass-care" },
];

/** Extra method families; each uses `slug` as its cluster anchor. */
export const ADDITIONAL_METHODS = [
  "rinsing",
  "drying",
  "buffing",
  "polishing",
  "agitation",
  "dwell-time",
] as const;

const additionalMethodEntities: ExpansionEntity[] = ADDITIONAL_METHODS.map((slug) => ({
  slug,
  title: expansionTitleFromSlug(slug),
  cluster: slug,
}));

/** Extra method slugs used for severity expansion (and general expanded grid). */
const severitySupportingMethodSlugs = ["hard-water-removal", "dust-removal"] as const;
const severitySupportingMethodEntities: ExpansionEntity[] = severitySupportingMethodSlugs.map((slug) => ({
  slug,
  title: expansionTitleFromSlug(slug),
  cluster: slug.includes("hard-water") ? "mineral-and-residue" : "dust-removal",
}));

export const expansionMethods: ExpansionEntity[] = [
  ...expansionMethodsBase,
  ...additionalMethodEntities,
  ...severitySupportingMethodEntities,
];

/** Surfaces used in cross products (labels come from taxonomy cleanup). */
const expansionSurfacesBase: ExpansionSurfaceRef[] = [
  { slug: "glass" },
  { slug: "shower-glass" },
  { slug: "grout" },
  { slug: "tile" },
  { slug: "tile-floors" },
  { slug: "stainless-steel" },
  { slug: "finished-wood" },
  { slug: "countertops" },
  { slug: "floors" },
];

export const EXPANDED_SURFACES = [
  "laminate",
  "vinyl",
  "painted-walls",
  "cabinets",
  "appliances",
  "baseboards",
  "countertops",
  "backsplashes",
  "shower-walls",
  "bathroom-fixtures",
] as const;

export const expansionSurfaces: ExpansionSurfaceRef[] = dedupeExpansionSurfaces([
  ...expansionSurfacesBase,
  ...expansionSurfaceRefsFromSlugs(EXPANDED_SURFACES),
]);

/** Symptom / cause question stems (full sentence, lower case ok). */
export const expansionSymptomQuestionStems: string[] = [
  "why does glass look hazy after cleaning",
  "why are floors sticky after mopping",
  "why does soap scum keep coming back",
  "why does grout still look dirty after scrubbing",
];

/** Prevention / troubleshooting question stems. */
export const expansionPreventionQuestionStems: string[] = [
  "how to prevent hard water stains on shower glass",
  "how to stop product residue buildup on tile floors",
  "how to keep stainless steel from looking streaky",
  "how to avoid sticky floors after cleaning",
];

export const expansionComparisonMethodPairs: ExpansionComparisonMethodPair[] = [
  { leftMethodSlug: "degreasing", rightMethodSlug: "neutral-surface-cleaning" },
  { leftMethodSlug: "touchpoint-sanitization", rightMethodSlug: "neutral-surface-cleaning" },
];

export const expansionComparisonProblemPairs: ExpansionComparisonProblemPair[] = [
  { leftProblemSlug: "hard-water-deposits", rightProblemSlug: "soap-scum" },
  { leftProblemSlug: "grease-buildup", rightProblemSlug: "stuck-on-residue" },
];

export const expansionComparisonSurfacePairs: ExpansionComparisonSurfacePair[] = [
  {
    leftSurfaceSlug: "grout",
    rightSurfaceSlug: "tile",
    framing: "for residue cleanup",
  },
  {
    leftSurfaceSlug: "shower-glass",
    rightSurfaceSlug: "tile",
    framing: "for mineral buildup",
  },
];

export const expansionGuardRules: ExpansionGuardRule[] = [
  {
    appliesTo: "problem_surface",
    problemSlug: "soap-scum",
    surfaceSlug: "finished-wood",
    action: "exclude",
    warningCode: "WEAK_PROBLEM_SURFACE",
  },
  {
    appliesTo: "method_surface",
    methodSlug: "streak-free-glass-cleaning",
    surfaceSlug: "grout",
    action: "flag",
    warningCode: "WEAK_METHOD_SURFACE",
  },
  {
    appliesTo: "question_symptom_cause",
    stemIncludesAll: ["floors", "glass"],
    action: "exclude",
    warningCode: "IMPLAUSIBLE_SUBSTRATE",
  },
];

export type GenerationExpansionConfig = {
  problems: ExpansionEntity[];
  methods: ExpansionEntity[];
  surfaces: ExpansionSurfaceRef[];
  symptomQuestionStems: string[];
  preventionQuestionStems: string[];
  comparisonMethodPairs: ExpansionComparisonMethodPair[];
  comparisonProblemPairs: ExpansionComparisonProblemPair[];
  comparisonSurfacePairs: ExpansionComparisonSurfacePair[];
  guardRules: ExpansionGuardRule[];
};

export const GENERATION_EXPANSION_CONFIG: GenerationExpansionConfig = {
  problems: expansionProblems,
  methods: expansionMethods,
  surfaces: expansionSurfaces,
  symptomQuestionStems: expansionSymptomQuestionStems,
  preventionQuestionStems: expansionPreventionQuestionStems,
  comparisonMethodPairs: expansionComparisonMethodPairs,
  comparisonProblemPairs: expansionComparisonProblemPairs,
  comparisonSurfacePairs: expansionComparisonSurfacePairs,
  guardRules: expansionGuardRules,
};

export {
  evaluateMethodSurfaceCompatibility,
  evaluateProblemSurfaceCompatibility,
  evaluateToolMethodSurfaceCompatibility,
  isCompatibleMethodSurface,
  isCompatibleProblemSurface,
  isCompatibleToolMethodSurface,
  type SurfaceCompatibilityReason,
  type SurfaceCompatibilityResult,
  type ToolMethodSurfaceCompatibilityReason,
  type ToolMethodSurfaceCompatibilityResult,
} from "../../../src/lib/encyclopedia/surfaceCompatibility";
