"use client";

import type { SystemTestsAutomationJobRow } from "@/types/systemTestsAutomation";

type Props = {
  jobs: SystemTestsAutomationJobRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
};

function statusClass(s: SystemTestsAutomationJobRow["status"]): string {
  switch (s) {
    case "sent":
      return "bg-emerald-500/15 text-emerald-100 ring-emerald-500/35";
    case "suppressed":
      return "bg-amber-500/15 text-amber-100 ring-amber-500/35";
    case "failed":
      return "bg-red-500/15 text-red-100 ring-red-500/35";
    case "generated":
      return "bg-cyan-500/15 text-cyan-100 ring-cyan-500/35";
    default:
      return "bg-white/10 text-white/70 ring-white/20";
  }
}

export function SystemTestsAutomationJobsTable(props: Props) {
  const { jobs, selectedId, onSelect, loading } = props;

  if (loading) {
    return <p className="text-sm text-white/55">Loading jobs…</p>;
  }

  if (!jobs.length) {
    return <p className="text-sm text-white/55">No automation jobs yet. Run a manual trigger below.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm text-white/90">
        <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-white/50">
          <tr>
            <th className="px-3 py-2">Created</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Trigger</th>
            <th className="px-3 py-2">Target</th>
            <th className="px-3 py-2">Headline</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr
              key={j.id}
              className={`cursor-pointer border-b border-white/5 hover:bg-white/[0.04] ${
                selectedId === j.id ? "bg-violet-500/10" : ""
              }`}
              onClick={() => onSelect(j.id)}
            >
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-white/65">
                {new Date(j.createdAt).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-white/80">{j.type}</td>
              <td className="px-3 py-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${statusClass(j.status)}`}>
                  {j.status}
                </span>
              </td>
              <td className="px-3 py-2 text-white/60">{j.triggerSource}</td>
              <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs text-white/55">
                {j.targetRunId ?? "—"}
              </td>
              <td className="max-w-[200px] truncate px-3 py-2 text-white/70">{j.headline ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
