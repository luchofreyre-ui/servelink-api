export type DispatchExceptionNotificationReason =
  | "new_unassigned_critical"
  | "sla_due_soon"
  | "sla_overdue"
  | "reopened"
  | "validation_failed";

export interface DispatchExceptionNotificationCandidate {
  dispatchExceptionKey: string;
  reason: DispatchExceptionNotificationReason;
  priority: string;
  status: string;
  ownerUserId: string | null;
  slaDueAt: string | null;
  reopenCount: number;
}
