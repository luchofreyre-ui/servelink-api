import { EncyclopediaBatchRunsTable } from "@/components/admin/authority/EncyclopediaBatchRunsTable";
import {
  loadEncyclopediaBatchPipelineRuns,
  summarizeBatchReports,
} from "@/lib/encyclopedia/batchReports";

export const dynamic = "force-dynamic";

export default function AdminAuthorityEncyclopediaBatchesPage() {
  const runs = loadEncyclopediaBatchPipelineRuns();
  const aggregates = summarizeBatchReports(runs);

  return (
    <main
      className="min-h-screen bg-neutral-950 px-6 py-10 text-white"
      data-testid="admin-authority-batches-page"
    >
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Admin · Authority · Encyclopedia
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Encyclopedia batch runs</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            Pipeline summaries from{" "}
            <code className="text-white/55">content-batches/encyclopedia/reports/*.pipeline-summary.json</code>.
            Newest runs first.
          </p>
          <p className="mt-2 text-xs text-white/40">
            {aggregates.totalRuns} run{aggregates.totalRuns === 1 ? "" : "s"} loaded · {aggregates.gapRuns} gap ·{" "}
            {aggregates.expandedRuns} expanded
          </p>
        </div>

        {runs.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-black/25 p-6 text-sm text-white/55">
            No pipeline summary files found. Run{" "}
            <code className="text-white/65">npm run run:encyclopedia-batch</code> to generate reports.
          </p>
        ) : (
          <EncyclopediaBatchRunsTable runs={runs} aggregates={aggregates} />
        )}
      </div>
    </main>
  );
}
