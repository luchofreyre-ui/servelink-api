import { cleanupSurfaceTaxonomy } from "./taxonomyCleanup";

export type CandidateScoreResult = {
  score: number;
  flags: string[];
  recommendation: "promote" | "review" | "reject";
};

type CandidateInput = {
  title: string;
  slug: string;
  generatedType: "problem_surface" | "method_surface" | "problem_method";
};

export function scoreGeneratedCandidate(input: CandidateInput): CandidateScoreResult {
  let score = 100;
  const flags: string[] = [];

  const lowerTitle = input.title.toLowerCase();
  const lowerSlug = input.slug.toLowerCase();

  if (lowerTitle.includes(" on cleaning ")) {
    score -= 25;
    flags.push("awkward_on_cleaning_phrase");
  }

  if (lowerSlug.includes("-on-cleaning-")) {
    score -= 25;
    flags.push("awkward_slug_on_cleaning");
  }

  if (lowerTitle.includes(" for cleaning ")) {
    score -= 20;
    flags.push("awkward_for_cleaning_phrase");
  }

  if ((lowerSlug.match(/-on-/g) ?? []).length > 1) {
    score -= 20;
    flags.push("multiple_on_segments");
  }

  if ((lowerSlug.match(/cleaning-/g) ?? []).length > 0) {
    score -= 15;
    flags.push("raw_cleaning_taxonomy");
  }

  if (lowerTitle.length > 85) {
    score -= 10;
    flags.push("long_title");
  }

  if (lowerSlug.length > 90) {
    score -= 10;
    flags.push("long_slug");
  }

  const cleanup = cleanupSurfaceTaxonomy(input.slug);
  flags.push(...cleanup.flags);

  if (input.generatedType === "problem_surface") {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  const dedupedFlags = unique(flags);

  if (
    dedupedFlags.includes("awkward_slug_on_cleaning") ||
    dedupedFlags.includes("awkward_on_cleaning_phrase") ||
    dedupedFlags.includes("multiple_on_segments")
  ) {
    return {
      score,
      flags: dedupedFlags,
      recommendation: "review",
    };
  }

  if (score >= 80) {
    return { score, flags: dedupedFlags, recommendation: "promote" };
  }

  if (score >= 55) {
    return { score, flags: dedupedFlags, recommendation: "review" };
  }

  return { score, flags: dedupedFlags, recommendation: "reject" };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
