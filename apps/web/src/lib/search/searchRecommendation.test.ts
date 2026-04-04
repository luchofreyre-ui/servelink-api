import { describe, expect, it } from "vitest";

import type { SiteSearchDocument } from "@/types/search";

import { getSearchRecommendations } from "./searchRecommendation";

describe("getSearchRecommendations", () => {
  const base: SiteSearchDocument[] = [
    {
      id: "a",
      source: "authority",
      type: "problem",
      title: "Other",
      description: "",
      href: "/problems/other-problem",
      keywords: [],
      body: "",
    },
    {
      id: "b",
      source: "authority",
      type: "problem",
      title: "Dust",
      description: "",
      href: "/problems/dust-buildup",
      keywords: ["dust-buildup"],
      body: "",
    },
  ];

  it("preserves order when no prefs and no boost", () => {
    const out = getSearchRecommendations(base, "unrelated query", {});
    expect(out.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("boosts rows matching last engaged problem hub", () => {
    const out = getSearchRecommendations(base, "x", {
      lastEngagedProblemSlug: "dust-buildup",
      lastEngagedSurface: null,
    });
    expect(out[0]?.id).toBe("b");
  });
});
