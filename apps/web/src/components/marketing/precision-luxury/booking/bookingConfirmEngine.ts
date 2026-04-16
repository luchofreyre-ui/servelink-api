import type { BookingStepId } from "@/lib/booking/bookingProductContract";
import type { RecurringIntent } from "./bookingFlowTypes";
import type { BookingConfirmChecklistItem } from "./BookingStepConfirm";

export type BookingConfirmWarningKind =
  | { kind: "none" }
  | { kind: "submit_error"; message: string }
  | { kind: "incomplete_booking" }
  | { kind: "contact_required" };

type BuildBookingConfirmChecklistParams = {
  serviceId: string;
  isHomeComplete: boolean;
  isScheduleComplete: boolean;
  recurringEnabled: boolean;
  recurringIntent: RecurringIntent | undefined;
  isContactReady: boolean;
  attemptedConfirm: boolean;
  isBookingReady: boolean;
  previewLoading: boolean;
  previewFetchCompleted: boolean;
  previewError: string | null;
  hasPreviewEstimate: boolean;
};

export function buildBookingConfirmChecklist(
  params: BuildBookingConfirmChecklistParams,
): BookingConfirmChecklistItem[] {
  const {
    serviceId,
    isHomeComplete,
    isScheduleComplete,
    recurringEnabled,
    recurringIntent,
    isContactReady,
    attemptedConfirm,
    isBookingReady,
    previewLoading,
    previewFetchCompleted,
    previewError,
    hasPreviewEstimate,
  } = params;

  const items: BookingConfirmChecklistItem[] = [
    {
      id: "service",
      label: "Service selected",
      complete: Boolean(serviceId),
      detail: !serviceId ? "Choose a service to continue." : undefined,
    },
    {
      id: "home",
      label: "Home details complete",
      complete: isHomeComplete,
      detail: !isHomeComplete
        ? "Bedrooms, bathrooms, and home size are required."
        : undefined,
    },
    {
      id: "schedule",
      label: "Schedule preferences set",
      complete: isScheduleComplete,
      detail: !isScheduleComplete
        ? "Select frequency and preferred timing."
        : undefined,
    },
  ];

  if (recurringEnabled) {
    items.push({
      id: "recurring",
      label: "Recurring cadence set",
      complete:
        recurringIntent?.type === "recurring" &&
        Boolean(recurringIntent.cadence),
      detail:
        recurringIntent?.type !== "recurring"
          ? "Enable recurring and pick a cadence."
          : undefined,
    });
  }

  items.push(
    {
      id: "contact",
      label: "Contact details added",
      complete: isContactReady,
      detail:
        attemptedConfirm && isBookingReady && !isContactReady
          ? "Name and valid email are required before confirming."
          : undefined,
    },
    {
      id: "estimate",
      label: "Estimate preview",
      complete: !previewLoading && previewFetchCompleted,
      detail:
        previewError && !hasPreviewEstimate ? previewError : undefined,
    },
  );

  return items;
}

export function buildBookingConfirmScheduleLine(
  frequency: string,
  preferredTime: string,
): string {
  if (frequency && preferredTime) {
    return `${frequency} · ${preferredTime}`;
  }
  return "Complete schedule selections to see timing here.";
}

export function buildBookingConfirmWarningKind(params: {
  step: BookingStepId;
  submitError: string | null;
  attemptedConfirm: boolean;
  isBookingReady: boolean;
  isContactReady: boolean;
}): BookingConfirmWarningKind {
  const { step, submitError, attemptedConfirm, isBookingReady, isContactReady } =
    params;

  if (step !== "review") {
    return { kind: "none" };
  }
  if (submitError) {
    return { kind: "submit_error", message: submitError };
  }
  if (attemptedConfirm && !isBookingReady) {
    return { kind: "incomplete_booking" };
  }
  if (attemptedConfirm && isBookingReady && !isContactReady) {
    return { kind: "contact_required" };
  }
  return { kind: "none" };
}
