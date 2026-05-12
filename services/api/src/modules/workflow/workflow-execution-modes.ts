export const WORKFLOW_EXECUTION_MODE = {
  /** Default — observe/audit runners only, real persistence on workflow rows. */
  OBSERVE_ONLY: "observe_only",
  /** Runners simulate side-effects only (still persist workflow audit with dry-run markers). */
  DRY_RUN: "dry_run",
  /** Future gated steps require approval — blocks categories in `HUMAN_APPROVAL_REQUIRED_*` until approved. */
  APPROVAL_REQUIRED: "approval_required",
  /** Same capability allow-list as observe_only; tagged for internal routing semantics. */
  INTERNAL_ONLY: "internal_only",
  /** Engine refuses all step transitions (governance block). */
  EXECUTION_DISABLED: "execution_disabled",
} as const;

export type WorkflowExecutionMode =
  (typeof WORKFLOW_EXECUTION_MODE)[keyof typeof WORKFLOW_EXECUTION_MODE];

/**
 * Global engine mode from env — conservative default `observe_only`.
 * Per-execution `WorkflowExecution.executionMode` is stamped at create time from this resolver.
 */
export function resolveWorkflowEngineExecutionMode(): WorkflowExecutionMode {
  const raw = process.env.WORKFLOW_ENGINE_EXECUTION_MODE?.trim().toLowerCase();
  switch (raw) {
    case WORKFLOW_EXECUTION_MODE.DRY_RUN:
      return WORKFLOW_EXECUTION_MODE.DRY_RUN;
    case WORKFLOW_EXECUTION_MODE.APPROVAL_REQUIRED:
      return WORKFLOW_EXECUTION_MODE.APPROVAL_REQUIRED;
    case WORKFLOW_EXECUTION_MODE.INTERNAL_ONLY:
      return WORKFLOW_EXECUTION_MODE.INTERNAL_ONLY;
    case WORKFLOW_EXECUTION_MODE.EXECUTION_DISABLED:
      return WORKFLOW_EXECUTION_MODE.EXECUTION_DISABLED;
    case WORKFLOW_EXECUTION_MODE.OBSERVE_ONLY:
    case undefined:
    case "":
    default:
      return WORKFLOW_EXECUTION_MODE.OBSERVE_ONLY;
  }
}
