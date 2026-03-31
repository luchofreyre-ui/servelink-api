import type { SystemTestResolutionDto } from "./dto/system-test-resolution.dto";
import type { SystemTestFamilyOperatorStateDto } from "./system-test-family-operator-state";
import type { SystemTestFamilyLifecycleDto } from "./system-test-family-lifecycle";

export type SystemTestResolutionPreviewPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type SystemTestResolutionPreviewDto = {
  hasResolution: boolean;
  category: string | null;
  confidence: number | null;
  confidenceLabel: string | null;
  topRecommendationSummary: string | null;
  recommendationCount: number;
  diagnosisSummary: string | null;
  highestPriority: SystemTestResolutionPreviewPriority | null;
};

export type SystemTestFixOpportunityDto = {
  familyId: string;
  familyKey: string;
  title: string;
  category: string | null;
  confidence: number | null;
  confidenceLabel: string | null;
  topRecommendationSummary: string | null;
  failureCount: number;
  affectedRunCount: number;
  highestPriority: SystemTestResolutionPreviewPriority | null;
  operatorState: SystemTestFamilyOperatorStateDto;
  lifecycle: SystemTestFamilyLifecycleDto;
};

type ResolutionLike = {
  diagnosis?: Array<{
    category?: string | null;
    confidence?: number | null;
    summary?: string | null;
  }> | null;
  recommendations?: Array<{
    summary?: string | null;
    priority?: string | null;
  }> | null;
} | null;

function normalizeConfidenceLabel(confidence: number | null): string | null {
  if (confidence == null || Number.isNaN(confidence)) {
    return null;
  }

  if (confidence >= 0.85) {
    return "High confidence";
  }

  if (confidence >= 0.6) {
    return "Medium confidence";
  }

  return "Low confidence";
}

function normalizePriority(
  value: string | null | undefined,
): SystemTestResolutionPreviewPriority | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase().trim();

  if (
    normalized === "critical" ||
    normalized === "high" ||
    normalized === "medium" ||
    normalized === "low"
  ) {
    return normalized;
  }

  return null;
}

function compactText(value: string | null | undefined, maxLength = 180): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildSystemTestResolutionPreview(
  resolution: ResolutionLike,
): SystemTestResolutionPreviewDto {
  const primaryDiagnosis = resolution?.diagnosis?.[0] ?? null;
  const primaryRecommendation = resolution?.recommendations?.[0] ?? null;
  const recommendationCount = resolution?.recommendations?.length ?? 0;

  const category = primaryDiagnosis?.category ?? null;
  const confidence = primaryDiagnosis?.confidence ?? null;
  const diagnosisSummary = compactText(primaryDiagnosis?.summary ?? null, 180);
  const topRecommendationSummary = compactText(
    primaryRecommendation?.summary ?? null,
    180,
  );
  const highestPriority = normalizePriority(primaryRecommendation?.priority);

  const hasResolution =
    Boolean(category) ||
    confidence != null ||
    Boolean(diagnosisSummary) ||
    Boolean(topRecommendationSummary) ||
    recommendationCount > 0;

  return {
    hasResolution,
    category,
    confidence,
    confidenceLabel: normalizeConfidenceLabel(confidence),
    topRecommendationSummary,
    recommendationCount,
    diagnosisSummary,
    highestPriority,
  };
}

function resolutionDtoToResolutionLike(dto: SystemTestResolutionDto): NonNullable<ResolutionLike> {
  const d = dto.diagnosis;
  return {
    diagnosis: [
      {
        category: d.category,
        confidence: d.confidence,
        summary: d.summary,
      },
    ],
    recommendations: dto.recommendations.map((r) => {
      const parts = [r.title, r.explanation].filter(Boolean);
      const joined = parts.join(" — ");
      return {
        summary: joined.length > 0 ? joined : null,
        priority: null,
      };
    }),
  };
}

/** Maps Phase 10A `SystemTestResolutionDto` into the preview mapper without duplicating diagnosis logic. */
export function buildSystemTestResolutionPreviewFromDto(
  dto: SystemTestResolutionDto,
): SystemTestResolutionPreviewDto {
  return buildSystemTestResolutionPreview(resolutionDtoToResolutionLike(dto));
}

export function toResolutionPreviewOrNull(
  dto: SystemTestResolutionDto,
): SystemTestResolutionPreviewDto | null {
  const preview = buildSystemTestResolutionPreviewFromDto(dto);
  return preview.hasResolution ? preview : null;
}

function fixOpportunityLifecycleRank(dto: SystemTestFixOpportunityDto): number {
  switch (dto.lifecycle.lifecycleState) {
    case "resurfaced":
      return 5;
    case "new":
      return 4;
    case "recurring":
      return 3;
    case "dormant":
      return 2;
    case "resolved":
      return 1;
    default:
      return 0;
  }
}

function operatorRankForFixOpp(dto: SystemTestFixOpportunityDto): number {
  const s = dto.operatorState.state;
  if (s === "open") return 3;
  if (s === "acknowledged") return 2;
  return 1;
}

export function compareSystemTestFixOpportunities(
  a: SystemTestFixOpportunityDto,
  b: SystemTestFixOpportunityDto,
): number {
  const priorityRank: Record<SystemTestResolutionPreviewPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const lr = fixOpportunityLifecycleRank(b) - fixOpportunityLifecycleRank(a);
  if (lr !== 0) return lr;

  const orank = operatorRankForFixOpp(b) - operatorRankForFixOpp(a);
  if (orank !== 0) return orank;

  const aHasAction = a.topRecommendationSummary ? 1 : 0;
  const bHasAction = b.topRecommendationSummary ? 1 : 0;
  if (aHasAction !== bHasAction) {
    return bHasAction - aHasAction;
  }

  const aConfidence = a.confidence ?? -1;
  const bConfidence = b.confidence ?? -1;
  if (aConfidence !== bConfidence) {
    return bConfidence - aConfidence;
  }

  const aPriority = a.highestPriority ? priorityRank[a.highestPriority] : 0;
  const bPriority = b.highestPriority ? priorityRank[b.highestPriority] : 0;
  if (aPriority !== bPriority) {
    return bPriority - aPriority;
  }

  if (a.affectedRunCount !== b.affectedRunCount) {
    return b.affectedRunCount - a.affectedRunCount;
  }

  if (a.failureCount !== b.failureCount) {
    return b.failureCount - a.failureCount;
  }

  return a.title.localeCompare(b.title);
}
