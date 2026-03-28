import type { SystemTestPipelineTriggerSource } from "@prisma/client";

/** Stored in SystemTestPipelineJob.payloadJson for stage === analysis */
export type SystemTestPipelineAnalysisPayload = {
  force: boolean;
  skipChildAutomation: boolean;
};

/** Stored in SystemTestPipelineJob.payloadJson for stage === automation */
export type SystemTestPipelineAutomationPayload = {
  reason: "analysis_completed" | "manual" | "scheduled";
  evaluateRegression: boolean;
  generateDigest: boolean;
  generateTriage: boolean;
  /** Passed to SystemTestAutomationService (schedule | manual) */
  automationTriggerSource: "schedule" | "manual";
};

export type EnqueueAnalysisOpts = {
  force?: boolean;
  triggerSource: SystemTestPipelineTriggerSource;
  skipChildAutomation?: boolean;
};

export type EnqueueAutomationOpts = {
  runId?: string | null;
  reason: SystemTestPipelineAutomationPayload["reason"];
  evaluateRegression?: boolean;
  generateDigest?: boolean;
  generateTriage?: boolean;
  /** Pipeline trigger (stored on row); maps to automationTriggerSource */
  triggerSource: SystemTestPipelineTriggerSource;
  parentJobId?: string | null;
};

export function toAutomationTriggerSource(
  t: SystemTestPipelineTriggerSource,
): "schedule" | "manual" {
  return t === "schedule" ? "schedule" : "manual";
}
