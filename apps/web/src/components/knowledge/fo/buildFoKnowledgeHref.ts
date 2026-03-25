interface BuildFoKnowledgeHrefParams {
  bookingId?: string;
  q?: string;
  surfaceId?: string;
  problemId?: string;
  severity?: "light" | "medium" | "heavy";
}

interface BuildFoKnowledgeHrefOptions {
  focusQuickSolve?: boolean;
}

/**
 * Deterministic FO Knowledge Hub URLs. The route may be implemented separately;
 * callers always receive stable query shapes.
 */
export function buildFoKnowledgeHref(
  params: BuildFoKnowledgeHrefParams = {},
  options?: BuildFoKnowledgeHrefOptions,
): string {
  const search = new URLSearchParams();

  if (params.bookingId) search.set("bookingId", params.bookingId);
  if (params.q) search.set("q", params.q);
  if (params.surfaceId) search.set("surfaceId", params.surfaceId);
  if (params.problemId) search.set("problemId", params.problemId);
  if (params.severity) search.set("severity", params.severity);
  if (options?.focusQuickSolve) search.set("focusQuickSolve", "1");

  const query = search.toString();
  return query ? `/fo/knowledge?${query}` : "/fo/knowledge";
}
