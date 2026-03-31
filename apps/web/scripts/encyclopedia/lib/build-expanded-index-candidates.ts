import { scoreGeneratedCandidate } from "../../../src/lib/encyclopedia/candidateScoring";
import {
  evaluateMethodSurfaceCompatibility,
  evaluateProblemSurfaceCompatibility,
  evaluateToolMethodSurfaceCompatibility,
} from "../../../src/lib/encyclopedia/surfaceCompatibility";
import { cleanupSurfaceTaxonomy } from "../../../src/lib/encyclopedia/taxonomyCleanup";
import {
  ALL_INTENT_PROBLEM_SURFACE_TEMPLATES,
  GENERATION_EXPANSION_CONFIG,
  INTENT_EXPANDABLE_PROBLEMS,
  SEVERITY_EXCLUDED_IDENTITY_ENTITY_SLUGS,
  SEVERITY_EXCLUDED_IDENTITY_SURFACE_SLUGS,
  SEVERITY_EXPANDABLE_METHODS,
  SEVERITY_EXPANDABLE_PROBLEMS,
  SEVERITY_LEVELS,
  TOOL_EXPANDABLE_METHODS,
  TOOL_LEVELS,
  type ExpansionEntity,
  type ExpansionGuardRule,
  type ExpansionSourceFamily,
  type GenerationExpansionConfig,
} from "./generation-expansion-config";

export type ExpandedRawIndexCandidate = {
  id: string;
  slug: string;
  title: string;
  category: "problems" | "methods";
  cluster: string;
  role: "supporting";
  status: "draft";
  /** Page archetype; comparisons/questions use neutral buckets + sourceFamily detail. */
  generatedType: string;
  sourceFamily: ExpansionSourceFamily;
  sourceParts: Record<string, unknown>;
  seedWarnings?: string[];
  cleanedTitle?: string;
  cleanedSlug?: string;
  qualityScore?: number;
  qualityFlags?: string[];
  recommendation?: "promote" | "review" | "reject";
};

export type BuildExpandedIndexCandidatesResult = {
  candidates: ExpandedRawIndexCandidate[];
  countsByFamily: Record<ExpansionSourceFamily, number>;
  totalGenerated: number;
  excludedCount: number;
  /** Skipped pairs that fail shared surface-compatibility rules (pre-guard). */
  compatibilityExcludedCount: number;
  flaggedCount: number;
};

const ALL_FAMILIES: ExpansionSourceFamily[] = [
  "problem_surface",
  "method_surface",
  "problem_surface_severity",
  "method_surface_severity",
  "method_surface_tool",
  "question_why_problem_surface",
  "question_cause_problem_surface",
  "prevention_problem_surface",
  "maintenance_problem_surface",
  "avoid_problem_surface",
  "comparison_method_method",
  "comparison_problem_problem",
  "comparison_surface_surface",
  "question_symptom_cause",
  "question_prevention_troubleshooting",
];

const SEVERITY_PROBLEM_SLUG_SET = new Set<string>(SEVERITY_EXPANDABLE_PROBLEMS);
const SEVERITY_METHOD_SLUG_SET = new Set<string>(SEVERITY_EXPANDABLE_METHODS);
const TOOL_METHOD_SLUG_SET = new Set<string>(TOOL_EXPANDABLE_METHODS);
const INTENT_EXPANDABLE_PROBLEM_SET = new Set<string>(INTENT_EXPANDABLE_PROBLEMS);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function makeExpandedId(kind: string, slug: string): string {
  const tail = slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  return `EXP-${kind}-${tail}`;
}

