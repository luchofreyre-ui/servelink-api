import { mapBookingHandoffToAssignmentConstraints } from "../src/modules/dispatch/assignment-constraint.mapper";
import {
  rankProviderCandidates,
  schedulePreferenceOverlapScore,
} from "../src/modules/dispatch/provider-ranking.service";

describe("schedulePreferenceOverlapScore", () => {
  it("returns >0 when a scheduling token appears in window labels", () => {
    const s = schedulePreferenceOverlapScore("Mon", null, [
      { label: "Mon 09:00–17:00" },
    ]);
    expect(s).toBeGreaterThan(0);
  });

  it("returns 0 when there are no windows", () => {
    expect(schedulePreferenceOverlapScore("Mon", null, undefined)).toBe(0);
  });
});

describe("rankProviderCandidates", () => {
  const baseConstraints = mapBookingHandoffToAssignmentConstraints({
    bookingHandoff: {
      scheduling: { preferredTime: "Weekday Morning" },
      cleanerPreference: { mode: "none" },
      recurring: { pathKind: "one_time" },
    },
  });

  it("preferred cleaner exact match outranks others", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Morning" },
        cleanerPreference: {
          mode: "preferred_cleaner",
          cleanerId: "c_best",
          hardRequirement: false,
        },
        recurring: { pathKind: "one_time" },
      },
    });
    const ranked = rankProviderCandidates({
      constraints,
      availableCleaners: [
        { cleanerId: "c_other", cleanerLabel: "Other" },
        { cleanerId: "c_best", cleanerLabel: "Best" },
        { cleanerId: "c_alpha", cleanerLabel: "Alpha" },
      ],
    });
    expect(ranked[0].cleanerId).toBe("c_best");
    expect(ranked[0].matchedPreferredCleaner).toBe(true);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it("recurring prior cleaner outranks generic when preferred is absent", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Fri" },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "recurring", cadence: "weekly" },
      },
    });
    const ranked = rankProviderCandidates({
      constraints,
      availableCleaners: [
        { cleanerId: "z_other", cleanerLabel: "Z" },
        { cleanerId: "prior", cleanerLabel: "Prior", supportsRecurring: true },
        { cleanerId: "a_other", cleanerLabel: "A" },
      ],
      recurringContext: { priorCleanerId: "prior", priorCleanerLabel: "Prior" },
    });
    expect(ranked[0].cleanerId).toBe("prior");
    expect(ranked[0].recurringContinuityCandidate).toBe(true);
  });

  it("recurring path prefers supportsRecurring=true when otherwise similar", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Morning" },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "recurring" },
      },
    });
    const ranked = rankProviderCandidates({
      constraints,
      availableCleaners: [
        { cleanerId: "b", cleanerLabel: "B", supportsRecurring: false },
        { cleanerId: "a", cleanerLabel: "A", supportsRecurring: true },
      ],
    });
    const scoreA = ranked.find((r) => r.cleanerId === "a")!.score;
    const scoreB = ranked.find((r) => r.cleanerId === "b")!.score;
    expect(scoreA).toBeGreaterThan(scoreB);
  });

  it("schedule hint overlap increases score vs no overlap", () => {
    const withOverlap = rankProviderCandidates({
      constraints: mapBookingHandoffToAssignmentConstraints({
        bookingHandoff: {
          scheduling: { preferredTime: "Monday" },
          cleanerPreference: { mode: "none" },
          recurring: { pathKind: "one_time" },
        },
      }),
      availableCleaners: [
        {
          cleanerId: "x1",
          cleanerLabel: "X1",
          availableWindows: [{ label: "Monday 09:00–12:00" }],
        },
      ],
    });
    const noOverlap = rankProviderCandidates({
      constraints: mapBookingHandoffToAssignmentConstraints({
        bookingHandoff: {
          scheduling: { preferredTime: "Friday" },
          cleanerPreference: { mode: "none" },
          recurring: { pathKind: "one_time" },
        },
      }),
      availableCleaners: [
        {
          cleanerId: "x1",
          cleanerLabel: "X1",
          availableWindows: [{ label: "Monday 09:00–12:00" }],
        },
      ],
    });
    expect(withOverlap[0].score).toBeGreaterThan(noOverlap[0].score);
  });

  it("tie-break is deterministic by cleanerId ascending", () => {
    const ranked = rankProviderCandidates({
      constraints: baseConstraints,
      availableCleaners: [
        { cleanerId: "m", cleanerLabel: "M" },
        { cleanerId: "a", cleanerLabel: "A" },
        { cleanerId: "z", cleanerLabel: "Z" },
      ],
    });
    expect(ranked.map((r) => r.cleanerId).join(",")).toBe("a,m,z");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });

  it("exact slot handoff ranks matching franchise owner first", () => {
    const slotFo = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: {
          mode: "slot_selection",
          preferredTime: "Morning",
          selectedSlotFoId: slotFo,
          selectedSlotWindowStart: "2026-05-01T14:00:00.000Z",
          selectedSlotWindowEnd: "2026-05-01T17:00:00.000Z",
        },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "one_time" },
      },
    });
    const ranked = rankProviderCandidates({
      constraints,
      availableCleaners: [
        { cleanerId: "zzzzzzzz-zzzz-4zzz-zzzz-zzzzzzzzzzzz", cleanerLabel: "Zed" },
        { cleanerId: slotFo, cleanerLabel: "Slot team" },
      ],
    });
    expect(ranked[0].cleanerId).toBe(slotFo);
    const topFactors = ranked[0].factors.map((f) => f.code);
    expect(topFactors).toContain("exact_slot_match");
  });

  it("service area ZIP5 match ranks higher when intent zip is provided", () => {
    const constraints = mapBookingHandoffToAssignmentConstraints({
      bookingHandoff: {
        scheduling: { preferredTime: "Morning" },
        cleanerPreference: { mode: "none" },
        recurring: { pathKind: "one_time" },
      },
    });
    const ranked = rankProviderCandidates({
      constraints,
      availableCleaners: [
        { cleanerId: "nozip", cleanerLabel: "A", serviceAreaZip5: null },
        { cleanerId: "zip", cleanerLabel: "B", serviceAreaZip5: "94107" },
      ],
      intentServiceZip5: "94107",
    });
    expect(ranked[0].cleanerId).toBe("zip");
  });
});
