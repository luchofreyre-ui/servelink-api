import {
  buildAuthorityContext,
  buildScoredCandidate,
  normalizeSlugList,
  sortCandidatesDescending,
} from "./interlinkScoring";
import {
  getAllEntitiesForKind,
  getCandidateContextRelationSlugs,
  getInverseReferenceSlugs,
} from "./interlinkSelectors";
import type {
  AuthorityContext,
  AuthorityEntityKind,
  AuthorityGroupBuildOptions,
  AuthorityLinkCandidate,
  AuthorityLinkGroup,
} from "./interlinkTypes";

const DEFAULT_MAX_ITEMS = 6;

function dedupeBySlug<T extends { slug: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const output: T[] = [];

  for (const item of items) {
    if (seen.has(item.slug)) continue;
    seen.add(item.slug);
    output.push(item);
  }

  return output;
}

function buildGroup(params: {
  key: string;
  title: string;
  description: string;
  sourceContext: AuthorityContext;
  targetKind: AuthorityEntityKind;
  directTargetSlugs: string[];
  sourceContextRelationSlugs: string[];
  options?: AuthorityGroupBuildOptions;
}): AuthorityLinkGroup | null {
  const {
    key,
    title,
    description,
    sourceContext,
    targetKind,
    directTargetSlugs,
    sourceContextRelationSlugs,
    options,
  } = params;

  const allCandidates = getAllEntitiesForKind(targetKind);
  const maxItems = options?.maxItems ?? DEFAULT_MAX_ITEMS;
  const scored: AuthorityLinkCandidate[] = [];

  for (const candidate of allCandidates) {
    if (
      candidate.slug === sourceContext.sourceSlug &&
      targetKind === sourceContext.sourceKind
    ) {
      continue;
    }

    const scoredCandidate = buildScoredCandidate({
      candidate,
      targetKind,
      directTargetSlugs,
      candidateInverseSourceSlugs: getInverseReferenceSlugs({
        sourceKind: sourceContext.sourceKind,
        sourceSlug: sourceContext.sourceSlug,
        targetKind,
        candidateSlug: candidate.slug,
      }),
      candidateContextRelationSlugs: getCandidateContextRelationSlugs({
        candidateKind: targetKind,
        candidateSlug: candidate.slug,
        sourceKind: sourceContext.sourceKind,
      }),
      sourceContextRelationSlugs,
    });

    if (scoredCandidate) {
      scored.push(scoredCandidate);
    }
  }

  const sorted = dedupeBySlug(sortCandidatesDescending(scored)).slice(
    0,
    maxItems
  );

  if (!sorted.length) return null;

  return { key, title, description, items: sorted };
}

function extractProblemBase(data: Record<string, unknown>) {
  const problem = (data.problem ?? {}) as Record<string, unknown>;
  return {
    sourceSlug: typeof problem.slug === "string" ? problem.slug : "",
    sourceName: typeof problem.name === "string" ? problem.name : "Problem",
    surfaceSlugs: normalizeSlugList(data.relatedSurfaces),
    methodSlugs: normalizeSlugList(data.recommendedMethods),
    toolSlugs: normalizeSlugList(data.recommendedTools),
  };
}

function extractSurfaceBase(data: Record<string, unknown>) {
  const surface = (data.surface ?? {}) as Record<string, unknown>;
  return {
    sourceSlug: typeof surface.slug === "string" ? surface.slug : "",
    sourceName: typeof surface.name === "string" ? surface.name : "Surface",
    problemSlugs: normalizeSlugList(data.commonProblems),
    methodSlugs: normalizeSlugList(data.safeMethods),
    toolSlugs: normalizeSlugList(data.safeTools),
  };
}

function extractMethodBase(data: Record<string, unknown>) {
  const method = (data.method ?? {}) as Record<string, unknown>;
  return {
    sourceSlug: typeof method.slug === "string" ? method.slug : "",
    sourceName: typeof method.name === "string" ? method.name : "Method",
    problemSlugs: normalizeSlugList(data.idealForSoils),
    surfaceSlugs: normalizeSlugList(data.compatibleSurfaces),
    toolSlugs: normalizeSlugList(data.recommendedTools),
  };
}

