import { describe, expect, it } from "vitest";
import {
  buildMethodComparisonPage,
  buildProblemComparisonPage,
  buildProductComparisonPage,
  buildSurfaceComparisonPage,
} from "../authorityComparisonBuilder";
import { normalizeComparisonSlug } from "../authorityComparisonSelectors";

describe("authorityComparisonBuilder", () => {
  it("builds method comparison page", () => {
    const page = buildMethodComparisonPage(
      normalizeComparisonSlug("degreasing", "neutral-surface-cleaning"),
    );
    expect(page).not.toBeNull();
    expect(page?.rows.length).toBeGreaterThan(0);
  });

  it("builds surface comparison page", () => {
    const page = buildSurfaceComparisonPage(normalizeComparisonSlug("tile", "shower-glass"));
    expect(page).not.toBeNull();
  });

  it("builds problem comparison page", () => {
    const page = buildProblemComparisonPage(
      normalizeComparisonSlug("soap-scum", "hard-water-deposits"),
    );
    expect(page).not.toBeNull();
  });

  it("uses expert copy for clr vs zep (not generic quickAnswer fallback)", () => {
    const page = buildProductComparisonPage("clr-calcium-lime-rust-vs-zep-calcium-lime-rust-remover");
    expect(page).not.toBeNull();
    expect(page!.quickAnswer).toContain("CLR and Zep");
    expect(page!.quickAnswer).not.toMatch(/Choose between .* by matching visible soil/i);
  });
});
