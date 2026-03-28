"use client";

import Link from "next/link";
import type { SystemTestIncidentListItemApi } from "@/lib/api/systemTestIncidents";

type Props = {
  items: SystemTestIncidentListItemApi[];
};

export function SystemTestsIncidentsTable(props: Props) {
  const { items } = props;

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
