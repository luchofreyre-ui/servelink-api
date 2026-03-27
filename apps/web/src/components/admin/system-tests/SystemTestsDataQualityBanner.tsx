"use client";

type Props = {
  /** Any local / manual / synthetic runs in the analyzed window. */
  showMixedHistory: boolean;
  /** Trends chart built from all sources because trusted CI rows were sparse. */
  trendUsesAllSources: boolean;
  /** Intelligence fell back because fewer than two trusted CI runs. */
  intelligenceFallback: boolean;
};

export function SystemTestsDataQualityBanner(props: Props) {
  const { showMixedHistory, trendUsesAllSources, intelligenceFallback } = props;
  if (!showMixedHistory && !trendUsesAllSources && !intelligenceFallback) return null;

  const parts: string[] = [];
  if (showMixedHistory) {
    parts.push(
      "Recent history includes local, manual, or synthetic uploads — intelligence may be noisy next to real CI.",
    );
  }
  if (intelligenceFallback) {
    parts.push(
      "Fewer than two runs matched trusted CI heuristics; rankings use every uploaded run in the window.",
    );
  }
  if (trendUsesAllSources && !intelligenceFallback) {
    parts.push("Trend charts include all sources until enough trusted CI runs exist for a dedicated series.");
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
      <p className="font-semibold text-amber-100">Data quality</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-amber-100/90">
        {parts.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
