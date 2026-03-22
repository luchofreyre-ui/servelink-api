import { getKnowledgeArticlesByCategory, getKnowledgeArticleBySlug } from "./knowledgeArticles";
import { getServiceBySlug } from "../seo/seoValidation";
import { getLocationBySlug } from "../seo/seoValidation";
import { getAreaPagePath } from "../seo/seoUrls";
import type { KnowledgeCategorySlug } from "./knowledgeConfig";

export type KnowledgeRelatedLink = { href: string; label: string };

export function getKnowledgeHubPopularLinks(): KnowledgeRelatedLink[] {
  return [
    { href: "/house-cleaning", label: "House Cleaning" },
    { href: "/deep-cleaning", label: "Deep Cleaning" },
    { href: "/move-out-cleaning", label: "Move-Out Cleaning" },
    { href: "/tulsa-cleaning-services", label: "Tulsa cleaning services" },
    { href: "/book", label: "Book now" },
  ];
}

export function getKnowledgeCategoryRelatedLinks(_categorySlug: string): KnowledgeRelatedLink[] {
  return [
    { href: "/cleaning-guides", label: "Cleaning Guides" },
    { href: "/house-cleaning", label: "House Cleaning" },
    { href: "/deep-cleaning", label: "Deep Cleaning" },
    { href: "/move-out-cleaning", label: "Move-Out Cleaning" },
  ];
}

export function getKnowledgeArticleRelatedArticles(articleSlug: string): KnowledgeRelatedLink[] {
  const article = getKnowledgeArticleBySlug(articleSlug);
  if (!article) return [];
  const sameCategory = getKnowledgeArticlesByCategory(article.categorySlug as KnowledgeCategorySlug);
  const others = sameCategory.filter((a) => a.slug !== articleSlug).slice(0, 6);
  return others.map((a) => ({ href: `/${a.slug}`, label: a.title }));
}

/** Build related service links for an article from its relatedServiceSlugs. */
export function getKnowledgeArticleRelatedServiceLinks(relatedServiceSlugs: string[]): KnowledgeRelatedLink[] {
  return relatedServiceSlugs
    .map((slug) => getServiceBySlug(slug))
    .filter(Boolean)
    .map((s) => ({ href: `/${s!.slug}`, label: s!.name }));
}

/** Build related location links for an article from its relatedLocationSlugs. */
export function getKnowledgeArticleRelatedLocationLinks(relatedLocationSlugs: string[]): KnowledgeRelatedLink[] {
  const links: KnowledgeRelatedLink[] = [];
  for (const slug of relatedLocationSlugs) {
    const loc = getLocationBySlug(slug);
    if (loc) {
      if (["tulsa", "broken-arrow", "bixby"].includes(slug)) {
        links.push({ href: getAreaPagePath(slug), label: `${loc.name} cleaning services` });
      } else {
        links.push({ href: `/${slug}`, label: `${loc.name} Cleaning Services` });
      }
    }
  }
  return links;
}
