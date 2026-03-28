"use client";

type Props = {
  insights: string[];
};

export function SystemTestsOperatorInsightsPanel(props: Props) {
  const { insights } = props;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Operator insights</h2>
      <p className="text-xs text-white/45">Deterministic signals derived from this comparison only (no LLM).</p>
      {!insights.length ? (
        <p className="text-sm text-white/55">No insights to show.</p>
      ) : (
        <ul className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          {insights.map((line, i) => (
            <li key={`${i}-${line.slice(0, 48)}`} className="flex gap-2 text-sm text-white/85">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/90" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
