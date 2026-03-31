import { getResolvedEncyclopediaIndex } from "./loader";
import { formatClusterDisplayTitle } from "./clusters";
import type { EncyclopediaCategory } from "./types";
import type { EncyclopediaResolvedIndexEntry } from "./types";

/**
 * Normalized row for density + link analysis (deterministic, no I/O in mappers).
 */
export type EncyclopediaCorpusEntry = {
  slug: string;
  title: string;
  category: EncyclopediaCategory;
  cluster: string;
  role: string;
  status: string;
  id: string;
  href: string;
  fileExists: boolean;
};

export function inferIsComparisonSlug(slug: string): boolean {
  return slug.includes("-vs-");
}

export function inferIsQuestionSlug(slug: string): boolean {
  return /^(why|how)-/i.test(slug);
}

export function inferIsGuideCategory(category: EncyclopediaCategory): boolean {
  return category === "prevention" || category === "rooms";
}

export function resolvedIndexEntryToCorpusEntry(entry: EncyclopediaResolvedIndexEntry): EncyclopediaCorpusEntry {
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    category: entry.category,
    cluster: entry.cluster,
    role: entry.role,
    status: entry.status,
    href: entry.href,
    fileExists: entry.fileExists,
  };
}

/**
 * Live corpus: published encyclopedia pages with markdown on disk.
 */
export function loadEncyclopediaIndexEntriesForAnalysis(): EncyclopediaCorpusEntry[] {
  return getResolvedEncyclopediaIndex()
    .filter((e) => e.status === "published" && e.fileExists)
    .map(resolvedIndexEntryToCorpusEntry);
}

export function clusterLabelForSlug(clusterSlug: string): string {
  return formatClusterDisplayTitle(clusterSlug);
}
