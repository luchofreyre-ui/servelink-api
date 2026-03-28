export type DispatchExceptionActionStatus =
  | "open"
  | "investigating"
  | "waiting"
  | "resolved"
  | "dismissed";

export type DispatchExceptionActionPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type DispatchExceptionActionEventType =
  | "action_created"
  | "assigned"
  | "unassigned"
  | "priority_changed"
  | "status_changed"
  | "note_added"
  | "exception_seen"
  | "validation_passed"
  | "validation_failed"
  | "reopened"
  | "sla_started"
  | "sla_due_soon"
  | "sla_overdue"
  | "escalation_ready"
  | "notification_queued";

export type DispatchExceptionValidationState = "pending" | "passed" | "failed";

export interface DispatchExceptionActionListItem {
  dispatchExceptionKey: string;
  bookingId: string;
  foId: string | null;
  status: DispatchExceptionActionStatus;
  priority: DispatchExceptionActionPriority;
  ownerUserId: string | null;
  ownerName: string | null;
  lastSeenAt: string | null;
  lastSeenExceptionId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  exceptionTitle: string | null;
  exceptionSummary: string | null;
  exceptionReasons: string[];
  latestDecisionStatus: string | null;
  severity: string | null;
  noteCount: number;
  validationState: DispatchExceptionValidationState | null;
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

export interface DispatchExceptionActionEvent {
  id: string;
  type: DispatchExceptionActionEventType;
  actorUserId: string | null;
  actorName: string | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface DispatchExceptionActionNote {
  id: string;
  userId: string | null;
  userName: string | null;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchExceptionActionDetail {
  dispatchExceptionKey: string;
  bookingId: string;
  foId: string | null;
  status: DispatchExceptionActionStatus;
  priority: DispatchExceptionActionPriority;
  ownerUserId: string | null;
  ownerName: string | null;
  lastSeenAt: string | null;
  lastSeenExceptionId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  exceptionTitle: string | null;
  exceptionSummary: string | null;
  exceptionReasons: string[];
  latestDecisionStatus: string | null;
  latestTrigger: string | null;
  latestTriggerDetail: string | null;
  recommendedAction: string | null;
  severity: string | null;
  metadataSnapshot: Record<string, unknown> | null;
  notes: DispatchExceptionActionNote[];
  events: DispatchExceptionActionEvent[];
  validationState: DispatchExceptionValidationState | null;
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

export interface ListDispatchExceptionActionsResponse {
  items: DispatchExceptionActionListItem[];
  count: number;
}

export function buildDispatchExceptionKeyFromBookingId(bookingId: string): string {
  return `dex_v1_${bookingId}`;
}
