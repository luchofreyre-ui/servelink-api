import {
  buildSystemTestResolutionPreview,
  buildSystemTestResolutionPreviewFromDto,
  compareSystemTestFixOpportunities,
  type SystemTestFixOpportunityDto,
} from "../src/modules/system-tests/system-test-resolution-preview";

describe("system-test-resolution-preview", () => {
  it("returns null/default-safe preview for null resolution", () => {
    const p = buildSystemTestResolutionPreview(null);
    expect(p.hasResolution).toBe(false);
    expect(p.category).toBeNull();
    expect(p.confidence).toBeNull();
    expect(p.confidenceLabel).toBeNull();
    expect(p.topRecommendationSummary).toBeNull();
    expect(p.recommendationCount).toBe(0);
    expect(p.diagnosisSummary).toBeNull();
    expect(p.highestPriority).toBeNull();
  });

  it("extracts category, confidence, diagnosis summary, and top recommendation", () => {
    const p = buildSystemTestResolutionPreview({
      diagnosis: [
        {
          category: "timing_issue",
          confidence: 0.72,
          summary: "Async settle problem detected.",
        },
      ],
      recommendations: [{ summary: "Wait for ready state.", priority: null }],
    });
    expect(p.hasResolution).toBe(true);
    expect(p.category).toBe("timing_issue");
    expect(p.confidence).toBe(0.72);
    expect(p.diagnosisSummary).toBe("Async settle problem detected.");
    expect(p.topRecommendationSummary).toBe("Wait for ready state.");
    expect(p.recommendationCount).toBe(1);
  });

  it("normalizes confidence labels (0.9 high, 0.7 medium, 0.4 low)", () => {
    expect(
      buildSystemTestResolutionPreview({
        diagnosis: [{ category: "x", confidence: 0.9, summary: "s" }],
      }).confidenceLabel,
    ).toBe("High confidence");
    expect(
      buildSystemTestResolutionPreview({
        diagnosis: [{ category: "x", confidence: 0.7, summary: "s" }],
      }).confidenceLabel,
    ).toBe("Medium confidence");
    expect(
      buildSystemTestResolutionPreview({
        diagnosis: [{ category: "x", confidence: 0.4, summary: "s" }],
      }).confidenceLabel,
    ).toBe("Low confidence");
  });

  it("normalizes recommendation priority", () => {
    const p = buildSystemTestResolutionPreview({
      diagnosis: [{ category: "x", confidence: 0.5, summary: "s" }],
      recommendations: [{ summary: "Do thing", priority: " HIGH " }],
    });
    expect(p.highestPriority).toBe("high");
    expect(
      buildSystemTestResolutionPreview({
        diagnosis: [{ category: "x", confidence: 0.5, summary: "s" }],
        recommendations: [{ summary: "x", priority: "nope" }],
      }).highestPriority,
    ).toBeNull();
  });

  it("truncates long summaries", () => {
    const long = `${"word ".repeat(80)}end`;
    const p = buildSystemTestResolutionPreview({
      diagnosis: [{ category: "x", confidence: 0.5, summary: long }],
      recommendations: [{ summary: long, priority: null }],
    });
    expect(p.diagnosisSummary!.length).toBeLessThanOrEqual(180);
    expect(p.diagnosisSummary!.endsWith("…")).toBe(true);
    expect(p.topRecommendationSummary!.endsWith("…")).toBe(true);
  });

  it("maps Phase 10A resolution DTO into preview", () => {
    const p = buildSystemTestResolutionPreviewFromDto({
      diagnosis: {
        familyId: "f1",
        category: "unknown",
        rootCause: "r",
        confidence: 0.8,
        summary: "Diagnosis text",
        signals: [],
      },
      recommendations: [
        {
          familyId: "f1",
          title: "Fix it",
          explanation: "Because reasons.",
          cursorReady: true,
          actions: [],
        },
      ],
    });
    expect(p.category).toBe("unknown");
    expect(p.confidence).toBe(0.8);
    expect(p.topRecommendationSummary).toContain("Fix it");
    expect(p.topRecommendationSummary).toContain("Because reasons");
    expect(p.recommendationCount).toBe(1);
  });

  it("ranks fix opportunities (lifecycle / operator tie → action > confidence > priority > runs > failures > title)", () => {
    const baseLifecycle = {
      firstSeenAt: null,
      lastSeenAt: null,
      seenInRunCount: 2,
      recentRunCountConsidered: 10,
      seenInLatestRun: true,
      seenInPreviousRun: true,
      consecutiveRunCount: 2,
      runsSinceLastSeen: 0,
      lifecycleState: "recurring" as const,
    };

    const base = (): SystemTestFixOpportunityDto => ({
      familyId: "a",
      familyKey: "k",
      title: "Z",
      category: "c",
      confidence: 0.5,
      confidenceLabel: "Medium confidence",
      topRecommendationSummary: null,
      failureCount: 1,
      affectedRunCount: 1,
      highestPriority: null,
      operatorState: {
        state: "open",
        updatedAt: null,
        updatedByUserId: null,
        note: null,
      },
      lifecycle: { ...baseLifecycle },
    });

    const resurfaced = {
      ...base(),
      lifecycle: { ...baseLifecycle, lifecycleState: "resurfaced" as const },
    };
    expect(compareSystemTestFixOpportunities(base(), resurfaced)).toBeGreaterThan(0);

    const withAction = { ...base(), topRecommendationSummary: "step" };
    expect(compareSystemTestFixOpportunities(base(), withAction)).toBeGreaterThan(0);

    const hiConf = { ...base(), confidence: 0.9 };
    const loConf = { ...base(), confidence: 0.2 };
    expect(compareSystemTestFixOpportunities(loConf, hiConf)).toBeGreaterThan(0);

    const crit = {
      ...base(),
      topRecommendationSummary: "x",
      highestPriority: "critical" as const,
    };
    const lowP = {
      ...base(),
      topRecommendationSummary: "x",
      highestPriority: "low" as const,
      confidence: crit.confidence,
    };
    expect(compareSystemTestFixOpportunities(lowP, crit)).toBeGreaterThan(0);

    const moreRuns = { ...base(), topRecommendationSummary: "x", affectedRunCount: 5 };
    const fewerRuns = { ...base(), topRecommendationSummary: "x", affectedRunCount: 2 };
    expect(compareSystemTestFixOpportunities(fewerRuns, moreRuns)).toBeGreaterThan(0);

    const moreFails = { ...base(), topRecommendationSummary: "x", failureCount: 10 };
    const fewerFails = { ...base(), topRecommendationSummary: "x", failureCount: 2 };
    expect(compareSystemTestFixOpportunities(fewerFails, moreFails)).toBeGreaterThan(0);

    const a = { ...base(), topRecommendationSummary: "x", title: "B" };
    const b = { ...base(), topRecommendationSummary: "x", title: "A" };
    expect(compareSystemTestFixOpportunities(a, b)).toBeGreaterThan(0);
  });
});
