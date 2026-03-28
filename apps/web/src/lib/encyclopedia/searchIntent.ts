/**
 * Order matters: stronger process cues first, then problem soil cues (beat generic "clean"),
 * then surface nouns, then remaining method cues.
 */
export function detectSearchIntent(query: string) {
  const q = query.toLowerCase();

  if (q.includes("how to")) {
    return "method";
  }

  // problem signals
  if (
    q.includes("remove") ||
    q.includes("stain") ||
    q.includes("buildup") ||
    q.includes("grease") ||
    q.includes("mold") ||
    q.includes("dirty")
  ) {
    return "problem";
  }

  // surface signals
  if (
    q.includes("glass") ||
    q.includes("floor") ||
    q.includes("counter") ||
    q.includes("tile") ||
    q.includes("cabinet")
  ) {
    return "surface";
  }

  // method signals
  if (q.includes("clean") || q.includes("method") || q.includes("process")) {
    return "method";
  }

  return "unknown";
}
