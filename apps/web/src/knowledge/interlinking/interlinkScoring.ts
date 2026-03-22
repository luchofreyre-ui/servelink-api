import type {
  AuthorityContext,
  AuthorityEntityKind,
  AuthorityEntityRecord,
  AuthorityLinkCandidate,
} from "./interlinkTypes";

const DIRECT_MATCH_SCORE = 1000;
const INVERSE_REFERENCE_SCORE = 300;
const CONTEXT_OVERLAP_SCORE = 80;
const CATEGORY_BONUS_SCORE = 10;

export function normalizeSlugList(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const output: string[] = [];

  for (const item of input) {
    if (typeof item === "string" && item.trim()) {
      output.push(item.trim());
      continue;
    }

    if (item && typeof item === "object" && "slug" in item) {
      const slug = (item as { slug?: unknown }).slug;
      if (typeof slug === "string" && slug.trim()) {
        output.push(slug.trim());
      }
    }
  }

  return Array.from(new Set(output));
}

export function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function safeEntityName(entity: Record<string, unknown>): string {
  const possible = [
    entity.name,
    entity.title,
    entity.label,
  ];

  for (const value of possible) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const slug = entity.slug;
  if (typeof slug === "string" && slug.trim()) {
    return humanizeSlug(slug.trim());
  }

  return "Untitled";
}

export function safeEntitySummary(entity: Record<string, unknown>): string {
  const possible = [
    entity.summary,
    entity.shortDescription,
    entity.description,
    entity.definition,
  ];

  for (const value of possible) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

export function createDeterministicTieBreakKey(
  item: Pick<AuthorityEntityRecord, "name" | "slug">
): string {
  return `${item.name.toLowerCase()}::${item.slug.toLowerCase()}`;
}

export function computeContextOverlap(
  candidateRelationSlugs: string[],
  sourceContextSlugs: string[]
): number {
  if (!candidateRelationSlugs.length || !sourceContextSlugs.length) {
    return 0;
  }

  const sourceSet = new Set(sourceContextSlugs);
  let overlapCount = 0;

  for (const slug of candidateRelationSlugs) {
    if (sourceSet.has(slug)) {
      overlapCount += 1;
    }
  }

  return overlapCount;
}

export function buildScoredCandidate(params: {
  candidate: AuthorityEntityRecord;
  targetKind: AuthorityEntityKind;
  directTargetSlugs: string[];
  candidateInverseSourceSlugs: string[];
  candidateContextRelationSlugs: string[];
  sourceContextRelationSlugs: string[];
}): AuthorityLinkCandidate | null {
  const {
    candidate,
    directTargetSlugs,
    candidateInverseSourceSlugs,
    candidateContextRelationSlugs,
    sourceContextRelationSlugs,
  } = params;

  let score = 0;
  const reasons: string[] = [];

  if (directTargetSlugs.includes(candidate.slug)) {
    score += DIRECT_MATCH_SCORE;
    reasons.push("direct");
  }

  if (candidateInverseSourceSlugs.length > 0) {
    score += INVERSE_REFERENCE_SCORE;
    reasons.push("inverse");
  }

  const overlapCount = computeContextOverlap(
    candidateContextRelationSlugs,
    sourceContextRelationSlugs
  );

  if (overlapCount > 0) {
    score += overlapCount * CONTEXT_OVERLAP_SCORE;
    reasons.push(`overlap:${overlapCount}`);
  }

  if (candidate.summary && candidate.summary.length > 0) {
    score += CATEGORY_BONUS_SCORE;
  }

  if (score <= 0) {
    return null;
  }

  return {
    ...candidate,
    score,
    reasons,
  };
}

export function sortCandidatesDescending(
  items: AuthorityLinkCandidate[]
): AuthorityLinkCandidate[] {
  return [...items].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const aKey = createDeterministicTieBreakKey(a);
    const bKey = createDeterministicTieBreakKey(b);

    return aKey.localeCompare(bKey);
  });
}

export function buildAuthorityContext(input: {
  sourceKind: AuthorityEntityKind;
  sourceSlug: string;
  sourceName: string;
  problemSlugs?: unknown;
  surfaceSlugs?: unknown;
  methodSlugs?: unknown;
  toolSlugs?: unknown;
}): AuthorityContext {
  return {
    sourceKind: input.sourceKind,
    sourceSlug: input.sourceSlug,
    sourceName: input.sourceName,
    problemSlugs: normalizeSlugList(input.problemSlugs),
    surfaceSlugs: normalizeSlugList(input.surfaceSlugs),
    methodSlugs: normalizeSlugList(input.methodSlugs),
    toolSlugs: normalizeSlugList(input.toolSlugs),
  };
}
