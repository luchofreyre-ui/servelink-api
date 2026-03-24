import type { DeepCleanAnalyticsSummaryDisplay } from "@/mappers/deepCleanAnalyticsMappers";

function formatMaybeNumber(n: number | null, suffix = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n}${suffix}`;
}

export function DeepCleanAnalyticsSummaryCards(props: {
  summary: DeepCleanAnalyticsSummaryDisplay;
}) {
  const { summary } = props;
  const cards: { label: string; value: string }[] = [
    { label: "Total calibrations", value: String(summary.totalProgramCalibrations) },
    { label: "Usable for calibration", value: String(summary.usableProgramCalibrations) },
    { label: "Fully completed", value: String(summary.fullyCompletedPrograms) },
    { label: "Programs with operator notes", value: String(summary.programsWithOperatorNotes) },
    {
      label: "Average variance (minutes)",
      value: formatMaybeNumber(summary.averageVarianceMinutes, " min"),
    },
    {
      label: "Average variance %",
      value:
        summary.averageVariancePercent != null && Number.isFinite(summary.averageVariancePercent)
          ? `${summary.averageVariancePercent}%`
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
