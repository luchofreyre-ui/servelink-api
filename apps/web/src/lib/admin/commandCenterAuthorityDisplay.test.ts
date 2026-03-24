import { describe, expect, it } from "vitest";
import {
  COMMAND_CENTER_AUTHORITY_TOP_TAG_COUNT,
  formatTopTagsDisplay,
} from "./commandCenterAuthorityDisplay";

describe("formatTopTagsDisplay", () => {
  it("returns em dash for empty list", () => {
    expect(formatTopTagsDisplay([])).toBe("—");
  });

  it("joins within max without suffix", () => {
    const tags = Array.from({ length: COMMAND_CENTER_AUTHORITY_TOP_TAG_COUNT }, (_, i) => `t${i}`);
    expect(formatTopTagsDisplay(tags)).toBe(tags.join(", "));
  });

  it("truncates with +N more", () => {
    const tags = ["a", "b", "c", "d", "e", "f", "g"];
    expect(formatTopTagsDisplay(tags, 5)).toBe("a, b, c, d, e +2 more");
  });
});
