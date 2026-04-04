import { buildFunnelGapReport } from "@/lib/funnel/funnelGapReport";

import { tryResolveAuthorityProblemSlugForQuery } from "./searchAuthorityProblemAlias";

export type SearchMonetizationCheckResult = {
  query: string;
  resolvedProblemSlug: string | null;
  issues: string[];
};

/**
 * When a query maps to a stackable authority problem, surfaces funnel gaps for that hub.
 * Called from the unified search pipeline for non-production diagnostics.
 */
export function checkSearchMonetization(query: string): SearchMonetizationCheckResult {
  const issues: string[] = [];
  const resolvedProblemSlug = tryResolveAuthorityProblemSlugForQuery(query);

  if (resolvedProblemSlug) {
    const gapsForProblem = buildFunnelGapReport().filter((g) => g.problemSlug === resolvedProblemSlug);
    for (const g of gapsForProblem) {
      issues.push(`${g.code}: ${g.detail}`);
    }
  }

  if (issues.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn("[searchMonetization]", { query, resolvedProblemSlug, issues });
  }

  return { query, resolvedProblemSlug, issues };
}
