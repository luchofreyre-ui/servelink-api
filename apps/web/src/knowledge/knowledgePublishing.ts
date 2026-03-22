import { getKnowledgeArticleBySlug } from "./knowledgeArticles";

export function isKnowledgeArticleLive(slug: string): boolean {
  const article = getKnowledgeArticleBySlug(slug);
  return article?.isLive ?? false;
}

export function shouldKnowledgeArticleBeIndexed(slug: string): boolean {
  return isKnowledgeArticleLive(slug);
}

export function getKnowledgeArticleRobotsValue(slug: string): string {
  return shouldKnowledgeArticleBeIndexed(slug) ? "index, follow" : "noindex, nofollow";
}
