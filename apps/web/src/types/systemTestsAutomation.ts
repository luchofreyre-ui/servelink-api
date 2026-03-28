export type SystemTestAutomationJobType = "digest" | "regression_alert" | "triage_generation";

export type SystemTestAutomationJobStatus =
  | "pending"
  | "generated"
  | "sent"
  | "suppressed"
  | "failed";

export type SystemTestAutomationTriggerSource = "schedule" | "manual" | "test";

export type SystemTestsAutomationStatus = {
  schedulerEnabled: boolean;
  digestScheduleDescription: string;
  regressionScheduleDescription: string;
  webhookConfigured: boolean;
  cooldownHours: number;
  digestCooldownHours: number;
  countsLast24h: {
    sent: number;
    suppressed: number;
    failed: number;
    generated: number;
    total: number;
  };
  lastDigestAt: string | null;
  lastRegressionAt: string | null;
};

export type SystemTestsAutomationJobRow = {
  id: string;
  createdAt: string;
  type: SystemTestAutomationJobType;
  status: SystemTestAutomationJobStatus;
  triggerSource: SystemTestAutomationTriggerSource;
  targetRunId: string | null;
  baseRunId: string | null;
  reportKind: string;
  headline: string | null;
  shortSummary: string | null;
  dedupeKey: string | null;
  suppressionReason: string | null;
  generatedAt: string | null;
  sentAt: string | null;
  failureReason: string | null;
  payloadPreview: {
    title: string;
    bodyExcerpt: string;
  };
};

export type SystemTestsAutomationJobsResponse = {
  items: SystemTestsAutomationJobRow[];
};

export type SystemTestsAutomationJobDetail = Omit<SystemTestsAutomationJobRow, "payloadPreview"> & {
  payloadJson: unknown;
};

export type SystemTestsAutomationJobDetailResponse = {
  job: SystemTestsAutomationJobDetail;
};

/** Automation report job (legacy) or pipeline enqueue result (Phase 7A). */
export type SystemTestsAutomationTriggerResponse = {
  jobId?: string;
  pipelineJobId?: string;
  mode?: "queued" | "inline" | "deduped";
  status?: string;
  envelope?: unknown;
  suppressed?: boolean;
  error?: string;
};
