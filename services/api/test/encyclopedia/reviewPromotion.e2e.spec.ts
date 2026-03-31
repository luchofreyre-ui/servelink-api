import fs from "fs";
import os from "os";
import path from "path";
import type { CanonicalPageSnapshot } from "../../src/modules/encyclopedia/canonical/canonicalTypes";
import { REQUIRED_CANONICAL_SECTION_KEYS } from "../../src/modules/encyclopedia/ingestion/generationValidator";
import {
  promoteApprovedReviewRecords,
  retryFailedPromotions,
} from "../../src/modules/encyclopedia/review/reviewPromotion.server";
import { getValidationInsights } from "../../src/modules/encyclopedia/review/reviewInsights.server";
import type { ReviewRecord } from "../../src/modules/encyclopedia/review/reviewPromotionTypes";
import { importReviewRecordsFromFile } from "../../src/modules/encyclopedia/review/reviewImport.server";
import {
  approveReview,
  intakeReviewedCandidates,
  promoteApproved,
} from "../../src/modules/encyclopedia/review/reviewActions.server";
import {
  batchUpsertGeneratedReviewRecords,
  upsertGeneratedReviewRecord,
} from "../../src/modules/encyclopedia/review/reviewIntake.server";
import {
  getAllReviewRecords,
  getMigrationSummary,
  getOperationalReviewRecords,
  markReviewApproved,
} from "../../src/modules/encyclopedia/review/reviewStore.server";

const longBody = "x".repeat(85);

function validSnapshot(slug: string): CanonicalPageSnapshot {
  return {
    title: "Valid encyclopedia title for API fixture",
    slug,
    problem: "Grease buildup on kitchen surfaces",
    surface: "Stovetop and backsplash",
    intent: "Remove safely without damage",
    riskLevel: "low",
    sections: REQUIRED_CANONICAL_SECTION_KEYS.map((key) => ({
      key,
      title: key,
      content: longBody,
    })),
    internalLinks: ["related-topic-one", "related-topic-two"],
  };
}

const validFixtureSnapshot = validSnapshot("intake-fixture");

