import { describe, expect, it } from "vitest";

import { calculateSearchRank, type UserBehaviorData } from "./searchOptimization";

describe("calculateSearchRank", () => {
  it("boosts previously clicked products", () => {
    const b: UserBehaviorData = {
      userSessionId: "x",
      timeSpentSeconds: 0,
      previousClicks: ["a"],
    };
    expect(calculateSearchRank("a", b)).toBeGreaterThan(calculateSearchRank("z", b));
  });

  it("adds weight for long dwell", () => {
    const short: UserBehaviorData = {
      userSessionId: "x",
      timeSpentSeconds: 10,
      previousClicks: [],
    };
    const long: UserBehaviorData = {
      userSessionId: "x",
      timeSpentSeconds: 200,
      previousClicks: [],
    };
    expect(calculateSearchRank("p", long)).toBeGreaterThan(calculateSearchRank("p", short));
  });
});
