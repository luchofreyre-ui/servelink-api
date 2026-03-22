import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_HUB_SLUG } from "./knowledgeConfig";
import { isKnowledgeArticleSlug as isKnowledgeArticleSlugFromArticles } from "./knowledgeArticles";

export const isKnowledgeArticleSlug = isKnowledgeArticleSlugFromArticles;

export function isKnowledgeCategorySlug(slug: string): boolean {
  return KNOWLEDGE_CATEGORIES.some((c) => c.slug === slug);
}

export function getKnowledgeCategoryBySlug(slug: string): (typeof KNOWLEDGE_CATEGORIES)[number] | null {
  return KNOWLEDGE_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function isKnowledgeHubSlug(slug: string): boolean {
  return slug === KNOWLEDGE_HUB_SLUG;
}