describe("Review promotion flow (encyclopedia)", () => {
  let prevEnv: string | undefined;
  let tmpDir: string;
  let storePath: string;
  let importJsonPath: string;

  beforeAll(() => {
    prevEnv = process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "enc-api-review-"));
    storePath = path.join(tmpDir, "review-store.json");
    importJsonPath = path.join(tmpDir, "review-import.json");
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH = storePath;
  });

  afterAll(() => {
    if (prevEnv === undefined) {
      delete process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH;
    } else {
      process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH = prevEnv;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    const records: ReviewRecord[] = [
      {
        slug: "fixture-promote-me",
        title: "Fixture",
        reviewStatus: "pending",
        publishStatus: "draft",
        canonicalSnapshot: validSnapshot("fixture-promote-me"),
      },
    ];
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(records, null, 2), "utf-8");
  });

  it("promotes approved valid snapshots", async () => {
    markReviewApproved("fixture-promote-me");

    const result = await promoteApprovedReviewRecords();

    expect(result.attempted).toBeGreaterThan(0);
    expect(result.promoted).toBe(1);
    expect(result.promotedSlugs).toContain("fixture-promote-me");

    const after = getAllReviewRecords();
    const row = after.find((r) => r.slug === "fixture-promote-me");
    expect(row?.publishStatus).toBe("live");
  });

  it("returns empty run when no approved unpromoted candidates", async () => {
    const records: ReviewRecord[] = [
      {
        slug: "only-pending",
        title: "P",
        reviewStatus: "pending",
        publishStatus: "draft",
        canonicalSnapshot: validSnapshot("only-pending"),
      },
    ];
    fs.writeFileSync(storePath, JSON.stringify(records, null, 2), "utf-8");

    const result = await promoteApprovedReviewRecords();

    expect(result.attempted).toBe(0);
    expect(result.promoted).toBe(0);
    expect(result).toBeDefined();
  });

  it("retries failed promotions and promotes once valid", async () => {
    const slug = "how-to-clean-stainless-steel-sinks";
    const snap = validSnapshot(slug);
    fs.writeFileSync(
      storePath,
      JSON.stringify(
        [
          {
            slug,
            title: "How to Clean Stainless Steel Sinks Properly",
            reviewStatus: "approved",
            publishStatus: "failed",
            canonicalSnapshot: snap,
            promotionErrors: ["section body too short"],
          },
        ],
        null,
        2,
      ),
      "utf-8",
    );

    const result = await retryFailedPromotions();

    expect(result.attempted).toBe(1);
    expect(result.promoted).toBe(1);
    expect(result.failed).toBe(0);

    const after = getAllReviewRecords();
    expect(after.find((r) => r.slug === slug)?.publishStatus).toBe("live");
  });

  it("aggregates validation insights from failed review records", () => {
    const one = validSnapshot("page-one");
    const two = validSnapshot("page-two");
    fs.writeFileSync(
      storePath,
      JSON.stringify(
        [
          {
            slug: "page-one",
            title: "Page One",
            reviewStatus: "approved",
            publishStatus: "failed",
            canonicalSnapshot: one,
            promotionErrors: [
              "missing section",
              "missing section",
              "internalLinks invalid",
            ],
          },
          {
            slug: "page-two",
            title: "Page Two",
            reviewStatus: "approved",
            publishStatus: "failed",
            canonicalSnapshot: two,
            promotionErrors: ["missing section"],
          },
        ],
        null,
        2,
      ),
      "utf-8",
    );

    const result = getValidationInsights();

    expect(result.totalFailures).toBe(2);
    expect(result.topErrors[0]).toEqual({
      error: "missing section",
      count: 3,
    });
  });

  it("stamps imported records with pipeline provenance", () => {
    const prevImport = process.env.ENCYCLOPEDIA_REVIEW_IMPORT_PATH;
    process.env.ENCYCLOPEDIA_REVIEW_IMPORT_PATH = importJsonPath;

    try {
      const validFixtureSnapshot = validSnapshot("imported-fixture");
      fs.writeFileSync(storePath, JSON.stringify([], null, 2), "utf-8");
      fs.writeFileSync(
        importJsonPath,
        JSON.stringify(
          [
            {
              slug: validFixtureSnapshot.slug,
              title: validFixtureSnapshot.title,
              canonicalSnapshot: validFixtureSnapshot,
              reviewStatus: "approved",
              publishStatus: "draft",
            },
          ],
          null,
          2,
        ),
        "utf-8",
      );

      const result = importReviewRecordsFromFile();
      expect(result.created).toBe(1);

      const summary = getMigrationSummary();
      expect(summary.imported).toBe(1);
      expect(summary.total).toBe(1);
    } finally {
      if (prevImport === undefined) {
        delete process.env.ENCYCLOPEDIA_REVIEW_IMPORT_PATH;
      } else {
        process.env.ENCYCLOPEDIA_REVIEW_IMPORT_PATH = prevImport;
      }
    }
  });

  it("sorts operational review records by failure then pending then approved-not-live then live", () => {
    const validFixtureSnapshot = validSnapshot("sort-template");
    fs.writeFileSync(
      storePath,
      JSON.stringify(
        [
          {
            slug: "live-page",
            title: "Live Page",
            reviewStatus: "approved",
            publishStatus: "live",
            canonicalSnapshot: {
              ...validFixtureSnapshot,
              slug: "live-page",
              title: "Live Page",
            },
            source: "pipeline_import",
          },
          {
            slug: "pending-page",
            title: "Pending Page",
            reviewStatus: "pending",
            publishStatus: "draft",
            canonicalSnapshot: {
              ...validFixtureSnapshot,
              slug: "pending-page",
              title: "Pending Page",
            },
            source: "pipeline_import",
          },
          {
            slug: "failed-page",
            title: "Failed Page",
            reviewStatus: "approved",
            publishStatus: "failed",
            canonicalSnapshot: {
              ...validFixtureSnapshot,
              slug: "failed-page",
              title: "Failed Page",
            },
            source: "pipeline_import",
          },
          {
            slug: "approved-page",
            title: "Approved Page",
            reviewStatus: "approved",
            publishStatus: "draft",
            canonicalSnapshot: {
              ...validFixtureSnapshot,
              slug: "approved-page",
              title: "Approved Page",
            },
            source: "pipeline_import",
          },
        ],
        null,
        2,
      ),
      "utf-8",
    );

    const ordered = getOperationalReviewRecords();
    expect(ordered.map((item) => item.slug)).toEqual([
      "failed-page",
      "pending-page",
      "approved-page",
      "live-page",
    ]);
  });

  it("creates a pending draft review record from generated snapshot", () => {
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH = storePath;
    fs.writeFileSync(storePath, JSON.stringify([], null, 2), "utf-8");

    const record = upsertGeneratedReviewRecord(validFixtureSnapshot);

    expect(record.slug).toBe(validFixtureSnapshot.slug);

    const rows = getAllReviewRecords();
    expect(rows).toHaveLength(1);
    expect(rows[0].reviewStatus).toBe("pending");
    expect(rows[0].publishStatus).toBe("draft");
    expect(rows[0].sourceDetail).toBe("generation_intake");
  });

  it("batch upserts generated snapshots into the API review store", () => {
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH = storePath;
    fs.writeFileSync(storePath, JSON.stringify([], null, 2), "utf-8");

    const result = batchUpsertGeneratedReviewRecords([
      validFixtureSnapshot,
      {
        ...validFixtureSnapshot,
        slug: "how-to-remove-soap-scum-from-tile",
        title: "How to Remove Soap Scum from Tile",
      },
    ]);

    expect(result.attempted).toBe(2);
    expect(result.upserted).toBe(2);

    const rows = getAllReviewRecords();
    expect(rows).toHaveLength(2);
  });

  it("runs the real operational happy path: intake -> approve -> promote -> live", async () => {
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH = storePath;

    fs.writeFileSync(storePath, JSON.stringify([], null, 2), "utf-8");

    const intakeResult = upsertGeneratedReviewRecord(validFixtureSnapshot);
    expect(intakeResult.slug).toBe(validFixtureSnapshot.slug);

    let rows = getAllReviewRecords();
    expect(rows).toHaveLength(1);
    expect(rows[0].reviewStatus).toBe("pending");
    expect(rows[0].publishStatus).toBe("draft");

    await approveReview(validFixtureSnapshot.slug);

    rows = getAllReviewRecords();
    expect(rows[0].reviewStatus).toBe("approved");
    expect(rows[0].publishStatus).toBe("draft");

    const promotion = await promoteApproved();

    expect(promotion.attempted).toBe(1);
    expect(promotion.promoted).toBe(1);
    expect(promotion.failed).toBe(0);
    expect(promotion.promotedSlugs).toContain(validFixtureSnapshot.slug);

    rows = getAllReviewRecords();
    expect(rows[0].reviewStatus).toBe("approved");
    expect(rows[0].publishStatus).toBe("live");
    expect(rows[0].promotedAt).toBeTruthy();
  });

  it("does not reset live rows back to pending/draft during generation intake upsert", () => {
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH = storePath;

    fs.writeFileSync(
      storePath,
      JSON.stringify(
        [
          {
            slug: validFixtureSnapshot.slug,
            title: validFixtureSnapshot.title,
            reviewStatus: "approved",
            publishStatus: "live",
            canonicalSnapshot: validFixtureSnapshot,
            source: "pipeline_import",
            sourceDetail: "seed",
            importedAt: new Date().toISOString(),
            promotedAt: new Date().toISOString(),
            promotionErrors: [],
          },
        ],
        null,
        2,
      ),
      "utf-8",
    );

    const updated = upsertGeneratedReviewRecord({
      ...validFixtureSnapshot,
      title: `${validFixtureSnapshot.title} Updated`,
    });

    expect(updated.reviewStatus).toBe("approved");
    expect(updated.publishStatus).toBe("live");

    const rows = getAllReviewRecords();
    expect(rows[0].reviewStatus).toBe("approved");
    expect(rows[0].publishStatus).toBe("live");
    expect(rows[0].title).toContain("Updated");
  });

  it("intakes reviewed candidates into the API review store", async () => {
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH = storePath;

    fs.writeFileSync(storePath, JSON.stringify([], null, 2));

    const result = await intakeReviewedCandidates([
      {
        slug: validFixtureSnapshot.slug,
        title: validFixtureSnapshot.title,
        canonicalSnapshot: validFixtureSnapshot,
        sourceName: "reviewed-candidates-route",
      },
    ]);

    expect(result.attempted).toBe(1);
    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);

    const rows = getAllReviewRecords();
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("reviewed_candidates");
    expect(rows[0].reviewStatus).toBe("pending");
    expect(rows[0].publishStatus).toBe("draft");
  });

  it("does not reset live rows during reviewed-candidates intake", async () => {
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH = storePath;

    fs.writeFileSync(
      storePath,
      JSON.stringify(
        [
          {
            slug: validFixtureSnapshot.slug,
            title: validFixtureSnapshot.title,
            reviewStatus: "approved",
            publishStatus: "live",
            canonicalSnapshot: validFixtureSnapshot,
            source: "pipeline_import",
            sourceDetail: "seed",
            importedAt: new Date().toISOString(),
            promotedAt: new Date().toISOString(),
            promotionErrors: [],
          },
        ],
        null,
        2,
      ),
    );

    const result = await intakeReviewedCandidates([
      {
        slug: validFixtureSnapshot.slug,
        title: `${validFixtureSnapshot.title} Updated`,
        canonicalSnapshot: {
          ...validFixtureSnapshot,
          title: `${validFixtureSnapshot.title} Updated`,
        },
        sourceName: "reviewed-candidates-route",
      },
    ]);

    expect(result.updated).toBe(1);

    const rows = getAllReviewRecords();
    expect(rows[0].publishStatus).toBe("live");
    expect(rows[0].reviewStatus).toBe("approved");
    expect(rows[0].title).toContain("Updated");
  });
});
