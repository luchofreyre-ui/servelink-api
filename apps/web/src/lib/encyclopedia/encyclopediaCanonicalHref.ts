import executableRedirects from "./generated/executableEncyclopediaRedirects.json";

type RedirectRow = { source: string; destination: string; permanent: boolean };

const legacyToPipeline = new Map<string, string>(
  (executableRedirects as RedirectRow[]).map((r) => [r.source, r.destination]),
);

/**
 * When a legacy authority path has a live Next redirect to the encyclopedia,
 * use the pipeline URL directly in internal links (avoid redirect hops).
 */
export function preferEncyclopediaCanonicalHref(legacyPath: string): string {
  return legacyToPipeline.get(legacyPath) ?? legacyPath;
}
