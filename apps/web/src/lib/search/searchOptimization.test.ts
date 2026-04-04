import { describe, expect, it } from "vitest";

import { calculateSearchRank, type UserBehaviorData } from "./searchOptimization";

describe("calculateSearchRank", () => {
  it("boosts previously clicked products", () => {
    const b: UserBehaviorData = {
      userSessionId: "x",
      timeSpentSeconds: 0,
      previousClicks: ["a"],
      lastEngagedProblemSlug: null,
      lastEngagedSurface: null,
    };
    expect(calculateSearchRank("a", b)).toBeGreaterThan(calculateSearchRank("z", b));
  });

  it("adds weight for long dwell", () => {
    const short: UserBehaviorData = {
      userSessionId: "x",
      timeSpentSeconds: 10,
      previousClicks: [],
      lastEngagedProblemSlug: null,
      lastEngagedSurface: null,
    };
    const long: UserBehaviorData = {
      userSessionId: "x",
      timeSpentSeconds: 200,
      previousClicks: [],
      lastEngagedProblemSlug: null,
      lastEngagedSurface: null,
    };
    expect(calculateSearchRank("p", long)).toBeGreaterThan(calculateSearchRank("p", short));
  });

  it("boosts when user prefs align with ranking context", () => {
    const u: UserBehaviorData = {
      userSessionId: "x",
      timeSpentSeconds: 0,
      previousClicks: [],
      lastEngagedProblemSlug: "dust-buildup",
      lastEngagedSurface: "tile",
    };
    const base = calculateSearchRank("p", u);
    const withProblem = calculateSearchRank("p", u, { problemSlug: "dust-buildup" });
    const withSurface = calculateSearchRank("p", u, { surface: "tile" });
    expect(withProblem).toBeGreaterThan(base);
    expect(withSurface).toBeGreaterThan(base);
  });
});
