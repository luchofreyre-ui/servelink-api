import { getKnowledgeHubUrl, getKnowledgeCategoryUrl, getKnowledgeArticleUrl } from "./knowledgeUrls";
import { KNOWLEDGE_CATEGORIES } from "./knowledgeConfig";
import type { KnowledgeArticleDefinition } from "./knowledgeArticles";
import { getKnowledgeArticleRobotsValue } from "./knowledgePublishing";

export type KnowledgePageMetadata = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  robots?: string;
};

const SITE_NAME = "Nu Standard Cleaning";

export function buildKnowledgeHubMetadata(): KnowledgePageMetadata {
  const canonical = getKnowledgeHubUrl();
  const title = "Cleaning Guides | Nu Standard Cleaning";
  const description =
    "Explore cleaning guides, checklists, techniques, stain removal tips, room-by-room cleaning advice, and professional residential cleaning knowledge from Nu Standard Cleaning.";
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}

export function buildKnowledgeCategoryMetadata(category: (typeof KNOWLEDGE_CATEGORIES)[number]): KnowledgePageMetadata {
  const canonical = getKnowledgeCategoryUrl(category.slug);
  const title = `${category.name} | ${SITE_NAME}`;
  const description = `Explore ${category.name.toLowerCase()} guides and residential cleaning knowledge from Nu Standard Cleaning.`;
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}

export function buildKnowledgeArticleMetadata(article: KnowledgeArticleDefinition): KnowledgePageMetadata {
  const canonical = getKnowledgeArticleUrl(article.slug);
  const title = `${article.title} | ${SITE_NAME}`;
  return {
    title,
    description: article.excerpt,
    canonical,
    ogTitle: title,
    ogDescription: article.excerpt,
    ogUrl: canonical,
    robots: getKnowledgeArticleRobotsValue(article.slug),
  };
}
