"use client";

import type {
  SystemTestsDurationRegression,
  SystemTestsHistoricalCaseRef,
  SystemTestsHistoricalChanges,
} from "@/types/systemTests";
import { formatDurationMs } from "./systemTestsFormatting";
import { SystemTestsBadge } from "./SystemTestsBadge";

type BadgeVariant = "flaky" | "persistent" | "newRegression" | "resolved" | "critical" | "warning" | "stable";

function CaseList(props: {
  title: string;
  items: SystemTestsHistoricalCaseRef[];
  badgeVariant: BadgeVariant;
  empty: string;
}) {
  if (!props.items.length) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <h3 className="text-sm font-semibold text-white">{props.title}</h3>
        <p className="mt-2 text-sm text-white/45">{props.empty}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-white">{props.title}</h3>
        <SystemTestsBadge variant={props.badgeVariant}>{props.items.length}</SystemTestsBadge>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {props.items.slice(0, 12).map((c) => (
          <li key={c.caseKey} className="border-b border-white/5 pb-2 last:border-0">
            <p className="font-medium text-white">{c.title}</p>
            <p className="font-mono text-[11px] text-white/45">{c.filePath}</p>
            {c.detail ? <p className="mt-1 text-xs text-white/55">{c.detail}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DurationList(props: { title: string; rows: SystemTestsDurationRegression[]; empty: string }) {
  if (!props.rows.length) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-sm font-semibold text-white">{props.title}</p>
        <p className="mt-2 text-sm text-white/45">{props.empty}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">{props.title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {props.rows.slice(0, 10).map((r) => (
          <li key={r.caseKey} className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-2">
            <div>
              <p className="font-medium text-white">{r.title}</p>
              <p className="font-mono text-[11px] text-white/45">{r.filePath}</p>
            </div>
            <div className="text-right text-xs text-amber-200/90">
              +{formatDurationMs(r.deltaMs)}
              <span className="block text-white/45">
                {formatDurationMs(r.previousDurationMs)} → {formatDurationMs(r.latestDurationMs)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  historical: SystemTestsHistoricalChanges | null;
  loading?: boolean;
  scopeNote?: string;
  emptyHint?: string;
};

export function SystemTestsHistoricalChangesPanel(props: Props) {
  const { historical, loading, scopeNote, emptyHint } = props;

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/55">
        Loading historical diff…
      </section>
    );
  }

  if (!historical) {
    return (
      <section className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-6 text-center text-sm text-white/50">
        {emptyHint ?? "Waiting for at least two trusted runs before showing historical changes."}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Historical changes</h2>
      <p className="text-sm text-white/55">
        Latest vs prior run in the fetched window, plus duration movers.
      </p>
      {scopeNote ? <p className="text-xs text-sky-200/80">{scopeNote}</p> : null}
      <div className="grid gap-3 lg:grid-cols-2">
        <CaseList
          title="New regressions"
          items={historical.newRegressions}
          badgeVariant="newRegression"
          empty="None — no new failures vs prior run."
        />
        <CaseList
          title="Resolved"
          items={historical.resolvedFailures}
          badgeVariant="resolved"
          empty="None vs prior run."
        />
        <CaseList
          title="Persistent failures"
          items={historical.persistentFailures}
          badgeVariant="persistent"
          empty="No repeated failures in window."
        />
        <CaseList
          title="New passes"
          items={historical.newPasses}
          badgeVariant="stable"
          empty="None."
        />
        <CaseList
          title="Added cases"
          items={historical.addedCases}
          badgeVariant="warning"
          empty="No new case rows vs prior run."
        />
        <CaseList
          title="Removed cases"
          items={historical.removedCases}
          badgeVariant="warning"
          empty="No removed case rows."
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <DurationList
          title="Slowdowns (≥25% & meaningful delta)"
          rows={historical.slowestRegressions}
          empty="No significant slowdowns vs prior run."
        />
        <DurationList
          title="Largest duration increases"
          rows={historical.biggestDurationDeltas}
          empty="No duration increases tracked."
        />
      </div>
    </section>
  );
}
