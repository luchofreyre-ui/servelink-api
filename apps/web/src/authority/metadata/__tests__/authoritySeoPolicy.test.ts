import { describe, expect, it } from "vitest";
import { buildAuthorityRobotsValue, buildAuthoritySeoPolicy } from "../authoritySeoPolicy";

describe("authoritySeoPolicy", () => {
  it("normalizes canonical path", () => {
    const policy = buildAuthoritySeoPolicy("method_detail", "methods/degreasing");
    expect(policy.canonicalPath).toBe("/methods/degreasing");
  });

  it("marks current authority families as indexable", () => {
    const policy = buildAuthoritySeoPolicy("problem_detail", "/problems/soap-scum");
    expect(policy.shouldIndex).toBe(true);
  });

  it("builds robots value", () => {
    expect(buildAuthorityRobotsValue(true)).toBe("index, follow");
    expect(buildAuthorityRobotsValue(false)).toBe("noindex, follow");
  });
});
