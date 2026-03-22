import type { BlueprintSectionKey, KnowledgePageBlueprintType } from "../blueprints";
import type { KnowledgeEntityKind } from "../entities";

export type EvidenceStrength = "missing" | "weak" | "adequate" | "strong";

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationCode =
  | "MISSING_REQUIRED_SECTION"
  | "EMPTY_REQUIRED_SECTION"
  | "MISSING_EVIDENCE_FIELD"
  | "WEAK_EVIDENCE_FIELD"
  | "MISSING_FAQ_COUNT"
  | "MISSING_MISTAKE_COUNT"
  | "MISSING_TAKEAWAY_COUNT"
  | "MISSING_STEP_COUNT"
  | "MISSING_RELATED_SERVICES"
  | "MISSING_RELATED_GUIDES"
  | "MISSING_PROFESSIONAL_CALLOUT"
  | "MISSING_SAFETY_SECTION"
  | "MISSING_EVIDENCE_EXPLANATION"
  | "MISSING_RELATIONSHIP_LINKS"
  | "WEAK_EDITORIAL_DEPTH"
  | "BLUEPRINT_MISMATCH";

export type KnowledgeEvidenceFieldKey =
  | "soil-types"
  | "surface-types"
  | "chemistry-class"
  | "tool-types"
  | "towel-types"
  | "dwell-time-guidance"
  | "moisture-control-guidance"
  | "avoid-on-surfaces"
  | "safety-notes"
  | "professional-escalation-threshold"
  | "why-this-works"
  | "residue-considerations";

export type KnowledgeEvidenceField = {
  key: KnowledgeEvidenceFieldKey;
  label: string;
  description: string;
  required: boolean;
};

export type KnowledgeEvidenceRecord = {
  soilTypes: string[];
  surfaceTypes: string[];
  chemistryClasses: string[];
  toolTypes: string[];
  towelTypes: string[];
  dwellTimeGuidance: string[];
  moistureControlGuidance: string[];
  avoidOnSurfaces: string[];
  safetyNotes: string[];
  professionalEscalationThresholds: string[];
  whyThisWorks: string[];
  residueConsiderations: string[];
};

export type KnowledgeDraftSection = {
  key: BlueprintSectionKey;
  title: string;
  body: string;
  items?: string[];
};

export type KnowledgeDraftRelationships = {
  soilSlugs: string[];
  surfaceSlugs: string[];
  methodSlugs: string[];
  toolSlugs: string[];
  articleSlugs: string[];
  serviceSlugs: string[];
  locationSlugs: string[];
};

export type KnowledgeDraftValidationInput = {
  pageType: KnowledgePageBlueprintType;
  title: string;
  summary?: string;
  targetKeyword?: string;
  primaryEntityKind?: KnowledgeEntityKind;
  primaryEntitySlug?: string;
  secondaryEntitySlug?: string;
  sections: KnowledgeDraftSection[];
  evidence: KnowledgeEvidenceRecord;
  relationships: KnowledgeDraftRelationships;
};

export type ValidationIssue = {
  code: ValidationCode;
  severity: ValidationSeverity;
  message: string;
  sectionKey?: BlueprintSectionKey;
  evidenceFieldKey?: KnowledgeEvidenceFieldKey;
};

export type StructureValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

export type EvidenceFieldAssessment = {
  key: KnowledgeEvidenceFieldKey;
  strength: EvidenceStrength;
  count: number;
};

export type EvidenceValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
  fieldAssessments: EvidenceFieldAssessment[];
};

export type EditorialDepthMetrics = {
  faqCount: number;
  mistakeCount: number;
  takeawayCount: number;
  stepCount: number;
  totalNonEmptySections: number;
};

export type EditorialDepthValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
  metrics: EditorialDepthMetrics;
};

export type RelationshipValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

export type ValidationCategoryScore = {
  earned: number;
  possible: number;
};

export type DraftQualityScoreBreakdown = {
  structure: ValidationCategoryScore;
  evidence: ValidationCategoryScore;
  editorialDepth: ValidationCategoryScore;
  relationships: ValidationCategoryScore;
};

export type DraftQualityScore = {
  total: number;
  breakdown: DraftQualityScoreBreakdown;
  rating: "reject" | "revise" | "publish-ready";
};

export type KnowledgeDraftValidationReport = {
  valid: boolean;
  pageType: KnowledgePageBlueprintType;
  issues: ValidationIssue[];
  structure: StructureValidationResult;
  evidence: EvidenceValidationResult;
  editorialDepth: EditorialDepthValidationResult;
  relationships: RelationshipValidationResult;
  score: DraftQualityScore;
};
