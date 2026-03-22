export type ArticleEntityKind = "problem" | "surface" | "method" | "tool";

export type ArticleEntityReference = {
  kind: ArticleEntityKind;
  slug: string;
};

export type ArticleEntityMapEntry = {
  articleSlug: string;
  entities: ArticleEntityReference[];
};

export type ArticleEntityLink = {
  kind: ArticleEntityKind;
  slug: string;
  name: string;
  href: string;
  summary?: string;
};

export type RelatedArticleLink = {
  slug: string;
  title: string;
  href: string;
  summary?: string;
  isLive: boolean;
};

export type ArticleEntitySectionData = {
  articleSlug: string;
  entities: ArticleEntityLink[];
};

export type EntityRelatedArticlesParams = {
  kind: ArticleEntityKind;
  slug: string;
  liveOnly?: boolean;
  maxItems?: number;
};
