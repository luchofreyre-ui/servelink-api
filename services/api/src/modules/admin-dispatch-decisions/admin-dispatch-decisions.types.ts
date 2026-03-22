export type AdminDispatchDecisionAction =
  | "approve_assignment"
  | "reassign"
  | "hold"
  | "escalate"
  | "request_review";

export interface AdminDispatchDecisionResult {
  ok: boolean;
  decisionId?: string;
  status: "accepted" | "rejected";
  message: string;
}
