export type PageSectionKey =
  | "whatIs"
  | "whyItHappens"
  | "whereItAppears"
  | "howToFix"
  | "whatToAvoid"
  | "whatToExpect";

/** Canonical snapshot aligned with apps/web encyclopedia pipeline. */
export type CanonicalPageSnapshot = {
  title: string;
  slug: string;
  problem: string;
  surface: string;
  intent: string;
  riskLevel: "low" | "medium" | "high";
  sections: Array<{ key: string; title: string; content: string }>;
  advancedNotes?: string;
  internalLinks?: string[];
};
