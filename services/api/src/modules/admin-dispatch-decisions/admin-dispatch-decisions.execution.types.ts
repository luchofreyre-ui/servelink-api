export type AdminDispatchDecisionExecutionOutcome = "applied" | "rejected";

export interface ExecuteAdminDispatchDecisionResult {
  outcome: AdminDispatchDecisionExecutionOutcome;
  message: string;
  errorCode?: string;
}
