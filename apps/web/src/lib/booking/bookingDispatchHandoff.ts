/**
 * UI-facing dispatch / confirm handoff summary derived from booking state.
 * Does not add fields to `BookingDirectionOutboundPayload` unless the API DTO grows.
 */
import type { BookingFlowState } from "@/components/marketing/precision-luxury/booking/bookingFlowTypes";
import { getBookingServiceCatalogItem } from "@/components/marketing/precision-luxury/booking/bookingServiceCatalog";

export type BookingDispatchHandoffSummary = {
  serviceLabel: string;
  homeSummary: string;
  estimateSummary: string | null;
  scheduleSummary: string;
  planSummary: string;
  cleanerSummary: string;
};

function cadenceLabel(c: "weekly" | "biweekly" | "monthly") {
  if (c === "weekly") return "Weekly";
  if (c === "biweekly") return "Bi-weekly";
  return "Monthly";
}

export function buildBookingDispatchHandoffSummary(
  state: BookingFlowState,
): BookingDispatchHandoffSummary {
  const svc = getBookingServiceCatalogItem(state.serviceId);
  const homeSummary = [
    state.homeSize?.trim(),
    state.bedrooms && `Bedrooms: ${state.bedrooms}`,
    state.bathrooms && `Bathrooms: ${state.bathrooms}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const snap = state.estimateSnapshot;
  const estimateSummary =
    snap != null
      ? `${(snap.priceCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })} · ${snap.durationMinutes} min · ${Math.round(snap.confidence * 100)}% confidence`
      : null;

  const freq = state.frequency || "—";
  const prefTime = state.preferredTime || "—";
  const ss = state.scheduleSelection;
  const windowPart = ss?.preferredDayWindow?.trim()
    ? ` · Preferred days: ${ss.preferredDayWindow.trim()}`
    : "";
  const flexPart = ss?.flexibilityNotes?.trim()
    ? ` · Notes: ${ss.flexibilityNotes.trim()}`
    : "";
  const slotPart =
    ss?.mode === "slot_selection" && ss.selectedSlotLabel
      ? ` · Requested slot: ${ss.selectedSlotLabel}`
      : ss?.mode === "slot_selection"
        ? " · Slot selection mode (no slot API wired in funnel yet — preferences only)."
        : "";

  const scheduleSummary = `Frequency: ${freq} · Preferred time: ${prefTime}${windowPart}${flexPart}${slotPart}`;

  const intent = state.recurringIntent;
  let planSummary = "Not selected";
  if (intent?.type === "one_time") planSummary = "One-time cleaning";
  else if (intent?.type === "recurring")
    planSummary = `Recurring · ${cadenceLabel(intent.cadence)}`;

  const cp = state.cleanerPreference;
  let cleanerSummary = "No cleaner preference captured.";
  if (cp?.mode === "preferred_cleaner") {
    cleanerSummary = cp.cleanerLabel?.trim()
      ? `Preferred cleaner: ${cp.cleanerLabel.trim()}${cp.hardRequirement ? " (required if available)" : " (soft preference)"}`
      : `Preferred cleaner request${cp.preferenceNotes?.trim() ? `: ${cp.preferenceNotes.trim()}` : " (no specific provider selected)"}`;
  } else if (cp?.mode === "none") {
    cleanerSummary = "No preference — assign best available team.";
  }

  return {
    serviceLabel: svc.title,
    homeSummary: homeSummary || "—",
    estimateSummary,
    scheduleSummary,
    planSummary,
    cleanerSummary,
  };
}
