// evidenceTypes.ts

export type EvidenceSourceType =
  | "cleaning-principle"
  | "chemical-rationale"
  | "tool-rationale"
  | "material-safety"
  | "maintenance-guidance";

export type EvidenceItem = {
  id: string;
  sourceType: EvidenceSourceType;
  title: string;
  summary: string;
  appliesToProblems?: string[];
  appliesToMaterials?: string[];
  appliesToSurfaces?: string[];
  tags: string[];
};

export type PageEvidenceBundle = {
  title: string;
  slug: string;
  evidence: EvidenceItem[];
};
