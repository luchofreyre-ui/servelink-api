"use client";

import type { SystemTestsAlert, SystemTestsAlertLevel } from "@/types/systemTests";

type Props = {
  alerts: SystemTestsAlert[];
};

function borderFor(level: SystemTestsAlertLevel): string {
  if (level === "critical") return "border-red-500/35 bg-red-500/10";
  if (level === "warning") return "border-amber-500/30 bg-amber-500/10";
  return "border-sky-500/25 bg-sky-500/10";
}

export function SystemTestsAlertsPanel(props: Props) {
  const { alerts } = props;
  if (!alerts.length) {
    return (
      <section className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-6 text-center text-sm text-white/50">
        No active alerts from recent signals.
      </section>
    );
  }

  const sorted = [...alerts].sort(
    (a, b) => b.weight + b.impactScore - (a.weight + a.impactScore),
  );

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Alerts</h2>
      <div className="space-y-2">
        {sorted.map((a) => (
          <div
            key={a.id}
            className={`rounded-xl border p-4 ${borderFor(a.level)}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-white/55">{a.level}</p>
            <p className="mt-1 text-sm font-semibold text-white">{a.title}</p>
            <p className="mt-2 text-sm font-medium text-white/90">{a.operatorSummary}</p>
            <p className="mt-1 text-sm text-white/65">{a.message}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-emerald-200/85">
              Next step
            </p>
            <p className="mt-1 text-sm text-emerald-100/90">{a.recommendedAction}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
