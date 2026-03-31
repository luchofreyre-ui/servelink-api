import type { SystemTestDiagnosisCategory } from "./dto/system-test-resolution.dto";

export interface SystemTestsDiagnosisInput {
  familyId: string;
  title: string;
  fingerprint?: string | null;
  failureMessages: string[];
  stackTraces: string[];
  filePaths: string[];
  artifactTexts: string[];
}

export interface SystemTestsDiagnosisSignal {
  code: string;
  label: string;
  matchedText?: string | null;
}

export interface SystemTestsDiagnosisResult {
  familyId: string;
  category: SystemTestDiagnosisCategory;
  rootCause: string;
  confidence: number;
  summary: string;
  signals: SystemTestsDiagnosisSignal[];
}

export interface SystemTestsFixAction {
  type: "code_change" | "test_update" | "config_change" | "runbook";
  file: string;
  instruction: string;
  reason: string;
}

export interface SystemTestsFixRecommendation {
  familyId: string;
  title: string;
  explanation: string;
  cursorReady: boolean;
  actions: SystemTestsFixAction[];
}