function extractToolBase(data: Record<string, unknown>) {
  const tool = (data.tool ?? {}) as Record<string, unknown>;
  return {
    sourceSlug: typeof tool.slug === "string" ? tool.slug : "",
    sourceName: typeof tool.name === "string" ? tool.name : "Tool",
    problemSlugs: normalizeSlugList(data.idealForSoils),
    surfaceSlugs: normalizeSlugList(data.idealForSurfaces),
  };
}

function buildSharedSourceContextRelationSlugs(
  context: AuthorityContext
): string[] {
  return Array.from(
    new Set([
      ...context.problemSlugs,
      ...context.surfaceSlugs,
      ...context.methodSlugs,
      ...context.toolSlugs,
    ])
  );
}

export function buildProblemAuthorityLinkGroups(
  rawData: Record<string, unknown>,
  options?: AuthorityGroupBuildOptions
): AuthorityLinkGroup[] {
  const base = extractProblemBase(rawData);
  const sourceContext = buildAuthorityContext({
    sourceKind: "problem",
    sourceSlug: base.sourceSlug,
    sourceName: base.sourceName,
    problemSlugs: [base.sourceSlug],
    surfaceSlugs: base.surfaceSlugs,
    methodSlugs: base.methodSlugs,
    toolSlugs: base.toolSlugs,
  });
  const sourceContextRelationSlugs =
    buildSharedSourceContextRelationSlugs(sourceContext);

  const groups = [
    buildGroup({
      key: "problem-surfaces",
      title: "Related surfaces",
      description:
        "Surfaces most commonly affected by this cleaning issue or most relevant to solving it safely.",
      sourceContext,
      targetKind: "surface",
      directTargetSlugs: base.surfaceSlugs,
      sourceContextRelationSlugs,
      options,
    }),
    buildGroup({
      key: "problem-methods",
      title: "Related methods",
      description:
        "Methods that directly address this problem or support safe removal without damaging the surface.",
      sourceContext,
      targetKind: "method",
      directTargetSlugs: base.methodSlugs,
      sourceContextRelationSlugs,
      options,
    }),
    buildGroup({
      key: "problem-tools",
      title: "Related tools",
      description:
        "Tools most aligned with handling this problem efficiently and with better surface control.",
      sourceContext,
      targetKind: "tool",
      directTargetSlugs: base.toolSlugs,
      sourceContextRelationSlugs,
      options,
    }),
  ].filter((group): group is AuthorityLinkGroup => Boolean(group));

  return groups;
}

export function buildSurfaceAuthorityLinkGroups(
  rawData: Record<string, unknown>,
  options?: AuthorityGroupBuildOptions
): AuthorityLinkGroup[] {
  const base = extractSurfaceBase(rawData);
  const sourceContext = buildAuthorityContext({
    sourceKind: "surface",
    sourceSlug: base.sourceSlug,
    sourceName: base.sourceName,
    problemSlugs: base.problemSlugs,
    surfaceSlugs: [base.sourceSlug],
    methodSlugs: base.methodSlugs,
    toolSlugs: base.toolSlugs,
  });
  const sourceContextRelationSlugs =
    buildSharedSourceContextRelationSlugs(sourceContext);

  const groups = [
    buildGroup({
      key: "surface-problems",
      title: "Common problems on this surface",
      description:
        "Cleaning issues that frequently appear on this surface or require surface-specific caution.",
      sourceContext,
      targetKind: "problem",
      directTargetSlugs: base.problemSlugs,
      sourceContextRelationSlugs,
      options,
    }),
    buildGroup({
      key: "surface-methods",
      title: "Recommended methods",
      description:
        "Methods that align with this surface's material behavior, finish sensitivity, and cleaning risk profile.",
      sourceContext,
      targetKind: "method",
      directTargetSlugs: base.methodSlugs,
      sourceContextRelationSlugs,
      options,
    }),
    buildGroup({
      key: "surface-tools",
      title: "Recommended tools",
      description:
        "Tools that improve control, reduce damage risk, and support better results on this surface.",
      sourceContext,
      targetKind: "tool",
      directTargetSlugs: base.toolSlugs,
      sourceContextRelationSlugs,
      options,
    }),
  ].filter((group): group is AuthorityLinkGroup => Boolean(group));

  return groups;
}

