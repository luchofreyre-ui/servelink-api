import { SiteSearchResult } from "@/types/search";
import { METHOD_ENTITIES } from "@/knowledge/entities/methods";
import { SURFACE_ENTITIES } from "@/knowledge/entities/surfaces";
import { SOIL_ENTITIES } from "@/knowledge/entities/soils";
import { TOOL_ENTITIES } from "@/knowledge/entities/tools";
import { KNOWLEDGE_ARTICLES } from "@/knowledge/knowledgeArticles";
import { EDITORIAL_CLUSTERS } from "@/knowledge/clusters/clusterData";
import { getAllGuidePages } from "@/authority/data/authorityGuidePageData";

function normalizeKeywords(values: Array<string | undefined | null>): string[] {
  return values
    .flatMap((value) => {
      if (!value) return [];
      return value
        .split(/[\n,|/]+/)
        .map((part) => part.trim())
        .filter(Boolean);
    })
    .filter(Boolean);
}

function asDescription(value: string | undefined, fallback: string): string {
  const next = (value ?? "").trim();
  return next.length > 0 ? next : fallback;
}

function titleToKeywords(title: string): string[] {
  return title
    .split(/[\s:/()-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildEncyclopediaRootResult(): SiteSearchResult[] {
  return [
    {
      id: "encyclopedia:hub",
      type: "encyclopedia",
      title: "Cleaning Encyclopedia",
      href: "/encyclopedia",
      description:
        "Browse the complete cleaning knowledge hub by method, surface, problem, tool, article, cluster, and guide.",
      keywords: [
        "encyclopedia",
        "cleaning encyclopedia",
        "knowledge hub",
        "cleaning guide",
        "cleaning resource",
        "methods",
        "surfaces",
        "problems",
        "tools",
        "guides",
        "articles",
      ],
    },
  ];
}

function buildMethodResults(): SiteSearchResult[] {
  return METHOD_ENTITIES.map((item) => ({
    id: `method:${item.slug}`,
    type: "method" as const,
    title: item.name,
    href: `/methods/${item.slug}`,
    description: asDescription(
      item.summary,
      "Method guidance covering what it does, where it works, and what to avoid.",
    ),
    keywords: normalizeKeywords([
      item.name,
      item.slug,
      item.summary,
      ...titleToKeywords(item.name),
      ...(item.aliases ?? []),
      ...(item.compatibleSurfaceSlugs ?? []),
      ...(item.idealForSoilSlugs ?? []),
      ...(item.mechanism ?? []),
      item.chemistryClass,
    ]),
  }));
}

function buildSurfaceResults(): SiteSearchResult[] {
  return SURFACE_ENTITIES.map((item) => ({
    id: `surface:${item.slug}`,
    type: "surface" as const,
    title: item.name,
    href: `/surfaces/${item.slug}`,
    description: asDescription(
      item.summary,
      "Surface-safe cleaning guidance, compatibility, and damage risk context.",
    ),
    keywords: normalizeKeywords([
      item.name,
      item.slug,
      item.summary,
      ...titleToKeywords(item.name),
      ...(item.aliases ?? []),
      ...(item.commonProblemSlugs ?? []),
      ...(item.safeMethodSlugs ?? []),
      item.materialFamily,
      ...(item.finishTypes ?? []),
    ]),
  }));
}

function buildProblemResults(): SiteSearchResult[] {
  return SOIL_ENTITIES.map((item) => ({
    id: `problem:${item.slug}`,
    type: "problem" as const,
    title: item.name,
    href: `/problems/${item.slug}`,
    description: asDescription(
      item.summary,
      "Problem-focused cleaning guidance with causes, removal approaches, and prevention context.",
    ),
    keywords: normalizeKeywords([
      item.name,
      item.slug,
      item.summary,
      ...titleToKeywords(item.name),
      ...(item.aliases ?? []),
      ...(item.affectedSurfaceSlugs ?? []),
      ...(item.recommendedMethodSlugs ?? []),
      ...(item.composition ?? []),
      ...(item.formsFrom ?? []),
      ...(item.commonLocations ?? []),
      item.category,
      "stain",
      "buildup",
      "residue",
      "problem",
    ]),
  }));
}

function buildToolResults(): SiteSearchResult[] {
  return TOOL_ENTITIES.map((item) => ({
    id: `tool:${item.slug}`,
    type: "tool" as const,
    title: item.name,
    href: `/tools/${item.slug}`,
    description: asDescription(
      item.summary,
      "Tool guidance covering use cases, handling, and misuse risk.",
    ),
    keywords: normalizeKeywords([
      item.name,
      item.slug,
      item.summary,
      ...titleToKeywords(item.name),
      ...(item.aliases ?? []),
      ...(item.idealForSoilSlugs ?? []),
      ...(item.idealForSurfaceSlugs ?? []),
      ...(item.materials ?? []),
      ...(item.usePrinciples ?? []),
      item.category,
    ]),
  }));
}

function buildArticleResults(): SiteSearchResult[] {
  return KNOWLEDGE_ARTICLES.map((item) => ({
    id: `article:${item.slug}`,
    type: "article" as const,
    title: item.title,
    href: `/questions/${item.slug}`,
    description: asDescription(
      item.excerpt,
      "Knowledge article answering a real cleaning question.",
    ),
    keywords: normalizeKeywords([
      item.title,
      item.slug,
      item.excerpt,
      ...titleToKeywords(item.title),
      item.categorySlug,
      "question",
      "answer",
      "how to",
    ]),
  }));
}

function buildClusterResults(): SiteSearchResult[] {
  return EDITORIAL_CLUSTERS.map((item) => ({
    id: `cluster:${item.slug}`,
    type: "cluster" as const,
    title: item.name,
    href: `/clusters/${item.slug}`,
    description: asDescription(
      item.shortDescription,
      "Clustered learning path for related cleaning topics and recurring problem families.",
    ),
    keywords: normalizeKeywords([
      item.name,
      item.slug,
      item.shortDescription,
      ...titleToKeywords(item.name),
      ...item.entityReferences.map((e) => `${e.kind}:${e.slug}`),
      ...item.entityReferences.map((e) => e.slug),
      ...item.articleSlugs,
      ...item.relatedClusterSlugs,
      "cluster",
      "topic",
    ]),
  }));
}

function buildGuideResults(): SiteSearchResult[] {
  return getAllGuidePages().map((item) => {
    const problemKws =
      item.relatedProblems?.flatMap((p) => [p.slug, p.title, p.summary].filter(Boolean) as string[]) ?? [];
    const methodKws =
      item.relatedMethods?.flatMap((m) => [m.slug, m.title, m.summary].filter(Boolean) as string[]) ?? [];

    return {
      id: `guide:${item.slug}`,
      type: "guide" as const,
      title: item.title,
      href: `/guides/${item.slug}`,
      description: asDescription(
        item.summary,
        "Long-form guide covering cleaning systems, safety, failures, and operating standards.",
      ),
      keywords: normalizeKeywords([
        item.title,
        item.slug,
        item.summary,
        ...titleToKeywords(item.title),
        ...problemKws,
        ...methodKws,
        "guide",
      ]),
    };
  });
}

export function buildSiteSearchIndex(): SiteSearchResult[] {
  return [
    ...buildEncyclopediaRootResult(),
    ...buildMethodResults(),
    ...buildSurfaceResults(),
    ...buildProblemResults(),
    ...buildToolResults(),
    ...buildArticleResults(),
    ...buildClusterResults(),
    ...buildGuideResults(),
  ];
}
