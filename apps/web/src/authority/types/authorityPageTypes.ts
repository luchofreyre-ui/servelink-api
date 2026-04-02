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
  /** Optional second hero line under the main summary (diagnostic framing). */
  heroSubline?: string;
  /** Featured-snippet style direct answer; falls back to a trimmed “what it usually is” if omitted. */
  quickAnswer?: string;
  category: AuthorityProblemCategory;
  symptoms: string[];
  causes: string[];
  whatItUsuallyIs: string;
  whyItHappens: string;
  commonOn: string;
  bestMethods: string;
  avoidMethods: string;
  /** Mindset block before methods; falls back to a shared default when omitted. */
  beforeYouClean?: string;
  /** Short human voice lines (2–4) placed after key sections; optional per problem. */
  diagnosticVoiceLines?: string[];
  recommendedTools: AuthorityToolSummary[];
  recommendedChemicals: AuthorityChemicalSummary[];
  commonMistakes: string[];
  whenItFails: string;
  whenToEscalate: string;
  relatedProblems: AuthorityProblemSummary[];
  relatedMethods: AuthorityEntitySummary[];
  relatedSurfaces: AuthorityEntitySummary[];
  /** When set, drives “best products” scenarios instead of only graph surface slugs. */
  productScenarios?: { problem: string; surface: string }[];
  /** Quick routing at the top of the problem hub. */
  decisionShortcuts?: { label: string; body: string; productSlugs?: string[] }[];
  /** Extra “best by surface” lines (e.g. cooktops not in the authority surface graph). */
  bestBySurfaceExtras?: { line: string; href?: string }[];
};

export type AuthorityComparisonType =
  | "method_comparison"
  | "surface_comparison"
  | "problem_comparison"
  | "product_comparison";

export interface AuthorityComparisonRow {
  label: string;
  leftValue: string;
  rightValue: string;
}

export interface AuthorityProductScenarioWinner {
  scenarioLabel: string;
  playbookHref: string;
  winnerSlug: string;
  winnerName: string;
  runnerUp?: string;
  note?: string;
}

export interface AuthorityComparisonPageData {
  type: AuthorityComparisonType;
  slug: string;

  leftSlug: string;
  rightSlug: string;

  title: string;
  description: string;
  intro: string;
  /** 1–2 sentence direct answer for snippets and summaries. */
  quickAnswer?: string;

  rows: AuthorityComparisonRow[];

  relatedMethods?: string[];
  relatedSurfaces?: string[];
  relatedProblems?: string[];

  /** Product vs product: who wins on shared playbook scenarios. */
  productScenarioWinners?: AuthorityProductScenarioWinner[];

  /** Product comparison: first scenario row with a surface + problem playbook (authority slugs). */
  topSharedProblemSlug?: string;
  topSharedSurfaceSlug?: string;

  /** When each SKU is the right tool—and when neither is. */
  notInterchangeable?: {
    leftWins: string;
    rightWins: string;
    bothFail: string;
  };

  /** Fast routing without re-reading the full table. */
  quickDecision?: string[];

  /** Typical misuse pattern (expert framing). */
  commonMistake?: string;

  /** When to leave this comparison and pick a third chemistry or problem hub. */
  whenNeitherWorks?: string;
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
  | "foundations"
  | "anti_pattern";

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
  /** Optional snippet-first answer; anti-pattern pages use intro/summary as fallback when unset. */
  quickAnswer?: string;
  /** Anti-pattern: authority problem slug for product recommendations (e.g. `grease-buildup`). */
  primaryProblemSlug?: string;
  sections: AuthorityGuideSection[];
  relatedMethods: AuthorityEntitySummary[];
  relatedSurfaces: AuthorityEntitySummary[];
  relatedProblems?: AuthorityProblemSummary[];
  linkGroups?: AuthorityGuideLinkGroupResolved[];
};
