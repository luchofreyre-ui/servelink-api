import { preferEncyclopediaCanonicalHref } from "./encyclopediaCanonicalHref";

/**
 * Canonical path segment for HTML metadata: `alternates.canonical`, Open Graph `url`,
 * JSON-LD `url` / `mainEntityOfPage`, and sitemap `<loc>` paths.
 *
 * Uses the same executable redirect map as live navigation — exact legacy path match only.
 */
export function resolveCanonicalMetadataHref(path: string): string {
  return preferEncyclopediaCanonicalHref(path);
}

/** Apply encyclopedia canonical preference to breadcrumb hrefs used in JSON-LD only. */
export function resolveJsonLdBreadcrumbHrefs(
  items: { label: string; href: string }[],
): { label: string; href: string }[] {
  return items.map((item) => ({
    ...item,
    href: resolveCanonicalMetadataHref(item.href),
  }));
}
