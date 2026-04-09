import type {
  AdminDispatchDecisionInput,
  AdminDispatchDecisionResult,
} from "@/contracts/adminDispatchDecision";
import { API_BASE_URL } from "@/lib/api";
import { validateAdminDispatchDecisionInput } from "./adminDispatchDecisionValidation";

export class AdminDispatchDecisionApiError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "AdminDispatchDecisionApiError";
    this.statusCode = statusCode;
  }
}

export async function submitAdminDispatchDecision(
  input: AdminDispatchDecisionInput,
): Promise<AdminDispatchDecisionResult> {
  const validation = validateAdminDispatchDecisionInput(input);

  if (!validation.valid) {
    throw new AdminDispatchDecisionApiError(validation.errors.join(" "));
  }

  const response = await fetch(`${API_BASE_URL}/admin/dispatch-decisions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 501) {
      return {
        ok: false,
        status: "unavailable",
        message:
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof (payload as { message?: unknown }).message === "string"
            ? (payload as { message: string }).message
            : "Dispatch decision persistence is not wired yet.",
      };
    }

    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : "Dispatch decision submission failed.";

    throw new AdminDispatchDecisionApiError(message, response.status);
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as { ok?: unknown }).ok !== "boolean" ||
    typeof (payload as { status?: unknown }).status !== "string" ||
    typeof (payload as { message?: unknown }).message !== "string"
  ) {
    throw new AdminDispatchDecisionApiError("Dispatch decision response shape is invalid.");
  }

  const typed = payload as {
    ok: boolean;
    decisionId?: string;
    status: "accepted" | "rejected" | "unavailable";
    message: string;
  };

  return {
    ok: typed.ok,
    decisionId: typed.decisionId,
    status: typed.status,
    message: typed.message,
  };
}
