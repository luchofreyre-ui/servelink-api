import { SITE_URL } from "../seo/seoConfig";
import { getKnowledgeHubUrl, getKnowledgeCategoryUrl, getKnowledgeArticleUrl } from "./knowledgeUrls";
import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_SITE_SECTION_NAME } from "./knowledgeConfig";
import type { KnowledgeArticleDefinition } from "./knowledgeArticles";

type BreadcrumbItem = { name: string; url: string };

function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildKnowledgeHubWebPageSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Cleaning Guides | Nu Standard Cleaning",
    url: getKnowledgeHubUrl(),
    description:
      "Explore cleaning guides, checklists, techniques, stain removal tips, room-by-room cleaning advice, and professional residential cleaning knowledge from Nu Standard Cleaning.",
  };
}

export function buildKnowledgeCategoryWebPageSchema(category: (typeof KNOWLEDGE_CATEGORIES)[number]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${category.name} | Nu Standard Cleaning`,
    url: getKnowledgeCategoryUrl(category.slug),
    description: `Explore ${category.name.toLowerCase()} guides and residential cleaning knowledge from Nu Standard Cleaning.`,
  };
}

export function buildKnowledgeArticleWebPageSchema(article: KnowledgeArticleDefinition): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${article.title} | Nu Standard Cleaning`,
    url: getKnowledgeArticleUrl(article.slug),
    description: article.excerpt,
  };
}

export function buildKnowledgeHubBreadcrumbSchema(): Record<string, unknown> {
  const items: BreadcrumbItem[] = [
    { name: "Home", url: SITE_URL },
    { name: KNOWLEDGE_SITE_SECTION_NAME, url: getKnowledgeHubUrl() },
  ];
  return buildBreadcrumbSchema(items);
}

export function buildKnowledgeCategoryBreadcrumbSchema(category: (typeof KNOWLEDGE_CATEGORIES)[number]): Record<string, unknown> {
  const items: BreadcrumbItem[] = [
    { name: "Home", url: SITE_URL },
    { name: KNOWLEDGE_SITE_SECTION_NAME, url: getKnowledgeHubUrl() },
    { name: category.name, url: getKnowledgeCategoryUrl(category.slug) },
  ];
  return buildBreadcrumbSchema(items);
}

export function buildKnowledgeArticleBreadcrumbSchema(
  article: KnowledgeArticleDefinition,
  category: (typeof KNOWLEDGE_CATEGORIES)[number]
): Record<string, unknown> {
  const items: BreadcrumbItem[] = [
    { name: "Home", url: SITE_URL },
    { name: KNOWLEDGE_SITE_SECTION_NAME, url: getKnowledgeHubUrl() },
    { name: category.name, url: getKnowledgeCategoryUrl(category.slug) },
    { name: article.title, url: getKnowledgeArticleUrl(article.slug) },
  ];
  return buildBreadcrumbSchema(items);
}
