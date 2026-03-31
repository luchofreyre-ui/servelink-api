import {
  systemTestFamilyLifecycleRank,
  type SystemTestFamilyLifecycleDto,
  type SystemTestFamilyLifecycleState,
} from "./system-test-family-lifecycle";
import { operatorStateSortRank } from "./system-test-family-operator-state";
import type { SystemTestFamilyOperatorStateDto } from "./system-test-family-operator-state";
import type { SystemTestResolutionPreviewDto } from "./system-test-resolution-preview";

export type SystemTestResolutionConfidenceTier = "high" | "medium" | "low";

export type SystemTestFamilyListSortBy =
  | "confidence"
  | "priority"
  | "affectedRuns"
  | "failureCount"
  | "recent"
  | "operatorState"
  | "lifecycle"
  | "regressionRisk";

export type SystemTestIncidentListSortBy =
  | "confidence"
  | "priority"
  | "recent"
  | "operatorState"
  | "lifecycle"
  | "regressionRisk";

export function getConfidenceTier(
  confidence: number | null | undefined,
): SystemTestResolutionConfidenceTier | null {
  if (confidence == null || Number.isNaN(Number(confidence))) {
    return null;
  }
  const c = Number(confidence);
  if (c >= 0.85) return "high";
  if (c >= 0.6) return "medium";
  return "low";
}

export function resolutionPreviewPriorityRank(highestPriority: string | null | undefined): number {
  const p = String(highestPriority ?? "")
    .toLowerCase()
    .trim();
  if (p === "critical") return 4;
  if (p === "high") return 3;
  if (p === "medium") return 2;
  if (p === "low") return 1;
  return 0;
}

export function normalizeDiagnosisCategory(value: string | null | undefined): string | null {
  if (value == null) return null;
  const s = String(value).trim().toLowerCase();
  return s.length ? s : null;
}

export function previewMatchesCategoryFilter(
  preview: SystemTestResolutionPreviewDto | null,
  filterCategory: string,
): boolean {
  const want = normalizeDiagnosisCategory(filterCategory);
  const got = normalizeDiagnosisCategory(preview?.category ?? null);
  if (!want || !got) return false;
  return got === want;
}

export function previewMatchesConfidenceTierFilter(
  preview: SystemTestResolutionPreviewDto | null,
  tier: SystemTestResolutionConfidenceTier,
): boolean {
  return getConfidenceTier(preview?.confidence ?? null) === tier;
}

type FamilyRowForSort = {
  updatedAt: string;
  affectedRunCount: number;
  totalOccurrencesAcrossRuns: number;
  resolutionPreview: SystemTestResolutionPreviewDto | null;
  operatorState: SystemTestFamilyOperatorStateDto;
  lifecycle: SystemTestFamilyLifecycleDto;
};

function compareRegressionRiskFamilyRows(a: FamilyRowForSort, b: FamilyRowForSort): number {
  let cmp =
    systemTestFamilyLifecycleRank(a.lifecycle) - systemTestFamilyLifecycleRank(b.lifecycle);
  if (cmp !== 0) return cmp;
  cmp =
    operatorStateSortRank(a.operatorState.state) - operatorStateSortRank(b.operatorState.state);
  if (cmp !== 0) return cmp;
  const av = a.resolutionPreview?.confidence;
  const bv = b.resolutionPreview?.confidence;
  const an = av != null && !Number.isNaN(Number(av)) ? Number(av) : -1;
  const bn = bv != null && !Number.isNaN(Number(bv)) ? Number(bv) : -1;
  cmp = an - bn;
  if (cmp !== 0) return cmp;
  cmp =
    resolutionPreviewPriorityRank(a.resolutionPreview?.highestPriority) -
    resolutionPreviewPriorityRank(b.resolutionPreview?.highestPriority);
  if (cmp !== 0) return cmp;
  cmp = a.affectedRunCount - b.affectedRunCount;
  if (cmp !== 0) return cmp;
  cmp = a.totalOccurrencesAcrossRuns - b.totalOccurrencesAcrossRuns;
  if (cmp !== 0) return cmp;
  return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
}

export function sortFamilyListRowsInPlace<T extends FamilyRowForSort>(
  rows: T[],
  sortBy: SystemTestFamilyListSortBy,
  direction: "asc" | "desc",
): void {
  const mul = direction === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "confidence": {
        const av = a.resolutionPreview?.confidence;
        const bv = b.resolutionPreview?.confidence;
        const an = av != null && !Number.isNaN(Number(av)) ? Number(av) : -1;
        const bn = bv != null && !Number.isNaN(Number(bv)) ? Number(bv) : -1;
        cmp = an - bn;
        break;
      }
      case "priority":
        cmp =
          resolutionPreviewPriorityRank(a.resolutionPreview?.highestPriority) -
          resolutionPreviewPriorityRank(b.resolutionPreview?.highestPriority);
        break;
      case "affectedRuns":
        cmp = a.affectedRunCount - b.affectedRunCount;
        break;
      case "failureCount":
        cmp = a.totalOccurrencesAcrossRuns - b.totalOccurrencesAcrossRuns;
        break;
      case "operatorState": {
        cmp =
          operatorStateSortRank(a.operatorState.state) -
          operatorStateSortRank(b.operatorState.state);
        break;
      }
      case "lifecycle": {
        cmp =
          systemTestFamilyLifecycleRank(a.lifecycle) -
          systemTestFamilyLifecycleRank(b.lifecycle);
        break;
      }
      case "regressionRisk":
        cmp = compareRegressionRiskFamilyRows(a, b);
        break;
      case "recent":
      default:
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }
    if (cmp !== 0) return cmp * mul;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

