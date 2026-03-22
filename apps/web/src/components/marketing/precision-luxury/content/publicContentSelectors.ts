import {
  publicContentRegistry,
  type PublicArticleEntry,
  type PublicContentEntry,
  type PublicServiceEntry,
} from "./publicContentRegistry";

export function getAllPublicContent() {
  return publicContentRegistry;
}

export function getPublicContentBySlug(slug: string) {
  return publicContentRegistry.find((entry) => entry.slug === slug);
}

export function getPublicContentNodeBySlug(slug: string) {
  return getPublicContentBySlug(slug);
}

export function getAllServiceEntries(): PublicServiceEntry[] {
  return publicContentRegistry.filter(
    (entry): entry is PublicServiceEntry => entry.kind === "service",
  );
}

export function getAllArticleEntries(): PublicArticleEntry[] {
  return publicContentRegistry.filter(
    (entry): entry is PublicArticleEntry =>
      entry.kind === "question" || entry.kind === "guide",
  );
}

export function getAllQuestionEntries(): PublicArticleEntry[] {
  return publicContentRegistry.filter(
    (entry): entry is PublicArticleEntry => entry.kind === "question",
  );
}

export function getAllGuideEntries(): PublicArticleEntry[] {
  return publicContentRegistry.filter(
    (entry): entry is PublicArticleEntry => entry.kind === "guide",
  );
}

export function getServiceBySlug(slug: string) {
  const entry = getPublicContentBySlug(slug);
  return entry?.kind === "service" ? entry : undefined;
}

export function getArticleBySlug(slug: string) {
  const entry = getPublicContentBySlug(slug);
  return entry?.kind === "question" || entry?.kind === "guide" ? entry : undefined;
}

export function getRelatedPublicContentBySlug(slug: string): PublicContentEntry[] {
  const node = getPublicContentBySlug(slug);

  if (!node) {
    return [];
  }

  return node.relatedSlugs
    .map((relatedSlug) => getPublicContentBySlug(relatedSlug))
    .filter((item): item is PublicContentEntry => Boolean(item));
}

export function getServiceHubCards() {
  return getAllServiceEntries();
}

export function getAllServiceSlugs() {
  return getAllServiceEntries().map((entry) => entry.slug);
}

export function getAllQuestionSlugs() {
  return getAllQuestionEntries().map((entry) => entry.slug);
}

export function getAllGuideSlugs() {
  return getAllGuideEntries().map((entry) => entry.slug);
}
