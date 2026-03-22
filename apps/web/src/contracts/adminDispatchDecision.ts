export type AdminDispatchDecisionAction =
  | "approve_assignment"
  | "reassign"
  | "hold"
  | "escalate"
  | "request_review";

export interface AdminDispatchDecisionInput {
  bookingId: string;
  action: AdminDispatchDecisionAction;
  rationale: string;
  targetFoId?: string;
  submittedAt: string;
  submittedByRole: "admin";
  source:
    | "admin_booking_detail"
    | "admin_exceptions"
    | "admin_dashboard"
    | "unknown";
}

export interface AdminDispatchDecisionResult {
  ok: boolean;
  decisionId?: string;
  status: "accepted" | "rejected" | "unavailable";
  message: string;
}
