import {
  getConfidenceTier,
  previewMatchesCategoryFilter,
  previewMatchesConfidenceTierFilter,
  resolutionPreviewPriorityRank,
  sortFamilyListRowsInPlace,
  sortIncidentListRowsInPlace,
} from "../src/modules/system-tests/system-test-resolution-preview-filters";
import type { SystemTestFamilyLifecycleDto } from "../src/modules/system-tests/system-test-family-lifecycle";
import type { SystemTestResolutionPreviewDto } from "../src/modules/system-tests/system-test-resolution-preview";

const defaultLifecycle = (): SystemTestFamilyLifecycleDto => ({
  firstSeenAt: null,
  lastSeenAt: null,
  seenInRunCount: 1,
  recentRunCountConsidered: 10,
  seenInLatestRun: true,
  seenInPreviousRun: false,
  consecutiveRunCount: 1,
  runsSinceLastSeen: 0,
  lifecycleState: "new",
});

const defaultOp = {
  state: "open" as const,
  updatedAt: null as string | null,
  updatedByUserId: null as string | null,
  note: null as string | null,
};

function prev(p: Partial<SystemTestResolutionPreviewDto>): SystemTestResolutionPreviewDto {
  return {
    hasResolution: true,
    category: p.category ?? null,
    confidence: p.confidence ?? null,
    confidenceLabel: p.confidenceLabel ?? null,
    topRecommendationSummary: p.topRecommendationSummary ?? null,
    recommendationCount: p.recommendationCount ?? 0,
    diagnosisSummary: p.diagnosisSummary ?? null,
    highestPriority: p.highestPriority ?? null,
  };
}

describe("system-test-resolution-preview-filters", () => {
  it("getConfidenceTier maps thresholds", () => {
    expect(getConfidenceTier(0.9)).toBe("high");
    expect(getConfidenceTier(0.85)).toBe("high");
    expect(getConfidenceTier(0.7)).toBe("medium");
    expect(getConfidenceTier(0.6)).toBe("medium");
    expect(getConfidenceTier(0.59)).toBe("low");
    expect(getConfidenceTier(null)).toBeNull();
  });

  it("resolutionPreviewPriorityRank orders critical highest", () => {
    expect(resolutionPreviewPriorityRank("critical")).toBe(4);
    expect(resolutionPreviewPriorityRank("high")).toBe(3);
    expect(resolutionPreviewPriorityRank("low")).toBe(1);
    expect(resolutionPreviewPriorityRank(null)).toBe(0);
  });

  it("previewMatchesCategoryFilter is exact normalized match", () => {
    expect(previewMatchesCategoryFilter(prev({ category: "environment_unavailable" }), "environment_unavailable")).toBe(
      true,
    );
    expect(previewMatchesCategoryFilter(prev({ category: "environment_unavailable" }), "auth_state")).toBe(false);
    expect(previewMatchesCategoryFilter(null, "x")).toBe(false);
  });

  it("previewMatchesConfidenceTierFilter", () => {
    expect(previewMatchesConfidenceTierFilter(prev({ confidence: 0.9 }), "high")).toBe(true);
    expect(previewMatchesConfidenceTierFilter(prev({ confidence: 0.9 }), "low")).toBe(false);
    expect(previewMatchesConfidenceTierFilter(null, "high")).toBe(false);
  });

  it("sortFamilyListRowsInPlace sorts by failureCount desc", () => {
    const rows = [
      {
        updatedAt: "2026-01-02T00:00:00.000Z",
        affectedRunCount: 1,
        totalOccurrencesAcrossRuns: 3,
        resolutionPreview: prev({ confidence: 0.5 }),
        operatorState: defaultOp,
        lifecycle: defaultLifecycle(),
      },
      {
        updatedAt: "2026-01-01T00:00:00.000Z",
        affectedRunCount: 1,
        totalOccurrencesAcrossRuns: 10,
        resolutionPreview: prev({ confidence: 0.5 }),
        operatorState: defaultOp,
        lifecycle: defaultLifecycle(),
      },
    ];
    sortFamilyListRowsInPlace(rows, "failureCount", "desc");
    expect(rows[0].totalOccurrencesAcrossRuns).toBe(10);
    expect(rows[1].totalOccurrencesAcrossRuns).toBe(3);
  });

  it("sortIncidentListRowsInPlace sorts by confidence desc", () => {
    const rows = [
      {
        updatedAt: "2026-01-02T00:00:00.000Z",
        resolutionPreview: prev({ confidence: 0.3 }),
        familyOperatorState: defaultOp,
        familyLifecycle: defaultLifecycle(),
        affectedFamilyCount: 1,
        currentRunFailureCount: 1,
      },
      {
        updatedAt: "2026-01-01T00:00:00.000Z",
        resolutionPreview: prev({ confidence: 0.95 }),
        familyOperatorState: defaultOp,
        familyLifecycle: defaultLifecycle(),
        affectedFamilyCount: 1,
        currentRunFailureCount: 1,
      },
    ];
    sortIncidentListRowsInPlace(rows, "confidence", "desc");
    expect(rows[0].resolutionPreview?.confidence).toBe(0.95);
  });
});
