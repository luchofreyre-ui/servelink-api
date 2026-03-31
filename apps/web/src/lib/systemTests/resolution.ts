import type {
  SystemTestDiagnosis,
  SystemTestDiagnosisCategory,
  SystemTestFixRecommendation,
  SystemTestResolution,
} from "@/types/systemTestResolution";

export function formatDiagnosisConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function getDiagnosisCategoryLabel(category: SystemTestDiagnosisCategory): string {
  switch (category) {
    case "selector_drift":
      return "Selector drift";
    case "timing_issue":
      return "Timing issue";
    case "api_contract_break":
      return "API contract break";
    case "auth_state":
      return "Auth state";
    case "data_dependency":
      return "Data dependency";
    case "ui_regression":
      return "UI regression";
    case "navigation_issue":
      return "Navigation issue";
    case "environment_unavailable":
      return "Environment unavailable";
    case "unknown":
    default:
      return "Unknown";
  }
}

export function buildSystemTestCursorReadyText(
  recommendation: SystemTestFixRecommendation,
): string {
  return recommendation.actions
    .map((action) => {
      return [
        `FILE: ${action.file}`,
        "",
        `CHANGE TYPE: ${action.type}`,
        "",
        "INSTRUCTION:",
        action.instruction,
        "",
        "REASON:",
        action.reason,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

export function buildSystemTestResolutionSummary(resolution: SystemTestResolution): string {
  const diagnosis = resolution.diagnosis;
  const topRecommendation = resolution.recommendations[0];

  return [
    `Diagnosis: ${getDiagnosisCategoryLabel(diagnosis.category)}`,
    `Confidence: ${formatDiagnosisConfidence(diagnosis.confidence)}`,
    "",
    `Root cause: ${diagnosis.rootCause}`,
    "",
    `Summary: ${diagnosis.summary}`,
    ...(topRecommendation
      ? [
          "",
          `Top recommendation: ${topRecommendation.title}`,
          topRecommendation.explanation,
        ]
      : []),
  ].join("\n");
}

export function getDiagnosisToneClasses(category: SystemTestDiagnosisCategory): string {
  switch (category) {
    case "environment_unavailable":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "auth_state":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "api_contract_break":
      return "border-orange-200 bg-orange-50 text-orange-900";
    case "selector_drift":
      return "border-blue-200 bg-blue-50 text-blue-900";
    case "timing_issue":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "data_dependency":
      return "border-cyan-200 bg-cyan-50 text-cyan-900";
    case "navigation_issue":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900";
    case "ui_regression":
      return "border-slate-200 bg-slate-50 text-slate-900";
    case "unknown":
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-900";
  }
}

export function sortDiagnosisSignals(diagnosis: SystemTestDiagnosis) {
  return [...diagnosis.signals].sort((a, b) => a.label.localeCompare(b.label));
}
