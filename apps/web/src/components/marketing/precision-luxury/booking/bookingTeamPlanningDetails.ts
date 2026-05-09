import type { SubmitBookingDirectionIntakePayload } from "./bookingDirectionIntakeApi";
import type { BookingFlowState } from "./bookingFlowTypes";

/** Per-field cap — keeps the merged `recurringInterest.note` under DTO limits alongside recurring text. */
export const BOOKING_TEAM_PLANNING_FIELD_MAX_CHARS = 400;

export const BOOKING_TEAM_PLANNING_FIELD_SPECS: {
  key: keyof NonNullable<BookingFlowState["teamPlanningDetails"]>;
  label: string;
}[] = [
  { key: "offLimitsRooms", label: "Off-limits / rooms to skip" },
  { key: "accessInstructions", label: "Access instructions" },
  { key: "parkingInstructions", label: "Parking instructions" },
  { key: "fragileAreas", label: "Fragile or special-care areas" },
  { key: "petsHandling", label: "Pets / access handling" },
  { key: "priorityRooms", label: "Priority rooms (if any)" },
  { key: "residentConstraints", label: "Someone at home / scheduling constraints" },
  { key: "fragranceSensitivity", label: "Product or fragrance sensitivity" },
  { key: "gateBuildingInstructions", label: "Gate / building instructions" },
];

function clampField(raw: string | undefined, max: number): string {
  const t = (raw ?? "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd();
}

/**
 * Normalizes team-planning fields for storage in client state and echo on submit.
 */
export function normalizeTeamPlanningDetails(
  raw: BookingFlowState["teamPlanningDetails"] | undefined,
): BookingFlowState["teamPlanningDetails"] | undefined {
  if (!raw) return undefined;
  const out: NonNullable<BookingFlowState["teamPlanningDetails"]> = {};
  for (const { key } of BOOKING_TEAM_PLANNING_FIELD_SPECS) {
    const v = clampField(raw[key], BOOKING_TEAM_PLANNING_FIELD_MAX_CHARS);
    if (v) out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Human-readable lines for review + confirmation (not shown as estimate drivers).
 */
export function buildTeamPlanningDisplayLines(
  details: BookingFlowState["teamPlanningDetails"] | undefined,
): string[] {
  if (!details) return [];
  const lines: string[] = [];
  for (const { key, label } of BOOKING_TEAM_PLANNING_FIELD_SPECS) {
    const v = details[key]?.trim();
    if (v) lines.push(`${label}: ${v}`);
  }
  return lines;
}

export function serializeTeamPlanningForIntakeNote(
  details: BookingFlowState["teamPlanningDetails"] | undefined,
): string {
  const normalized = normalizeTeamPlanningDetails(details);
  if (!normalized) return "";
  const lines: string[] = [];
  for (const { key, label } of BOOKING_TEAM_PLANNING_FIELD_SPECS) {
    const v = normalized[key]?.trim();
    if (v) lines.push(`${label}: ${v}`);
  }
  return lines.join("\n");
}

/**
 * Uses the existing `recurringInterest` payload (including `note` MaxLength) as transport
 * for team-planning prose. Does not touch `estimateFactors`.
 */
export function buildRecurringInterestPayloadForDirectionIntake(
  state: Pick<BookingFlowState, "recurringInterest" | "teamPlanningDetails" | "intent">,
): SubmitBookingDirectionIntakePayload["recurringInterest"] | undefined {
  const tp = serializeTeamPlanningForIntakeNote(state.teamPlanningDetails);
  const rec = state.recurringInterest;
  const recurringInterested = rec?.interested === true;
  const recurringNote = rec?.note?.trim();

  let combinedNote: string | undefined;
  if (tp && recurringNote) {
    combinedNote = recurringInterested
      ? `${tp}\n\nRecurring preferences: ${recurringNote}`
      : `${tp}\n\n${recurringNote}`;
  } else if (tp) {
    combinedNote = tp;
  } else if (recurringNote) {
    combinedNote = recurringNote;
  }

  if (recurringInterested) {
    return {
      interested: true,
      ...(rec?.cadence ? { cadence: rec.cadence } : {}),
      ...(combinedNote ? { note: combinedNote } : {}),
      ...(state.intent ? { sourceIntent: state.intent } : {}),
    };
  }

  if (combinedNote) {
    return { interested: false, note: combinedNote };
  }

  return undefined;
}
