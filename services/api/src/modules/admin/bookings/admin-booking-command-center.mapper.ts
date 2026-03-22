import type {
  AdminBookingWorkflowState,
  Booking,
  BookingDispatchControl,
  OpsAlert,
} from "@prisma/client";
import type {
  AdminBookingCommandCenterActivityPreview,
  AdminBookingCommandCenterPayload,
} from "./admin-booking-command-center.types";

export type CommandCenterRow = {
  booking: Pick<Booking, "id" | "status" | "foId">;
  control: BookingDispatchControl | null;
  anomaly: OpsAlert | null;
  activityPreview: AdminBookingCommandCenterActivityPreview[];
};

export function parsePayloadJson(payloadJson: string | null): Record<string, unknown> {
  if (!payloadJson || !payloadJson.trim()) {
    return {};
  }
  try {
    const v = JSON.parse(payloadJson) as unknown;
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function mergePayloadJson(
  payloadJson: string | null,
  patch: Record<string, unknown>,
): string {
  const base = parsePayloadJson(payloadJson);
  return JSON.stringify({ ...base, ...patch });
}

export function effectiveWorkflowState(control: BookingDispatchControl | null): AdminBookingWorkflowState {
  if (!control) {
    return "open";
  }
  if (control.holdActive) {
    return "held";
  }
  if (control.reviewRequired && !control.reviewCompletedAt) {
    return "in_review";
  }
  return control.workflowState;
}

export function buildAvailableActions(args: {
  workflow: AdminBookingWorkflowState;
  bookingStatus: string;
}): AdminBookingCommandCenterPayload["availableActions"] {
  const terminal = args.workflow === "approved";
  const held = args.workflow === "held";
  const inReview = args.workflow === "in_review";

  const dispatchCompatible =
    args.bookingStatus === "pending_dispatch" ||
    args.bookingStatus === "offered" ||
    args.bookingStatus === "assigned";

  return {
    canSaveOperatorNote: true,
    canHold: !held && !terminal,
    canMarkInReview: !inReview && !terminal && !held,
    canApprove: !terminal,
    canReassign: dispatchCompatible && !terminal,
  };
}

export function toCommandCenterPayload(row: CommandCenterRow): AdminBookingCommandCenterPayload {
  const { booking, control, anomaly, activityPreview } = row;
  const workflow = effectiveWorkflowState(control);
  const payload = anomaly ? parsePayloadJson(anomaly.payloadJson) : {};

  const reviewState =
    typeof payload.adminReviewState === "string" ? payload.adminReviewState : null;
  const commandCenterHeld = payload.commandCenterHeld === true;
  const reassignmentRequested = payload.reassignmentRequested === true;

  return {
    success: true,
    bookingId: booking.id,
    status: booking.status,
    workflowState: workflow as AdminBookingCommandCenterPayload["workflowState"],
    operatorNote: control?.commandCenterOperatorNote ?? null,
    anomaly: anomaly
      ? {
          id: anomaly.id,
          status: anomaly.status,
          reviewState,
          commandCenterHeld,
          reassignmentRequested,
        }
      : null,
    availableActions: buildAvailableActions({
      workflow,
      bookingStatus: booking.status,
    }),
    activityPreview,
  };
}
