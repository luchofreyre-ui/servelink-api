import { KNOWLEDGE_ARTICLES } from "../knowledgeArticles";
import { METHOD_ENTITIES, SOIL_ENTITIES, SURFACE_ENTITIES, TOOL_ENTITIES } from "../entities";
import { ARTICLE_ENTITY_MAP } from "./articleEntityMap";
import type {
  ArticleEntityKind,
  ArticleEntityLink,
  ArticleEntityReference,
  EntityRelatedArticlesParams,
  RelatedArticleLink,
} from "./articleEntityTypes";

type GenericEntity = Record<string, unknown>;
type GenericArticle = Record<string, unknown>;

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getEntityName(entity: GenericEntity): string {
  const n = safeString(entity.name) || safeString(entity.title) || safeString(entity.label);
  return n || humanizeSlug(safeString(entity.slug));
}

function getEntitySummary(entity: GenericEntity): string {
  return (
    safeString(entity.summary) ||
    safeString(entity.shortDescription) ||
    safeString(entity.description) ||
    safeString(entity.definition)
  );
}

function getArticleTitle(article: GenericArticle): string {
  const t = safeString(article.title) || safeString(article.name);
  return t || humanizeSlug(safeString(article.slug));
}

function getArticleSummary(article: GenericArticle): string {
  return (
    safeString(article.summary) ||
    safeString(article.description) ||
    safeString(article.excerpt) ||
    safeString(article.shortDescription)
  );
}

function getEntitiesForKind(kind: ArticleEntityKind): GenericEntity[] {
  switch (kind) {
    case "problem":
      return SOIL_ENTITIES as GenericEntity[];
    case "surface":
      return SURFACE_ENTITIES as GenericEntity[];
    case "method":
      return METHOD_ENTITIES as GenericEntity[];
    case "tool":
      return TOOL_ENTITIES as GenericEntity[];
    default:
      return [];
  }
}

function getEntityHref(kind: ArticleEntityKind, slug: string): string {
  switch (kind) {
    case "problem":
      return "/cleaning-problems/" + slug;
    case "surface":
      return "/cleaning-surfaces/" + slug;
    case "method":
      return "/cleaning-methods/" + slug;
    case "tool":
      return "/cleaning-tools/" + slug;
    default:
      return "/";
  }
}

function buildEntityMap(kind: ArticleEntityKind): Map<string, GenericEntity> {
  const map = new Map<string, GenericEntity>();
  for (const entity of getEntitiesForKind(kind)) {
    const slug = safeString(entity.slug);
    if (slug) map.set(slug, entity);
  }
  return map;
}

const PROBLEM_ENTITY_MAP = buildEntityMap("problem");
const SURFACE_ENTITY_MAP = buildEntityMap("surface");
const METHOD_ENTITY_MAP = buildEntityMap("method");
const TOOL_ENTITY_MAP = buildEntityMap("tool");

function getEntityMap(kind: ArticleEntityKind): Map<string, GenericEntity> {
  switch (kind) {
    case "problem":
      return PROBLEM_ENTITY_MAP;
    case "surface":
      return SURFACE_ENTITY_MAP;
    case "method":
      return METHOD_ENTITY_MAP;
    case "tool":
      return TOOL_ENTITY_MAP;
    default:
      return new Map<string, GenericEntity>();
  }
}

function getKnowledgeArticlesArray(): GenericArticle[] {
  return KNOWLEDGE_ARTICLES as unknown as GenericArticle[];
}

function uniqueEntityRefs(refs: ArticleEntityReference[]): ArticleEntityReference[] {
  const seen = new Set<string>();
  const output: ArticleEntityReference[] = [];
  for (const ref of refs) {
    const key = ref.kind + ":" + ref.slug;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(ref);
  }
  return output;
}

export function getArticleEntityReferences(articleSlug: string): ArticleEntityReference[] {
  const entry = ARTICLE_ENTITY_MAP.find((item) => item.articleSlug === articleSlug);
  if (!entry) return [];
  return uniqueEntityRefs(entry.entities);
}

export function getArticleEntityLinks(articleSlug: string): ArticleEntityLink[] {
  const refs = getArticleEntityReferences(articleSlug);
  const output: ArticleEntityLink[] = [];
  for (const ref of refs) {
    const entity = getEntityMap(ref.kind).get(ref.slug);
    if (!entity) continue;
    const summary = getEntitySummary(entity);
    output.push({
      kind: ref.kind,
      slug: ref.slug,
      name: getEntityName(entity),
      href: getEntityHref(ref.kind, ref.slug),
      summary: summary || undefined,
    });
  }
  return output.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.name.localeCompare(b.name);
  });
}

export function getRelatedArticlesForEntity(
  params: EntityRelatedArticlesParams
): RelatedArticleLink[] {
  const { kind, slug, liveOnly = true, maxItems = 6 } = params;
  const articleSlugs = ARTICLE_ENTITY_MAP.filter((entry) =>
    entry.entities.some((e) => e.kind === kind && e.slug === slug)
  ).map((entry) => entry.articleSlug);
  if (!articleSlugs.length) return [];

  const articleMap = new Map<string, GenericArticle>();
  for (const article of getKnowledgeArticlesArray()) {
    const s = safeString(article.slug);
    if (s) articleMap.set(s, article);
  }

  const output: RelatedArticleLink[] = [];
  for (const articleSlug of articleSlugs) {
    const article = articleMap.get(articleSlug);
    if (!article) continue;
    const isLive = Boolean(article.isLive);
    if (liveOnly && !isLive) continue;
    output.push({
      slug: articleSlug,
      title: getArticleTitle(article),
      href: "/" + articleSlug,
      summary: getArticleSummary(article) || undefined,
      isLive,
    });
  }
  return output.sort((a, b) => a.title.localeCompare(b.title)).slice(0, maxItems);
}

export function getEntityReferencesGrouped(
  articleSlug: string
): Record<ArticleEntityKind, ArticleEntityLink[]> {
  const links = getArticleEntityLinks(articleSlug);
  return {
    problem: links.filter((l) => l.kind === "problem"),
    surface: links.filter((l) => l.kind === "surface"),
    method: links.filter((l) => l.kind === "method"),
    tool: links.filter((l) => l.kind === "tool"),
  };
}
