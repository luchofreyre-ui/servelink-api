export const ESTIMATE_EXECUTION_FAILED_CODE = "ESTIMATE_EXECUTION_FAILED" as const;
export const ESTIMATE_INPUT_INVALID_CODE = "ESTIMATE_INPUT_INVALID" as const;

function assignCause(target: Error, cause: unknown): void {
  (target as Error & { cause?: unknown }).cause = cause;
}

export class EstimatorExecutionError extends Error {
  readonly code = ESTIMATE_EXECUTION_FAILED_CODE;
  readonly estimatorContext?: Record<string, unknown>;

  constructor(
    message: string,
    opts?: { cause?: unknown; context?: Record<string, unknown> },
  ) {
    super(message);
    this.name = "EstimatorExecutionError";
    Object.setPrototypeOf(this, new.target.prototype);
    if (opts?.cause !== undefined) {
      assignCause(this, opts.cause);
    }
    this.estimatorContext = opts?.context;
  }
}

export class EstimatorInputValidationError extends Error {
  readonly code = ESTIMATE_INPUT_INVALID_CODE;
  readonly validationContext?: Record<string, unknown>;

  constructor(
    message: string,
    opts?: { cause?: unknown; context?: Record<string, unknown> },
  ) {
    super(message);
    this.name = "EstimatorInputValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
    if (opts?.cause !== undefined) {
      assignCause(this, opts.cause);
    }
    this.validationContext = opts?.context;
  }
}
