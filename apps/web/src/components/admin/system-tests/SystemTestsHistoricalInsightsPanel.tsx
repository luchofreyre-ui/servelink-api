"use client";

type Props = {
  insights: string[];
  loading?: boolean;
  historyWindowSize: number;
  chronologyNote?: string | null;
};

export function SystemTestsHistoricalInsightsPanel(props: Props) {
  const { insights, loading, historyWindowSize, chronologyNote } = props;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Historical insights</h2>
      <p className="text-xs text-white/45">
        Prior window: {historyWindowSize} run(s) (excluding this run). Deterministic rules only.
      </p>
      {chronologyNote ? (
        <p className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/95">
          Chronology: {chronologyNote}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-white/55">Loading run history…</p>
      ) : !insights.length ? (
        <p className="text-sm text-white/55">No insights for this context.</p>
      ) : (
        <ul className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          {insights.map((line, i) => (
            <li key={`${i}-${line.slice(0, 40)}`} className="flex gap-2 text-sm text-white/85">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/90" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
