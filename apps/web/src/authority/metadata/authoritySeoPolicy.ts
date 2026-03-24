import type { AuthorityPageFamily, AuthoritySeoPolicy } from "../types/authoritySeoTypes";
import { isAuthorityFamilyIndexable } from "./authorityIndexRules";

function normalizePath(path: string): string {
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

export function buildAuthoritySeoPolicy(
  family: AuthorityPageFamily,
  canonicalPath: string,
): AuthoritySeoPolicy {
  const normalizedPath = normalizePath(canonicalPath);
  const shouldIndex = isAuthorityFamilyIndexable(family);

  return {
    family,
    canonicalPath: normalizedPath,
    shouldIndex,
  };
}

export function buildAuthorityRobotsValue(shouldIndex: boolean): string {
  return shouldIndex ? "index, follow" : "noindex, follow";
}
