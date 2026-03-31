import { describe, expect, it } from "vitest";

import {
  applyManualOverrides,
  filterReviewedCandidates,
  getEffectiveRecommendation,
  parseReviewedCandidatesFile,
  summarizeReviewedCandidates,
  titleIntentKindForReviewRow,
  type EncyclopediaReviewedCandidateRow,
  type ReviewedCandidatesFile,
} from "./reviewedCandidatesQueue";

function row(partial: Partial<EncyclopediaReviewedCandidateRow> & Pick<EncyclopediaReviewedCandidateRow, "id">) {
  const base: EncyclopediaReviewedCandidateRow = {
    id: partial.id,
    slug: partial.slug ?? "s",
    title: partial.title ?? "T",
    category: partial.category ?? "problems",
    cluster: partial.cluster ?? "c",
    role: "supporting",
    status: "draft",
    generatedType: "t",
    scorerRecommendation: partial.scorerRecommendation ?? "review",
    normalizedTitle: partial.normalizedTitle ?? "N",
    normalizedSlug: partial.normalizedSlug ?? "n",
    normalizationWarnings: partial.normalizationWarnings ?? [],
    normalizationAction: partial.normalizationAction ?? "none",
    recommendation: partial.recommendation ?? "review",
  };
  return { ...base, ...partial };
}

describe("reviewedCandidatesQueue", () => {
  it("summarizeReviewedCandidates counts by effective recommendation", () => {
    const candidates = [
      row({ id: "1", recommendation: "promote" }),
      row({ id: "2", recommendation: "review" }),
      row({ id: "3", recommendation: "reject" }),
      row({ id: "4", recommendation: "review", manualOverrideRecommendation: "promote" }),
    ];
    expect(summarizeReviewedCandidates(candidates)).toEqual({
      total: 4,
      promote: 2,
      review: 1,
      reject: 1,
    });
  });

  it("getEffectiveRecommendation prefers manualOverrideRecommendation", () => {
    expect(
      getEffectiveRecommendation(
        row({ id: "x", recommendation: "reject", manualOverrideRecommendation: "review" }),
      ),
    ).toBe("review");
    expect(getEffectiveRecommendation(row({ id: "y", recommendation: "promote" }))).toBe("promote");
  });

  it("filterReviewedCandidates filters by recommendation, category, cluster, warning code", () => {
    const candidates = [
      row({
        id: "a",
        category: "problems",
        cluster: "product-residue",
        recommendation: "review",
        normalizationWarnings: ["DOUBLE_PREPOSITION"],
      }),
      row({
        id: "b",
        category: "methods",
        cluster: "other",
        recommendation: "promote",
        manualOverrideRecommendation: "reject",
        normalizationWarnings: [],
      }),
    ];

    expect(filterReviewedCandidates(candidates, { recommendation: "review" }).map((c) => c.id)).toEqual(["a"]);
    expect(filterReviewedCandidates(candidates, { recommendation: "reject" }).map((c) => c.id)).toEqual(["b"]);
    expect(filterReviewedCandidates(candidates, { category: "methods" }).map((c) => c.id)).toEqual(["b"]);
    expect(filterReviewedCandidates(candidates, { cluster: "product" }).map((c) => c.id)).toEqual(["a"]);
    expect(filterReviewedCandidates(candidates, { warningCode: "DOUBLE_PREPOSITION" }).map((c) => c.id)).toEqual([
      "a",
    ]);
  });

  it("filterReviewedCandidates filters by titleIntent", () => {
    const candidates = [
      row({ id: "why", normalizedTitle: "Why does grease build up on cabinets" }),
      row({ id: "heavy", normalizedTitle: "Heavy grease on cabinets" }),
      row({ id: "plain", normalizedTitle: "Agitation for Appliances" }),
    ];
    expect(filterReviewedCandidates(candidates, { titleIntent: "search_intent" }).map((c) => c.id)).toEqual(["why"]);
    expect(filterReviewedCandidates(candidates, { titleIntent: "problem_layer" }).map((c) => c.id)).toEqual([
      "heavy",
    ]);
    expect(filterReviewedCandidates(candidates, { titleIntent: "ambiguous" }).map((c) => c.id)).toEqual(["plain"]);
  });

  it("titleIntentKindForReviewRow prefers normalizedTitle", () => {
    expect(
      titleIntentKindForReviewRow(
        row({ id: "x", title: "Wrong", normalizedTitle: "How to clean glass" }),
      ),
    ).toBe("search_intent");
  });

  it("parseReviewedCandidatesFile preserves extra top-level keys", () => {
    const raw = {
      generatedAt: "2026-01-01",
      summary: { total: 1, promote: 0, review: 1, reject: 0 },
      candidates: [row({ id: "z" })],
      generatorVersion: "1.2.3",
    };
    const parsed = parseReviewedCandidatesFile(raw);
    expect(parsed.generatorVersion).toBe("1.2.3");
    expect(parsed.candidates).toHaveLength(1);
  });

  it("applyManualOverrides updates only targeted ids and refreshes summary; null clears override", () => {
    const file: ReviewedCandidatesFile = {
      generatedAt: "g",
      candidates: [
        row({ id: "1", recommendation: "review" }),
        row({ id: "2", recommendation: "review", manualOverrideRecommendation: "promote" }),
      ],
    };
    const next = applyManualOverrides(file, { "1": "promote", "2": null });
    expect(next.candidates[0].manualOverrideRecommendation).toBe("promote");
    expect(next.candidates[1].manualOverrideRecommendation).toBeUndefined();
    expect(next.summary).toEqual(summarizeReviewedCandidates(next.candidates));
  });

  it("save round-trip: JSON serialize preserves candidate fields and overrides", () => {
    const file: ReviewedCandidatesFile = {
      generatedAt: "2026-03-29T00:00:00.000Z",
      extraMeta: { x: 1 },
      candidates: [
        row({
          id: "P-1",
          recommendation: "review",
          scorerRecommendation: "review",
          customNote: "keep",
        } as EncyclopediaReviewedCandidateRow),
      ],
    };
    const edited = applyManualOverrides(file, { "P-1": "reject" });
    edited.summary = summarizeReviewedCandidates(edited.candidates);

    const roundTrip = parseReviewedCandidatesFile(JSON.parse(JSON.stringify(edited)) as unknown);
    expect(roundTrip.generatedAt).toBe(file.generatedAt);
    expect((roundTrip as { extraMeta: unknown }).extraMeta).toEqual({ x: 1 });
    expect(roundTrip.candidates[0].recommendation).toBe("review");
    expect(roundTrip.candidates[0].manualOverrideRecommendation).toBe("reject");
    expect(roundTrip.candidates[0].scorerRecommendation).toBe("review");
    expect((roundTrip.candidates[0] as { customNote?: string }).customNote).toBe("keep");
    expect(getEffectiveRecommendation(roundTrip.candidates[0])).toBe("reject");
  });
});
