import type {
  PublicArticleEntry,
  PublicServiceEntry,
} from "./publicContentRegistry";

export function defineServiceEntry(entry: PublicServiceEntry): PublicServiceEntry {
  return entry;
}

export function defineArticleEntry(entry: PublicArticleEntry): PublicArticleEntry {
  return entry;
}

export const REGISTRY_EXPANSION_NOTES = {
  service:
    "New services should be added once in the unified registry and then automatically flow into services hub, service routes, booking mapping, metadata, sitemap, and related-content linking.",
  article:
    "New questions and guides should be added once in the unified registry and then automatically flow into routes, metadata, sitemap, and related-content linking.",
};
