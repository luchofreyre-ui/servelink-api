import { describe, expect, it } from "vitest";
import {
  buildGuideFaqBlock,
  buildMethodFaqBlock,
  buildProblemFaqBlock,
  buildSurfaceFaqBlock,
} from "../authorityFaqSelectors";

describe("authorityFaqSelectors", () => {
  it("builds method faq", () => {
    const block = buildMethodFaqBlock("degreasing");
    expect(block).not.toBeNull();
    expect(block?.items.length).toBeGreaterThan(0);
  });

  it("builds surface faq", () => {
    const block = buildSurfaceFaqBlock("tile");
    expect(block).not.toBeNull();
  });

  it("builds problem faq", () => {
    const block = buildProblemFaqBlock("soap-scum");
    expect(block).not.toBeNull();
  });

  it("builds guide faq", () => {
    const block = buildGuideFaqBlock("why-cleaning-fails");
    expect(block).not.toBeNull();
  });
});
