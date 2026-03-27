"use client";

import type { SystemTestsFailurePattern, SystemTestsFailurePatternSeverity } from "@/types/systemTests";
import { SystemTestsBadge } from "./SystemTestsBadge";

type Props = {
  patterns: SystemTestsFailurePattern[];
  loading?: boolean;
  scopeNote?: string;
};

function severityBadge(s: SystemTestsFailurePatternSeverity): "critical" | "warning" | "stable" {
  if (s === "high") return "critical";
  if (s === "medium") return "warning";
  return "stable";
}

export function SystemTestsFailurePatternsPanel(props: Props) {
  const { patterns, loading, scopeNote } = props;
  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/55">
        Loading failure patterns…
      </section>
    );
  }
  if (!patterns.length) {
    return (
      <section className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-6 text-center text-sm text-white/50">
        No clustered failure patterns in the recent window.
      </section>
    );
  }

  const top = patterns.slice(0, 12);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Failure patterns</h2>
      <p className="text-sm text-white/55">
        Grouped by normalized error text — spikes in the latest run weigh heavier.
      </p>
      {scopeNote ? <p className="text-xs text-sky-200/80">{scopeNote}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {top.map((p) => (
          <div
            key={p.patternKey}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <SystemTestsBadge variant={severityBadge(p.severity)}>{p.severity}</SystemTestsBadge>
              <span className="text-sm font-semibold text-white">{p.label}</span>
            </div>
            <p className="mt-2 font-mono text-[11px] leading-snug text-white/50 line-clamp-2" title={p.signature}>
              {p.signature || p.patternKey}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/60">
              <span>hits: {p.count}</span>
              <span>latest run: {p.latestRunCount}</span>
              <span>files: {p.affectedFiles.length}</span>
              <span>cases: {p.affectedCases.length}</span>
            </div>
            {p.examples.length ? (
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-red-200/80">
                {p.examples.slice(0, 2).map((ex, i) => (
                  <li key={i} className="line-clamp-2">
                    {ex}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
