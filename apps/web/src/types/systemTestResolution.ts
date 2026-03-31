/** Mirrors API resolution DTOs (family detail `/resolution` + Phase 10C list previews). */

export type SystemTestFamilyLifecycleState =
  | "new"
  | "recurring"
  | "resurfaced"
  | "dormant"
  | "resolved";

export type SystemTestFamilyLifecycle = {
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  seenInRunCount: number;
  recentRunCountConsidered: number;
  seenInLatestRun: boolean;
  seenInPreviousRun: boolean;
  consecutiveRunCount: number;
  runsSinceLastSeen: number | null;
  lifecycleState: SystemTestFamilyLifecycleState;
};

export type SystemTestFamilyOperatorStateValue =
  | "open"
  | "acknowledged"
  | "dismissed";

export type SystemTestFamilyOperatorState = {
  state: SystemTestFamilyOperatorStateValue;
  updatedAt: string | null;
  updatedByUserId: string | null;
  note: string | null;
};

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

export interface SystemTestDiagnosisSignal {
  code: string;
  label: string;
  matchedText?: string | null;
}

export interface SystemTestDiagnosis {
  familyId: string;
  category: SystemTestDiagnosisCategory;
  rootCause: string;
  confidence: number;
  summary: string;
  signals: SystemTestDiagnosisSignal[];
}

export interface SystemTestFixAction {
  type: "code_change" | "test_update" | "config_change" | "runbook";
  file: string;
  instruction: string;
  reason: string;
}

export interface SystemTestFixRecommendation {
  familyId: string;
  title: string;
  explanation: string;
  cursorReady: boolean;
  actions: SystemTestFixAction[];
}

export interface SystemTestResolution {
  diagnosis: SystemTestDiagnosis;
  recommendations: SystemTestFixRecommendation[];
}

export type SystemTestResolutionPreviewPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type SystemTestResolutionPreview = {
  hasResolution: boolean;
  category: string | null;
  confidence: number | null;
  confidenceLabel: string | null;
  topRecommendationSummary: string | null;
  recommendationCount: number;
  diagnosisSummary: string | null;
  highestPriority: SystemTestResolutionPreviewPriority | null;
};

export type SystemTestFixOpportunity = {
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
  operatorState: SystemTestFamilyOperatorState;
  lifecycle: SystemTestFamilyLifecycle;
};
