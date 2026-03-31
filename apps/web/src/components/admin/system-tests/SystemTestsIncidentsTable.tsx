"use client";

import Link from "next/link";
import type { SystemTestIncidentListItemApi } from "@/lib/api/systemTestIncidents";
import { buildIncidentQuickFixText } from "@/lib/system-tests/quickFixCopy";
import type { SystemTestFamilyOperatorState } from "@/types/systemTestResolution";
import { SystemTestsCopyQuickFixButton } from "./SystemTestsCopyQuickFixButton";
import { SystemTestsOperatorStateActions } from "./SystemTestsOperatorStateActions";
import { SystemTestsOperatorStateBadge } from "./SystemTestsOperatorStateBadge";
import { SystemTestsLifecycleBadge } from "./SystemTestsLifecycleBadge";
import { SystemTestsResolutionPreview } from "./SystemTestsResolutionPreview";

type Props = {
  items: SystemTestIncidentListItemApi[];
  onLeadFamilyOperatorStateUpdated?: (
    runId: string,
    incidentKey: string,
    next: SystemTestFamilyOperatorState,
  ) => void;
};

export function SystemTestsIncidentsTable(props: Props) {
  const { items, onLeadFamilyOperatorStateUpdated } = props;

  if (!items.length) {
    return (
      <p className="text-sm text-white/55">
        No incidents yet. Ingest runs with active failure families to synthesize operator incidents.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="px-4 py-3 font-semibold">Incident</th>
            <th className="min-w-[14rem] max-w-md px-4 py-3 font-semibold">Likely fix</th>
            <th className="min-w-[10rem] px-4 py-3 font-semibold">Operator state</th>
            <th className="min-w-[9rem] px-4 py-3 font-semibold">Lifecycle</th>
            <th className="px-4 py-3 font-semibold">Severity</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Trend</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Families / files</th>
            <th className="px-4 py-3 font-semibold">Current run fails</th>
            <th className="px-4 py-3 font-semibold" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-white/80">
          {items.map((row) => (
            <tr key={`${row.runId}:${row.incidentKey}`} className="hover:bg-white/[0.02]">
              <td className="max-w-md px-4 py-3">
                <p className="font-medium text-white">{row.displayTitle}</p>
                <p className="mt-1 line-clamp-2 text-xs text-white/50">{row.summary}</p>
              </td>
              <td className="min-w-[14rem] max-w-md px-4 py-3 align-top">
                <div className="flex flex-col gap-1">
                  <SystemTestsResolutionPreview
                    preview={row.resolutionPreview}
                    href={
                      row.leadFamilyId
                        ? `/admin/system-tests/families/${row.leadFamilyId}`
                        : undefined
                    }
                    compact
                  />
                  <SystemTestsCopyQuickFixButton text={buildIncidentQuickFixText(row)} />
                </div>
              </td>
              <td className="min-w-[10rem] px-4 py-3 align-top">
                {row.leadFamilyId && row.familyOperatorState ?
                  <div className="flex flex-col gap-1">
                    <SystemTestsOperatorStateBadge state={row.familyOperatorState.state} />
                    <SystemTestsOperatorStateActions
                      familyId={row.leadFamilyId}
                      currentState={row.familyOperatorState.state}
                      compact
                      onUpdated={(next) =>
                        onLeadFamilyOperatorStateUpdated?.(row.runId, row.incidentKey, next)
                      }
                    />
                  </div>
                : <span className="text-xs text-white/35">—</span>}
              </td>
              <td className="min-w-[9rem] px-4 py-3 align-top">
                {row.leadFamilyId && row.familyLifecycle ?
                  <div className="flex flex-col gap-1">
                    <SystemTestsLifecycleBadge state={row.familyLifecycle.lifecycleState} />
                    <p className="text-[10px] text-white/40">
                      Seen in {row.familyLifecycle.seenInRunCount}/
                      {row.familyLifecycle.recentRunCountConsidered}
                    </p>
                  </div>
                : <span className="text-xs text-white/35">—</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs">{row.severity}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs">{row.status}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs">{row.trendKind}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-white/55">
                {row.rootCauseCategory}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs">
                {row.affectedFamilyCount} / {row.affectedFileCount}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs">{row.currentRunFailureCount}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/system-tests/incidents/${encodeURIComponent(row.incidentKey)}?runId=${encodeURIComponent(row.runId)}`}
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
