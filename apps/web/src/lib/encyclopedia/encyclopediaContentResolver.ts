// Server-only: uses fs + cached loader. Import from RSC or server modules only.

import type { CanonicalPageSnapshot } from "./encyclopediaPipelineTypes";
import { readLiveEncyclopediaPageBySlug } from "./encyclopediaLiveStore.server";
import type { EncyclopediaCategory, EncyclopediaDocument } from "./types";
import {
  getEncyclopediaDocumentByCategoryAndSlug,
  getPublishedEncyclopediaIndex,
} from "./loader";

// Fail in real browser bundles (window + no Node). Vitest jsdom has window but process.versions.node.
const looksLikeBrowserOnly =
  typeof window !== "undefined" &&
  (typeof process === "undefined" ||
    typeof process.versions?.node !== "string");
if (looksLikeBrowserOnly) {
  throw new Error("encyclopediaContentResolver is server-only");
}

export type LiveEncyclopediaPage = {
  slug: string;
  title: string;
  content: CanonicalPageSnapshot;
  contentHash: string;
  promotedAt?: string;
};

export type ResolvedEncyclopediaPage = {
  slug: string;
  title: string;
  content: CanonicalPageSnapshot | EncyclopediaDocument;
  source: "live" | "legacy";
};

function liveRecordToPage(
  slug: string,
  record: NonNullable<ReturnType<typeof readLiveEncyclopediaPageBySlug>>
): LiveEncyclopediaPage {
  return {
    slug,
    title: record.title,
    content: record.snapshot,
    contentHash: record.contentHash,
    promotedAt: record.promotedAt,
  };
}

function normalizeLivePage(page: LiveEncyclopediaPage): ResolvedEncyclopediaPage {
  return {
    slug: page.slug,
    title: page.title,
    content: page.content,
    source: "live",
  };
}

/** Prefer promoted live snapshot; else published markdown + master-index (existing system). */
export function getResolvedEncyclopediaPage(
  category: EncyclopediaCategory,
  slug: string
): ResolvedEncyclopediaPage | null {
  const liveRecord = readLiveEncyclopediaPageBySlug(slug);
  if (liveRecord) {
    return normalizeLivePage(liveRecordToPage(slug, liveRecord));
  }

  const doc = getEncyclopediaDocumentByCategoryAndSlug(category, slug);
  if (!doc) {
    return null;
  }

  return {
    slug,
    title: doc.frontmatter.title,
    content: doc,
    source: "legacy",
  };
}

/**
 * Slug-only resolution: live store first, then first published index row with this slug.
 */
export function getEncyclopediaPageBySlug(
  slug: string
): ResolvedEncyclopediaPage | null {
  const liveRecord = readLiveEncyclopediaPageBySlug(slug);
  if (liveRecord) {
    return normalizeLivePage(liveRecordToPage(slug, liveRecord));
  }

  const entry = getPublishedEncyclopediaIndex().find((e) => e.slug === slug);
  if (!entry) {
    return null;
  }

  const doc = getEncyclopediaDocumentByCategoryAndSlug(entry.category, slug);
  if (!doc) {
    return null;
  }

  return {
    slug,
    title: doc.frontmatter.title,
    content: doc,
    source: "legacy",
  };
}
