export type SystemTestIncidentActionStatus =
  | "open"
  | "investigating"
  | "fixing"
  | "validating"
  | "resolved"
  | "dismissed";

export type SystemTestIncidentActionPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type SystemTestIncidentStepExecutionStatus =
  | "pending"
  | "in_progress"
  | "completed";

export type SystemTestIncidentEventType =
  | "action_created"
  | "assigned"
  | "unassigned"
  | "priority_changed"
  | "status_changed"
  | "note_added"
  | "validation_passed"
  | "validation_failed"
  | "reopened"
  | "incident_seen"
  | "sla_started"
  | "sla_due_soon"
  | "sla_overdue"
  | "escalation_ready"
  | "notification_queued";

export type IncidentValidationState = "pending" | "passed" | "failed";

export interface SystemTestIncidentActionListItem {
  incidentKey: string;
  status: SystemTestIncidentActionStatus;
  priority: SystemTestIncidentActionPriority;
  ownerUserId: string | null;
  ownerName: string | null;
  lastSeenRunId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  title: string | null;
  summary: string | null;
  severity: string | null;
  runId: string | null;
  totalSteps: number;
  completedSteps: number;
  noteCount: number;
  validationState: IncidentValidationState | null;
  validationLastCheckedAt: string | null;
  validationLastPassedAt: string | null;
  validationLastFailedAt: string | null;
  reopenedAt: string | null;
  reopenCount: number;
  slaPolicyHours: number | null;
  slaStartedAt: string | null;
  slaDueAt: string | null;
  slaStatus: string | null;
  slaLastEvaluatedAt: string | null;
  escalationReadyAt: string | null;
}

export interface SystemTestIncidentStepExecution {
  stepIndex: number;
  status: SystemTestIncidentStepExecutionStatus;
  notes: string | null;
  updatedAt: string;
}

export interface SystemTestIncidentEvent {
  id: string;
  type: SystemTestIncidentEventType;
  actorUserId: string | null;
  actorName: string | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface SystemTestIncidentNote {
  id: string;
  userId: string | null;
  userName: string | null;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemTestIncidentActionDetail {
  incidentKey: string;
  status: SystemTestIncidentActionStatus;
  priority: SystemTestIncidentActionPriority;
  ownerUserId: string | null;
  ownerName: string | null;
  lastSeenRunId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  incidentSummary: string | null;
  incidentSeverity: string | null;
  incidentTitle: string | null;
  currentRunId: string | null;
  fixTrackPrimaryArea: string | null;
  recommendedSteps: string[];
  validationSteps: string[];
  stepExecutions: SystemTestIncidentStepExecution[];
  notes: SystemTestIncidentNote[];
  events: SystemTestIncidentEvent[];
  validationState: IncidentValidationState | null;
  validationLastCheckedAt: string | null;
  validationLastPassedAt: string | null;
  validationLastFailedAt: string | null;
  reopenedAt: string | null;
  reopenCount: number;
  isResolvedAwaitingValidation: boolean;
  slaPolicyHours: number | null;
  slaStartedAt: string | null;
  slaDueAt: string | null;
  slaStatus: string | null;
  slaLastEvaluatedAt: string | null;
  escalationReadyAt: string | null;
  isOverdue: boolean;
  isDueSoon: boolean;
}

export interface ListSystemTestIncidentActionsResponse {
  items: SystemTestIncidentActionListItem[];
  count: number;
}
