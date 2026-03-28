/**
 * Normalized delivery envelope for webhook / email / Slack later (Phase 5A).
 * Stored inside job payloadJson and used for previews.
 */
export type SystemTestDeliveryChannel = "webhook" | "email" | "internal_log";

export interface SystemTestDeliveryPayload {
  channel: SystemTestDeliveryChannel;
  subject: string;
  title: string;
  bodyText: string;
  structuredSummary: Record<string, unknown>;
  severity: "info" | "warning" | "critical";
  dedupeKey: string;
}

export interface RegressionAlertStructuredPayload {
  title: string;
  severity: "info" | "warning" | "critical";
  targetRunId: string;
  baseRunId: string;
  headline: string;
  summaryBullets: string[];
  topNewFailures: Array<{ key: string; title: string; file: string; shortMessage: string }>;
  topHighPriorityReruns: Array<{ key: string; title: string; file: string; score: number; reasons: string[] }>;
  comparePath: string;
  dashboardPath: string;
  runDetailPath: string;
  generatedAt: string;
}

export interface DigestStructuredPayload {
  latestRunId: string;
  latestStatus: string;
  passRatePct: string;
  failedCount: number;
  durationMs: number | null;
  deltaVsPrevious: {
    passRateDeltaPct: string;
    failedDelta: number;
    previousRunId: string | null;
  };
  topChanges: string[];
  topRerunPriorities: Array<{ title: string; file: string; score: number }>;
  unstableFiles: Array<{ file: string; failedRunsInWindow: number; windowSize: number }>;
  links: {
    dashboard: string;
    compare: string | null;
    runDetail: string;
  };
  generatedAt: string;
}

export interface AutomationJobPayloadEnvelope {
  version: 1;
  delivery: SystemTestDeliveryPayload;
  regression?: RegressionAlertStructuredPayload;
  digest?: DigestStructuredPayload;
  triage?: { bodyText: string; runId: string; generatedAt: string };
}
