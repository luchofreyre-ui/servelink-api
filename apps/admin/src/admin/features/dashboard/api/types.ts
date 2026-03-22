/**
 * Dashboard summary shape. Can be from a single GET /admin/dashboard/summary later,
 * or computed client-side from exceptions + anomalies + activity.
 */
export type AdminDashboardSummary = {
  openExceptions: number;
  criticalExceptions: number;
  acknowledgedExceptions: number;
  resolvedTodayExceptions: number;
  activeAnomalies: number;
  recentActivityCount: number;
  activeConfigVersion: number | null;
};
