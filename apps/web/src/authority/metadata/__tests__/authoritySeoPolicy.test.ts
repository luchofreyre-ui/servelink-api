import { describe, expect, it } from "vitest";
import { buildAuthorityRobotsValue, buildAuthoritySeoPolicy } from "../authoritySeoPolicy";

describe("authoritySeoPolicy", () => {
  it("normalizes canonical path and prefers encyclopedia for migrated method topics", () => {
    const policy = buildAuthoritySeoPolicy("method_detail", "methods/degreasing");
    expect(policy.canonicalPath).toBe("/encyclopedia/methods/degreasing");
  });

  it("leaves non-migrated authority paths unchanged", () => {
    const policy = buildAuthoritySeoPolicy("method_detail", "/methods/spot-treatment");
    expect(policy.canonicalPath).toBe("/methods/spot-treatment");
  });

  it("prefers encyclopedia for migrated problem topics", () => {
    const policy = buildAuthoritySeoPolicy("problem_detail", "/problems/grease-buildup");
    expect(policy.canonicalPath).toBe("/encyclopedia/problems/grease-buildup");
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
