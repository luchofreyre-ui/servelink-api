import {
  normalizeAuthorityLabel,
  normalizeSentenceLabel,
} from "./authorityLabelFormatting";

export function buildProblemMeta(problem: string) {
  const label = normalizeAuthorityLabel(problem);

  return {
    title: `Best Cleaners for ${label} + What Actually Works`,
    description: `The most effective way to fix ${normalizeSentenceLabel(
      problem,
    )}, what actually works, and what to avoid based on real cleaning chemistry.`,
  };
}

export function buildPlaybookMeta(problem: string, surface: string) {
  const problemLabel = normalizeAuthorityLabel(problem);
  const surfaceLabel = normalizeAuthorityLabel(surface);

  return {
    title: `How to Remove ${problemLabel} from ${surfaceLabel}`,
    description: `Step-by-step method to remove ${normalizeSentenceLabel(
      problem,
    )} from ${surfaceLabel}, including the best products and what not to use.`,
  };
}

export function buildComparisonMeta(a: string, b: string, problem?: string) {
  const aLabel = normalizeAuthorityLabel(a);
  const bLabel = normalizeAuthorityLabel(b);
  const problemLabel = problem ? normalizeAuthorityLabel(problem) : undefined;

  return {
    title: `${aLabel} vs ${bLabel}${
      problemLabel ? `: Which Is Better for ${problemLabel}?` : ""
    }`,
    description: `Side-by-side comparison of ${aLabel} and ${bLabel}, including when each one wins and when neither is the right choice.`,
  };
}

export function buildGuideMeta(title: string) {
  const label = normalizeAuthorityLabel(title);

  return {
    title: label,
    description:
      "Why this cleaning method fails, what actually works instead, and the best products for the job.",
  };
}
