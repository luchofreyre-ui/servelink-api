import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../app/routes/adminRoutes";
import { AdminMetricCard } from "../../../app/components/cards/AdminMetricCard";

export type DashboardMetrics = {
  openExceptions: number;
  criticalExceptions: number;
  activeAnomalies: number;
  activeConfigVersion: number | null;
};

type DashboardMetricsGridProps = {
  metrics: DashboardMetrics;
  isLoading?: boolean;
};

export function DashboardMetricsGrid({
  metrics,
  isLoading,
}: DashboardMetricsGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border bg-white p-4 animate-pulse"
          >
            <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
            <div className="h-8 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Link to={ADMIN_ROUTES.exceptions}>
        <AdminMetricCard title="Open exceptions" value={metrics.openExceptions} />
      </Link>
      <Link to={ADMIN_ROUTES.exceptions}>
        <AdminMetricCard title="Critical exceptions" value={metrics.criticalExceptions} />
      </Link>
      <Link to={ADMIN_ROUTES.anomalies}>
        <AdminMetricCard title="Active anomalies" value={metrics.activeAnomalies} />
      </Link>
      <Link to={ADMIN_ROUTES.dispatchConfig}>
        <AdminMetricCard
          title="Dispatch config (active)"
          value={metrics.activeConfigVersion ?? "—"}
        />
      </Link>
    </div>
  );
}
