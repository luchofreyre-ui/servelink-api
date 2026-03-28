export type SystemTestIncidentNotificationReason =
  | "new_unassigned_critical"
  | "sla_due_soon"
  | "sla_overdue"
  | "validation_failed"
  | "reopened";

export interface SystemTestIncidentNotificationCandidate {
  incidentKey: string;
  reason: SystemTestIncidentNotificationReason;
  priority: string;
  status: string;
  ownerUserId: string | null;
  slaDueAt: string | null;
  reopenCount: number;
}
