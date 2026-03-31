import { buildClusterDensityReport } from "@/lib/encyclopedia/clusterDensity";
import { loadEncyclopediaIndexEntriesForAnalysis } from "@/lib/encyclopedia/loadEncyclopediaIndexEntries";

export const dynamic = "force-dynamic";

export default function AdminClusterDensityPage() {
  const entries = loadEncyclopediaIndexEntriesForAnalysis();
  const report = buildClusterDensityReport(entries, new Date().toISOString());

  return (
    <main
      className="min-h-screen bg-neutral-950 px-6 py-10 text-white"
      data-testid="admin-cluster-density-page"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Admin · Authority · Encyclopedia
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Cluster density</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            Published file-backed encyclopedia pages only. Status:{" "}
            <span className="text-rose-200/80">thin</span> (&lt; 5 pages or no problems+methods),{" "}
            <span className="text-amber-200/80">developing</span>,{" "}
            <span className="text-emerald-200/80">dense</span> (≥12 pages, problems+methods, plus question
            / comparison / guide signal).
          </p>
          <p className="mt-2 text-xs text-white/40">
            Generated {report.generatedAt} · {entries.length} pages · {report.totalClusters} clusters
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-white/55">
              <tr>
                <th className="p-2 font-semibold">Cluster</th>
                <th className="p-2 font-semibold">Status</th>
                <th className="p-2 font-semibold">Total</th>
                <th className="p-2 font-semibold">P</th>
                <th className="p-2 font-semibold">M</th>
                <th className="p-2 font-semibold">S</th>
                <th className="p-2 font-semibold">Q</th>
                <th className="p-2 font-semibold">Cmp</th>
                <th className="p-2 font-semibold">G</th>
                <th className="p-2 font-semibold">Missing</th>
                <th className="p-2 font-semibold">Samples</th>
              </tr>
            </thead>
            <tbody>
              {[...report.rows]
                .sort((a, b) => b.counts.total - a.counts.total)
                .map((row) => (
                  <tr key={row.clusterSlug} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-2 font-medium text-white/85">{row.clusterLabel}</td>
                    <td className="p-2 text-white/70">{row.status}</td>
                    <td className="p-2">{row.counts.total}</td>
                    <td className="p-2 text-white/60">{row.counts.problems}</td>
                    <td className="p-2 text-white/60">{row.counts.methods}</td>
                    <td className="p-2 text-white/60">{row.counts.surfaces}</td>
                    <td className="p-2 text-white/60">{row.counts.questions}</td>
                    <td className="p-2 text-white/60">{row.counts.comparisons}</td>
                    <td className="p-2 text-white/60">{row.counts.guides}</td>
                    <td className="max-w-[200px] p-2 text-amber-200/70">
                      {[
                        !row.missing.hasProblemPages && "problems",
                        !row.missing.hasMethodPages && "methods",
                        !row.missing.hasQuestionPages && "questions",
                        !row.missing.hasComparisonPages && "cmp",
                        !row.missing.hasSurfaceCoverage && "surface",
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="max-w-[240px] truncate p-2 font-mono text-[10px] text-white/45" title={row.sampleSlugs.join(", ")}>
                      {row.sampleSlugs.join(", ")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-white/40">
          JSON report:{" "}
          <code className="text-white/55">npm run report:encyclopedia-cluster-density</code> →{" "}
          <code className="text-white/55">content-batches/encyclopedia/reports/cluster-density-report.json</code>
        </p>
      </div>
    </main>
  );
}
