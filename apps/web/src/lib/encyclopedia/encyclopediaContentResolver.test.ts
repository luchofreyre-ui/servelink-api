import { describe, expect, it } from "vitest";
import { getEncyclopediaPageBySlug } from "./encyclopediaContentResolver";

describe("encyclopediaContentResolver", () => {
  it("returns null for unknown slug", () => {
    expect(getEncyclopediaPageBySlug("__not_a_real_slug_xyz__")).toBeNull();
  });
});
