import type { DeepCleanInsightsSummaryDisplay } from "@/mappers/deepCleanInsightsMappers";

function fmtAvg(n: number | null, suffix: string): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n}${suffix}`;
}

export function DeepCleanInsightsSummaryCards(props: { summary: DeepCleanInsightsSummaryDisplay }) {
  const { summary } = props;
  const cards: { label: string; value: string }[] = [
    { label: "Reviewed programs", value: String(summary.totalReviewedPrograms) },
    { label: "Estimator issue", value: String(summary.reviewedEstimatorIssuePrograms) },
    { label: "Operational issue", value: String(summary.reviewedOperationalIssuePrograms) },
    { label: "Scope issue", value: String(summary.reviewedScopeIssuePrograms) },
    {
      label: "Avg reviewed variance (minutes)",
      value: fmtAvg(summary.averageReviewedVarianceMinutes, " min"),
    },
    {
      label: "Avg reviewed variance %",
      value: summary.averageReviewedVariancePercent != null
        ? `${summary.averageReviewedVariancePercent}%`
        : "—",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