function titleCaseSentence(stem: string): string {
  const t = stem.trim();
  if (!t) {
    return t;
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function findEntity(entities: ExpansionEntity[], slug: string): ExpansionEntity | undefined {
  return entities.find((e) => e.slug === slug);
}

function guardWarningsForProblemSurface(
  rules: ExpansionGuardRule[],
  problemSlug: string,
  surfaceSlugNorm: string,
): { exclude: boolean; warnings: string[] } {
  const hits = rules.filter(
    (r) =>
      r.appliesTo === "problem_surface" &&
      r.problemSlug === problemSlug &&
      r.surfaceSlug === surfaceSlugNorm,
  );
  if (hits.some((h) => h.action === "exclude")) {
    return { exclude: true, warnings: [] };
  }
  const warnings = hits.filter((h) => h.action === "flag").map((h) => h.warningCode);
  return { exclude: false, warnings };
}

function guardWarningsForMethodSurface(
  rules: ExpansionGuardRule[],
  methodSlug: string,
  surfaceSlugNorm: string,
): { exclude: boolean; warnings: string[] } {
  const hits = rules.filter(
    (r) =>
      r.appliesTo === "method_surface" &&
      r.methodSlug === methodSlug &&
      r.surfaceSlug === surfaceSlugNorm,
  );
  if (hits.some((h) => h.action === "exclude")) {
    return { exclude: true, warnings: [] };
  }
  const warnings = hits.filter((h) => h.action === "flag").map((h) => h.warningCode);
  return { exclude: false, warnings };
}

function guardForSymptomStem(
  rules: ExpansionGuardRule[],
  stem: string,
): { exclude: boolean; warnings: string[] } {
  const lower = stem.toLowerCase();
  const hits = rules.filter(
    (r) => r.appliesTo === "question_symptom_cause" && r.stemIncludesAll.every((s) => lower.includes(s)),
  );
  if (hits.some((h) => h.action === "exclude")) {
    return { exclude: true, warnings: [] };
  }
  const warnings = hits.filter((h) => h.action === "flag").map((h) => h.warningCode);
  return { exclude: false, warnings };
}

function scoreProblemOrMethodSurface(
  title: string,
  slug: string,
  generatedType: "problem_surface" | "method_surface",
): Pick<ExpandedRawIndexCandidate, "qualityScore" | "qualityFlags" | "recommendation" | "cleanedTitle" | "cleanedSlug"> {
  const scored = scoreGeneratedCandidate({ title, slug, generatedType });
  return {
    cleanedSlug: slug,
    cleanedTitle: title,
    qualityScore: scored.score,
    qualityFlags: scored.flags,
    recommendation: scored.recommendation,
  };
}

/**
 * Builds expanded raw index candidates from expansion config. Deterministic: stable ordering by slug.
 */
export function buildExpandedIndexCandidates(options?: {
  families?: ExpansionSourceFamily[];
  config?: GenerationExpansionConfig;
}): BuildExpandedIndexCandidatesResult {
  const config = options?.config ?? GENERATION_EXPANSION_CONFIG;
  const familyFilter = options?.families?.length ? new Set(options.families) : new Set(ALL_FAMILIES);

  const candidates: ExpandedRawIndexCandidate[] = [];
  let excludedCount = 0;
  let compatibilityExcludedCount = 0;
  const countsByFamily = Object.fromEntries(ALL_FAMILIES.map((f) => [f, 0])) as Record<
    ExpansionSourceFamily,
    number
  >;

  const rules = config.guardRules;

  if (familyFilter.has("problem_surface")) {
    for (const problem of config.problems) {
      for (const surface of config.surfaces) {
        const cleanedSurface = cleanupSurfaceTaxonomy(surface.slug);
        if (!evaluateProblemSurfaceCompatibility(problem.slug, cleanedSurface.normalizedSurfaceSlug).ok) {
          compatibilityExcludedCount += 1;
          continue;
        }
        const cleanedSlug = `${slugify(problem.slug)}-on-${cleanedSurface.normalizedSurfaceSlug}`;
        const cleanedTitle = `${problem.title} on ${cleanedSurface.normalizedSurfaceLabel}`;
        const { exclude, warnings } = guardWarningsForProblemSurface(
          rules,
          problem.slug,
          cleanedSurface.normalizedSurfaceSlug,
        );
        if (exclude) {
          excludedCount += 1;
          continue;
        }
        const scored = scoreProblemOrMethodSurface(cleanedTitle, cleanedSlug, "problem_surface");
        const row: ExpandedRawIndexCandidate = {
          id: makeExpandedId("P", cleanedSlug),
          slug: cleanedSlug,
          title: cleanedTitle,
          category: "problems",
          cluster: problem.cluster,
          role: "supporting",
          status: "draft",
          generatedType: "problem_surface",
          sourceFamily: "problem_surface",
          sourceParts: {
            problem: { slug: problem.slug, title: problem.title },
            surface: {
              inputSlug: surface.slug,
              normalizedSlug: cleanedSurface.normalizedSurfaceSlug,
              label: cleanedSurface.normalizedSurfaceLabel,
            },
          },
          ...scored,
        };
        if (warnings.length > 0) {
          row.seedWarnings = warnings;
        }
        candidates.push(row);
        countsByFamily.problem_surface += 1;
      }
    }
  }

  if (familyFilter.has("method_surface")) {
    for (const method of config.methods) {
      for (const surface of config.surfaces) {
        const cleanedSurface = cleanupSurfaceTaxonomy(surface.slug);
        if (!evaluateMethodSurfaceCompatibility(method.slug, cleanedSurface.normalizedSurfaceSlug).ok) {
          compatibilityExcludedCount += 1;
          continue;
        }
        const cleanedSlug = `${slugify(method.slug)}-${cleanedSurface.normalizedSurfaceSlug}`;
        const cleanedTitle = `${method.title} for ${cleanedSurface.normalizedSurfaceLabel}`;
        const { exclude, warnings } = guardWarningsForMethodSurface(
          rules,
          method.slug,
          cleanedSurface.normalizedSurfaceSlug,
        );
        if (exclude) {
          excludedCount += 1;
          continue;
        }
        const scored = scoreProblemOrMethodSurface(cleanedTitle, cleanedSlug, "method_surface");
        const row: ExpandedRawIndexCandidate = {
          id: makeExpandedId("M", cleanedSlug),
          slug: cleanedSlug,
          title: cleanedTitle,
          category: "methods",
          cluster: method.cluster,
          role: "supporting",
          status: "draft",
          generatedType: "method_surface",
          sourceFamily: "method_surface",
          sourceParts: {
            method: { slug: method.slug, title: method.title },
            surface: {
              inputSlug: surface.slug,
              normalizedSlug: cleanedSurface.normalizedSurfaceSlug,
              label: cleanedSurface.normalizedSurfaceLabel,
            },
          },
          ...scored,
        };
        if (warnings.length > 0) {
          row.seedWarnings = warnings;
        }
        candidates.push(row);
        countsByFamily.method_surface += 1;
      }
    }
  }

  if (familyFilter.has("problem_surface_severity")) {
    for (const problem of config.problems) {
      if (!SEVERITY_PROBLEM_SLUG_SET.has(problem.slug)) {
        continue;
      }
      if (SEVERITY_EXCLUDED_IDENTITY_ENTITY_SLUGS.has(problem.slug)) {
        continue;
      }
      for (const surface of config.surfaces) {
        const cleanedSurface = cleanupSurfaceTaxonomy(surface.slug);
        const norm = cleanedSurface.normalizedSurfaceSlug;
        if (SEVERITY_EXCLUDED_IDENTITY_SURFACE_SLUGS.has(norm)) {
          continue;
        }
        if (!evaluateProblemSurfaceCompatibility(problem.slug, norm).ok) {
          compatibilityExcludedCount += 1;
          continue;
        }
        const { exclude, warnings } = guardWarningsForProblemSurface(rules, problem.slug, norm);
        if (exclude) {
          excludedCount += 1;
          continue;
        }
        const baseSlug = `${slugify(problem.slug)}-on-${norm}`;
        for (const sev of SEVERITY_LEVELS) {
          const cleanedSlug = `${sev.slug}-${baseSlug}`;
          const cleanedTitle = `${sev.title} ${problem.title} on ${cleanedSurface.normalizedSurfaceLabel}`;
          const scored = scoreProblemOrMethodSurface(cleanedTitle, cleanedSlug, "problem_surface");
          const row: ExpandedRawIndexCandidate = {
            id: makeExpandedId("P", cleanedSlug),
            slug: cleanedSlug,
            title: cleanedTitle,
            category: "problems",
            cluster: problem.cluster,
            role: "supporting",
            status: "draft",
            generatedType: "problem_surface_severity",
            sourceFamily: "problem_surface_severity",
            sourceParts: {
              severity: { slug: sev.slug, title: sev.title },
              problem: { slug: problem.slug, title: problem.title },
              surface: {
                inputSlug: surface.slug,
                normalizedSlug: norm,
                label: cleanedSurface.normalizedSurfaceLabel,
              },
            },
            ...scored,
          };
          if (warnings.length > 0) {
            row.seedWarnings = warnings;
          }
          candidates.push(row);
          countsByFamily.problem_surface_severity += 1;
        }
      }
    }
  }

  if (familyFilter.has("method_surface_severity")) {
    for (const method of config.methods) {
      if (!SEVERITY_METHOD_SLUG_SET.has(method.slug)) {
        continue;
      }
      if (SEVERITY_EXCLUDED_IDENTITY_ENTITY_SLUGS.has(method.slug)) {
        continue;
      }
      for (const surface of config.surfaces) {
        const cleanedSurface = cleanupSurfaceTaxonomy(surface.slug);
        const norm = cleanedSurface.normalizedSurfaceSlug;
        if (SEVERITY_EXCLUDED_IDENTITY_SURFACE_SLUGS.has(norm)) {
          continue;
        }
        if (!evaluateMethodSurfaceCompatibility(method.slug, norm).ok) {
          compatibilityExcludedCount += 1;
          continue;
        }
        const { exclude, warnings } = guardWarningsForMethodSurface(rules, method.slug, norm);
        if (exclude) {
          excludedCount += 1;
          continue;
        }
        const baseSlug = `${slugify(method.slug)}-${norm}`;
        for (const sev of SEVERITY_LEVELS) {
          const cleanedSlug = `${sev.slug}-${baseSlug}`;
          const cleanedTitle = `${sev.title} ${method.title} for ${cleanedSurface.normalizedSurfaceLabel}`;
          const scored = scoreProblemOrMethodSurface(cleanedTitle, cleanedSlug, "method_surface");
          const row: ExpandedRawIndexCandidate = {
            id: makeExpandedId("M", cleanedSlug),
            slug: cleanedSlug,
            title: cleanedTitle,
            category: "methods",
            cluster: method.cluster,
            role: "supporting",
            status: "draft",
            generatedType: "method_surface_severity",
            sourceFamily: "method_surface_severity",
            sourceParts: {
              severity: { slug: sev.slug, title: sev.title },
              method: { slug: method.slug, title: method.title },
              surface: {
                inputSlug: surface.slug,
                normalizedSlug: norm,
                label: cleanedSurface.normalizedSurfaceLabel,
              },
            },
            ...scored,
          };
          if (warnings.length > 0) {
            row.seedWarnings = warnings;
          }
          candidates.push(row);
          countsByFamily.method_surface_severity += 1;
        }
      }
    }
  }

  if (familyFilter.has("method_surface_tool")) {
    for (const method of config.methods) {
      if (!TOOL_METHOD_SLUG_SET.has(method.slug)) {
        continue;
      }
      for (const surface of config.surfaces) {
        const cleanedSurface = cleanupSurfaceTaxonomy(surface.slug);
        const norm = cleanedSurface.normalizedSurfaceSlug;
        if (!evaluateMethodSurfaceCompatibility(method.slug, norm).ok) {
          compatibilityExcludedCount += 1;
          continue;
        }
        const { exclude, warnings } = guardWarningsForMethodSurface(rules, method.slug, norm);
        if (exclude) {
          excludedCount += 1;
          continue;
        }
        for (const tool of TOOL_LEVELS) {
          if (!evaluateToolMethodSurfaceCompatibility(tool.slug, method.slug, norm).ok) {
            compatibilityExcludedCount += 1;
            continue;
          }
          const cleanedSlug = `${tool.slug}-${slugify(method.slug)}-${norm}`;
          const cleanedTitle = `${tool.title} ${method.title} for ${cleanedSurface.normalizedSurfaceLabel}`;
          const scored = scoreProblemOrMethodSurface(cleanedTitle, cleanedSlug, "method_surface");
          const row: ExpandedRawIndexCandidate = {
            id: makeExpandedId("MST", cleanedSlug),
            slug: cleanedSlug,
            title: cleanedTitle,
            category: "methods",
            cluster: method.cluster,
            role: "supporting",
            status: "draft",
            generatedType: "method_surface_tool",
            sourceFamily: "method_surface_tool",
            sourceParts: {
              method: { slug: method.slug, title: method.title },
              surface: {
                inputSlug: surface.slug,
                normalizedSlug: norm,
                label: cleanedSurface.normalizedSurfaceLabel,
              },
              tool: { slug: tool.slug, title: tool.title },
            },
            ...scored,
          };
          if (warnings.length > 0) {
            row.seedWarnings = warnings;
          }
          candidates.push(row);
          countsByFamily.method_surface_tool += 1;
        }
      }
    }
  }

  for (const tmpl of ALL_INTENT_PROBLEM_SURFACE_TEMPLATES) {
    if (!familyFilter.has(tmpl.sourceFamily)) {
      continue;
    }
    for (const problem of config.problems) {
      if (!INTENT_EXPANDABLE_PROBLEM_SET.has(problem.slug)) {
        continue;
      }
      for (const surface of config.surfaces) {
        const cleanedSurface = cleanupSurfaceTaxonomy(surface.slug);
        const norm = cleanedSurface.normalizedSurfaceSlug;
        if (!evaluateProblemSurfaceCompatibility(problem.slug, norm).ok) {
          compatibilityExcludedCount += 1;
          continue;
        }
        const { exclude, warnings } = guardWarningsForProblemSurface(rules, problem.slug, norm);
        if (exclude) {
          excludedCount += 1;
          continue;
        }
        const cleanedSlug = tmpl.buildSlug(slugify(problem.slug), norm);
        const cleanedTitle = tmpl.buildTitle(problem.title, cleanedSurface.normalizedSurfaceLabel);
        const row: ExpandedRawIndexCandidate = {
          id: makeExpandedId("I", cleanedSlug),
          slug: cleanedSlug,
          title: cleanedTitle,
          category: "problems",
          cluster: problem.cluster,
          role: "supporting",
          status: "draft",
          generatedType: tmpl.sourceFamily,
          sourceFamily: tmpl.sourceFamily,
          sourceParts: {
            problem: { slug: problem.slug, title: problem.title },
            surface: {
              inputSlug: surface.slug,
              normalizedSlug: norm,
              label: cleanedSurface.normalizedSurfaceLabel,
            },
            intent: { slug: tmpl.intentSlug, title: tmpl.intentTitle },
          },
        };
        if (warnings.length > 0) {
          row.seedWarnings = warnings;
        }
        candidates.push(row);
        countsByFamily[tmpl.sourceFamily] += 1;
      }
    }
  }

  if (familyFilter.has("comparison_method_method")) {
    for (const pair of config.comparisonMethodPairs) {
      const left = findEntity(config.methods, pair.leftMethodSlug);
      const right = findEntity(config.methods, pair.rightMethodSlug);
      if (!left || !right) {
        continue;
      }
      const cleanedSlug = `${slugify(left.slug)}-vs-${slugify(right.slug)}`;
      const cleanedTitle = `${left.title} vs ${right.title}`;
      candidates.push({
        id: makeExpandedId("CMM", cleanedSlug),
        slug: cleanedSlug,
        title: cleanedTitle,
        category: "methods",
        cluster: left.cluster,
        role: "supporting",
        status: "draft",
        generatedType: "comparison_seed",
        sourceFamily: "comparison_method_method",
        sourceParts: {
          leftMethod: { slug: left.slug, title: left.title },
          rightMethod: { slug: right.slug, title: right.title },
        },
      });
      countsByFamily.comparison_method_method += 1;
    }
  }

  if (familyFilter.has("comparison_problem_problem")) {
    for (const pair of config.comparisonProblemPairs) {
      const left = findEntity(config.problems, pair.leftProblemSlug);
      const right = findEntity(config.problems, pair.rightProblemSlug);
      if (!left || !right) {
        continue;
      }
      const cleanedSlug = `${slugify(left.slug)}-vs-${slugify(right.slug)}`;
      const cleanedTitle = `${left.title} vs ${right.title}`;
      candidates.push({
        id: makeExpandedId("CPP", cleanedSlug),
        slug: cleanedSlug,
        title: cleanedTitle,
        category: "problems",
        cluster: left.cluster,
        role: "supporting",
        status: "draft",
        generatedType: "comparison_seed",
        sourceFamily: "comparison_problem_problem",
        sourceParts: {
          leftProblem: { slug: left.slug, title: left.title },
          rightProblem: { slug: right.slug, title: right.title },
        },
      });
      countsByFamily.comparison_problem_problem += 1;
    }
  }

  if (familyFilter.has("comparison_surface_surface")) {
    for (const pair of config.comparisonSurfacePairs) {
      const left = cleanupSurfaceTaxonomy(pair.leftSurfaceSlug);
      const right = cleanupSurfaceTaxonomy(pair.rightSurfaceSlug);
      const cleanedSlug = `${left.normalizedSurfaceSlug}-vs-${right.normalizedSurfaceSlug}-${slugify(pair.framing)}`;
      const cleanedTitle = `${left.normalizedSurfaceLabel} vs ${right.normalizedSurfaceLabel} ${pair.framing}`;
      candidates.push({
        id: makeExpandedId("CSS", cleanedSlug),
        slug: cleanedSlug,
        title: cleanedTitle,
        category: "problems",
        cluster: "surface-care",
        role: "supporting",
        status: "draft",
        generatedType: "comparison_seed",
        sourceFamily: "comparison_surface_surface",
        sourceParts: {
          leftSurface: {
            inputSlug: pair.leftSurfaceSlug,
            normalizedSlug: left.normalizedSurfaceSlug,
            label: left.normalizedSurfaceLabel,
          },
          rightSurface: {
            inputSlug: pair.rightSurfaceSlug,
            normalizedSlug: right.normalizedSurfaceSlug,
            label: right.normalizedSurfaceLabel,
          },
          framing: pair.framing,
        },
      });
      countsByFamily.comparison_surface_surface += 1;
    }
  }

  if (familyFilter.has("question_symptom_cause")) {
    for (const stem of config.symptomQuestionStems) {
      const { exclude, warnings } = guardForSymptomStem(rules, stem);
      if (exclude) {
        excludedCount += 1;
        continue;
      }
      const cleanedSlug = slugify(stem);
      const title = titleCaseSentence(stem);
      const row: ExpandedRawIndexCandidate = {
        id: makeExpandedId("QS", cleanedSlug),
        slug: cleanedSlug,
        title,
        category: "problems",
        cluster: "diagnostics",
        role: "supporting",
        status: "draft",
        generatedType: "question_seed",
        sourceFamily: "question_symptom_cause",
        sourceParts: { questionStem: stem },
      };
      if (warnings.length > 0) {
        row.seedWarnings = warnings;
      }
      candidates.push(row);
      countsByFamily.question_symptom_cause += 1;
    }
  }

  if (familyFilter.has("question_prevention_troubleshooting")) {
    for (const stem of config.preventionQuestionStems) {
      const cleanedSlug = slugify(stem);
      const title = titleCaseSentence(stem);
      candidates.push({
        id: makeExpandedId("QP", cleanedSlug),
        slug: cleanedSlug,
        title,
        category: "methods",
        cluster: "maintenance-guides",
        role: "supporting",
        status: "draft",
        generatedType: "question_seed",
        sourceFamily: "question_prevention_troubleshooting",
        sourceParts: { questionStem: stem },
      });
      countsByFamily.question_prevention_troubleshooting += 1;
    }
  }

  candidates.sort((a, b) => a.slug.localeCompare(b.slug));

  const flaggedCount = candidates.filter((c) => (c.seedWarnings?.length ?? 0) > 0).length;

  return {
    candidates,
    countsByFamily,
    totalGenerated: candidates.length,
    excludedCount,
    compatibilityExcludedCount,
    flaggedCount,
  };
}
