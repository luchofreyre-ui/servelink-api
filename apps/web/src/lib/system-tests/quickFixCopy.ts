import type { SystemTestFamilyListItemApi } from "@/lib/api/systemTestFamilies";
import type { SystemTestIncidentListItemApi } from "@/lib/api/systemTestIncidents";
import type {
  SystemTestFixOpportunity,
  SystemTestResolutionPreview,
} from "@/types/systemTestResolution";
import type { SystemTestsTopProblemItem } from "@/types/systemTests";
import { lifecycleStateLabel } from "@/lib/system-tests/lifecycle";
import { operatorStateLabel } from "@/lib/system-tests/operatorState";

function getBestSummary(preview: SystemTestResolutionPreview | null): string {
  return (
    preview?.topRecommendationSummary ??
    preview?.diagnosisSummary ??
    "No recommendation available."
  );
}

function getWhyLikely(preview: SystemTestResolutionPreview | null): string {
  return preview?.diagnosisSummary ?? "No diagnosis summary available.";
}

function formatCategory(preview: SystemTestResolutionPreview | null): string {
  const c = preview?.category?.trim();
  return c ? c.replace(/_/g, " ") : "Unknown";
}

function formatConfidenceLabel(preview: SystemTestResolutionPreview | null): string {
  return preview?.confidenceLabel?.trim() || "Unspecified";
}

export type FamilyQuickFixInput = Pick<
  SystemTestFamilyListItemApi,
  "id" | "displayTitle" | "resolutionPreview" | "operatorState" | "lifecycle"
>;

export function buildFamilyQuickFixText(family: FamilyQuickFixInput): string {
  const p = family.resolutionPreview;
  return [
    "SYSTEM TEST QUICK FIX",
    "",
    `Family: ${family.displayTitle}`,
    `Category: ${formatCategory(p)}`,
    `Confidence: ${formatConfidenceLabel(p)}`,
    `Lifecycle: ${lifecycleStateLabel(family.lifecycle.lifecycleState)}`,
    `Operator state: ${operatorStateLabel(family.operatorState.state)}`,
    "",
    "Top recommendation:",
    getBestSummary(p),
    "",
    "Why this is likely:",
    getWhyLikely(p),
    "",
    "Open detail:",
    `/admin/system-tests/families/${family.id}`,
  ].join("\n");
}

export type IncidentQuickFixInput = Pick<
  SystemTestIncidentListItemApi,
  | "displayTitle"
  | "leadFamilyId"
  | "resolutionPreview"
  | "familyOperatorState"
  | "familyLifecycle"
  | "leadFamilyTitle"
>;

export function buildIncidentQuickFixText(incident: IncidentQuickFixInput): string {
  const p = incident.resolutionPreview;
  const familyLine = incident.leadFamilyTitle?.trim() || "Unknown";
  const openDetail =
    incident.leadFamilyId ?
      `/admin/system-tests/families/${incident.leadFamilyId}`
    : "No family detail link available.";
  const lifecycleLine = incident.familyLifecycle
    ? lifecycleStateLabel(incident.familyLifecycle.lifecycleState)
    : "Unspecified";
  const opLine = incident.familyOperatorState
    ? operatorStateLabel(incident.familyOperatorState.state)
    : "Unspecified";

  return [
    "SYSTEM TEST QUICK FIX",
    "",
    `Incident: ${incident.displayTitle}`,
    `Linked family: ${familyLine}`,
    `Category: ${formatCategory(p)}`,
    `Confidence: ${formatConfidenceLabel(p)}`,
    `Lifecycle: ${lifecycleLine}`,
    `Operator state: ${opLine}`,
    "",
    "Top recommendation:",
    getBestSummary(p),
    "",
    "Why this is likely:",
    getWhyLikely(p),
    "",
    "Open detail:",
    openDetail,
  ].join("\n");
}

export function buildFixOpportunityQuickFixText(
  item: SystemTestFixOpportunity,
  preview?: SystemTestResolutionPreview | null,
): string {
  const p = preview ?? null;
  const topRec = p ? getBestSummary(p) : (item.topRecommendationSummary?.trim() || "No recommendation available.");
  const why = p ? getWhyLikely(p) : (item.topRecommendationSummary?.trim() || "No diagnosis summary available.");

  const category = item.category?.trim() ? item.category.replace(/_/g, " ") : "Unknown";
  const confidence = item.confidenceLabel?.trim() || "Unspecified";

  return [
    "SYSTEM TEST QUICK FIX",
    "",
    `Family: ${item.title}`,
    `Category: ${category}`,
    `Confidence: ${confidence}`,
    `Lifecycle: ${lifecycleStateLabel(item.lifecycle.lifecycleState)}`,
    `Operator state: ${operatorStateLabel(item.operatorState.state)}`,
    "",
    "Top recommendation:",
    topRec,
    "",
    "Why this is likely:",
    why,
    "",
    "Open detail:",
    `/admin/system-tests/families/${item.familyId}`,
  ].join("\n");
}

export function buildTopIssueQuickFixText(item: SystemTestsTopProblemItem): string {
  const preview = item.resolutionPreview ?? null;
  const title = item.familyTitle?.trim() || item.title;
  const familyId = item.familyId;
  const p = preview;
  return [
    "SYSTEM TEST QUICK FIX",
    "",
    `Family: ${title}`,
    `Category: ${formatCategory(p)}`,
    `Confidence: ${formatConfidenceLabel(p)}`,
    `Lifecycle: ${item.lifecycle ? lifecycleStateLabel(item.lifecycle.lifecycleState) : "Unspecified"}`,
    `Operator state: ${item.operatorState ? operatorStateLabel(item.operatorState.state) : "Unspecified"}`,
    "",
    "Top recommendation:",
    getBestSummary(p),
    "",
    "Why this is likely:",
    getWhyLikely(p),
    "",
    "Open detail:",
    familyId ? `/admin/system-tests/families/${familyId}` : "No family detail link available.",
  ].join("\n");
}