type IncidentRowForSort = {
  updatedAt: string;
  resolutionPreview: SystemTestResolutionPreviewDto | null;
  familyOperatorState: SystemTestFamilyOperatorStateDto | null;
  familyLifecycle: SystemTestFamilyLifecycleDto | null;
  affectedFamilyCount: number;
  currentRunFailureCount: number;
};

function incidentLifecycleRank(row: IncidentRowForSort): number {
  return row.familyLifecycle ? systemTestFamilyLifecycleRank(row.familyLifecycle) : 0;
}

function compareRegressionRiskIncidentRows(a: IncidentRowForSort, b: IncidentRowForSort): number {
  let cmp = incidentLifecycleRank(a) - incidentLifecycleRank(b);
  if (cmp !== 0) return cmp;
  cmp =
    operatorStateSortRank(a.familyOperatorState?.state ?? "open") -
    operatorStateSortRank(b.familyOperatorState?.state ?? "open");
  if (cmp !== 0) return cmp;
  const av = a.resolutionPreview?.confidence;
  const bv = b.resolutionPreview?.confidence;
  const an = av != null && !Number.isNaN(Number(av)) ? Number(av) : -1;
  const bn = bv != null && !Number.isNaN(Number(bv)) ? Number(bv) : -1;
  cmp = an - bn;
  if (cmp !== 0) return cmp;
  cmp =
    resolutionPreviewPriorityRank(a.resolutionPreview?.highestPriority) -
    resolutionPreviewPriorityRank(b.resolutionPreview?.highestPriority);
  if (cmp !== 0) return cmp;
  cmp = a.affectedFamilyCount - b.affectedFamilyCount;
  if (cmp !== 0) return cmp;
  cmp = a.currentRunFailureCount - b.currentRunFailureCount;
  if (cmp !== 0) return cmp;
  return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
}

export function sortIncidentListRowsInPlace<T extends IncidentRowForSort>(
  rows: T[],
  sortBy: SystemTestIncidentListSortBy,
  direction: "asc" | "desc",
): void {
  const mul = direction === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "confidence": {
        const av = a.resolutionPreview?.confidence;
        const bv = b.resolutionPreview?.confidence;
        const an = av != null && !Number.isNaN(Number(av)) ? Number(av) : -1;
        const bn = bv != null && !Number.isNaN(Number(bv)) ? Number(bv) : -1;
        cmp = an - bn;
        break;
      }
      case "priority":
        cmp =
          resolutionPreviewPriorityRank(a.resolutionPreview?.highestPriority) -
          resolutionPreviewPriorityRank(b.resolutionPreview?.highestPriority);
        break;
      case "operatorState": {
        cmp =
          operatorStateSortRank(a.familyOperatorState?.state ?? "open") -
          operatorStateSortRank(b.familyOperatorState?.state ?? "open");
        break;
      }
      case "lifecycle": {
        cmp = incidentLifecycleRank(a) - incidentLifecycleRank(b);
        break;
      }
      case "regressionRisk":
        cmp = compareRegressionRiskIncidentRows(a, b);
        break;
      case "recent":
      default:
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }
    if (cmp !== 0) return cmp * mul;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function parseShowDismissedParam(raw: string | undefined): boolean {
  if (raw == null || raw === "") return false;
  const x = String(raw).toLowerCase().trim();
  return x === "true" || x === "1" || x === "yes";
}

export function parseConfidenceTierParam(
  raw: string | undefined,
): SystemTestResolutionConfidenceTier | undefined {
  if (!raw) return undefined;
  const x = raw.toLowerCase().trim();
  if (x === "high" || x === "medium" || x === "low") return x;
  return undefined;
}

export function parseSortDirectionParam(raw: string | undefined): "asc" | "desc" {
  if (raw?.toLowerCase().trim() === "asc") return "asc";
  return "desc";
}

export function parseFamilyListSortBy(raw: string | undefined): SystemTestFamilyListSortBy {
  const x = raw?.toLowerCase().trim();
  switch (x) {
    case "confidence":
      return "confidence";
    case "priority":
      return "priority";
    case "affectedruns":
      return "affectedRuns";
    case "failurecount":
      return "failureCount";
    case "recent":
      return "recent";
    case "operatorstate":
      return "operatorState";
    case "lifecycle":
      return "lifecycle";
    case "regressionrisk":
      return "regressionRisk";
    default:
      return "recent";
  }
}

export function parseIncidentListSortBy(raw: string | undefined): SystemTestIncidentListSortBy {
  const x = raw?.toLowerCase().trim();
  if (
    x === "confidence" ||
    x === "priority" ||
    x === "recent" ||
    x === "operatorstate" ||
    x === "lifecycle" ||
    x === "regressionrisk"
  ) {
    if (x === "operatorstate") return "operatorState";
    if (x === "regressionrisk") return "regressionRisk";
    return x;
  }
  return "recent";
}

export function parseLifecycleStateParam(
  raw: string | undefined,
): SystemTestFamilyLifecycleState | undefined {
  const x = raw?.toLowerCase().trim();
  if (
    x === "new" ||
    x === "recurring" ||
    x === "resurfaced" ||
    x === "dormant" ||
    x === "resolved"
  ) {
    return x;
  }
  return undefined;
}

/** Default true when param omitted. */
export function parseIncludeDormantParam(raw: string | undefined): boolean {
  if (raw == null || raw === "") return true;
  return parseShowDismissedParam(raw);
}

/** Default false when param omitted. */
export function parseIncludeResolvedParam(raw: string | undefined): boolean {
  if (raw == null || raw === "") return false;
  return parseShowDismissedParam(raw);
}
