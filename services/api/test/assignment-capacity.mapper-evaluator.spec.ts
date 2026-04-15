import { ASSIGNMENT_REASON_CODES } from "../src/modules/dispatch/assignment-capacity.contract";
import { evaluateAssignmentCapacity } from "../src/modules/dispatch/assignment-capacity.evaluator";
import { mapBookingHandoffToAssignmentConstraints } from "../src/modules/dispatch/assignment-constraint.mapper";

describe("mapBookingHandoffToAssignmentConstraints", () => {
  it("defaults cleanly for unknown / partial handoff", () => {
    const c = mapBookingHandoffToAssignmentConstraints({
      intakeId: "in_1",
      bookingHandoff: null,
      intakePreferredTime: null,
    });
    expect(c.intakeId).toBe("in_1");
    expect(c.scheduling.mode).toBe("preference_only");
    expect(c.cleanerPreference.mode).toBe("none");
    expect(c.recurring.pathKind).toBe("one_time");
  });

  it("merges intake preferredTime when handoff scheduling omits it", () => {
    const c = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: { scheduling: {} },
      intakePreferredTime: "Morning",
    });
    expect(c.scheduling.preferredTime).toBe("Morning");
  });

  it("maps slot window fields from scheduling handoff", () => {
    const c = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: {
          mode: "slot_selection",
          selectedSlotFoId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
          selectedSlotWindowStart: "2026-05-01T14:00:00.000Z",
          selectedSlotWindowEnd: "2026-05-01T17:00:00.000Z",
        },
      },
    });
    expect(c.scheduling.mode).toBe("slot_selection");
    expect(c.scheduling.selectedSlotFoId).toBe(
      "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    );
    expect(c.scheduling.selectedSlotWindowStart).toBe("2026-05-01T14:00:00.000Z");
    expect(c.scheduling.selectedSlotWindowEnd).toBe("2026-05-01T17:00:00.000Z");
  });

  it("maps selectedSlotSource and selectedSlotProviderLabel from scheduling handoff", () => {
    const c = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: {
          mode: "slot_selection",
          selectedSlotFoId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
          selectedSlotWindowStart: "2026-05-01T14:00:00.000Z",
          selectedSlotWindowEnd: "2026-05-01T17:00:00.000Z",
          selectedSlotSource: "candidate_provider",
          selectedSlotProviderLabel: "Team B",
        },
      },
    });
    expect(c.scheduling.selectedSlotSource).toBe("candidate_provider");
    expect(c.scheduling.selectedSlotProviderLabel).toBe("Team B");
  });
});

