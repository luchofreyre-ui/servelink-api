import type {
  AdminDispatchDecisionAction,
  AdminDispatchDecisionInput,
} from "@/contracts/adminDispatchDecision";

export interface AdminDispatchDecisionValidationResult {
  valid: boolean;
  errors: string[];
}

function actionRequiresTarget(action: AdminDispatchDecisionAction): boolean {
  return action === "approve_assignment" || action === "reassign";
}

export function validateAdminDispatchDecisionInput(
  input: AdminDispatchDecisionInput,
): AdminDispatchDecisionValidationResult {
  const errors: string[] = [];

  if (!input.bookingId.trim()) {
    errors.push("Booking id is required.");
  }

  if (!input.rationale.trim()) {
    errors.push("Rationale is required.");
  }

  if (input.rationale.trim().length < 20) {
    errors.push("Rationale must be at least 20 characters.");
  }

  if (actionRequiresTarget(input.action) && !input.targetFoId?.trim()) {
    errors.push("A target FO is required for this action.");
  }

  if (input.submittedByRole !== "admin") {
    errors.push("Only admin submissions are allowed.");
  }

  if (!input.submittedAt.trim()) {
    errors.push("Submission timestamp is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
