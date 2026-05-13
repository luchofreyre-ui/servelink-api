"use client";

import type { WarehouseOperationalFreshness } from "@/lib/api/operationalIntelligence";

function labelTone(label: WarehouseOperationalFreshness["label"]): string {
  switch (label) {
    case "FRESH":
      return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
    case "STALE":
      return "border-amber-400/35 bg-amber-500/15 text-amber-100";
    case "FAILED":
      return "border-rose-400/35 bg-rose-500/15 text-rose-100";
    case "EMPTY_BUT_VALID":
      return "border-sky-400/35 bg-sky-500/15 text-sky-100";
    case "NOT_REFRESHED":
    default:
      return "border-slate-500/35 bg-slate-800/60 text-slate-200";
  }
}

const DISCLAIMER_LINES = [
  "Warehouse freshness is an analytics-read-model status, not live ops truth.",
  "Live ops tiles remain authoritative for current operational counters.",
  "Empty warehouse panels after a successful refresh indicate missing source data or producer gaps, not necessarily UI failure.",
] as const;

export function AdminWarehouseOperationalFreshnessCallout(props: {
  freshness: WarehouseOperationalFreshness | null | undefined;
}) {
  if (!props.freshness) return null;

  return (
    <div
      className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-[11px] leading-snug text-slate-300"
      aria-label="Warehouse operational freshness"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-500">Warehouse freshness</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${labelTone(props.freshness.label)}`}
        >
          {props.freshness.label}
        </span>
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-500">
        {DISCLAIMER_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
