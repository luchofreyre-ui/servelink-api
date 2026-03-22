/** Centralized operator-visible labels for admin operations surfaces. */

export const WORKFLOW_STATE_LABELS: Record<string, string> = {
  open: "Open",
  held: "Held",
  in_review: "In Review",
  approved: "Approved",
  reassign_requested: "Reassign",
  pending_dispatch: "Pending Dispatch",
  assigned: "Assigned",
};

export const ANOMALY_REVIEW_STATE_LABELS: Record<string, string> = {
  in_review: "In Review",
  approved: "Approved",
  reassign_requested: "Reassign",
  open: "Open",
};

export const SLA_STATE_LABELS: Record<string, string> = {
  dueSoon: "Due Soon",
  overdue: "Overdue",
  breached: "Breached",
};

/** Activity `type` values from admin activity API → short chip label */
export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  dispatch_config_published: "Dispatch config",
  dispatch_operator_note_added: "Operator note",
  dispatch_manual_assign: "Manual assign",
  dispatch_manual_redispatch: "Manual redispatch",
  dispatch_manual_exclude_provider: "Provider excluded",
  dispatch_admin_hold_applied: "Admin hold",
  dispatch_admin_review_requested: "Review requested",
  admin_operator_note_saved: "Command center",
  admin_booking_held: "Command center",
  admin_booking_marked_in_review: "Command center",
  admin_booking_approved: "Command center",
  admin_booking_reassign_requested: "Command center",
  anomaly_acknowledged: "Anomaly",
  anomaly_resolved: "Anomaly",
  anomaly_assigned: "Anomaly",
  anomaly_unassigned: "Anomaly",
  anomaly_audit: "Anomaly",
};

export function labelWorkflowState(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return WORKFLOW_STATE_LABELS[raw] ?? raw.replace(/_/g, " ");
}

export function labelReviewState(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return ANOMALY_REVIEW_STATE_LABELS[raw] ?? raw.replace(/_/g, " ");
}

export function labelSlaState(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return SLA_STATE_LABELS[raw] ?? raw;
}

export function labelActivityType(raw: string | null | undefined): string {
  if (!raw) return "Activity";
  return ACTIVITY_TYPE_LABELS[raw] ?? raw.replace(/_/g, " ");
}

export function labelOpsAnomalyStatus(status: string | null | undefined): string {
  if (!status) return "—";
  const s = status.toLowerCase();
  if (s === "open") return "Open";
  if (s === "acked") return "Acked";
  return status;
}

/** Infer workflow emphasis chip from command-center activity types */
export function workflowStateFromActivityType(
  type: string | null | undefined,
): string | null {
  if (!type) return null;
  switch (type) {
    case "admin_booking_held":
    case "dispatch_admin_hold_applied":
      return "held";
    case "admin_booking_marked_in_review":
    case "dispatch_admin_review_requested":
      return "in_review";
    case "admin_booking_approved":
      return "approved";
    case "admin_booking_reassign_requested":
      return "reassign_requested";
    default:
      return null;
  }
}

export function formatAnomalyRowTitle(
  anomalyType: string,
  bookingId: string | null | undefined,
): string {
  const readable = anomalyType.replace(/_/g, " ").toLowerCase();
  const cap = readable.replace(/\b\w/g, (c) => c.toUpperCase());
  if (bookingId) {
    return `${cap} · ${bookingId.slice(0, 8)}…`;
  }
  return cap;
}
