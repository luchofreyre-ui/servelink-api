// pageTypes.ts

import type { GeneratedPageContent } from "./contentTypes";

export type PageSectionKey =
  | "whatIs"
  | "whyItHappens"
  | "whereItAppears"
  | "canThisBeFixed"
  | "chemistry"
  | "commonMistakes"
  | "professionalMethod"
  | "howToFix"
  | "whatToAvoid"
  | "whatToExpect"
  | "whenToStop"
  | "toolsRequired"
  | "recommendedProducts"
  | "visualDiagnostics"
  | "relatedTopics";

export type PageSection = {
  key: PageSectionKey;
  title: string;
  required: boolean;
};

export type PageMeta = {
  problem: string;
  surface: string;
  intent: string;
  riskLevel: "low" | "medium" | "high";
  needsChemicalExplanation: boolean;
  needsMaterialSpecifics: boolean;
};

export type GeneratedPage = {
  title: string;
  slug: string;
  meta: PageMeta;
  sections: PageSection[];
  content?: GeneratedPageContent;
  internalLinks?: string[];
};
