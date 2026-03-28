export type SystemTestPipelineJobStage = "analysis" | "automation";

export type SystemTestPipelineJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "retrying"
  | "dead";

export type SystemTestPipelineTriggerSource =
  | "ingestion"
  | "manual"
  | "schedule"
  | "reanalysis";

export type SystemTestPipelineJobRow = {
  id: string;
  createdAt: string;
  updatedAt: string;
  runId: string | null;
  stage: SystemTestPipelineJobStage;
  status: SystemTestPipelineJobStatus;
  triggerSource: SystemTestPipelineTriggerSource;
  attemptCount: number;
  maxAttempts: number;
  queueJobId: string | null;
  parentJobId: string | null;
  dedupeKey: string | null;
  payloadJson: unknown;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type SystemTestsPipelineJobsResponse = {
  items: SystemTestPipelineJobRow[];
};

export type SystemTestsPipelineJobsByRunResponse = {
  runId: string;
  items: SystemTestPipelineJobRow[];
};

export type SystemTestsPipelineEnqueueResponse = {
  pipelineJobId: string;
  mode: "queued" | "inline" | "deduped";
};
