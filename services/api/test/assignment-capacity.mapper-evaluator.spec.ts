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

  it("9: active roster + no preference -> assignable + deterministic recommended cleaner", () => {
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
    expect(ev.status).toBe("assignable");
    expect(ev.recommendedCleanerId).toBe("afo");
    expect(ev.recommendedCleanerLabel).toBe("Amy");
  });
});
