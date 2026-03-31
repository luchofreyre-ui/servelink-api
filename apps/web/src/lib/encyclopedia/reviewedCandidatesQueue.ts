import {
  classifyEncyclopediaSearchIntentTitle,
  type EncyclopediaSearchIntentTitleKind,
} from "./encyclopediaSearchIntentTitle";

export type ReviewTriage = "promote" | "review" | "reject";

export type EncyclopediaReviewedCandidateRow = {
  id: string;
  slug: string;
  title: string;
  category: "problems" | "methods";
  cluster: string;
  role: "supporting";
  status: "draft";
  generatedType: string;
  cleanedSlug?: string;
  cleanedTitle?: string;
  qualityScore?: number;
  qualityFlags?: string[];
  scorerRecommendation: ReviewTriage;
  normalizedTitle: string;
  normalizedSlug: string;
  normalizationWarnings: string[];
  normalizationAction: string;
  recommendation: ReviewTriage;
  manualOverrideRecommendation?: ReviewTriage;
  [key: string]: unknown;
};

export type ReviewedCandidatesFile = {
  generatedAt: string;
  summary?: {
    total: number;
    promote: number;
    review: number;
    reject: number;
  };
  candidates: EncyclopediaReviewedCandidateRow[];
  /** Preserved from source JSON on round-trip (e.g. generator metadata). */
  [key: string]: unknown;
};

export type ReviewQueueFilters = {
  recommendation?: "all" | ReviewTriage;
  category?: "all" | "problems" | "methods";
  cluster?: string;
  warningCode?: string;
  /** Filter by search-intent vs problem-layer title heuristic (expanded-lane triage). */
  titleIntent?: "all" | "search_intent" | "problem_layer" | "ambiguous";
};

export function titleIntentKindForReviewRow(row: EncyclopediaReviewedCandidateRow): EncyclopediaSearchIntentTitleKind {
  const label = (row.normalizedTitle?.trim() ? row.normalizedTitle : row.title) ?? "";
  return classifyEncyclopediaSearchIntentTitle(label).kind;
}

export function getEffectiveRecommendation(row: EncyclopediaReviewedCandidateRow): ReviewTriage {
  const o = row.manualOverrideRecommendation;
  if (o === "promote" || o === "review" || o === "reject") {
    return o;
  }
  return row.recommendation;
}

export function summarizeReviewedCandidates(candidates: EncyclopediaReviewedCandidateRow[]): {
  total: number;
  promote: number;
  review: number;
  reject: number;
} {
  let promote = 0;
  let review = 0;
  let reject = 0;
  for (const c of candidates) {
    const e = getEffectiveRecommendation(c);
    if (e === "promote") promote += 1;
    else if (e === "review") review += 1;
    else reject += 1;
  }
  return { total: candidates.length, promote, review, reject };
}

export function filterReviewedCandidates(
  candidates: EncyclopediaReviewedCandidateRow[],
  filters: ReviewQueueFilters,
): EncyclopediaReviewedCandidateRow[] {
  let out = candidates;

  if (filters.recommendation && filters.recommendation !== "all") {
    const r = filters.recommendation;
    out = out.filter((c) => getEffectiveRecommendation(c) === r);
  }

  if (filters.category && filters.category !== "all") {
    out = out.filter((c) => c.category === filters.category);
  }

  if (filters.cluster && filters.cluster.trim() !== "") {
    const q = filters.cluster.trim().toLowerCase();
    out = out.filter((c) => c.cluster.toLowerCase().includes(q));
  }

  if (filters.warningCode && filters.warningCode.trim() !== "") {
    const w = filters.warningCode.trim();
    out = out.filter((c) => (c.normalizationWarnings ?? []).includes(w));
  }

  if (filters.titleIntent && filters.titleIntent !== "all") {
    const want = filters.titleIntent;
    out = out.filter((c) => titleIntentKindForReviewRow(c) === want);
  }

  return out;
}

export function applyManualOverrides(
  file: ReviewedCandidatesFile,
  overrides: Record<string, ReviewTriage | null | undefined>,
): ReviewedCandidatesFile {
  const candidates = file.candidates.map((row) => {
    const id = row.id;
    if (!(id in overrides)) {
      return { ...row };
    }
    const value = overrides[id];
    const next = { ...row } as EncyclopediaReviewedCandidateRow;
    if (value === null || value === undefined) {
      delete next.manualOverrideRecommendation;
      return next;
    }
    next.manualOverrideRecommendation = value;
    return next;
  });

  const summary = summarizeReviewedCandidates(candidates);
  return {
    ...file,
    candidates,
    summary,
  };
}

export function parseReviewedCandidatesFile(raw: unknown): ReviewedCandidatesFile {
  if (!raw || typeof raw !== "object") {
    throw new Error("Reviewed candidates file must be an object.");
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.candidates)) {
    throw new Error("Reviewed candidates file must contain a candidates array.");
  }
  const { candidates, summary, generatedAt, ...rest } = obj;
  return {
    ...rest,
    generatedAt: String(generatedAt ?? ""),
    summary: summary as ReviewedCandidatesFile["summary"],
    candidates: candidates as EncyclopediaReviewedCandidateRow[],
  };
}

export function recommendationExplanation(row: EncyclopediaReviewedCandidateRow): string {
  const parts: string[] = [];
  parts.push(`Scorer: ${row.scorerRecommendation}.`);
  parts.push(`Normalization action: ${row.normalizationAction}.`);
  parts.push(`Pipeline recommendation (reconciled): ${row.recommendation}.`);
  if (row.manualOverrideRecommendation) {
    parts.push(`Manual override: ${row.manualOverrideRecommendation}.`);
  }
  parts.push(`Effective: ${getEffectiveRecommendation(row)}.`);
  return parts.join(" ");
}
