"use client";

import type { EncyclopediaThroughputCounts } from "@/lib/encyclopedia/encyclopediaThroughputMetrics.server";
import type { PublishQueueRecord } from "@/lib/encyclopedia/publishQueueTypes";
import type { OpsMetrics } from "@/lib/encyclopedia/opsMetrics";
import type { WeakPageRepairRecord } from "@/lib/encyclopedia/repairWorkflowTypes";

type Props = {
  metrics: OpsMetrics;
  queue: PublishQueueRecord[];
  throughput: EncyclopediaThroughputCounts;
  weakPages: WeakPageRepairRecord[];
  completedRepairsCount: number;
  openRewritesLeaderboard: { slug: string; openRewriteCount: number }[];
  pagesWithNotesCount: number;
  completedRepairsLeaderboard: {
    slug: string;
    attachedEvidenceCount: number;
    openRewriteCount: number;
  }[];
  pagesWithRewriteDraftsCount: number;
  rewriteDraftLeaderboard: {
    slug: string;
    openRewriteDraftCount: number;
    openRewriteCount: number;
  }[];
  appliedRewritesCount: number;
  rewriteApplicationsLeaderboard: {
    slug: string;
    rewriteApplicationCount: number;
    openRewriteDraftCount: number;
    openRewriteCount: number;
  }[];
  readyForApprovalCount: number;
  notReadyForApprovalCount: number;
  repairReadinessLeaderboard: {
    slug: string;
    reasons: string[];
  }[];
  batchActionEligibleCount: number;
};

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

