import { describe, expect, it } from "vitest";
import {
  buildRecurringInterestPayloadForDirectionIntake,
  serializeTeamPlanningForIntakeNote,
} from "./bookingTeamPlanningDetails";
import type { BookingFlowState } from "./bookingFlowTypes";

const minimal = {
  recurringInterest: undefined,
  teamPlanningDetails: undefined,
  intent: undefined,
} as Pick<BookingFlowState, "recurringInterest" | "teamPlanningDetails" | "intent">;

describe("buildRecurringInterestPayloadForDirectionIntake", () => {
  it("sends interested:false when only team planning is present", () => {
    const payload = buildRecurringInterestPayloadForDirectionIntake({
      ...minimal,
      teamPlanningDetails: {
        accessInstructions: "Use side entrance",
      },
    });
    expect(payload).toEqual({
      interested: false,
      note: "Access instructions: Use side entrance",
    });
  });

  it("merges team planning ahead of recurring note when both exist", () => {
    const payload = buildRecurringInterestPayloadForDirectionIntake({
      recurringInterest: {
        interested: true,
        cadence: "weekly",
        note: "Prefer Tuesday mornings",
      },
      teamPlanningDetails: {
        parkingInstructions: "Street parking only",
      },
      intent: undefined,
    });
    expect(payload?.interested).toBe(true);
    expect(payload?.cadence).toBe("weekly");
    expect(payload?.note).toContain("Parking instructions: Street parking only");
    expect(payload?.note).toContain("Recurring preferences: Prefer Tuesday mornings");
  });
});

describe("serializeTeamPlanningForIntakeNote", () => {
  it("clamps overlong fields for safe API transport", () => {
    const long = "x".repeat(500);
    const note = serializeTeamPlanningForIntakeNote({
      accessInstructions: long,
    });
    expect(note.startsWith("Access instructions:")).toBe(true);
    expect(note.length).toBeLessThanOrEqual(421);
  });
});
