export type IntentServiceSlug =
  | "shower-cleaning"
  | "grout-cleaning"
  | "glass-and-detail-cleaning"
  | "hard-surface-floor-cleaning";

export type IntentServiceRoute = {
  serviceSlug: IntentServiceSlug;
  href: string;
  title: string;
  citySlug?: string;
};

export type IntentRule = {
  id: string;
  title: string;
  description: string;
  serviceSlug: IntentServiceSlug;
  matches: {
    problemSlugs: string[];
    surfaceSlugs: string[];
    methodSlugs: string[];
    toolSlugs: string[];
    articleSlugs: string[];
    clusterSlugs: string[];
  };
};

export type IntentSelectionInput = {
  kind: "method" | "problem" | "surface" | "tool" | "cluster";
  slug: string;
  clusterSlug?: string;
  problemSlugs: string[];
  surfaceSlugs: string[];
  methodSlugs: string[];
  toolSlugs: string[];
  articleSlugs?: string[];
  clusterSlugs?: string[];
};

export type IntentCta = {
  ruleId: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};
