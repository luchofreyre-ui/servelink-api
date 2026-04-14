import type { AssignmentConstraintSet } from "./assignment-capacity.contract";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asTrimmedString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function asBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
}

/**
 * Converts persisted `bookingHandoff` JSON into assignment constraints.
 * Never throws; fills safe defaults. Optionally merges intake column fallbacks for timing.
 */
export function mapBookingHandoffToAssignmentConstraints(args: {
  bookingId?: string | null;
  intakeId?: string | null;
  bookingHandoff?: unknown;
  /** When handoff omits scheduling.preferredTime, use intake row `preferredTime`. */
  intakePreferredTime?: string | null;
  /** Carried for ops context only (not a separate constraint field today). */
  intakeFrequency?: string | null;
}): AssignmentConstraintSet {
  const raw = args.bookingHandoff;
  const bh = isPlainObject(raw) ? raw : {};
  const schedRaw = isPlainObject(bh.scheduling) ? bh.scheduling : {};
  const cleanerRaw = isPlainObject(bh.cleanerPreference) ? bh.cleanerPreference : {};
  const recRaw = isPlainObject(bh.recurring) ? bh.recurring : {};

  const schedulingMode =
    schedRaw.mode === "slot_selection" ? "slot_selection" : "preference_only";

  const preferredTime =
    asTrimmedString(schedRaw.preferredTime) ??
    asTrimmedString(args.intakePreferredTime);

  const scheduling: AssignmentConstraintSet["scheduling"] = {
    mode: schedulingMode,
    preferredTime,
    preferredDayWindow: asTrimmedString(schedRaw.preferredDayWindow),
    flexibilityNotes: asTrimmedString(schedRaw.flexibilityNotes),
    selectedSlotId: asTrimmedString(schedRaw.selectedSlotId),
    selectedSlotLabel: asTrimmedString(schedRaw.selectedSlotLabel),
  };

  const cleanerMode: AssignmentConstraintSet["cleanerPreference"]["mode"] =
    cleanerRaw.mode === "preferred_cleaner" ? "preferred_cleaner" : "none";

  const cleanerPreference: AssignmentConstraintSet["cleanerPreference"] = {
    mode: cleanerMode,
    cleanerId: asTrimmedString(cleanerRaw.cleanerId),
    cleanerLabel: asTrimmedString(cleanerRaw.cleanerLabel),
    hardRequirement: asBool(cleanerRaw.hardRequirement),
    notes:
      asTrimmedString(cleanerRaw.notes) ??
      asTrimmedString(cleanerRaw.preferenceNotes),
  };

  const pathKind: AssignmentConstraintSet["recurring"]["pathKind"] =
    recRaw.pathKind === "recurring" ? "recurring" : "one_time";

  const recurring: AssignmentConstraintSet["recurring"] = {
    pathKind,
    cadence: asTrimmedString(recRaw.cadence),
    authRequiredAtConfirm:
      typeof recRaw.authRequiredAtConfirm === "boolean"
        ? recRaw.authRequiredAtConfirm
        : undefined,
  };

  return {
    bookingId: args.bookingId ?? null,
    intakeId: args.intakeId ?? null,
    scheduling,
    cleanerPreference,
    recurring,
  };
}
