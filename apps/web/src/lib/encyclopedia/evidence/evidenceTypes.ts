export type ChemistryClass =
  | "acidic"
  | "alkaline"
  | "neutral"
  | "enzymatic"
  | "solvent";

export type SoilClass =
  | "mineral"
  | "organic"
  | "biofilm"
  | "grease"
  | "residue"
  | "damage";

export interface CleaningProduct {
  name: string;
  brand?: string;
  chemistry: ChemistryClass;
  surfaces: string[];
  avoids: string[];
  reason: string;
}

export interface CleaningMethod {
  tools: string[];
  dwell: string;
  agitation: string;
  rinse: string;
  dry: string;
}

export interface EvidenceRecord {
  surface: string;
  problem: string;

  soilClass: SoilClass;

  recommendedChemistry: ChemistryClass;
  avoidChemistry: ChemistryClass[];

  products: CleaningProduct[];

  method: CleaningMethod;

  whyItWorks: string;
  whyItHappens: string;

  mistakes: string[];

  benchmarks: string[];

  professionalInsights: string[];

  sources: string[];
}
