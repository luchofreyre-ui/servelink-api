import type { AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";

/**
 * Execution-first problem hubs: compact hero + full-width Quick fix + optional “Why this works”.
 *
 * When true, `AuthorityProblemDetailPage` must use only the single-column execution branch for the
 * top fold. Do not mount `AuthorityQuickAnswer`, `ProblemBestMethodCard`, or the diagnostic
 * “What this usually is” rail there—those belong in the legacy branch only.
 *
 * Editorial / monetization expectation: each execution-first hub should also ship at least one
 * `productScenarios` row with `products` and a working purchase URL (enforced in content review, not here).
 */
export function isExecutionFirstProblemLayout(
  data: Pick<AuthorityProblemPageData, "executionQuickFix" | "problemDefinitionLine">,
): boolean {
  return Boolean(data.executionQuickFix && data.problemDefinitionLine);
}
