import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminPageHeader } from "../../components/layout/AdminPageHeader";
import { DashboardMetricsGrid } from "../../../features/dashboard/components/DashboardMetricsGrid";
import { DashboardHotlistCard } from "../../../features/dashboard/components/DashboardHotlistCard";
import { useDashboardSummary } from "../../../features/dashboard/hooks/useDashboardSummary";
import { ADMIN_ROUTES } from "../../routes/adminRoutes";
import { setAdminDocumentTitle } from "../../lib/documentTitle";

export function DashboardPage() {
  useEffect(() => {
    setAdminDocumentTitle("Dashboard");
  }, []);

  const {
    metrics,
    exceptionHotlist,
    activityHotlist,
    isLoading,
    refetch,
  } = useDashboardSummary();

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Operational overview. Exceptions, anomalies, and dispatch config."
        actions={
          <button
            type="button"
            className="rounded-xl border px-3 py-2 text-sm"
            onClick={refetch}
          >
            Refresh
          </button>
        }
      />

      <div className="mb-6">
        <DashboardMetricsGrid
        metrics={{
          ...metrics,
          activeConfigVersion: metrics.activeDispatchConfigVersion,
        }}
        isLoading={isLoading}
      />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardHotlistCard
          title="Urgent dispatch exceptions"
          viewAllHref={ADMIN_ROUTES.exceptions}
          items={exceptionHotlist.map((i) => ({
            ...i,
            href: i.href ?? undefined,
          }))}
          emptyMessage="No open exceptions."
        />
        <DashboardHotlistCard
          title="Recent activity"
          viewAllHref={ADMIN_ROUTES.activity}
          items={activityHotlist}
          emptyMessage="No recent activity."
        />
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Quick links</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to={ADMIN_ROUTES.exceptions}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Exceptions
          </Link>
          <Link
            to={ADMIN_ROUTES.dispatchConfig}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Dispatch config
          </Link>
          <Link
            to={ADMIN_ROUTES.anomalies}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Anomalies
          </Link>
          <Link
            to={ADMIN_ROUTES.supplyOverview}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Supply
          </Link>
        </div>
      </div>
    </div>
  );
}
