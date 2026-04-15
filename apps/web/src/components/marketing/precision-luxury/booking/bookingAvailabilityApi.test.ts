import {
  parseAggregatedAvailabilityResponse,
  parseAvailabilityWindowsResponse,
  parseProviderBackedWindowRow,
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

  it("parseProviderBackedWindowRow requires foId, times, label, source", () => {
    expect(
      parseProviderBackedWindowRow({
        foId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        startAt: "2026-05-01T14:00:00.000Z",
        endAt: "2026-05-01T17:00:00.000Z",
        windowLabel: "2026-05-01T14:00:00.000Z → 2026-05-01T17:00:00.000Z",
        source: "candidate_provider",
        cleanerLabel: "Team A",
      }),
    ).toMatchObject({ source: "candidate_provider", foId: expect.any(String) });
    expect(parseProviderBackedWindowRow({ foId: "x", startAt: "a", endAt: "b" })).toBeNull();
  });

  it("parseAggregatedAvailabilityResponse accepts mode + windows array", () => {
    const parsed = parseAggregatedAvailabilityResponse({
      mode: "multi_provider_candidates",
      windows: [
        {
          foId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
          startAt: "2026-05-01T14:00:00.000Z",
          endAt: "2026-05-01T17:00:00.000Z",
          windowLabel: "2026-05-01T14:00:00.000Z → 2026-05-01T17:00:00.000Z",
          source: "preferred_provider",
        },
      ],
    });
    expect(parsed.mode).toBe("multi_provider_candidates");
    expect(parsed.windows).toHaveLength(1);
    expect(parsed.windows[0].source).toBe("preferred_provider");
  });

  it("parseAggregatedAvailabilityResponse rejects bad mode", () => {
    expect(() =>
      parseAggregatedAvailabilityResponse({ mode: "bogus", windows: [] }),
    ).toThrow("INVALID_AGGREGATED_AVAILABILITY_MODE");
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
