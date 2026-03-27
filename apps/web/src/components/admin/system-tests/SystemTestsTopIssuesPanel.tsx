"use client";

import type { SystemTestsTopProblemItem, SystemTestsTopProblemSeverity } from "@/types/systemTests";
import { SystemTestsBadge } from "./SystemTestsBadge";

type Props = {
  items: SystemTestsTopProblemItem[];
  loading?: boolean;
};

function severityToBadge(s: SystemTestsTopProblemSeverity): "critical" | "warning" | "stable" {
  if (s === "high") return "critical";
  if (s === "medium") return "warning";
  return "stable";
}

function typeLabel(t: SystemTestsTopProblemItem["type"]): string {
  switch (t) {
    case "regression":
      return "Regression";
    case "pattern":
      return "Pattern";
    case "flaky":
      return "Flaky";
    case "duration":
      return "Duration";
    default:
      return t;
  }
}

export function SystemTestsTopIssuesPanel(props: Props) {
  const { items, loading } = props;

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/55">
        Ranking top issues…
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-6 text-center text-sm text-white/50">
        No prioritized issues right now — suite looks steady in this window.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-white">Top issues</h2>
        <p className="mt-1 text-sm text-white/55">
          Ranked for triage — start at the top and work down.
        </p>
      </div>
      <ol className="space-y-3">
        {items.map((it, i) => (
          <li
            key={`${it.type}-${it.title}-${i}`}
            className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white/90">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SystemTestsBadge variant={severityToBadge(it.severity)}>{it.severity}</SystemTestsBadge>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  {typeLabel(it.type)}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">{it.title}</p>
              <p className="text-sm leading-relaxed text-white/70">{it.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
