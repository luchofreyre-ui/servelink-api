import { describe, expect, it } from "vitest";

import {
  evaluateMethodSurfaceCompatibility,
  evaluateProblemSurfaceCompatibility,
  evaluateToolMethodSurfaceCompatibility,
} from "./surfaceCompatibility";

describe("surfaceCompatibility", () => {
  describe("blocked", () => {
    it("glass × laminate", () => {
      expect(evaluateProblemSurfaceCompatibility("glass", "laminate").ok).toBe(false);
    });
    it("tile × laminate", () => {
      expect(evaluateProblemSurfaceCompatibility("tile", "laminate").ok).toBe(false);
    });
    it("shower-glass × vinyl", () => {
      expect(evaluateProblemSurfaceCompatibility("shower-glass", "vinyl").ok).toBe(false);
    });
    it("glass-cleaning × painted-walls (method family)", () => {
      expect(evaluateMethodSurfaceCompatibility("glass-cleaning", "painted-walls").ok).toBe(false);
    });
    it("soap-scum × cabinets", () => {
      expect(evaluateProblemSurfaceCompatibility("soap-scum", "cabinets").ok).toBe(false);
    });
    it("soap-scum × glass-surfaces (taxonomy-normalized shower glass)", () => {
      expect(evaluateProblemSurfaceCompatibility("soap-scum", "glass-surfaces").ok).toBe(true);
    });
  });

  describe("laminate only for broad families", () => {
    it("degreasing × laminate", () => {
      expect(evaluateMethodSurfaceCompatibility("degreasing", "laminate").ok).toBe(true);
    });
    it("odor × laminate blocked", () => {
      expect(evaluateProblemSurfaceCompatibility("odor", "laminate").ok).toBe(false);
    });
  });

  describe("allowed", () => {
    it("degreasing × cabinets", () => {
      expect(evaluateProblemSurfaceCompatibility("degreasing", "cabinets").ok).toBe(true);
    });
    it("dust-removal × painted-walls", () => {
      expect(evaluateMethodSurfaceCompatibility("dust-removal", "painted-walls").ok).toBe(true);
    });
    it("hard-water × bathroom-fixtures", () => {
      expect(evaluateProblemSurfaceCompatibility("hard-water", "bathroom-fixtures").ok).toBe(true);
    });
    it("glass-cleaning × glass", () => {
      expect(evaluateMethodSurfaceCompatibility("glass-cleaning", "glass").ok).toBe(true);
    });
    it("shower-glass × shower-glass", () => {
      expect(evaluateProblemSurfaceCompatibility("shower-glass", "shower-glass").ok).toBe(true);
    });
  });

  describe("tool × method × surface (expanded inventory)", () => {
    it("allows squeegee on glass-like surfaces", () => {
      expect(evaluateToolMethodSurfaceCompatibility("squeegee", "drying", "glass-surfaces").ok).toBe(true);
      expect(evaluateToolMethodSurfaceCompatibility("squeegee", "drying", "shower-walls").ok).toBe(true);
    });
    it("blocks squeegee on grout", () => {
      expect(evaluateToolMethodSurfaceCompatibility("squeegee", "agitation", "grout").ok).toBe(false);
    });
    it("allows mop on floor-like surfaces only", () => {
      expect(evaluateToolMethodSurfaceCompatibility("mop", "neutral-surface-cleaning", "vinyl").ok).toBe(true);
      expect(evaluateToolMethodSurfaceCompatibility("mop", "drying", "cabinets").ok).toBe(false);
    });
    it("blocks scrub-pad on finished wood", () => {
      expect(evaluateToolMethodSurfaceCompatibility("scrub-pad", "buffing", "finished-wood").ok).toBe(false);
    });
    it("blocks soft-bristle-brush on painted walls", () => {
      expect(
        evaluateToolMethodSurfaceCompatibility(
          "soft-bristle-brush",
          "neutral-surface-cleaning",
          "painted-walls",
        ).ok,
      ).toBe(false);
    });
    it("blocks microfiber-cloth on mop-primary floors", () => {
      expect(evaluateToolMethodSurfaceCompatibility("microfiber-cloth", "dust-removal", "floors").ok).toBe(
        false,
      );
    });
  });
});
