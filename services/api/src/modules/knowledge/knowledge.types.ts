export type KnowledgeSurfaceId =
  | "glass_shower_door"
  | "tile"
  | "grout"
  | "stainless_steel"
  | "stovetop"
  | "granite_countertop"
  | "hardwood_floor"
  | "baseboard"
  | "toilet_bowl"
  | "sink_faucet"
  | "microwave_interior";

export type KnowledgeProblemId =
  | "soap_scum"
  | "mildew"
  | "grease"
  | "food_residue"
  | "dirt_buildup"
  | "dust_buildup"
  | "mineral_scale"
  | "hard_water_spots";

export type KnowledgeSeverity = "light" | "medium" | "heavy";

export type KnowledgeMethodId =
  | "acidic_descaling"
  | "targeted_degreasing"
  | "controlled_agitation"
  | "gentle_food_lift"
  | "low_moisture_detailing"
  | "disinfecting_bowl_descaling"
  | "spot_descaling";

export type KnowledgeToolId =
  | "non_scratch_pad"
  | "grout_brush"
  | "detail_brush"
  | "microfiber_towel"
  | "scraper_non_metal"
  | "toilet_bowl_brush"
  | "soft_applicator_pad"
  | "vacuum_soft_brush"
  | "flat_mop";

export type KnowledgeChemicalId =
  | "acidic_scale_remover"
  | "alkaline_degreaser"
  | "neutral_surface_cleaner"
  | "peroxide_mildew_treatment"
  | "disinfecting_bathroom_cleaner";

export type KnowledgeScenarioId =
  | "glass_shower_door_soap_scum_light"
  | "glass_shower_door_soap_scum_heavy"
  | "tile_soap_scum_medium"
  | "grout_mildew_medium"
  | "stainless_steel_grease_medium"
  | "stovetop_grease_heavy"
  | "granite_countertop_food_residue_light"
  | "hardwood_floor_dirt_buildup_medium"
  | "baseboard_dust_buildup_medium"
  | "toilet_bowl_mineral_scale_heavy"
  | "sink_faucet_hard_water_spots_medium"
  | "microwave_interior_grease_medium";

export interface KnowledgeSurfaceDefinition {
  id: KnowledgeSurfaceId;
  label: string;
  shortDescription: string;
}

export interface KnowledgeProblemDefinition {
  id: KnowledgeProblemId;
  label: string;
  shortDescription: string;
}

export interface KnowledgeMethodDefinition {
  id: KnowledgeMethodId;
  label: string;
  shortWhyItWorks: string;
}

export interface KnowledgeToolDefinition {
  id: KnowledgeToolId;
  label: string;
  purpose: string;
}

export interface KnowledgeChemicalDefinition {
  id: KnowledgeChemicalId;
  label: string;
  category: string;
  shortWhyItWorks: string;
  safetyNotes: string[];
}

export interface KnowledgeQuickSolveScenario {
  id: KnowledgeScenarioId;
  surfaceId: KnowledgeSurfaceId;
  problemId: KnowledgeProblemId;
  severity: KnowledgeSeverity;
  title: string;
  summary: string;
  recommendedMethodId: KnowledgeMethodId;
  toolIds: KnowledgeToolId[];
  chemicalIds: KnowledgeChemicalId[];
  steps: string[];
  warnings: string[];
  commonMistakes: string[];
  whenToEscalate: string[];
  estimatedMinutesMin: number;
  estimatedMinutesMax: number;
  foNotes: string[];
  seoSlug?: string;
}

export interface KnowledgeQuickSolveInput {
  surfaceId: KnowledgeSurfaceId;
  problemId: KnowledgeProblemId;
  severity: KnowledgeSeverity;
}

export interface KnowledgeQuickSolveResult {
  input: KnowledgeQuickSolveInput;
  surface: KnowledgeSurfaceDefinition;
  problem: KnowledgeProblemDefinition;
  scenario: {
    id: KnowledgeScenarioId;
    title: string;
    summary: string;
    estimatedMinutesMin: number;
    estimatedMinutesMax: number;
    steps: string[];
    warnings: string[];
    commonMistakes: string[];
    whenToEscalate: string[];
    foNotes: string[];
  };
  method: KnowledgeMethodDefinition;
  tools: KnowledgeToolDefinition[];
  chemicals: KnowledgeChemicalDefinition[];
}
