export type AuthorityEntityKind = "problem" | "surface" | "method" | "tool";

export type AuthorityEntityRecord = {
  slug: string;
  name: string;
  summary?: string;
  kind: AuthorityEntityKind;
  href: string;
};

export type AuthorityContext = {
  sourceKind: AuthorityEntityKind;
  sourceSlug: string;
  sourceName: string;
  problemSlugs: string[];
  surfaceSlugs: string[];
  methodSlugs: string[];
  toolSlugs: string[];
};

export type AuthorityLinkCandidate = AuthorityEntityRecord & {
  score: number;
  reasons: string[];
};

export type AuthorityLinkGroup = {
  key: string;
  title: string;
  description: string;
  items: AuthorityLinkCandidate[];
};

export type AuthorityGroupBuildOptions = {
  maxItems?: number;
};