function getMethodSlugsForTool(toolSlug: string): string[] {
  const methodEntities = getAllEntitiesForKind("method");
  return methodEntities
    .filter((methodEntity) => {
      const candidateSlug = methodEntity.slug;
      const inverse = getInverseReferenceSlugs({
        sourceKind: "tool",
        sourceSlug: toolSlug,
        targetKind: "method",
        candidateSlug,
      });
      return inverse.length > 0;
    })
    .map((entity) => entity.slug);
}

export function buildMethodAuthorityLinkGroups(
  rawData: Record<string, unknown>,
  options?: AuthorityGroupBuildOptions
): AuthorityLinkGroup[] {
  const base = extractMethodBase(rawData);
  const sourceContext = buildAuthorityContext({
    sourceKind: "method",
    sourceSlug: base.sourceSlug,
    sourceName: base.sourceName,
    problemSlugs: base.problemSlugs,
    surfaceSlugs: base.surfaceSlugs,
    methodSlugs: [base.sourceSlug],
    toolSlugs: base.toolSlugs,
  });
  const sourceContextRelationSlugs =
    buildSharedSourceContextRelationSlugs(sourceContext);

  const groups = [
    buildGroup({
      key: "method-problems",
      title: "Best for these problems",
      description:
        "Problems this method most directly addresses based on soil behavior, residue type, and cleaning outcome.",
      sourceContext,
      targetKind: "problem",
      directTargetSlugs: base.problemSlugs,
      sourceContextRelationSlugs,
      options,
    }),
    buildGroup({
      key: "method-surfaces",
      title: "Compatible surfaces",
      description:
        "Surfaces where this method is most relevant, effective, or materially appropriate.",
      sourceContext,
      targetKind: "surface",
      directTargetSlugs: base.surfaceSlugs,
      sourceContextRelationSlugs,
      options,
    }),
    buildGroup({
      key: "method-tools",
      title: "Recommended tools",
      description:
        "Tools that pair well with this method and improve control, agitation, extraction, or finish protection.",
      sourceContext,
      targetKind: "tool",
      directTargetSlugs: base.toolSlugs,
      sourceContextRelationSlugs,
      options,
    }),
  ].filter((group): group is AuthorityLinkGroup => Boolean(group));

  return groups;
}

export function buildToolAuthorityLinkGroups(
  rawData: Record<string, unknown>,
  options?: AuthorityGroupBuildOptions
): AuthorityLinkGroup[] {
  const base = extractToolBase(rawData);
  const methodSlugs = getMethodSlugsForTool(base.sourceSlug);
  const sourceContext = buildAuthorityContext({
    sourceKind: "tool",
    sourceSlug: base.sourceSlug,
    sourceName: base.sourceName,
    problemSlugs: base.problemSlugs,
    surfaceSlugs: base.surfaceSlugs,
    methodSlugs,
    toolSlugs: [base.sourceSlug],
  });
  const sourceContextRelationSlugs =
    buildSharedSourceContextRelationSlugs(sourceContext);

  const groups = [
    buildGroup({
      key: "tool-problems",
      title: "Best for these problems",
      description:
        "Cleaning issues where this tool is especially useful because of its contact style, control, or removal efficiency.",
      sourceContext,
      targetKind: "problem",
      directTargetSlugs: base.problemSlugs,
      sourceContextRelationSlugs,
      options,
    }),
    buildGroup({
      key: "tool-surfaces",
      title: "Best for these surfaces",
      description:
        "Surfaces where this tool is most useful because of texture, finish, access, or soil-removal behavior.",
      sourceContext,
      targetKind: "surface",
      directTargetSlugs: base.surfaceSlugs,
      sourceContextRelationSlugs,
      options,
    }),
    buildGroup({
      key: "tool-methods",
      title: "Methods that use this tool",
      description:
        "Cleaning methods that commonly rely on this tool for agitation, detailing, extraction, or safer material handling.",
      sourceContext,
      targetKind: "method",
      directTargetSlugs: methodSlugs,
      sourceContextRelationSlugs,
      options,
    }),
  ].filter((group): group is AuthorityLinkGroup => Boolean(group));

  return groups;
}
