/**
 * Single hook for dashboard. Composes dispatch exceptions, anomaly counts, activity, and active config.
 * When backend adds GET /admin/dashboard/summary, switch to that and remove this composition.
 */
import { useDispatchExceptions } from "../../dispatch-exceptions/hooks/useDispatchExceptions";
import { useOpsAnomalyCounts } from "../../anomalies/hooks/useAnomalies";
import { useActivityList } from "../../activity/hooks/useActivity";
import { useActiveDispatchConfig } from "../../dispatch-config/hooks/useDispatchConfig";

export type DashboardSummaryMetrics = {
  openExceptions: number;
  criticalExceptions: number;
  activeAnomalies: number;
  activeDispatchConfigVersion: number | null;
};

export type DashboardHotlistItem = {
  id: string;
  label: string;
  sublabel?: string;
  href?: string;
};

export type DashboardSummaryResult = {
  metrics: DashboardSummaryMetrics;
  exceptionHotlist: DashboardHotlistItem[];
  activityHotlist: DashboardHotlistItem[];
  isLoading: boolean;
  refetch: () => void;
};

export function useDashboardSummary(): DashboardSummaryResult {
  const exceptions = useDispatchExceptions({ limit: 100 });
  const anomalyCounts = useOpsAnomalyCounts({
    sinceHours: 24,
    groupBy: "fingerprint",
    opsStatus: "open",
  });
  const activity = useActivityList({ limit: 10 });
  const activeConfig = useActiveDispatchConfig();

  const exceptionItems = exceptions.data?.items ?? [];
  const openCount = exceptionItems.length;
  const criticalCount = exceptionItems.filter(
    (e) => e.severity === "critical" || e.severity === "high",
  ).length;

  const metrics: DashboardSummaryMetrics = {
    openExceptions: openCount,
    criticalExceptions: criticalCount,
    activeAnomalies: anomalyCounts.data?.openTotal ?? anomalyCounts.data?.total ?? 0,
    activeDispatchConfigVersion: activeConfig.data?.version ?? null,
  };

  const exceptionHotlist: DashboardHotlistItem[] = exceptionItems.slice(0, 5).map((e) => ({
    id: e.bookingId,
    label: e.bookingId.slice(0, 12) + "…",
    sublabel: e.severity,
    href: `/bookings/${e.bookingId}`,
  }));

  const activityHotlist: DashboardHotlistItem[] = (activity.data?.items ?? [])
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      label: a.title,
      sublabel: a.type,
    }));

  const isLoading =
    exceptions.isLoading ||
    anomalyCounts.isLoading ||
    activity.isLoading ||
    activeConfig.isLoading;

  const refetch = () => {
    exceptions.refetch();
    anomalyCounts.refetch();
    activity.refetch();
    activeConfig.refetch();
  };

  return {
    metrics,
    exceptionHotlist,
    activityHotlist,
    isLoading,
    refetch,
  };
}
