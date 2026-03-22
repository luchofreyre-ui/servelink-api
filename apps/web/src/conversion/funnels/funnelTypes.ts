import type { IntentServiceSlug } from "../intent/intentCtaTypes";

export type ServiceFunnelDefinition = {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  serviceSlug: IntentServiceSlug;
  articleSlugs: string[];
  entityReferences: Array<{
    kind: "problem" | "surface" | "method" | "tool";
    slug: string;
  }>;
  preferredCitySlugs: string[];
};

export type ServiceFunnelIndexItem = {
  slug: string;
  name: string;
  shortDescription: string;
  href: string;
  serviceSlug: IntentServiceSlug;
};

export type ServiceFunnelPageArticle = {
  slug: string;
  title: string;
  href: string;
  summary?: string;
};

export type ServiceFunnelPageEntity = {
  key: string;
  kind: "problem" | "surface" | "method" | "tool";
  slug: string;
  name: string;
  href: string;
  summary?: string;
};

export type ServiceFunnelPageServiceLink = {
  key: string;
  title: string;
  href: string;
  summary: string;
};

export type ServiceFunnelPageData = {
  funnel: ServiceFunnelDefinition;
  articles: ServiceFunnelPageArticle[];
  entities: ServiceFunnelPageEntity[];
  serviceLinks: ServiceFunnelPageServiceLink[];
};
