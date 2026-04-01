export type ResearchSourceType =
  | "manufacturer"
  | "sds"
  | "epa"
  | "retailer"
  | "review"
  | "technical";

export type ProductResearchSource = {
  label: string;
  url: string;
  type: ResearchSourceType;
};

export type ProductResearchSection =
  | "identity"
  | "claims"
  | "chemistry"
  | "safety"
  | "performance"
  | "reviews"
  | "comparisons";

export type CleaningProductResearch = {
  slug: string;

  // IDENTITY / MANUFACTURER
  manufacturerSummary?: string;
  manufacturerClaims?: string[];

  // CHEMISTRY / USE
  activeIngredients?: string[];
  phRange?: string;
  dwellTime?: string;
  rinseGuidance?: string;
  residueNotes?: string;
  fragranceNotes?: string;

  // REGULATORY
  epaRegistered?: boolean;
  epaNumber?: string;

  // SAFETY
  safetyWarnings?: string[];
  incompatibilities?: string[];
  ppeRecommendations?: string[];
  ventilationNotes?: string;

  // PERFORMANCE / INTERPRETATION
  expertAnalysis?: string[];
  commonMisusePatterns?: string[];
  bestAlternatives?: string[];
  useInsteadOf?: string[];
  verdictSummary?: string;

  // REVIEW SYNTHESIS
  reviewHighlights?: string[];
  reviewComplaints?: string[];

  // SOURCES
  sources?: ProductResearchSource[];

  // SYSTEM
  lastReviewed: string;
};
