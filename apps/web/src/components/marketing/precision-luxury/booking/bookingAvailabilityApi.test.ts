import {
  parseAvailabilityWindowsResponse,
  parseSlotHoldRecord,
} from "./bookingAvailabilityApi";

describe("bookingAvailabilityApi parsing", () => {
  it("parseAvailabilityWindowsResponse accepts array of windows", () => {
    const rows = parseAvailabilityWindowsResponse([
      { startAt: "2026-05-01T14:00:00.000Z", endAt: "2026-05-01T17:00:00.000Z" },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].startAt).toContain("2026-05-01T14");
  });

  it("parseAvailabilityWindowsResponse rejects non-array", () => {
    expect(() => parseAvailabilityWindowsResponse({})).toThrow(
      "INVALID_AVAILABILITY_WINDOWS_SHAPE",
    );
  });

  it("parseSlotHoldRecord requires core fields", () => {
    expect(
      parseSlotHoldRecord({
        id: "h1",
        bookingId: "b1",
        foId: "f1",
        startAt: "2026-05-01T14:00:00.000Z",
        endAt: "2026-05-01T17:00:00.000Z",
        expiresAt: "2026-05-01T14:01:00.000Z",
      }),
    ).toBeTruthy();
    expect(parseSlotHoldRecord({ id: "only" })).toBeNull();
  });
});
