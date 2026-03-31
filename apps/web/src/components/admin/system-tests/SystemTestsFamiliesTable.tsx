"use client";

import Link from "next/link";
import type { SystemTestFamilyListItemApi } from "@/lib/api/systemTestFamilies";
import { buildFamilyQuickFixText } from "@/lib/system-tests/quickFixCopy";
import type { SystemTestFamilyOperatorState } from "@/types/systemTestResolution";
import { SystemTestsCopyQuickFixButton } from "./SystemTestsCopyQuickFixButton";
import { SystemTestsOperatorStateActions } from "./SystemTestsOperatorStateActions";
import { SystemTestsOperatorStateBadge } from "./SystemTestsOperatorStateBadge";
import { SystemTestsLifecycleBadge } from "./SystemTestsLifecycleBadge";
import { SystemTestsResolutionPreview } from "./SystemTestsResolutionPreview";

type Props = {
  items: SystemTestFamilyListItemApi[];
  onFamilyOperatorStateUpdated?: (familyId: string, next: SystemTestFamilyOperatorState) => void;
};

export function SystemTestsFamiliesTable(props: Props) {
  const { items, onFamilyOperatorStateUpdated } = props;

  if (!items.length) {
    return <p className="text-sm text-white/55">No failure families yet. Ingest runs with rich evidence to cluster.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="px-4 py-3 font-semibold">Family</th>
            <th className="min-w-[14rem] max-w-md px-4 py-3 font-semibold">Fix opportunity</th>
            <th className="min-w-[10rem] px-4 py-3 font-semibold">Operator state</th>
            <th className="min-w-[9rem] px-4 py-3 font-semibold">Lifecycle</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Trend</th>
            <th className="px-4 py-3 font-semibold">Recurrence</th>
            <th className="px-4 py-3 font-semibold">Runs / files</th>
            <th className="px-4 py-3 font-semibold">Signals</th>
            <th className="px-4 py-3 font-semibold" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-white/80">
          {items.map((row) => (
            <tr key={row.id} className="hover:bg-white/[0.02]">
              <td className="max-w-md px-4 py-3">
                <p className="font-medium text-white">{row.displayTitle}</p>
                <p className="mt-1 font-mono text-[10px] text-white/35">{row.id.slice(0, 12)}…</p>
              </td>
              <td className="min-w-[14rem] max-w-md px-4 py-3 align-top">
                <div className="flex flex-col gap-1">
                  <SystemTestsResolutionPreview
                    preview={row.resolutionPreview}
                    href={`/admin/system-tests/families/${row.id}`}
                    compact
                  />
                  <SystemTestsCopyQuickFixButton text={buildFamilyQuickFixText(row)} />
                </div>
              </td>
              <td className="min-w-[10rem] px-4 py-3 align-top">
                <div className="flex flex-col gap-1">
                  <SystemTestsOperatorStateBadge state={row.operatorState.state} />
                  <SystemTestsOperatorStateActions
                    familyId={row.id}
                    currentState={row.operatorState.state}
                    compact
                    onUpdated={(next) => onFamilyOperatorStateUpdated?.(row.id, next)}
                  />
                </div>
              </td>
              <td className="min-w-[9rem] px-4 py-3 align-top">
                <div className="flex flex-col gap-1">
                  <SystemTestsLifecycleBadge state={row.lifecycle.lifecycleState} />
                  <p className="text-[10px] text-white/40">
                    Seen in {row.lifecycle.seenInRunCount}/{row.lifecycle.recentRunCountConsidered} runs
                    {row.lifecycle.consecutiveRunCount > 1 ?
                      <> · Streak: {row.lifecycle.consecutiveRunCount}</>
                    : null}
                  </p>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs">{row.status}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs">{row.trendKind}</td>
              <td className="px-4 py-3 text-xs text-white/65">{row.recurrenceLine ?? "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs">
                {row.affectedRunCount} / {row.affectedFileCount}
              </td>
              <td className="max-w-xs px-4 py-3 text-xs text-white/55">
                {[row.primaryAssertionType, row.primaryLocator?.slice(0, 40), row.primaryRouteUrl?.slice(0, 40)]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/system-tests/families/${row.id}`}
                  className="text-sky-300 hover:text-sky-200"
                >
                  Detail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
