import ApiEncyclopediaIntakeRunbookPanel from "@/components/admin/encyclopedia/ApiEncyclopediaIntakeRunbookPanel";
import ApiEncyclopediaGenerationFeedbackPanel from "@/components/admin/encyclopedia/ApiEncyclopediaGenerationFeedbackPanel";
import ApiEncyclopediaImportPanel from "@/components/admin/encyclopedia/ApiEncyclopediaImportPanel";
import ApiEncyclopediaInsightsPanel from "@/components/admin/encyclopedia/ApiEncyclopediaInsightsPanel";
import ApiEncyclopediaMigrationPanel from "@/components/admin/encyclopedia/ApiEncyclopediaMigrationPanel";
import ApiEncyclopediaOpsPanel from "@/components/admin/encyclopedia/ApiEncyclopediaOpsPanel";
import EncyclopediaOpsDashboard from "@/components/admin/encyclopedia/EncyclopediaOpsDashboard";
import EncyclopediaWeakPageRepairPanel from "@/components/admin/encyclopedia/EncyclopediaWeakPageRepairPanel";
import FunnelAnalyticsReport from "@/components/admin/analytics/FunnelAnalyticsReport";
import { FunnelStageDashboard } from "@/components/admin/FunnelStageDashboard";
import { MonetizationGapActionReport } from "@/components/admin/MonetizationGapActionReport";
import MonetizationHealthDashboard from "@/components/admin/MonetizationHealthDashboard";
import MonetizationFunnelGapsPanel from "@/components/admin/encyclopedia/MonetizationFunnelGapsPanel";
import { buildEncyclopediaOpsSnapshot } from "@/lib/encyclopedia/opsPipeline.server";

export default function AdminEncyclopediaOpsPage() {
  const snapshot = buildEncyclopediaOpsSnapshot();

  return (
    <main className="space-y-6 p-6">
      <div>
        <div className="text-sm font-medium text-neutral-500">
          Encyclopedia admin
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Content ops dashboard
        </h1>
      </div>

      <MonetizationFunnelGapsPanel
        monetizationGaps={snapshot.monetizationGaps}
        monetizationGapLines={snapshot.monetizationGapLines}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <MonetizationGapActionReport />
        <FunnelStageDashboard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelAnalyticsReport userId="encyclopedia-ops" />
        <MonetizationHealthDashboard monetizationGaps={snapshot.monetizationGaps} />
      </div>

      <div className="space-y-6">
        <ApiEncyclopediaMigrationPanel />
        <ApiEncyclopediaIntakeRunbookPanel />
        <ApiEncyclopediaOpsPanel />
        <ApiEncyclopediaInsightsPanel />
        <ApiEncyclopediaGenerationFeedbackPanel />
        <ApiEncyclopediaImportPanel />
      </div>

      <details className="rounded-2xl border border-neutral-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-medium">
          Legacy pipeline ops (read-only migration reference)
        </summary>

        <div className="mt-4 space-y-6">
          <EncyclopediaOpsDashboard
            metrics={snapshot.metrics}
            queue={snapshot.queue}
            throughput={snapshot.throughput}
            weakPages={snapshot.weakPages}
            completedRepairsCount={snapshot.completedRepairsCount}
            openRewritesLeaderboard={snapshot.openRewritesLeaderboard}
            pagesWithNotesCount={snapshot.pagesWithNotesCount}
            completedRepairsLeaderboard={snapshot.completedRepairsLeaderboard}
            pagesWithRewriteDraftsCount={snapshot.pagesWithRewriteDraftsCount}
            rewriteDraftLeaderboard={snapshot.rewriteDraftLeaderboard}
            appliedRewritesCount={snapshot.appliedRewritesCount}
            rewriteApplicationsLeaderboard={snapshot.rewriteApplicationsLeaderboard}
            readyForApprovalCount={snapshot.readyForApprovalCount}
            notReadyForApprovalCount={snapshot.notReadyForApprovalCount}
            repairReadinessLeaderboard={snapshot.repairReadinessLeaderboard}
            batchActionEligibleCount={snapshot.batchActionEligibleCount}
          />
          <EncyclopediaWeakPageRepairPanel pages={snapshot.weakPages} />
        </div>
      </details>
    </main>
  );
}