describe("evaluateAssignmentCapacity", () => {
  it("1: no scheduling intent -> needs_review + missing_scheduling_intent", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: {},
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "one_time" },
      },
      intakePreferredTime: null,
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: undefined,
    });
    expect(ev.status).toBe("needs_review");
    expect(ev.reasonCodes).toContain(
      ASSIGNMENT_REASON_CODES.MISSING_SCHEDULING_INTENT,
    );
    expect(ev.reasonCodes).toContain(ASSIGNMENT_REASON_CODES.MANUAL_REVIEW_REQUIRED);
  });

  it("2: preferred cleaner found -> assignable + matchedPreferredCleaner", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { mode: "preference_only", preferredTime: "Weekday Morning" },
        cleanerPreference: {
          mode: "preferred_cleaner",
          cleanerId: "c1",
          hardRequirement: false,
        },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [{ cleanerId: "c1", cleanerLabel: "Team A" }],
    });
    expect(ev.status).toBe("assignable");
    expect(ev.matchedPreferredCleaner).toBe(true);
    expect(ev.recommendedCleanerId).toBe("c1");
    expect(ev.recommendationConfidence).toBe("high");
    expect(ev.rankedCandidates?.[0]?.cleanerId).toBe("c1");
  });

  it("2b: preferred cleaner id matches providerId on roster row", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Morning" },
        cleanerPreference: {
          mode: "preferred_cleaner",
          cleanerId: "prov_99",
          hardRequirement: false,
        },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [
        {
          cleanerId: "fo_1",
          providerId: "prov_99",
          cleanerLabel: "Alex",
        },
      ],
    });
    expect(ev.status).toBe("assignable");
    expect(ev.matchedPreferredCleaner).toBe(true);
    expect(ev.recommendedCleanerId).toBe("fo_1");
  });

  it("3: preferred cleaner unavailable (soft) -> needs_review", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Weekday Morning" },
        cleanerPreference: {
          mode: "preferred_cleaner",
          cleanerId: "missing",
          hardRequirement: false,
        },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [{ cleanerId: "c1", cleanerLabel: "Other" }],
    });
    expect(ev.status).toBe("needs_review");
    expect(ev.reasonCodes).toContain(
      ASSIGNMENT_REASON_CODES.PREFERRED_CLEANER_UNAVAILABLE,
    );
  });

  it("4: preferred cleaner unavailable (hard) -> deferred", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Weekday Morning" },
        cleanerPreference: {
          mode: "preferred_cleaner",
          cleanerId: "missing",
          hardRequirement: true,
        },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [{ cleanerId: "c1", cleanerLabel: "Other" }],
    });
    expect(ev.status).toBe("deferred");
    expect(ev.reasonCodes).toContain(
      ASSIGNMENT_REASON_CODES.HARD_CLEANER_REQUIREMENT_UNMET,
    );
  });

  it("5: recurring with prior cleaner available -> continuity candidate", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Fri" },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "recurring", cadence: "weekly" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [{ cleanerId: "prior", cleanerLabel: "Prior", supportsRecurring: true }],
      recurringContext: { priorCleanerId: "prior", priorCleanerLabel: "Prior" },
    });
    expect(ev.status).toBe("assignable");
    expect(ev.recurringContinuityCandidate).toBe(true);
    expect(ev.recommendedCleanerId).toBe("prior");
    expect(ev.recommendationConfidence).toBe("high");
  });

  it("6: recurring with prior cleaner unavailable -> needs_review + continuity code", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Fri" },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "recurring" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [{ cleanerId: "other", cleanerLabel: "Other" }],
      recurringContext: { priorCleanerId: "gone", priorCleanerLabel: "Gone" },
    });
    expect(ev.status).toBe("needs_review");
    expect(ev.reasonCodes).toContain(
      ASSIGNMENT_REASON_CODES.RECURRING_CONTINUITY_UNAVAILABLE,
    );
  });

  it("7: empty roster array -> needs_review + capacity_unknown + manual_review", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Morning" },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [],
    });
    expect(ev.status).toBe("needs_review");
    expect(ev.reasonCodes).toContain(ASSIGNMENT_REASON_CODES.CAPACITY_UNKNOWN);
    expect(ev.reasonCodes).toContain(
      ASSIGNMENT_REASON_CODES.MANUAL_REVIEW_REQUIRED,
    );
  });

  it("8: slot_selection + selectedSlotId -> needs_review + slot_not_enforceable_yet", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: {
          mode: "slot_selection",
          preferredTime: "Morning",
          selectedSlotId: "slot_xyz",
        },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [{ cleanerId: "c1", cleanerLabel: "A" }],
    });
    expect(ev.status).toBe("needs_review");
    expect(ev.reasonCodes).toContain(
      ASSIGNMENT_REASON_CODES.SLOT_NOT_ENFORCEABLE_YET,
    );
    expect(ev.reasonCodes).toContain(
      ASSIGNMENT_REASON_CODES.MANUAL_REVIEW_REQUIRED,
    );
  });

  it("9: bare roster + no preference -> needs_review (low ranking confidence)", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Afternoon" },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [
        { cleanerId: "zfo", cleanerLabel: "Zed" },
        { cleanerId: "afo", cleanerLabel: "Amy" },
      ],
    });
    expect(ev.status).toBe("needs_review");
    expect(ev.reasonCodes).toContain(ASSIGNMENT_REASON_CODES.LOW_RANKING_CONFIDENCE);
    expect(ev.recommendationConfidence).toBe("low");
    expect(ev.recommendedCleanerId).toBeUndefined();
    expect(ev.rankedCandidates?.length).toBeGreaterThan(0);
  });

  it("8b: slot_selection with enforceable window + roster FO -> assignable (no slot_not_enforceable_yet)", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: {
          mode: "slot_selection",
          preferredTime: "Morning",
          selectedSlotFoId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
          selectedSlotWindowStart: "2026-05-01T14:00:00.000Z",
          selectedSlotWindowEnd: "2026-05-01T17:00:00.000Z",
        },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [
        {
          cleanerId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
          cleanerLabel: "Slot FO",
        },
      ],
    });
    expect(ev.status).toBe("assignable");
    expect(ev.reasonCodes).not.toContain(
      ASSIGNMENT_REASON_CODES.SLOT_NOT_ENFORCEABLE_YET,
    );
    expect(ev.recommendedCleanerId).toBe(
      "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    );
  });

  it("8b2: candidate_provider slot source surfaces multi-provider ops note", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: {
          mode: "slot_selection",
          preferredTime: "Morning",
          selectedSlotFoId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
          selectedSlotWindowStart: "2026-05-01T14:00:00.000Z",
          selectedSlotWindowEnd: "2026-05-01T17:00:00.000Z",
          selectedSlotSource: "candidate_provider",
        },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [
        {
          cleanerId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
          cleanerLabel: "Slot FO",
        },
      ],
    });
    expect(ev.notesForOps?.join(" ")).toContain("candidate_provider");
  });

  it("8c: enforceable slot FO missing from roster -> needs_review", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: {
          mode: "slot_selection",
          preferredTime: "Morning",
          selectedSlotFoId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
          selectedSlotWindowStart: "2026-05-01T14:00:00.000Z",
          selectedSlotWindowEnd: "2026-05-01T17:00:00.000Z",
        },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [{ cleanerId: "other", cleanerLabel: "Other" }],
    });
    expect(ev.status).toBe("needs_review");
    expect(ev.reasonCodes).toContain(
      ASSIGNMENT_REASON_CODES.SELECTED_SLOT_PROVIDER_NOT_ON_ROSTER,
    );
  });

  it("8d: enforceable slot vs hard preferred cleaner conflict -> deferred", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: {
          mode: "slot_selection",
          preferredTime: "Morning",
          selectedSlotFoId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
          selectedSlotWindowStart: "2026-05-01T14:00:00.000Z",
          selectedSlotWindowEnd: "2026-05-01T17:00:00.000Z",
        },
        cleanerPreference: {
          mode: "preferred_cleaner",
          cleanerId: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
          hardRequirement: true,
        },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [
        {
          cleanerId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
          cleanerLabel: "Slot FO",
        },
        {
          cleanerId: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
          cleanerLabel: "Preferred",
        },
      ],
    });
    expect(ev.status).toBe("deferred");
    expect(ev.reasonCodes).toContain(
      ASSIGNMENT_REASON_CODES.SELECTED_SLOT_VS_HARD_PREFERRED_CLEANER_CONFLICT,
    );
  });

  it("9b: roster with windows + scheduling token overlap -> assignable + ranked winner", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Mon" },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "one_time" },
      },
    });
    const ev = evaluateAssignmentCapacity({
      constraints,
      availableCleaners: [
        {
          cleanerId: "zfo",
          cleanerLabel: "Zed",
          availableWindows: [{ label: "Tue 09:00–17:00" }],
        },
        {
          cleanerId: "afo",
          cleanerLabel: "Amy",
          availableWindows: [{ label: "Mon 09:00–17:00" }],
        },
      ],
    });
    expect(ev.status).toBe("assignable");
    expect(ev.recommendedCleanerId).toBe("afo");
    expect(ev.recommendationConfidence).toBe("medium");
    expect(ev.rankedCandidates?.[0]?.cleanerId).toBe("afo");
  });
});
