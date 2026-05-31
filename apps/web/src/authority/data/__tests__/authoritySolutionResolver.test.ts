import { describe, expect, it } from "vitest";

import { resolveAuthoritySolutionProfile } from "../authoritySolutionResolver";

describe("authoritySolutionResolver", () => {
  it("resolves workflow, tools, and products for soap scum on shower glass", () => {
    const solution = resolveAuthoritySolutionProfile({
      surfaceSlug: "shower-glass",
      problemSlug: "soap-scum",
    });

    expect(solution.problemSlug).toBe("soap-scum");
    expect(solution.surfaceSlug).toBe("shower-glass");
    expect(solution.workflow.primaryWorkflowSlug).toBeTruthy();
    expect(solution.workflow.actionSequence.length).toBeGreaterThan(0);
    expect(solution.tools.length).toBeGreaterThan(0);
    expect(solution.products.length).toBeGreaterThan(0);
    expect(solution.products.some((product) => product.role === "best_option")).toBe(true);
  });

  it("resolves workflow and products for hard water deposits on glass", () => {
    const solution = resolveAuthoritySolutionProfile({
      surfaceSlug: "glass",
      problemSlug: "hard-water-deposits",
    });

    expect(solution.workflow.primaryWorkflowSlug).toBeTruthy();
    expect(solution.products.length).toBeGreaterThan(0);
  });

  it("returns stop and assess for restoration-boundary scenarios", () => {
    const solution = resolveAuthoritySolutionProfile({
      surfaceSlug: "finished-wood",
      problemSlug: "surface-haze",
    });

    expect(solution.serviceEscalation.level).toBe("stop_and_assess");
    expect(solution.warnings.stopConditions.length).toBeGreaterThan(0);
  });

  it("returns a valid solution profile when product mapping is missing", () => {
    const solution = resolveAuthoritySolutionProfile({
      surfaceSlug: "unmapped-surface",
      problemSlug: "unmapped-problem",
    });

    expect(solution.problemSlug).toBe("unmapped-problem");
    expect(solution.surfaceSlug).toBe("unmapped-surface");
    expect(solution.workflow.primaryWorkflowSlug).toBeNull();
    expect(solution.products).toEqual([]);
    expect(solution.tools).toEqual([]);
    expect(solution.chemicals).toEqual([]);
  });
});
