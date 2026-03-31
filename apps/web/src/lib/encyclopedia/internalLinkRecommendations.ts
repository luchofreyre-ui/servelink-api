import { buildEncyclopediaHref } from "./slug";
import type { EncyclopediaCategory } from "./types";
import type { EncyclopediaCorpusEntry } from "./loadEncyclopediaIndexEntries";
import { inferIsComparisonSlug, inferIsQuestionSlug } from "./loadEncyclopediaIndexEntries";

export type InternalLinkReason =
  | "same_cluster"
  | "same_surface"
  | "same_problem_family"
  | "same_method_family"
  | "question_followup"
  | "comparison_followup"
  | "guide_followup";

export const INTERNAL_LINK_REASON_SCORES: Record<InternalLinkReason, number> = {
  same_cluster: 50,
  same_surface: 25,
  same_problem_family: 20,
  same_method_family: 20,
  question_followup: 10,
  comparison_followup: 10,
  guide_followup: 8,
};

export interface InternalLinkRecommendation {
  slug: string;
  title: string;
  href: string;
  reason: InternalLinkReason;
  score: number;
}

export interface InternalLinkRecommendationResult {
  sourceSlug: string;
  recommendations: InternalLinkRecommendation[];
}

export const INTERNAL_LINK_RECOMMENDATION_LIMIT = 8;

export function problemStemFromSlug(slug: string): string | null {
  const i = slug.indexOf("-on-");
  if (i <= 0) {
    return null;
  }
  return slug.slice(0, i);
}

/** Method/problem slug tails that are not surface identifiers (avoid false same_surface). */
const GENERIC_METHOD_SLUG_TAILS = new Set([
  "removal",
  "cleaning",
  "treatment",
  "care",
  "sanitization",
  "degreasing",
]);

export function surfaceTailFromSlug(slug: string, category: EncyclopediaCategory): string | null {
  const on = slug.match(/-on-(.+)$/);
  if (on) {
    return on[1];
  }
  const fr = slug.match(/-for-(.+)$/);
  if (fr && (category === "methods" || category === "problems")) {
    return fr[1];
  }
  if (category === "methods" || category === "problems") {
    const parts = slug.split("-").filter(Boolean);
    if (parts.length >= 2) {
      const tail = parts[parts.length - 1] ?? null;
      if (tail && !GENERIC_METHOD_SLUG_TAILS.has(tail)) {
        return tail;
      }
    }
  }
  return null;
}

export function methodStemFromSlug(slug: string): string | null {
  const parts = slug.split("-").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  return parts.slice(0, -1).join("-");
}

function hrefForEntry(e: EncyclopediaCorpusEntry): string {
  return e.href || buildEncyclopediaHref(e.category, e.slug);
}

function collectReasons(
  source: EncyclopediaCorpusEntry,
  target: EncyclopediaCorpusEntry,
): InternalLinkReason[] {
  const reasons: InternalLinkReason[] = [];

  if (target.cluster === source.cluster) {
    reasons.push("same_cluster");
  }

  const sTail = surfaceTailFromSlug(source.slug, source.category);
  const tTail = surfaceTailFromSlug(target.slug, target.category);
  if (sTail && tTail && sTail === tTail) {
    reasons.push("same_surface");
  }

  const ps = problemStemFromSlug(source.slug);
  const pt = problemStemFromSlug(target.slug);
  if (source.category === "problems" && target.category === "problems" && ps && pt && ps === pt) {
    reasons.push("same_problem_family");
  }

  const ms = methodStemFromSlug(source.slug);
  const mt = methodStemFromSlug(target.slug);
  if (source.category === "methods" && target.category === "methods" && ms && mt && ms === mt) {
    reasons.push("same_method_family");
  }

  if (inferIsQuestionSlug(target.slug)) {
    reasons.push("question_followup");
  }
  if (inferIsComparisonSlug(target.slug)) {
    reasons.push("comparison_followup");
  }
  if (target.category === "prevention" || target.category === "rooms") {
    reasons.push("guide_followup");
  }

  return reasons;
}

function scoreFromReasons(reasons: InternalLinkReason[]): number {
  let s = 0;
  const seen = new Set<InternalLinkReason>();
  for (const r of reasons) {
    if (seen.has(r)) {
      continue;
    }
    seen.add(r);
    s += INTERNAL_LINK_REASON_SCORES[r];
  }
  return s;
}

function primaryReason(reasons: InternalLinkReason[]): InternalLinkReason {
  const order: InternalLinkReason[] = [
    "same_cluster",
    "same_surface",
    "same_problem_family",
    "same_method_family",
    "question_followup",
    "comparison_followup",
    "guide_followup",
  ];
  for (const r of order) {
    if (reasons.includes(r)) {
      return r;
    }
  }
  return "same_cluster";
}

function problemVariantDupKey(e: EncyclopediaCorpusEntry): string | null {
  if (e.category !== "problems") {
    return null;
  }
  const stem = problemStemFromSlug(e.slug);
  const tail = surfaceTailFromSlug(e.slug, e.category);
  if (!stem || !tail) {
    return null;
  }
  return `${stem}::${tail}`;
}

