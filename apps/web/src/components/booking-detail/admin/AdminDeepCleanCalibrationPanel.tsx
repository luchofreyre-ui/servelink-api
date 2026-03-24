import { DEEP_CLEAN_REVIEW_TAG_LABELS } from "@/constants/deepCleanReviewTags";
import type { DeepCleanCalibrationAdminDisplay } from "@/types/deepCleanProgram";

function fmtInt(n: number | null | undefined): string {
  if (n == null) return "—";
  return String(n);
}

function fmtPercent(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n}%`;
}

function yesNo(v: boolean): string {
  return v ? "Yes" : "No";
}

export function AdminDeepCleanCalibrationPanel({
  calibration,
}: {
  calibration: DeepCleanCalibrationAdminDisplay;
}) {
  const p = calibration.program;

  return (
    <div
      className="mt-6 rounded-[28px] border border-cyan-500/25 bg-black/30 p-6"
      data-testid="admin-deep-clean-calibration"
    >
      <h3 className="text-lg font-semibold text-white">Calibration</h3>
      <p className="mt-1 text-sm text-white/55">
        Estimated vs actual duration from persisted booking-time estimates and
        execution actuals. Operator note present flags only — no note text.
      </p>

      <div className="mt-4 grid gap-3 text-sm text-white/80 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-white/45">
            Estimated duration (program total)
          </div>
          <div className="mt-1 font-semibold text-white">
            {fmtInt(p.estimatedTotalDurationMinutes)} min
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-white/45">
            Actual duration (program total)
          </div>
          <div className="mt-1 font-semibold text-white">
            {p.actualTotalDurationMinutes != null
              ? `${p.actualTotalDurationMinutes} min`
              : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-white/45">
            Variance
          </div>
          <div className="mt-1 font-semibold text-white">
            {fmtInt(p.durationVarianceMinutes)} min
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-white/45">
            Variance %
          </div>
          <div className="mt-1 font-semibold text-white">
            {fmtPercent(p.durationVariancePercent)}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-white/45">
            Completed visits
          </div>
          <div className="mt-1 font-semibold text-white">
            {p.completedVisits} / {p.totalVisits}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-white/45">
            Fully completed
          </div>
          <div className="mt-1 font-semibold text-white">
            {p.isFullyCompleted ? "Yes" : "No"}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-white/45">
            Operator note present (any visit)
          </div>
          <div className="mt-1 font-semibold text-white">
            {yesNo(p.hasAnyOperatorNotes)}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-white/45">
            Usable for calibration analysis
          </div>
          <div className="mt-1 font-semibold text-white">
            {yesNo(p.usableForCalibrationAnalysis)}
          </div>
        </div>
      </div>

      <div
        className="mt-6 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4"
        data-testid="admin-deep-clean-calibration-review"
      >
        <h4 className="text-sm font-semibold text-white">Calibration review</h4>
        <p className="mt-1 text-xs text-white/55">
          Admin judgment on this program calibration (structured tags, not guaranteed truth).
        </p>
        <div className="mt-3 grid gap-3 text-sm text-white/85 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/45">Status</div>
            <div className="mt-1 font-semibold text-white">
              {p.reviewStatus === "reviewed" ? "Reviewed" : "Unreviewed"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-white/45">Reviewed at</div>
            <div className="mt-1 font-semibold text-white">{p.reviewedAt ?? "—"}</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs uppercase tracking-wide text-white/45">Reason tags</div>
          {p.reviewReasonTags?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {p.reviewReasonTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white"
                >
                  {DEEP_CLEAN_REVIEW_TAG_LABELS[t as keyof typeof DEEP_CLEAN_REVIEW_TAG_LABELS] ??
                    t}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-white/50">—</p>
          )}
        </div>
        <div className="mt-3">
          <div className="text-xs uppercase tracking-wide text-white/45">Review note</div>
          <p className="mt-1 text-sm text-white/90 whitespace-pre-wrap">
            {p.reviewNote?.trim() ? p.reviewNote : "—"}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm text-white/85">
          <thead>
            <tr className="border-b border-white/15 text-xs uppercase tracking-wide text-white/50">
              <th className="py-2 pr-3">Visit</th>
              <th className="py-2 pr-3">Estimated duration</th>
              <th className="py-2 pr-3">Actual duration</th>
              <th className="py-2 pr-3">Variance</th>
              <th className="py-2 pr-3">Variance %</th>
              <th className="py-2 pr-3">Execution status</th>
              <th className="py-2 pr-3">Operator note present</th>
              <th className="py-2 pr-3">Completed at</th>
            </tr>
          </thead>
          <tbody>
            {calibration.visits.map((v) => (
              <tr
                key={v.visitNumber}
                className="border-b border-white/10"
                data-testid={`cal-visit-${v.visitNumber}`}
              >
                <td className="py-2 pr-3 font-medium text-white">
                  Visit {v.visitNumber}
                </td>
                <td className="py-2 pr-3">{fmtInt(v.estimatedDurationMinutes)}</td>
                <td className="py-2 pr-3">{fmtInt(v.actualDurationMinutes)}</td>
                <td className="py-2 pr-3">
                  {fmtInt(v.durationVarianceMinutes)}
                </td>
                <td className="py-2 pr-3">
                  {fmtPercent(v.durationVariancePercent)}
                </td>
                <td className="py-2 pr-3">{v.executionStatus}</td>
                <td className="py-2 pr-3">{yesNo(v.hasOperatorNote)}</td>
                <td className="py-2 pr-3 text-white/70">
                  {v.completedAt ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
