import { SITE_URL } from "../seo/seoConfig";
import { KNOWLEDGE_HUB_SLUG } from "./knowledgeConfig";

export function getKnowledgeHubUrl(): string {
  return `${SITE_URL}/${KNOWLEDGE_HUB_SLUG}`;
}

export function getKnowledgeCategoryUrl(categorySlug: string): string {
  return `${SITE_URL}/${categorySlug}`;
}

export function getKnowledgeArticleUrl(articleSlug: string): string {
  return `${SITE_URL}/${articleSlug}`;
}
