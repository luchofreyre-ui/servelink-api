import { describe, expect, it } from "vitest";
import { formatAuthorityComparisonTitle, getAuthorityEntityLabel } from "../authorityLabeling";

describe("authorityLabeling", () => {
  it("resolves entity labels from known slugs", () => {
    expect(getAuthorityEntityLabel("degreasing").length).toBeGreaterThan(0);
  });

  it("formats comparison titles", () => {
    expect(formatAuthorityComparisonTitle("degreasing-vs-neutral-surface-cleaning")).toContain("vs");
  });
});