/** Legacy file-backed pipeline metrics and lists only (no mutations). */
export default function EncyclopediaOpsDashboard({
  metrics,
  queue,
  throughput,
  weakPages,
  completedRepairsCount,
  openRewritesLeaderboard,
  pagesWithNotesCount,
  completedRepairsLeaderboard,
  pagesWithRewriteDraftsCount,
  rewriteDraftLeaderboard,
  appliedRewritesCount,
  rewriteApplicationsLeaderboard,
  readyForApprovalCount,
  notReadyForApprovalCount,
  repairReadinessLeaderboard,
  batchActionEligibleCount,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Legacy pipeline ops are read-only. Operational actions now run through
        the API-backed encyclopedia review system.
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-slate-800">
          Throughput (canonical pipeline, reference)
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard
            label="Generated, not ingested"
            value={throughput.generatedNotIngested}
          />
          <MetricCard
            label="Ingested, pending review"
            value={throughput.ingestedPendingReview}
          />
          <MetricCard
            label="Approved, not promoted"
            value={throughput.approvedNotPromoted}
          />
          <MetricCard label="Promoted (live store)" value={throughput.promoted} />
          <MetricCard label="Failed promotion" value={throughput.failedPromotion} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        <MetricCard label="Total pages" value={metrics.totalPages} />
        <MetricCard label="Approved pages" value={metrics.approvedPages} />
        <MetricCard label="Queued pages" value={metrics.queuedPages} />
        <MetricCard label="Published pages" value={metrics.publishedPages} />
        <MetricCard label="Weak pages" value={weakPages.length} />
        <MetricCard label="Completed repairs" value={completedRepairsCount} />
        <MetricCard label="Pages with notes" value={pagesWithNotesCount} />
        <MetricCard
          label="Pages with rewrite drafts"
          value={pagesWithRewriteDraftsCount}
        />
        <MetricCard label="Applied rewrites" value={appliedRewritesCount} />
        <MetricCard label="Ready for approval" value={readyForApprovalCount} />
        <MetricCard label="Not ready" value={notReadyForApprovalCount} />
        <MetricCard
          label="Batch-action eligible"
          value={batchActionEligibleCount}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Policy passed" value={metrics.policyPassedPages} />
        <MetricCard label="Policy failed" value={metrics.policyFailedPages} />
        <MetricCard label="Draft" value={metrics.byReviewStatus.draft} />
        <MetricCard label="Rejected" value={metrics.byReviewStatus.rejected} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Low risk" value={metrics.byRiskLevel.low} />
        <MetricCard label="Medium risk" value={metrics.byRiskLevel.medium} />
        <MetricCard label="High risk" value={metrics.byRiskLevel.high} />
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Approval blockers</div>
          <div className="text-sm text-neutral-500">Weak pages not ready</div>
        </div>
        <div className="space-y-3">
          {repairReadinessLeaderboard.length ? (
            repairReadinessLeaderboard.map((row) => (
              <div key={row.slug} className="rounded-2xl border p-3 text-sm">
                <div className="font-medium break-all">{row.slug}</div>
                <div className="mt-1 text-xs text-neutral-600">
                  {row.reasons.join(", ")}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No approval blockers in the weak-page queue.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Completed repairs</div>
          <div className="text-sm text-neutral-500">Weak pages, top by evidence</div>
        </div>
        <div className="space-y-3">
          {completedRepairsLeaderboard.length ? (
            completedRepairsLeaderboard.map((row) => (
              <div
                key={row.slug}
                className="flex flex-col gap-1 rounded-2xl border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0 break-all font-medium">{row.slug}</span>
                <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
                  <span className="rounded-full border bg-neutral-50 px-2 py-1">
                    Evidence {row.attachedEvidenceCount}
                  </span>
                  <span className="rounded-full border bg-neutral-50 px-2 py-1">
                    Open rewrites {row.openRewriteCount}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No completed repairs in the weak-page queue.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Rewrite drafts</div>
          <div className="text-sm text-neutral-500">Weak pages with saved drafts</div>
        </div>
        <div className="space-y-3">
          {rewriteDraftLeaderboard.length ? (
            rewriteDraftLeaderboard.map((row) => (
              <div
                key={row.slug}
                className="flex flex-col gap-1 rounded-2xl border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0 break-all font-medium">{row.slug}</span>
                <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
                  <span className="rounded-full border bg-neutral-50 px-2 py-1">
                    Drafts {row.openRewriteDraftCount}
                  </span>
                  <span className="rounded-full border bg-neutral-50 px-2 py-1">
                    Open rewrites {row.openRewriteCount}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No rewrite drafts in the weak-page queue.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Applied rewrites</div>
          <div className="text-sm text-neutral-500">Weak pages by applications</div>
        </div>
        <div className="space-y-3">
          {rewriteApplicationsLeaderboard.length ? (
            rewriteApplicationsLeaderboard.map((row) => (
              <div
                key={row.slug}
                className="flex flex-col gap-1 rounded-2xl border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0 break-all font-medium">{row.slug}</span>
                <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
                  <span className="rounded-full border bg-neutral-50 px-2 py-1">
                    Applied {row.rewriteApplicationCount}
                  </span>
                  <span className="rounded-full border bg-neutral-50 px-2 py-1">
                    Drafts {row.openRewriteDraftCount}
                  </span>
                  <span className="rounded-full border bg-neutral-50 px-2 py-1">
                    Open rewrites {row.openRewriteCount}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No applied rewrites in the weak-page queue.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Open rewrites</div>
          <div className="text-sm text-neutral-500">Top slugs by open tasks</div>
        </div>
        <div className="space-y-3">
          {openRewritesLeaderboard.length ? (
            openRewritesLeaderboard.map((row) => (
              <div
                key={row.slug}
                className="flex items-center justify-between rounded-2xl border p-3 text-sm"
              >
                <span className="min-w-0 break-all font-medium">{row.slug}</span>
                <span className="shrink-0 rounded-full border bg-neutral-50 px-2 py-1 text-xs">
                  {row.openRewriteCount} open
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No open rewrite tasks across pages.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Weak-page repair queue</div>
          <div className="text-sm text-neutral-500">
            Pages needing remediation: {weakPages.length}
          </div>
        </div>
        <div className="space-y-3">
          {weakPages.length ? (
            weakPages.slice(0, 8).map((page) => (
              <div key={page.slug} className="rounded-2xl border p-4">
                <div className="text-sm font-semibold">{page.title}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  {page.riskLevel} • quality {page.qualityOverall}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {page.publishFailureReasons.slice(0, 3).map((reason) => (
                    <span key={reason} className="rounded-full border bg-red-50 px-2 py-1">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No weak pages right now.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Publish queue</div>
          <div className="text-sm text-neutral-500">
            Failed: {metrics.failedPages}
          </div>
        </div>
        <div className="space-y-3">
          {queue.length ? (
            queue.map((record) => (
              <div key={record.slug} className="rounded-2xl border p-4">
                <div className="text-sm font-semibold">{record.title}</div>
                <div className="mt-1 break-all text-xs text-neutral-500">
                  {record.slug}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border px-2 py-1">
                    {record.status}
                  </span>
                  <span className="rounded-full border px-2 py-1">
                    queued {record.queuedAt}
                  </span>
                  {record.publishedAt ? (
                    <span className="rounded-full border px-2 py-1">
                      published {record.publishedAt}
                    </span>
                  ) : null}
                  {record.failedAt ? (
                    <span className="rounded-full border px-2 py-1">
                      failed {record.failedAt}
                    </span>
                  ) : null}
                </div>
                {record.error ? (
                  <div className="mt-2 text-sm text-red-600">{record.error}</div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-neutral-500">
              No publish queue items yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
