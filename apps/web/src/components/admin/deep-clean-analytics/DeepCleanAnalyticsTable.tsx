import Link from "next/link";
import { DEEP_CLEAN_REVIEW_TAG_LABELS } from "@/constants/deepCleanReviewTags";
import type { DeepCleanAnalyticsRowDisplay } from "@/mappers/deepCleanAnalyticsMappers";

function fmtMin(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n} min`;
}

function fmtPct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n}%`;
}

function fmtDt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function SeverityCell(props: { severity: DeepCleanAnalyticsRowDisplay["severity"] }) {
  if (!props.severity) return <span className="text-slate-400">—</span>;
  const cls =
    props.severity === "high"
      ? "text-red-700"
      : props.severity === "watch"
        ? "text-amber-800"
        : "text-slate-600";
  return <span className={`text-sm font-medium capitalize ${cls}`}>{props.severity}</span>;
}

function ReviewStatusBadge(props: { status: DeepCleanAnalyticsRowDisplay["reviewStatus"] }) {
  if (props.status === "reviewed") {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
        Reviewed
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      Unreviewed
    </span>
  );
}

export function DeepCleanAnalyticsTable(props: {
  rows: DeepCleanAnalyticsRowDisplay[];
  onReviewRow: (row: DeepCleanAnalyticsRowDisplay) => void;
}) {
  if (props.rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No calibration rows for the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className="px-3 py-3">Booking ID</th>
            <th className="px-3 py-3">Program type</th>
            <th className="px-3 py-3">Est. total</th>
            <th className="px-3 py-3">Actual total</th>
            <th className="px-3 py-3">Variance</th>
            <th className="px-3 py-3">Variance %</th>
            <th className="px-3 py-3">Visits complete</th>
            <th className="px-3 py-3">Notes</th>
            <th className="px-3 py-3">Usable</th>
            <th className="px-3 py-3">Review</th>
            <th className="px-3 py-3">Reason tags</th>
            <th className="px-3 py-3">Severity</th>
            <th className="px-3 py-3">Updated at</th>
            <th className="px-3 py-3"> </th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => (
            <tr key={`${r.bookingId}-${r.programId}`} className="border-b border-slate-100">
              <td className="px-3 py-2 font-mono text-xs">
                <Link
                  className="text-blue-700 hover:underline"
                  href={`/admin/bookings/${encodeURIComponent(r.bookingId)}`}
                >
                  {r.bookingId}
                </Link>
              </td>
              <td className="px-3 py-2 text-slate-800">{r.programTypeLabel}</td>
              <td className="px-3 py-2">{fmtMin(r.estimatedTotalDurationMinutes)}</td>
              <td className="px-3 py-2">{fmtMin(r.actualTotalDurationMinutes)}</td>
              <td className="px-3 py-2">{fmtMin(r.durationVarianceMinutes)}</td>
              <td className="px-3 py-2">{fmtPct(r.durationVariancePercent)}</td>
              <td className="px-3 py-2">
                {r.completedVisits}/{r.totalVisits}
              </td>
              <td className="px-3 py-2">{r.hasAnyOperatorNotes ? "Yes" : "No"}</td>
              <td className="px-3 py-2">
                {r.usableForCalibrationAnalysis ? (
                  <span className="text-emerald-700">Yes</span>
                ) : (
                  <span className="text-amber-800">No</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                  <ReviewStatusBadge status={r.reviewStatus} />
                  {r.reviewedAt ? (
                    <span className="text-xs text-slate-500">{fmtDt(r.reviewedAt)}</span>
                  ) : null}
                </div>
              </td>
              <td className="max-w-[200px] px-3 py-2">
                {r.reviewReasonTags.length === 0 ? (
                  <span className="text-slate-400">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {r.reviewReasonTags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-900"
                      >
                        {DEEP_CLEAN_REVIEW_TAG_LABELS[t as keyof typeof DEEP_CLEAN_REVIEW_TAG_LABELS] ??
                          t}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-3 py-2">
                <SeverityCell severity={r.severity} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-slate-600">{fmtDt(r.updatedAt)}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => props.onReviewRow(r)}
                >
                  {r.reviewStatus === "reviewed" ? "Edit review" : "Mark reviewed"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
