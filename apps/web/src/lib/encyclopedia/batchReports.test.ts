import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  loadEncyclopediaBatchPipelineRuns,
  sortBatchPipelineRuns,
  summarizeBatchReports,
  tryParsePipelineSummaryJson,
} from "./batchReports";

const minimalSummary = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    batchName: "batch-test",
    mode: "gap",
    startedAt: "2026-01-01T00:00:00.000Z",
    finishedAt: "2026-01-01T00:01:00.000Z",
    inputFiles: {
      rawCandidates: "content-batches/encyclopedia/pipeline-runs/batch-test/gap-raw.json",
      reviewedCandidates: "content-batches/encyclopedia/pipeline-runs/batch-test/gap-reviewed.json",
      appendedIds: "content-batches/encyclopedia/pipeline-runs/batch-test/appended-ids.json",
    },
    reviewedSummary: { total: 10, promote: 4, review: 5, reject: 1 },
    promoteSummary: {
      appendedCount: 2,
      skippedCount: 2,
      consideredCount: 4,
      sourceCandidateCount: 10,
    },
    appendedIds: [],
    scaffold: { outputPath: "content-batches/encyclopedia/batch-test.json", pageCount: 2 },
    enriched: { outputPath: "content-batches/encyclopedia/batch-test.enriched.json", pageCount: 2 },
    generatedFileCount: 2,
    build: { ok: true, exitCode: 0 },
    steps: ["promote-index-candidates"],
    ...over,
  });

describe("batchReports", () => {
  it("tryParsePipelineSummaryJson normalizes expected fields", () => {
    const run = tryParsePipelineSummaryJson(minimalSummary(), "x.pipeline-summary.json", "content-batches/encyclopedia/reports/x.pipeline-summary.json");
    expect(run).not.toBeNull();
    expect(run!.batchName).toBe("batch-test");
    expect(run!.mode).toBe("gap");
    expect(run!.reviewedSummary).toEqual({ total: 10, promote: 4, review: 5, reject: 1 });
    expect(run!.promoteSummary?.appendedCount).toBe(2);
    expect(run!.scaffoldPageCount).toBe(2);
    expect(run!.enrichedPageCount).toBe(2);
    expect(run!.appendedIdsPath).toContain("appended-ids.json");
    expect(run!.buildOk).toBe(true);
  });

  it("tryParsePipelineSummaryJson returns null for malformed JSON", () => {
    expect(tryParsePipelineSummaryJson("{", "a.pipeline-summary.json", "p")).toBeNull();
  });

  it("tryParsePipelineSummaryJson returns null for cluster-density style files", () => {
    expect(tryParsePipelineSummaryJson(JSON.stringify({ foo: 1 }), "cluster-density-report.json", "p")).toBeNull();
  });

  it("tryParsePipelineSummaryJson returns null without batchName", () => {
    const raw = JSON.parse(minimalSummary()) as Record<string, unknown>;
    delete raw.batchName;
    expect(tryParsePipelineSummaryJson(JSON.stringify(raw), "x.pipeline-summary.json", "p")).toBeNull();
  });

  it("sortBatchPipelineRuns orders by finishedAt desc then fileName", () => {
    const a: NonNullable<ReturnType<typeof tryParsePipelineSummaryJson>> = {
      batchName: "a",
      fileName: "a.pipeline-summary.json",
      reportPath: "p/a",
      mode: "gap",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:00:00.000Z",
      reviewedSummary: null,
      promoteSummary: null,
      scaffoldPageCount: null,
      enrichedPageCount: null,
      generatedFileCount: 0,
      buildOk: null,
      buildExitCode: null,
      appendedIdsPath: null,
      inputRawCandidates: null,
      inputReviewedCandidates: null,
      steps: [],
      sortTimestampMs: Date.parse("2026-01-01T00:00:00.000Z"),
    };
    const b = {
      ...a,
      batchName: "b",
      fileName: "b.pipeline-summary.json",
      reportPath: "p/b",
      finishedAt: "2026-02-01T00:00:00.000Z",
      sortTimestampMs: Date.parse("2026-02-01T00:00:00.000Z"),
    };
    const sorted = sortBatchPipelineRuns([a, b as typeof a]);
    expect(sorted[0]!.batchName).toBe("b");
    expect(sorted[1]!.batchName).toBe("a");
  });

  it("sortBatchPipelineRuns falls back to startedAt when finishedAt missing", () => {
    const older = tryParsePipelineSummaryJson(
      minimalSummary({
        batchName: "old",
        finishedAt: undefined,
        startedAt: "2025-12-01T00:00:00.000Z",
      }),
      "o.pipeline-summary.json",
      "p/o",
    )!;
    const newer = tryParsePipelineSummaryJson(
      minimalSummary({
        batchName: "new",
        finishedAt: undefined,
        startedAt: "2026-06-01T00:00:00.000Z",
      }),
      "n.pipeline-summary.json",
      "p/n",
    )!;
    const sorted = sortBatchPipelineRuns([older, newer]);
    expect(sorted[0]!.batchName).toBe("new");
    expect(sorted[1]!.batchName).toBe("old");
  });

  it("loadEncyclopediaBatchPipelineRuns ignores invalid files and loads valid ones", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "batch-reports-"));
    const rep = path.join(root, "content-batches", "encyclopedia", "reports");
    fs.mkdirSync(rep, { recursive: true });
    fs.writeFileSync(path.join(rep, "good.pipeline-summary.json"), minimalSummary(), "utf8");
    fs.writeFileSync(path.join(rep, "bad.pipeline-summary.json"), '{"nope":true}', "utf8");
    fs.writeFileSync(path.join(rep, "cluster-density-report.json"), '{"clusters":[]}', "utf8");

    const runs = loadEncyclopediaBatchPipelineRuns(root);
    expect(runs).toHaveLength(1);
    expect(runs[0]!.batchName).toBe("batch-test");
    expect(runs[0]!.reportPath).toBe("content-batches/encyclopedia/reports/good.pipeline-summary.json");
  });

  it("summarizeBatchReports counts modes and failures", () => {
    const a = tryParsePipelineSummaryJson(
      minimalSummary({ mode: "expanded", build: { ok: false, exitCode: 1 } }),
      "a.pipeline-summary.json",
      "p/a",
    )!;
    const b = tryParsePipelineSummaryJson(
      minimalSummary({
        promoteSummary: { appendedCount: 0, skippedCount: 5, consideredCount: 5 },
      }),
      "b.pipeline-summary.json",
      "p/b",
    )!;
    const agg = summarizeBatchReports([a, b]);
    expect(agg.totalRuns).toBe(2);
    expect(agg.expandedRuns).toBe(1);
    expect(agg.gapRuns).toBe(1);
    expect(agg.failedBuilds).toBe(1);
    expect(agg.zeroAppendRuns).toBe(1);
  });
});
