export type KnowledgeEntityKind = "soil" | "surface" | "method" | "tool";

export type RiskLevel = "low" | "low-medium" | "medium" | "medium-high" | "high";

export type SurfacePorosity =
  | "non-porous"
  | "low-porosity"
  | "medium-porosity"
  | "high-porosity"
  | "variable";

export type SurfaceSensitivity =
  | "acid-sensitive"
  | "alkali-sensitive"
  | "abrasion-sensitive"
  | "chemical-sensitive"
  | "moisture-sensitive"
  | "heat-sensitive"
  | "finish-sensitive"
  | "stain-prone";

export type MethodChemistryClass =
  | "acidic"
  | "alkaline"
  | "neutral"
  | "enzyme"
  | "oxidizing"
  | "solvent"
  | "mechanical"
  | "thermal"
  | "absorbent";

export type ToolCategory =
  | "towel"
  | "brush"
  | "pad"
  | "scraper"
  | "extractor"
  | "squeegee"
  | "sprayer"
  | "vacuum"
  | "steam-machine"
  | "mop"
  | "bucket"
  | "applicator";

export type KnowledgeEntityBase = {
  slug: string;
  name: string;
  shortName?: string;
  kind: KnowledgeEntityKind;
  summary: string;
  aliases: string[];
  relatedArticleSlugs: string[];
  relatedServiceSlugs: string[];
};

export type SoilEntity = KnowledgeEntityBase & {
  kind: "soil";
  category: string;
  composition: string[];
  formsFrom: string[];
  commonLocations: string[];
  affectedSurfaceSlugs: string[];
  recommendedMethodSlugs: string[];
  avoidMethodSlugs: string[];
  recommendedToolSlugs: string[];
  avoidToolSlugs: string[];
  visualSignals: string[];
  safetyNotes: string[];
  professionalEscalationThresholds: string[];
  riskLevel: RiskLevel;
};

export type SurfaceEntity = KnowledgeEntityBase & {
  kind: "surface";
  materialFamily: string;
  finishTypes: string[];
  porosity: SurfacePorosity;
  sensitivities: SurfaceSensitivity[];
  safeMethodSlugs: string[];
  avoidMethodSlugs: string[];
  safeToolSlugs: string[];
  avoidToolSlugs: string[];
  commonProblemSlugs: string[];
  maintenancePrinciples: string[];
  safetyNotes: string[];
};

export type MethodEntity = KnowledgeEntityBase & {
  kind: "method";
  chemistryClass: MethodChemistryClass;
  mechanism: string[];
  idealForSoilSlugs: string[];
  compatibleSurfaceSlugs: string[];
  incompatibleSurfaceSlugs: string[];
  recommendedToolSlugs: string[];
  dwellTimeGuidance: string[];
  moistureControlGuidance: string[];
  residueConsiderations: string[];
  safetyNotes: string[];
  professionalEscalationThresholds: string[];
};

export type ToolEntity = KnowledgeEntityBase & {
  kind: "tool";
  category: ToolCategory;
  materials: string[];
  idealForSoilSlugs: string[];
  idealForSurfaceSlugs: string[];
  notRecommendedForSurfaceSlugs: string[];
  usePrinciples: string[];
  careInstructions: string[];
  safetyNotes: string[];
};

export type KnowledgeEntity = SoilEntity | SurfaceEntity | MethodEntity | ToolEntity;

export type EntitySlugMap = {
  soils: string[];
  surfaces: string[];
  methods: string[];
  tools: string[];
};
