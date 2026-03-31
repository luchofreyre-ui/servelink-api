import { buildRedirectManifest } from "./redirectManifest";

export type ExecutableRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
};

function isInternalAbsolutePath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

/**
 * Next.js–ready redirects from the high-priority encyclopedia manifest only.
 * Dedupes by source; drops invalid or self-redirect rows; stable sort by source.
 */
export function buildExecutableEncyclopediaRedirects(): ExecutableRedirect[] {
  const { items } = buildRedirectManifest({ minPriority: "high" });
  const sorted = [...items].sort((a, b) => a.sourceHref.localeCompare(b.sourceHref));
  const bySource = new Map<string, ExecutableRedirect>();

  for (const row of sorted) {
    const source = row.sourceHref.trim();
    const destination = row.destinationHref.trim();
    if (!source || !destination) continue;
    if (source === destination) continue;
    if (!isInternalAbsolutePath(source) || !isInternalAbsolutePath(destination)) continue;
    if (bySource.has(source)) continue;

    bySource.set(source, {
      source,
      destination,
      permanent: true,
    });
  }

  return [...bySource.values()].sort((a, b) => a.source.localeCompare(b.source));
}
