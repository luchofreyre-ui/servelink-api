"use client";

import type { SystemTestPipelineJobRow } from "@/types/systemTestsPipeline";

type Props = {
  jobs: SystemTestPipelineJobRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRetry?: (id: string) => void;
  retryBusyId?: string | null;
  loading?: boolean;
};

function statusClass(status: SystemTestPipelineJobRow["status"]): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30";
    case "queued":
      return "bg-sky-500/15 text-sky-200 ring-sky-500/30";
    case "running":
      return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
    case "retrying":
      return "bg-orange-500/15 text-orange-200 ring-orange-500/30";
    case "failed":
    case "dead":
      return "bg-red-500/15 text-red-200 ring-red-500/30";
    default:
      return "bg-white/10 text-white/70 ring-white/15";
  }
}

export function SystemTestsPipelineJobsTable(props: Props) {
  const { jobs, selectedId, onSelect, onRetry, retryBusyId, loading } = props;

  if (loading && jobs.length === 0) {
    return <p className="text-sm text-white/50">Loading pipeline jobs…</p>;
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-white/50">No pipeline jobs yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-xs text-white/80">
        <thead className="border-b border-white/10 bg-white/[0.04] text-[10px] font-semibold uppercase tracking-wide text-white/45">
          <tr>
            <th className="px-3 py-2">Stage</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Run</th>
            <th className="px-3 py-2">Trigger</th>
            <th className="px-3 py-2">Attempts</th>
            <th className="px-3 py-2">Created</th>
            <th className="px-3 py-2">Error</th>
            {onRetry ? <th className="px-3 py-2">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => {
            const sel = j.id === selectedId;
            return (
              <tr
                key={j.id}
                className={`cursor-pointer border-b border-white/5 ${sel ? "bg-sky-500/10" : "hover:bg-white/[0.03]"}`}
                onClick={() => onSelect(j.id)}
              >
                <td className="px-3 py-2 font-mono text-[11px]">{j.stage}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusClass(j.status)}`}
                  >
                    {j.status}
                  </span>
                </td>
                <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[10px] text-white/60">
                  {j.runId ?? "—"}
                </td>
                <td className="px-3 py-2 text-[10px]">{j.triggerSource}</td>
                <td className="px-3 py-2 font-mono text-[10px]">
                  {j.attemptCount}/{j.maxAttempts}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-[10px] text-white/55">
                  {new Date(j.createdAt).toLocaleString()}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 text-[10px] text-red-200/90" title={j.errorMessage ?? ""}>
                  {j.errorMessage ?? "—"}
                </td>
                {onRetry ?
                  <td className="px-3 py-2">
                    {(j.status === "failed" || j.status === "dead") ?
                      <button
                        type="button"
                        className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-medium text-sky-200 hover:bg-white/10 disabled:opacity-40"
                        disabled={retryBusyId === j.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetry(j.id);
                        }}
                      >
                        {retryBusyId === j.id ? "…" : "Retry"}
                      </button>
                    : null}
                  </td>
                : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
