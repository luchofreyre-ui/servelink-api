"use client";

import { useEffect, useState } from "react";

import {
  listGapResolutionAuditEntries,
  type GapResolutionAuditEntry,
} from "@/lib/funnel/funnelGapResolution";

export function MonetizationGapActionReport() {
  const [entries, setEntries] = useState<GapResolutionAuditEntry[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setEntries(listGapResolutionAuditEntries());
  }, [tick]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-neutral-900">Gap resolution actions</h2>
        <button
          type="button"
          className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
          onClick={() => setTick((n) => n + 1)}
        >
          Refresh
        </button>
      </div>
      <p className="mb-2 text-xs text-neutral-500">
        Audit trail for this browser (newest first). Bulk actions without notes appear here too.
      </p>
      {entries.length === 0 ?
        <p className="text-xs text-neutral-600">No actions recorded yet.</p>
      : <ul className="max-h-64 space-y-1 overflow-y-auto text-xs text-neutral-600">
          {entries.map((e) => (
            <li key={e.id} className="border-b border-neutral-100 pb-1 last:border-0">
              <span className="text-neutral-400">{e.at}</span>
              {" · "}
              <span className="font-medium text-neutral-800">{e.problemSlug}</span>
              {" · "}
              {e.action}
              {e.gapCode ? ` · [${e.gapCode}]` : ""}
              {e.note ? ` · ${e.note}` : ""}
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
