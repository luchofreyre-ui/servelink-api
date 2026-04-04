import { isAuthorityOwnedProblemHub } from "@/lib/authority/authorityOwnedProblemHubs";
import executableRedirects from "./generated/executableEncyclopediaRedirects.json";

type RedirectRow = { source: string; destination: string; permanent: boolean };

const legacyToPipeline = new Map<string, string>(
  (executableRedirects as RedirectRow[]).map((r) => [r.source, r.destination]),
);

const PROBLEM_PATH = /^\/problems\/([^/]+)$/;

/**
 * When a legacy authority path has a live Next redirect to the encyclopedia,
 * use the pipeline URL directly in internal links (avoid redirect hops).
 */
export function preferEncyclopediaCanonicalHref(legacyPath: string): string {
  const m = PROBLEM_PATH.exec(legacyPath);
  if (m && isAuthorityOwnedProblemHub(m[1])) {
    return legacyPath;
  }
  return legacyToPipeline.get(legacyPath) ?? legacyPath;
}
