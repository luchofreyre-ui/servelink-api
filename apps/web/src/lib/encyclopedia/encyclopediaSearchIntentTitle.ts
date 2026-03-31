/**
 * Heuristic classification for encyclopedia index titles: search-intent (Why/What/How)
 * vs symptom-on-surface “problem layer” phrasing the product should not mix with intent pages.
 */

export type EncyclopediaSearchIntentTitleKind = "search_intent" | "problem_layer" | "ambiguous";

export type EncyclopediaSearchIntentTitleResult = {
  kind: EncyclopediaSearchIntentTitleKind;
  /** Short machine-readable reason for UI / logs. */
  code: string;
};

function collapseWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/**
 * Uses the same string reviewers see (prefer normalized title when wiring from a row).
 */
export function classifyEncyclopediaSearchIntentTitle(raw: string): EncyclopediaSearchIntentTitleResult {
  const t = collapseWhitespace(raw);
  if (!t) {
    return { kind: "ambiguous", code: "empty" };
  }

  const firstWord = (t.split(/\s+/)[0] ?? "").toLowerCase();
  const startsIntentWord = firstWord === "why" || firstWord === "what" || firstWord === "how";

  const hasOnPhrase = /\s+on\s+/i.test(t);

  if (/^(heavy|light|severe)\b/i.test(t) && hasOnPhrase) {
    return { kind: "problem_layer", code: "severity-on-surface" };
  }

  if (!startsIntentWord && hasOnPhrase) {
    return { kind: "problem_layer", code: "phrase-with-on-without-intent-prefix" };
  }

  if (startsIntentWord) {
    return { kind: "search_intent", code: "why-what-how-prefix" };
  }

  return { kind: "ambiguous", code: "no-intent-prefix" };
}

export function isEncyclopediaSearchIntentPromotableTitle(raw: string): boolean {
  return classifyEncyclopediaSearchIntentTitle(raw).kind === "search_intent";
}
