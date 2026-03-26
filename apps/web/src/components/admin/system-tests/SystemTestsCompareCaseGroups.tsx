"use client";

import { useState } from "react";
import type { SystemTestsCompareCaseGroup } from "@/types/systemTests";
import { formatDurationMs } from "./systemTestsFormatting";

type Props = {
  title: string;
  groups: SystemTestsCompareCaseGroup[];
  variant: "new" | "resolved" | "persistent" | "flaky";
};

const ring: Record<Props["variant"], string> = {
  new: "border-emerald-500/25",
  resolved: "border-sky-500/25",
  persistent: "border-amber-500/25",
  flaky: "border-fuchsia-500/25",
};

export function SystemTestsCompareCaseGroups(props: Props) {
  const { title, groups, variant } = props;

  if (!groups.length) {
    return (
      <div className="rounded-xl border border-white/10 border-dashed bg-white/[0.02] p-6 text-center text-sm text-white/45">
        No cases in <span className="text-white/70">{title}</span>.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <div className="space-y-3">
        {groups.map((g) => (
          <CaseRow key={g.key} group={g} ringClass={ring[variant]} />
        ))}
      </div>
    </section>
  );
}

function CaseRow(props: {
  group: SystemTestsCompareCaseGroup;
  ringClass: string;
}) {
  const { group, ringClass } = props;
  const [open, setOpen] = useState(false);
  const b = group.baseCase;
  const t = group.targetCase;
  const stack = t?.errorStack ?? b?.errorStack;

  return (
    <div className={`rounded-xl border bg-white/[0.03] p-4 ${ringClass}`}>
      <p className="text-sm font-medium text-white">{group.title}</p>
      <p className="mt-1 font-mono text-[11px] text-white/40">{group.key}</p>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <p className="text-white/45">Base</p>
          <p className="text-white/85">{b?.status ?? "—"}</p>
          <p className="mt-1 text-white/55">{b?.route ?? "—"}</p>
          <p className="text-white/55">{b?.selector ?? "—"}</p>
          <p className="mt-1 text-red-200/80">{b?.errorMessage ?? "—"}</p>
          <p className="text-white/45">{b ? formatDurationMs(b.durationMs) : "—"}</p>
        </div>
        <div>
          <p className="text-white/45">Target</p>
          <p className="text-white/85">{t?.status ?? "—"}</p>
          <p className="mt-1 text-white/55">{t?.route ?? "—"}</p>
          <p className="text-white/55">{t?.selector ?? "—"}</p>
          <p className="mt-1 text-red-200/80">{t?.errorMessage ?? "—"}</p>
          <p className="text-white/45">{t ? formatDurationMs(t.durationMs) : "—"}</p>
        </div>
      </div>
      {stack ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-xs font-medium text-sky-300 hover:text-sky-200"
          >
            {open ? "Hide stack" : "Show stack"}
          </button>
          {open ? (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-[10px] text-white/75">
              {stack}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
