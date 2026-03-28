"use client";

import Link from "next/link";
import type { SystemTestFamilyListItemApi } from "@/lib/api/systemTestFamilies";

type Props = {
  items: SystemTestFamilyListItemApi[];
};

export function SystemTestsFamiliesTable(props: Props) {
  const { items } = props;

  if (!items.length) {
    return <p className="text-sm text-white/55">No failure families yet. Ingest runs with rich evidence to cluster.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="px-4 py-3 font-semibold">Family</th>
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
