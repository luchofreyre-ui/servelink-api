/**
 * Deterministic FO Knowledge Hub URLs. The route may be implemented separately;
 * callers always receive stable query shapes.
 */
export function buildFoKnowledgeHref(
  params: { bookingId?: string },
  options?: { focusQuickSolve?: boolean },
): string {
  const search = new URLSearchParams();
  if (params.bookingId) search.set("bookingId", params.bookingId);
  if (options?.focusQuickSolve) search.set("focusQuickSolve", "1");
  const q = search.toString();
  return q ? `/fo/knowledge?${q}` : "/fo/knowledge";
}
