import { describe, expect, it } from "vitest";
import { MIN_SECTION_LENGTH } from "./generationValidator";
import { BASE_PAGE_TEMPLATE } from "./pageTemplate";
import type { GeneratedPage } from "./pageTypes";
import type { StoredReviewRecord } from "./reviewPersistenceTypes";
import {
  buildCanonicalPageSnapshotFromGeneratedPage,
  computeCanonicalContentHash,
  mergeIngestionIntoRecord,
  buildLivePageRecordFromApprovedReviewRecord,
} from "./encyclopediaPipelineMerge";
import { reviewPageAllowsPipelinePromotion } from "./encyclopediaPromotion.server";
import type { ReviewablePage } from "./renderTypes";

function pipelineSampleSectionBody(key: string, index: number, bodySuffix: string): string {
  const min = MIN_SECTION_LENGTH[key as keyof typeof MIN_SECTION_LENGTH];
  let body = `Pipeline sample ${key} index ${index}${bodySuffix}. Second sentence differs in mechanics. Third sentence covers rinse and dry discipline.`;
  let wave = 0;
  while (body.length < min) {
    wave += 1;
    body += ` Unique expansion wave ${wave} for merge hash stability.`;
  }
  return body;
}

function sampleGeneratedPage(slug: string, bodySuffix = ""): GeneratedPage {
  return {
    title: `Title ${slug}`,
    slug,
    meta: {
      problem: "grease buildup",
      surface: "stovetops",
      intent: "what-causes",
      riskLevel: "low",
      needsChemicalExplanation: false,
      needsMaterialSpecifics: false,
    },
    sections: BASE_PAGE_TEMPLATE,
    content: {
      title: `Title ${slug}`,
      slug,
      sections: BASE_PAGE_TEMPLATE.map((template, index) => ({
        key: template.key,
        content: pipelineSampleSectionBody(template.key, index, bodySuffix),
      })),
    },
    internalLinks: ["other-slug-a", "other-slug-b", "other-slug-c"],
  };
}

function baseReviewable(overrides: Partial<ReviewablePage>): ReviewablePage {
  return {
    title: "T",
    slug: "x",
    problem: "p",
    surface: "s",
    intent: "i",
    riskLevel: "low",
    sections: [],
    internalLinks: [],
    reviewStatus: "draft",
    ...overrides,
  } as ReviewablePage;
}

