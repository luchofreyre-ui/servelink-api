/** Pull 1–2 short sentences for featured-snippet style blocks (no HTML). */
export function snippetAnswer(source: string, maxSentences = 2, maxChars = 280): string {
  const t = source.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  let out = sentences.slice(0, maxSentences).join(" ");
  if (out.length > maxChars) {
    out = `${out.slice(0, maxChars - 1).trim()}…`;
  }
  return out;
}
