export type SystemTestDiagnosisCategory =
  | "selector_drift"
  | "timing_issue"
  | "api_contract_break"
  | "auth_state"
  | "data_dependency"
  | "ui_regression"
  | "navigation_issue"
  | "environment_unavailable"
  | "unknown";

export interface SystemTestDiagnosisSignalDto {
  code: string;
  label: string;
  matchedText?: string | null;
}

export interface SystemTestDiagnosisDto {
  familyId: string;
  category: SystemTestDiagnosisCategory;
  rootCause: string;
  confidence: number;
  summary: string;
  signals: SystemTestDiagnosisSignalDto[];
}

export interface SystemTestFixActionDto {
  type: "code_change" | "test_update" | "config_change" | "runbook";
  file: string;
  instruction: string;
  reason: string;
}

export interface SystemTestFixRecommendationDto {
  familyId: string;
  title: string;
  explanation: string;
  cursorReady: boolean;
  actions: SystemTestFixActionDto[];
}

export interface SystemTestResolutionDto {
  diagnosis: SystemTestDiagnosisDto;
  recommendations: SystemTestFixRecommendationDto[];
}
