import Link from "next/link";

import type { SystemTestRunsListItem } from "@/types/systemTests";

export function SystemTestRunsTable({ items }: { items: SystemTestRunsListItem[] }) {
  if (!items.length) {
    return <div className="p-4 text-sm text-gray-500">No recent system test runs</div>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">Run</th>
          <th className="p-2 text-left">Status</th>
          <th className="p-2 text-left">Failed</th>
          <th className="p-2 text-left">Flaky</th>
          <th className="p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((r) => (
          <tr key={r.id} className="border-b">
            <td className="p-2 font-medium">{r.id}</td>
            <td className="p-2">{r.status}</td>
            <td className="p-2">{r.failedCount}</td>
            <td className="p-2">{r.flakyCount}</td>
            <td className="p-2">
              <Link href={`/admin/system-tests/${encodeURIComponent(r.id)}`} className="underline">
                View run
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
