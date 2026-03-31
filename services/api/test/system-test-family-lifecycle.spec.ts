import {
  buildSystemTestFamilyLifecycle,
  compareSystemTestFamilyLifecycleRank,
  sortLifecycleRunPoints,
  type LifecycleRunPoint,
} from "../src/modules/system-tests/system-test-family-lifecycle";

function pt(
  runId: string,
  startedAt: string,
  hasFamily: boolean,
): LifecycleRunPoint {
  return { runId, startedAt, hasFamily };
}

describe("system-test-family-lifecycle", () => {
  it("classifies new when only latest run has family", () => {
    const dto = buildSystemTestFamilyLifecycle([
      pt("r1", "2025-01-03T00:00:00.000Z", true),
      pt("r2", "2025-01-02T00:00:00.000Z", false),
      pt("r3", "2025-01-01T00:00:00.000Z", false),
    ]);
    expect(dto.lifecycleState).toBe("new");
    expect(dto.seenInRunCount).toBe(1);
    expect(dto.consecutiveRunCount).toBe(1);
    expect(dto.runsSinceLastSeen).toBe(0);
  });

  it("classifies recurring when present in latest and previous", () => {
    const dto = buildSystemTestFamilyLifecycle([
      pt("r1", "2025-01-03T00:00:00.000Z", true),
      pt("r2", "2025-01-02T00:00:00.000Z", true),
      pt("r3", "2025-01-01T00:00:00.000Z", false),
    ]);
    expect(dto.lifecycleState).toBe("recurring");
    expect(dto.consecutiveRunCount).toBe(2);
  });

  it("classifies resurfaced when latest has family, previous absent, older present", () => {
    const dto = buildSystemTestFamilyLifecycle([
      pt("r1", "2025-01-03T00:00:00.000Z", true),
      pt("r2", "2025-01-02T00:00:00.000Z", false),
      pt("r3", "2025-01-01T00:00:00.000Z", true),
    ]);
    expect(dto.lifecycleState).toBe("resurfaced");
    expect(dto.seenInRunCount).toBe(2);
    expect(dto.consecutiveRunCount).toBe(1);
  });

  it("classifies dormant when absent from latest but seen 1–2 runs ago", () => {
    const dto = buildSystemTestFamilyLifecycle([
      pt("r1", "2025-01-03T00:00:00.000Z", false),
      pt("r2", "2025-01-02T00:00:00.000Z", true),
    ]);
    expect(dto.seenInLatestRun).toBe(false);
    expect(dto.runsSinceLastSeen).toBe(1);
    expect(dto.lifecycleState).toBe("dormant");
  });

  it("classifies resolved when absent from latest and last seen 3+ runs ago", () => {
    const dto = buildSystemTestFamilyLifecycle([
      pt("r1", "2025-01-04T00:00:00.000Z", false),
      pt("r2", "2025-01-03T00:00:00.000Z", false),
      pt("r3", "2025-01-02T00:00:00.000Z", false),
      pt("r4", "2025-01-01T00:00:00.000Z", true),
    ]);
    expect(dto.runsSinceLastSeen).toBe(3);
    expect(dto.lifecycleState).toBe("resolved");
  });

  it("classifies resolved when never seen in window", () => {
    const dto = buildSystemTestFamilyLifecycle([
      pt("r1", "2025-01-02T00:00:00.000Z", false),
      pt("r2", "2025-01-01T00:00:00.000Z", false),
    ]);
    expect(dto.seenInRunCount).toBe(0);
    expect(dto.lifecycleState).toBe("resolved");
    expect(dto.runsSinceLastSeen).toBeNull();
  });

  it("sorts points newest-first before classification", () => {
    const unsorted = [
      pt("old", "2025-01-01T00:00:00.000Z", true),
      pt("new", "2025-01-03T00:00:00.000Z", true),
    ];
    const sorted = sortLifecycleRunPoints(unsorted);
    expect(sorted[0].runId).toBe("new");
  });

  it("compareSystemTestFamilyLifecycleRank orders resurfaced before recurring", () => {
    const resurfaced = buildSystemTestFamilyLifecycle([
      pt("a", "2025-01-02T00:00:00.000Z", true),
      pt("b", "2025-01-01T00:00:00.000Z", false),
      pt("c", "2024-12-31T00:00:00.000Z", true),
    ]);
    const recurring = buildSystemTestFamilyLifecycle([
      pt("a", "2025-01-02T00:00:00.000Z", true),
      pt("b", "2025-01-01T00:00:00.000Z", true),
    ]);
    expect(resurfaced.lifecycleState).toBe("resurfaced");
    expect(recurring.lifecycleState).toBe("recurring");
    expect(compareSystemTestFamilyLifecycleRank(resurfaced, recurring)).toBeLessThan(0);
  });
});
