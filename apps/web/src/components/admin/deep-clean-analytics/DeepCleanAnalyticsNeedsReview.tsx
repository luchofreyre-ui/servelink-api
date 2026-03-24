import Link from "next/link";
import type { DeepCleanAnalyticsRowDisplay } from "@/mappers/deepCleanAnalyticsMappers";
import {
  getHighestOverrunRows,
  getHighestUnderrunRows,
  getUnreviewedRowsNeedingReview,
} from "@/analytics/deep-clean/deepCleanAnalyticsSelectors";

function formatVarianceMinutes(m: number | null): string {
  if (m == null || !Number.isFinite(m)) return "—";
  const sign = m > 0 ? "+" : "";
  return `${sign}${m} min`;
}

function SeverityBadge(props: { severity: DeepCleanAnalyticsRowDisplay["severity"] }) {
  if (!props.severity) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const styles =
    props.severity === "high"
      ? "bg-red-100 text-red-800"
      : props.severity === "watch"
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles}`}>
      {props.severity}
    </span>
  );
}

function CompactBookingList(props: {
  title: string;
  rows: DeepCleanAnalyticsRowDisplay[];
  empty: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{props.title}</h3>
      {props.rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{props.empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {props.rows.map((r) => (
            <li key={r.bookingId}>
              <Link
                href={`/admin/bookings/${encodeURIComponent(r.bookingId)}`}
                className="flex flex-wrap items-center gap-2 text-sm text-blue-700 hover:underline"
              >
                <span className="font-mono font-medium">{r.bookingId}</span>
                <SeverityBadge severity={r.severity} />
                <span className="text-slate-600">{formatVarianceMinutes(r.durationVarianceMinutes)}</span>
                {r.hasAnyOperatorNotes ? (
                  <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-800">
                    Notes
                  </span>
                ) : null}
                <span
                  className={
                    r.usableForCalibrationAnalysis ? "text-emerald-700" : "text-amber-800"
                  }
                >
                  {r.usableForCalibrationAnalysis ? "Usable" : "Not usable"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DeepCleanAnalyticsNeedsReview(props: {
  rows: DeepCleanAnalyticsRowDisplay[];
}) {
  const { rows } = props;
  const openRows = rows.filter((r) => r.reviewStatus !== "reviewed");
  const overruns = getHighestOverrunRows(openRows, 8);
  const underruns = getHighestUnderrunRows(openRows, 8);
  const completedNotUsable = openRows.filter(
    (r) => r.isFullyCompleted && !r.usableForCalibrationAnalysis,
  );
  const withNotes = openRows.filter((r) => r.hasAnyOperatorNotes);
  const reviewUnion = getUnreviewedRowsNeedingReview(rows);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Needs review</h2>
        <p className="mt-1 text-sm text-slate-600">
          Unreviewed rows only — clears as you mark bookings reviewed (same loaded window as
          filters, sort, and limit).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CompactBookingList
          title="Highest overruns"
          rows={overruns}
          empty="No positive variance in this window."
        />
        <CompactBookingList
          title="Highest underruns"
          rows={underruns}
          empty="No negative variance in this window."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CompactBookingList
          title="Completed but not usable"
          rows={completedNotUsable}
          empty="None in this window."
        />
        <CompactBookingList
          title="Programs with operator notes"
          rows={withNotes}
          empty="None in this window."
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Combined review queue</h3>
        <p className="mt-1 text-xs text-slate-500">
          Unreviewed rows matching: high variance (|variance %| ≥ 25), operator notes, or completed
          but not usable for calibration.
        </p>
        {reviewUnion.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">None in this window.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {reviewUnion.map((r) => (
              <li key={r.bookingId}>
                <Link
                  href={`/admin/bookings/${encodeURIComponent(r.bookingId)}`}
                  className="flex flex-wrap items-center gap-2 text-sm text-blue-700 hover:underline"
                >
                  <span className="font-mono font-medium">{r.bookingId}</span>
                  <SeverityBadge severity={r.severity} />
                  <span className="text-slate-600">{formatVarianceMinutes(r.durationVarianceMinutes)}</span>
                  {r.hasAnyOperatorNotes ? (
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-800">
                      Notes
                    </span>
                  ) : null}
                  <span
                    className={
                      r.usableForCalibrationAnalysis ? "text-emerald-700" : "text-amber-800"
                    }
                  >
                    {r.usableForCalibrationAnalysis ? "Usable" : "Not usable"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
