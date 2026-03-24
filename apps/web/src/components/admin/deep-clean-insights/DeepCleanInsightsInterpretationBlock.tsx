import type { DeepCleanInsightsFingerprint } from "@/analytics/deep-clean/deepCleanInsightsInterpretation";

export function DeepCleanInsightsInterpretationBlock(props: {
  fingerprint: DeepCleanInsightsFingerprint;
}) {
  const { fingerprint } = props;
  const lines: string[] = [];
  if (fingerprint.dominantIssueBucket) {
    lines.push(`Most common reviewed issue: ${fingerprint.dominantIssueBucket}`);
  }
  if (fingerprint.topReviewReason) {
    lines.push(`Top review reason: ${fingerprint.topReviewReason}`);
  }
  if (fingerprint.worstProgramTypeByVariance) {
    lines.push(`Highest average variance: ${fingerprint.worstProgramTypeByVariance} program`);
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No reviewed programs in the current filter — nothing to summarize yet.
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 text-sm text-slate-800"
      data-testid="deep-clean-insights-interpretation"
    >
      <p className="font-semibold text-indigo-950">At a glance</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
