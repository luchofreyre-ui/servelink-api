import {
  BOOKING_FINALIZE_ERROR_PREFIX,
  buildOccurrenceBookingFingerprint,
  formatBookingNoteWithFingerprint,
  parseBookingIdFromFinalizeError,
} from "./recurring-occurrence-identity";

describe("recurring-occurrence-identity", () => {
  it("buildOccurrenceBookingFingerprint is stable for same inputs", () => {
    const a = buildOccurrenceBookingFingerprint({
      recurringPlanId: "p1",
      occurrenceId: "o1",
      customerId: "c1",
      targetDateIso: "2026-01-15T00:00:00.000Z",
      serviceType: "deep-cleaning",
    });
    const b = buildOccurrenceBookingFingerprint({
      recurringPlanId: "p1",
      occurrenceId: "o1",
      customerId: "c1",
      targetDateIso: "2026-01-15T00:00:00.000Z",
      serviceType: "deep-cleaning",
    });
    expect(a).toBe(b);
    expect(a).toContain("occurrence:o1");
    expect(a).not.toContain("occurrence:o2");
  });

  it("formatBookingNoteWithFingerprint embeds searchable token", () => {
    const fp = "recurring:p:occ:o:target:t:service:s:customer:c";
    const note = formatBookingNoteWithFingerprint("base note", fp);
    expect(note).toContain(fp);
    expect(note).toContain("base note");
  });

  it("parseBookingIdFromFinalizeError extracts booking id", () => {
    expect(
      parseBookingIdFromFinalizeError(
        `${BOOKING_FINALIZE_ERROR_PREFIX}bk_abc123`,
      ),
    ).toBe("bk_abc123");
    expect(parseBookingIdFromFinalizeError(null)).toBeNull();
    expect(parseBookingIdFromFinalizeError("other")).toBeNull();
  });
});