describe("encyclopediaPipelineMerge — ingestion", () => {
  it("new generated page becomes canonical record with draft + not_promoted", () => {
    const page = sampleGeneratedPage("new-ingest-slug");
    const snap = buildCanonicalPageSnapshotFromGeneratedPage(page);
    const hash = computeCanonicalContentHash(snap);
    const merged = mergeIngestionIntoRecord(undefined, snap, hash, {
      ingestedAt: "2026-01-01T00:00:00.000Z",
      contentOrigin: "generated",
      sourceBatchId: "b1",
    });
    expect(merged.slug).toBe("new-ingest-slug");
    expect(merged.reviewStatus).toBe("draft");
    expect(merged.promotionStatus).toBe("not_promoted");
    expect(merged.contentHash).toBe(hash);
    expect(merged.canonicalContent?.title).toContain("Title");
    expect(merged.reviewNotes).toBeUndefined();
  });

  it("re-ingest upserts same slug: refreshes machine fields, preserves editor-owned", () => {
    const page1 = sampleGeneratedPage("same-slug", "-v1");
    const s1 = buildCanonicalPageSnapshotFromGeneratedPage(page1);
    const h1 = computeCanonicalContentHash(s1);
    const first = mergeIngestionIntoRecord(undefined, s1, h1, {
      ingestedAt: "2026-01-01T00:00:00.000Z",
      contentOrigin: "generated",
    });
    const existing: StoredReviewRecord = {
      ...first,
      reviewStatus: "reviewed",
      reviewNotes: "editor note",
      editorialOverrideMode: "force-pass",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const page2 = sampleGeneratedPage("same-slug", "-v2");
    const s2 = buildCanonicalPageSnapshotFromGeneratedPage(page2);
    const h2 = computeCanonicalContentHash(s2);
    expect(h2).not.toBe(h1);

    const second = mergeIngestionIntoRecord(existing, s2, h2, {
      ingestedAt: "2026-01-02T00:00:00.000Z",
      contentOrigin: "generated",
    });

    expect(second.reviewStatus).toBe("reviewed");
    expect(second.reviewNotes).toBe("editor note");
    expect(second.editorialOverrideMode).toBe("force-pass");
    expect(second.contentHash).toBe(h2);
    expect(second.canonicalContent?.sections[0]?.content).toContain("-v2");
  });

  it("content hash changes when machine body changes", () => {
    const a = computeCanonicalContentHash(
      buildCanonicalPageSnapshotFromGeneratedPage(sampleGeneratedPage("h", "1"))
    );
    const b = computeCanonicalContentHash(
      buildCanonicalPageSnapshotFromGeneratedPage(sampleGeneratedPage("h", "2"))
    );
    expect(a).not.toBe(b);
  });

  it("re-ingest after promote invalidates promoted state when hash changes", () => {
    const page1 = sampleGeneratedPage("promo-slug");
    const s1 = buildCanonicalPageSnapshotFromGeneratedPage(page1);
    const h1 = computeCanonicalContentHash(s1);
    let rec = mergeIngestionIntoRecord(undefined, s1, h1, {
      ingestedAt: "2026-01-01T00:00:00.000Z",
      contentOrigin: "generated",
    });
    rec = {
      ...rec,
      reviewStatus: "approved",
      promotionStatus: "promoted",
      liveContentHash: h1,
      promotedAt: "2026-01-01T01:00:00.000Z",
    };

    const page2 = sampleGeneratedPage("promo-slug", "-changed");
    const s2 = buildCanonicalPageSnapshotFromGeneratedPage(page2);
    const h2 = computeCanonicalContentHash(s2);
    const next = mergeIngestionIntoRecord(rec, s2, h2, {
      ingestedAt: "2026-01-02T00:00:00.000Z",
      contentOrigin: "generated",
    });

    expect(next.promotionStatus).toBe("not_promoted");
    expect(next.liveContentHash).toBeUndefined();
    expect(next.promotedAt).toBeUndefined();
  });
});

describe("reviewPageAllowsPipelinePromotion", () => {
  it("blocks when not approved", () => {
    expect(
      reviewPageAllowsPipelinePromotion(
        baseReviewable({ reviewStatus: "draft", repairReadiness: "ready" })
      )
    ).toBe(false);
  });

  it("allows when approved and ready", () => {
    expect(
      reviewPageAllowsPipelinePromotion(
        baseReviewable({ reviewStatus: "approved", repairReadiness: "ready" })
      )
    ).toBe(true);
  });

  it("allows when approved and force-pass override", () => {
    expect(
      reviewPageAllowsPipelinePromotion(
        baseReviewable({
          reviewStatus: "approved",
          repairReadiness: "not_ready",
          editorialOverrideMode: "force-pass",
        })
      )
    ).toBe(true);
  });

  it("blocks when approved but not ready and no override", () => {
    expect(
      reviewPageAllowsPipelinePromotion(
        baseReviewable({
          reviewStatus: "approved",
          repairReadiness: "not_ready",
        })
      )
    ).toBe(false);
  });
});

describe("buildLivePageRecordFromApprovedReviewRecord", () => {
  it("builds live row from canonical snapshot", () => {
    const page = sampleGeneratedPage("live-slug");
    const snap = buildCanonicalPageSnapshotFromGeneratedPage(page);
    const hash = computeCanonicalContentHash(snap);
    const record: StoredReviewRecord = {
      slug: "live-slug",
      reviewStatus: "approved",
      updatedAt: "2026-01-01T00:00:00.000Z",
      contentHash: hash,
      canonicalContent: snap,
    };
    const live = buildLivePageRecordFromApprovedReviewRecord(
      record,
      "2026-01-01T02:00:00.000Z"
    );
    expect(live.slug).toBe("live-slug");
    expect(live.contentHash).toBe(hash);
    expect(live.snapshot.slug).toBe("live-slug");
  });

  it("throws without canonicalContent", () => {
    const record: StoredReviewRecord = {
      slug: "x",
      reviewStatus: "approved",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(() =>
      buildLivePageRecordFromApprovedReviewRecord(record, "2026-01-01T00:00:00.000Z")
    ).toThrow(/Missing canonicalContent/);
  });
});

describe("golden path (pure steps)", () => {
  it("generate snapshot → ingest merge → approve fields → live record shape", () => {
    const slug = "what-causes-grease-buildup-on-stovetops";
    const page = sampleGeneratedPage(slug);
    const snap = buildCanonicalPageSnapshotFromGeneratedPage(page);
    const hash = computeCanonicalContentHash(snap);
    let rec = mergeIngestionIntoRecord(undefined, snap, hash, {
      ingestedAt: "2026-03-01T00:00:00.000Z",
      contentOrigin: "generated",
    });
    rec = {
      ...rec,
      reviewStatus: "approved",
      editorialOverrideMode: "force-pass",
    };
    const live = buildLivePageRecordFromApprovedReviewRecord(
      rec,
      "2026-03-01T01:00:00.000Z"
    );
    expect(live.slug).toBe(slug);
    expect(reviewPageAllowsPipelinePromotion(
      baseReviewable({
        slug,
        reviewStatus: "approved",
        repairReadiness: "not_ready",
        editorialOverrideMode: "force-pass",
      })
    )).toBe(true);
  });
});
