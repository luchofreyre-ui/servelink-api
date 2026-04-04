import { AUTHORITY_OWNED_PROBLEM_SLUGS } from "@/lib/authority/authorityOwnedProblemHubs";
import executableRedirects from "./generated/executableEncyclopediaRedirects.json";

type RedirectRow = { source: string; destination: string; permanent: boolean };

const legacyToPipeline = new Map<string, string>(
  (executableRedirects as RedirectRow[]).map((r) => [r.source, r.destination]),
);

/**
 * When a legacy authority path has a live Next redirect to the encyclopedia,
 * use the pipeline URL directly in internal links (avoid redirect hops).
 */
export function preferEncyclopediaCanonicalHref(href: string): string {
  // HARD STOP — NEVER rewrite authority-owned problem hubs
  if (href.startsWith("/problems/")) {
    const slug = href.replace("/problems/", "").split("/")[0];
    if (AUTHORITY_OWNED_PROBLEM_SLUGS.has(slug)) {
      return href;
    }
  }

  return legacyToPipeline.get(href) ?? href;
}
