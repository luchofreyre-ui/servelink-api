"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { buildSystemTestReportFromPayload } from "@/lib/systemTests/buildSystemTestReport";
import { buildSystemTestReportPayload } from "@/lib/systemTests/buildSystemTestReportPayload";
import { buildSystemTestTriageReportFromPayload } from "@/lib/systemTests/buildSystemTestTriageReport";
import {
  normalizeRunSummaryFromListItem,
  normalizeSystemTestRunDetail,
  trendVsPrevious,
} from "@/lib/systemTests/normalizeSystemTestRun";
import type {
  SystemTestHistoricalAnalysis,
  SystemTestRunDetailResponse,
  SystemTestRunsListItem,
} from "@/types/systemTests";
import { SystemTestsCopyReportButton } from "./SystemTestsCopyReportButton";
import { SystemTestsFailureGroupsPanel } from "./SystemTestsFailureGroupsPanel";
import { SystemTestsHistoricalInsightsPanel } from "./SystemTestsHistoricalInsightsPanel";
import { SystemTestsPageHeader } from "./SystemTestsPageHeader";
import { SystemTestsRerunPriorityPanel } from "./SystemTestsRerunPriorityPanel";
import { SystemTestsSpecBreakdownTable } from "./SystemTestsSpecBreakdownTable";
import { SystemTestsSummaryCards } from "./SystemTestsSummaryCards";
import { SystemTestsUnstableFilesPanel } from "./SystemTestsUnstableFilesPanel";
import { formatDateTime } from "./systemTestsFormatting";

type Props = {
  detail: SystemTestRunDetailResponse;
  sortedRuns: SystemTestRunsListItem[];
  historicalAnalysis: SystemTestHistoricalAnalysis;
  historyLoading?: boolean;
};

export function SystemTestsRunDetail(props: Props) {
  const { detail, sortedRuns, historicalAnalysis, historyLoading } = props;

  const normalized = useMemo(() => normalizeSystemTestRunDetail(detail), [detail]);

  const latestRunId = sortedRuns[0]?.id ?? null;

  const trendVsPrev = useMemo(() => {
    const idx = sortedRuns.findIndex((r) => r.id === detail.run.id);
    const older = idx >= 0 && idx < sortedRuns.length - 1 ? sortedRuns[idx + 1] : null;
    const prevSummary = older ? normalizeRunSummaryFromListItem(older) : null;
    return trendVsPrevious(normalized.summary, prevSummary);
  }, [detail.run.id, sortedRuns, normalized.summary]);

  const getReportText = useCallback(async () => {
    const idx = sortedRuns.findIndex((r) => r.id === detail.run.id);
    const older = idx >= 0 && idx < sortedRuns.length - 1 ? sortedRuns[idx + 1] : null;
    const prevSummary = older ? normalizeRunSummaryFromListItem(older) : null;
    const payload = buildSystemTestReportPayload({
      currentDetailResponse: detail,
      previousRunSummary: prevSummary,
    });
    return buildSystemTestReportFromPayload(payload);
  }, [detail, sortedRuns]);

  const getTriageReportText = useCallback(async () => {
    const idx = sortedRuns.findIndex((r) => r.id === detail.run.id);
    const older = idx >= 0 && idx < sortedRuns.length - 1 ? sortedRuns[idx + 1] : null;
    const prevSummary = older ? normalizeRunSummaryFromListItem(older) : null;
    const payload = buildSystemTestReportPayload({
      currentDetailResponse: detail,
      previousRunSummary: prevSummary,
      historicalAnalysis,
    });
    return buildSystemTestTriageReportFromPayload(payload);
  }, [detail, sortedRuns, historicalAnalysis]);

  const showCompareCta = latestRunId && detail.run.id !== latestRunId;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/system-tests" className="text-sm text-sky-300 hover:text-sky-200">
            ← System tests
          </Link>
        </div>
        {showCompareCta ? (
          <Link
            href={`/admin/system-tests/compare?baseRunId=${encodeURIComponent(detail.run.id)}&targetRunId=${encodeURIComponent(latestRunId)}`}
            className="rounded-xl border border-violet-400/35 bg-violet-500/15 px-3 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/25"
          >
            Compare to latest
          </Link>
        ) : null}
      </div>

      <SystemTestsPageHeader
        title="System test run"
        summary={normalized.summary}
        subtitle={`Source ${detail.run.source} · Ingest v${detail.run.ingestVersion}`}
      />

      <SystemTestsSummaryCards summary={normalized.summary} trendVsPrevious={trendVsPrev} />

      <div className="flex flex-wrap gap-3">
        <SystemTestsCopyReportButton getReportText={getReportText} />
        <SystemTestsCopyReportButton getReportText={getTriageReportText} label="Copy triage report" />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Per-file breakdown</h2>
        <SystemTestsSpecBreakdownTable rows={normalized.specs} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Failure groups</h2>
        <SystemTestsFailureGroupsPanel
          groups={normalized.failureGroups}
          failureProfiles={historicalAnalysis.failureProfiles}
          historyLoading={historyLoading}
        />
      </section>

      <SystemTestsHistoricalInsightsPanel
        insights={historicalAnalysis.historicalInsights}
        chronologyNote={historicalAnalysis.historyChronologyNote}
        loading={historyLoading}
        historyWindowSize={historicalAnalysis.historyWindowSize}
      />
      <SystemTestsRerunPriorityPanel
        groups={normalized.failureGroups}
        profiles={historicalAnalysis.failureProfiles}
        loading={historyLoading}
      />
      <SystemTestsUnstableFilesPanel files={historicalAnalysis.unstableFiles} loading={historyLoading} />

      {detail.diagnosticReport?.trim() ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Raw evidence</h2>
          <p className="text-xs text-white/45">Diagnostic bundle generated at ingest ({formatDateTime(detail.run.createdAt)}).</p>
          <pre className="max-h-[480px] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-white/80 whitespace-pre-wrap">
            {detail.diagnosticReport}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