type Acc = {
  slug: string;
  title: string;
  href: string;
  reasons: InternalLinkReason[];
  score: number;
};

/**
 * Deterministic internal link recommendations for one published page in the corpus.
 */
export function getInternalLinkRecommendations(
  sourceSlug: string,
  corpus: EncyclopediaCorpusEntry[],
  options?: { limit?: number },
): InternalLinkRecommendationResult {
  const limit = options?.limit ?? INTERNAL_LINK_RECOMMENDATION_LIMIT;
  const source = corpus.find((e) => e.slug === sourceSlug);
  if (!source) {
    return { sourceSlug, recommendations: [] };
  }

  const bySlug = new Map<string, Acc>();

  for (const target of corpus) {
    if (target.slug === source.slug) {
      continue;
    }

    const reasons = collectReasons(source, target);
    if (reasons.length === 0) {
      continue;
    }

    const mergedReasons = [...new Set([...(bySlug.get(target.slug)?.reasons ?? []), ...reasons])];
    const score = scoreFromReasons(mergedReasons);
    bySlug.set(target.slug, {
      slug: target.slug,
      title: target.title,
      href: hrefForEntry(target),
      reasons: mergedReasons,
      score,
    });
  }

  const list = [...bySlug.values()].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const ra = [...new Set(a.reasons)].sort().join(",");
    const rb = [...new Set(b.reasons)].sort().join(",");
    if (ra !== rb) {
      return ra.localeCompare(rb);
    }
    return a.slug.localeCompare(b.slug);
  });

  const corpusBySlug = new Map(corpus.map((e) => [e.slug, e]));
  const picked: InternalLinkRecommendation[] = [];
  const usedProblemDup = new Set<string>();

  for (const item of list) {
    if (picked.length >= limit) {
      break;
    }
    const entry = corpusBySlug.get(item.slug);
    if (!entry) {
      continue;
    }
    const dup = problemVariantDupKey(entry);
    if (dup && usedProblemDup.has(dup) && picked.length >= 2) {
      continue;
    }
    if (dup) {
      usedProblemDup.add(dup);
    }
    picked.push({
      slug: item.slug,
      title: item.title,
      href: item.href,
      reason: primaryReason(item.reasons),
      score: item.score,
    });
  }

  if (picked.length < limit) {
    for (const item of list) {
      if (picked.length >= limit) {
        break;
      }
      if (picked.some((p) => p.slug === item.slug)) {
        continue;
      }
      picked.push({
        slug: item.slug,
        title: item.title,
        href: item.href,
        reason: primaryReason(item.reasons),
        score: item.score,
      });
    }
  }

  return { sourceSlug, recommendations: picked.slice(0, limit) };
}

/** Prefer same_cluster → surface → family mix for visible “Related Topics” ordering. */
const RELATED_TOPICS_REASON_ORDER: InternalLinkReason[] = [
  "same_cluster",
  "same_surface",
  "same_problem_family",
  "same_method_family",
  "question_followup",
  "comparison_followup",
  "guide_followup",
];

export function sortRecommendationsForRelatedTopicsBlock(
  recs: InternalLinkRecommendation[],
): InternalLinkRecommendation[] {
  return [...recs].sort((a, b) => {
    const ia = RELATED_TOPICS_REASON_ORDER.indexOf(a.reason);
    const ib = RELATED_TOPICS_REASON_ORDER.indexOf(b.reason);
    const sa = ia === -1 ? 999 : ia;
    const sb = ib === -1 ? 999 : ib;
    if (sa !== sb) {
      return sa - sb;
    }
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.slug.localeCompare(b.slug);
  });
}

export function escapeMarkdownLinkText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}

/** Max links appended under `## Related Topics` (engine still capped separately). */
export const RELATED_TOPICS_MAX_LINKS = 8;

/**
 * Markdown block to append at the end of generated encyclopedia bodies.
 * Empty string when there are no recommendations.
 */
export function buildRelatedTopicsMarkdownSection(
  sourceSlug: string,
  corpus: EncyclopediaCorpusEntry[],
  options?: { maxLinks?: number },
): string {
  const maxLinks = Math.min(
    Math.max(1, options?.maxLinks ?? RELATED_TOPICS_MAX_LINKS),
    RELATED_TOPICS_MAX_LINKS,
  );
  const { recommendations } = getInternalLinkRecommendations(sourceSlug, corpus, {
    limit: INTERNAL_LINK_RECOMMENDATION_LIMIT,
  });
  const sorted = sortRecommendationsForRelatedTopicsBlock(recommendations);
  const picked = sorted.slice(0, maxLinks);
  if (picked.length === 0) {
    return "";
  }
  const lines = picked.map((r) => `- [${escapeMarkdownLinkText(r.title)}](${r.href})`);
  return `\n## Related Topics\n\n${lines.join("\n")}\n`;
}
