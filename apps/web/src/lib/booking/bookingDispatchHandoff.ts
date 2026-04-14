/**
 * UI-facing dispatch / confirm handoff summary + structured API `bookingHandoff` for intake submit.
 */
import type { BookingFlowState } from "@/components/marketing/precision-luxury/booking/bookingFlowTypes";
import { getBookingServiceCatalogItem } from "@/components/marketing/precision-luxury/booking/bookingServiceCatalog";

/** Mirrors `CreateBookingDirectionIntakeDto.bookingHandoff` (API). */
export type BookingDirectionBookingHandoffPayload = {
  scheduling: {
    mode: "preference_only" | "slot_selection";
    preferredTime?: string | null;
    preferredDayWindow?: string | null;
    flexibilityNotes?: string | null;
    selectedSlotId?: string | null;
    selectedSlotLabel?: string | null;
  };
  cleanerPreference: {
    mode: "none" | "preferred_cleaner";
    cleanerId?: string | null;
    cleanerLabel?: string | null;
    hardRequirement?: boolean;
    notes?: string | null;
  };
  recurring: {
    pathKind: "one_time" | "recurring";
    cadence?: string | null;
    authRequiredAtConfirm?: boolean;
  };
};

export function buildBookingHandoffPayloadForIntakeSubmit(
  state: BookingFlowState,
): BookingDirectionBookingHandoffPayload {
  const ss = state.scheduleSelection;
  const mode: "preference_only" | "slot_selection" =
    ss?.mode === "slot_selection" ? "slot_selection" : "preference_only";

  const scheduling: BookingDirectionBookingHandoffPayload["scheduling"] = {
    mode,
    preferredTime: (ss?.preferredTime ?? state.preferredTime) || null,
    preferredDayWindow: ss?.preferredDayWindow ?? null,
    flexibilityNotes: ss?.flexibilityNotes ?? null,
    selectedSlotId: ss?.selectedSlotId ?? null,
    selectedSlotLabel: ss?.selectedSlotLabel ?? null,
  };

  const cp = state.cleanerPreference;
  const cleanerPreference: BookingDirectionBookingHandoffPayload["cleanerPreference"] =
    {
      mode: cp?.mode === "preferred_cleaner" ? "preferred_cleaner" : "none",
      cleanerId: cp?.cleanerId ?? null,
      cleanerLabel: cp?.cleanerLabel ?? null,
      hardRequirement: Boolean(cp?.hardRequirement),
      notes: cp?.preferenceNotes?.trim() ? cp.preferenceNotes.trim() : null,
    };

  const ri = state.recurringIntent;
  const recurring: BookingDirectionBookingHandoffPayload["recurring"] =
    ri?.type === "recurring"
      ? {
          pathKind: "recurring",
          cadence: ri.cadence,
          authRequiredAtConfirm: true,
        }
      : {
          pathKind: "one_time",
          cadence: null,
          authRequiredAtConfirm: false,
        };

  return { scheduling, cleanerPreference, recurring };
}

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
