export type EditorialClusterEntityKind = "problem" | "surface" | "method" | "tool";

export type EditorialClusterEntityReference = {
  kind: EditorialClusterEntityKind;
  slug: string;
};

export type EditorialClusterServiceReference = {
  serviceSlug: string;
  citySlug?: string;
};

export type EditorialClusterDefinition = {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  articleSlugs: string[];
  entityReferences: EditorialClusterEntityReference[];
  serviceReferences: EditorialClusterServiceReference[];
  relatedClusterSlugs: string[];
};

export type EditorialClusterIndexItem = {
  slug: string;
  name: string;
  shortDescription: string;
  href: string;
  articleCount: number;
  entityCount: number;
};

export type EditorialClusterArticleLink = {
  slug: string;
  title: string;
  href: string;
  summary?: string;
  isLive: boolean;
};

export type EditorialClusterEntityLink = {
  kind: EditorialClusterEntityKind;
  slug: string;
  name: string;
  href: string;
  summary?: string;
};

export type EditorialClusterServiceLink = {
  key: string;
  title: string;
  href: string;
  summary: string;
};

export type EditorialClusterPageData = {
  cluster: EditorialClusterDefinition;
  articles: EditorialClusterArticleLink[];
  entities: EditorialClusterEntityLink[];
  services: EditorialClusterServiceLink[];
  relatedClusters: EditorialClusterIndexItem[];
};
