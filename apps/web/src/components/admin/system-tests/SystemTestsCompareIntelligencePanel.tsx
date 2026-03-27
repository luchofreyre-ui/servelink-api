"use client";

import type { SystemTestsCompareIntelligence } from "@/types/systemTests";
import { formatDurationMs } from "./systemTestsFormatting";
import { SystemTestsBadge } from "./SystemTestsBadge";

type Props = {
  intelligence: SystemTestsCompareIntelligence;
};

function MiniList(props: {
  title: string;
  items: { caseKey: string; title: string; filePath: string; detail?: string }[];
  variant: "flaky" | "persistent" | "newRegression" | "resolved" | "critical" | "warning" | "stable";
  empty: string;
}) {
  if (!props.items.length) {
    return (
      <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{props.title}</p>
        <p className="mt-1 text-sm text-white/45">{props.empty}</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{props.title}</p>
        <SystemTestsBadge variant={props.variant}>{props.items.length}</SystemTestsBadge>
      </div>
      <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
        {props.items.slice(0, 8).map((c) => (
          <li key={c.caseKey} className="truncate text-white/85" title={c.caseKey}>
            {c.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SystemTestsCompareIntelligencePanel(props: Props) {
  const i = props.intelligence;
  const flakyHints = i.flakyHintsForChangedFailures.filter((h) => h.historicallyFlaky);

  return (
    <section className="space-y-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Run intelligence</h2>
        <p className="mt-1 text-sm text-white/55">
          Base → target diff beyond raw case groups. Flaky hints use recent runs when loaded.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MiniList
          title="New regressions"
          items={i.newRegressions}
          variant="newRegression"
          empty="None"
        />
        <MiniList
          title="Resolved"
          items={i.resolvedFailures}
          variant="resolved"
          empty="None"
        />
        <MiniList
          title="Persistent"
          items={i.persistentFailures}
          variant="persistent"
          empty="None"
        />
        <MiniList title="New passes" items={i.newPasses} variant="stable" empty="None" />
        <MiniList title="Added cases" items={i.addedCases} variant="warning" empty="None" />
        <MiniList title="Removed cases" items={i.removedCases} variant="warning" empty="None" />
      </div>

      {i.slowestRegressions.length ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Duration regressions
          </p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            {i.slowestRegressions.slice(0, 6).map((r) => (
              <li key={r.caseKey} className="flex justify-between gap-2">
                <span className="truncate">{r.title}</span>
                <span className="shrink-0 text-amber-200/90">+{formatDurationMs(r.deltaMs)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {flakyHints.length ? (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
          <p className="text-sm font-semibold text-amber-100">Historically flaky changed failures</p>
          <p className="mt-1 text-xs text-amber-100/75">
            These failing cases showed instability in recent runs — treat as flaky until proven otherwise.
          </p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-amber-50/90">
            {flakyHints.slice(0, 10).map((h) => (
              <li key={h.caseKey}>
                {h.caseKey.slice(0, 80)}
                {h.caseKey.length > 80 ? "…" : ""}
                <span className="text-white/50">
                  {" "}
                  (score {h.flakyScore?.toFixed(1) ?? "—"}, transitions {h.transitionCount ?? "—"})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
