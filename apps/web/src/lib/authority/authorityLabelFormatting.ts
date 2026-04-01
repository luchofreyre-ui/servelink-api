export function normalizeAuthorityLabel(input: string): string {
  return input
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function normalizeSentenceLabel(input: string): string {
  const title = normalizeAuthorityLabel(input);
  return title.charAt(0).toUpperCase() + title.slice(1);
}
