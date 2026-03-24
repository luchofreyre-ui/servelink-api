/** Public authority layer — educational content. */

export type AuthorityEntityKind = "method" | "surface" | "guide" | "problem";

export type AuthorityEntitySummary = {
  slug: string;
  title: string;
  href: string;
  summary?: string;
  kind?: AuthorityEntityKind;
};

export type AuthorityToolSummary = { name: string; note?: string };
export type AuthorityChemicalSummary = { name: string; note?: string };

export type AuthorityProblemSummary = {
  slug: string;
  title: string;
  href: string;
  summary?: string;
};

export type AuthorityRelatedLinkGroup = {
  heading: string;
  links: AuthorityEntitySummary[];
};

export interface AuthorityFaqItem {
  question: string;
  answer: string;
}

export interface AuthorityFaqBlock {
  title: string;
  items: AuthorityFaqItem[];
}

export type AuthorityProblemCategory =
  | "organic"
  | "mineral"
  | "oil_based"
  | "residue"
  | "biological"
  | "physical_damage"
  | "transfer"
  | "unknown";

export type AuthorityMethodPageData = {
  slug: string;
  title: string;
  summary: string;
  whatItIs: string;
  whyItWorks: string;
  bestFor: string;
  avoidOn: string;
  commonMistakes: string[];
  whenItFails: string;
  recommendedTools: AuthorityToolSummary[];
  recommendedChemicals: AuthorityChemicalSummary[];
  relatedSurfaces: AuthorityEntitySummary[];
  relatedProblems: AuthorityProblemSummary[];
  relatedMethods: AuthorityEntitySummary[];
};

export type AuthoritySurfacePageData = {
  slug: string;
  title: string;
  summary: string;
  whatToKnowFirst: string;
  safeMethods: string;
  avoidMethods: string;
  commonProblems: AuthorityProblemSummary[];
  recommendedTools: AuthorityToolSummary[];
  recommendedChemicals: AuthorityChemicalSummary[];
  commonMistakes: string[];
  whenToEscalate: string;
  relatedSurfaces: AuthorityEntitySummary[];
  relatedMethods: AuthorityEntitySummary[];
};

export type AuthorityProblemPageData = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  category: AuthorityProblemCategory;
  symptoms: string[];
  causes: string[];
  whatItUsuallyIs: string;
  whyItHappens: string;
  commonOn: string;
  bestMethods: string;
  avoidMethods: string;
  recommendedTools: AuthorityToolSummary[];
  recommendedChemicals: AuthorityChemicalSummary[];
  commonMistakes: string[];
  whenItFails: string;
  whenToEscalate: string;
  relatedProblems: AuthorityProblemSummary[];
  relatedMethods: AuthorityEntitySummary[];
  relatedSurfaces: AuthorityEntitySummary[];
};

export type AuthorityComparisonType =
  | "method_comparison"
  | "surface_comparison"
  | "problem_comparison";

export interface AuthorityComparisonRow {
  label: string;
  leftValue: string;
  rightValue: string;
}

export interface AuthorityComparisonPageData {
  type: AuthorityComparisonType;
  slug: string;

  leftSlug: string;
  rightSlug: string;

  title: string;
  description: string;
  intro: string;

  rows: AuthorityComparisonRow[];

  relatedMethods?: string[];
  relatedSurfaces?: string[];
  relatedProblems?: string[];
}

export type AuthorityClusterType = "problem_category" | "method_family" | "surface_risk";

export interface AuthorityClusterPageData {
  type: AuthorityClusterType;
  slug: string;
  title: string;
  description: string;
  intro: string;

  relatedMethods: string[];
  relatedSurfaces: string[];
  relatedProblems: string[];
  relatedGuides?: string[];
  relatedComparisons?: {
    type: "methods" | "surfaces" | "problems";
    slugs: string[];
  }[];
}

export type AuthorityGuideCategory =
  | "safety"
  | "failure_analysis"
  | "surface_protection"
  | "stain_removal"
  | "chemical_safety"
  | "foundations";

export type AuthorityGuideSection = {
  id: string;
  title: string;
  body?: string;
  paragraphs?: string[];
  bulletPoints?: string[];
};

export type AuthorityGuideLinkGroupResolved = {
  title: string;
  links: AuthorityEntitySummary[];
};

export type AuthorityGuidePageData = {
  slug: string;
  title: string;
  summary: string;
  description?: string;
  category?: AuthorityGuideCategory;
  intro?: string;
  sections: AuthorityGuideSection[];
  relatedMethods: AuthorityEntitySummary[];
  relatedSurfaces: AuthorityEntitySummary[];
  relatedProblems?: AuthorityProblemSummary[];
  linkGroups?: AuthorityGuideLinkGroupResolved[];
};
