/**
 * Production admin surface: https://nustandardcleaning.com/admin
 * Routes are root-relative for React Router (no /admin prefix in path).
 */
export const ADMIN_APP_HOST = "https://nustandardcleaning.com/admin";

export const ADMIN_ROUTES = {
  dashboard: "/",
  exceptions: "/exceptions",
  bookingDetail: (bookingId: string) => `/bookings/${bookingId}`,
  dispatchConfig: "/dispatch-config",
  activity: "/activity",
  anomalies: "/anomalies",
  supplyOverview: "/supply",
  foSupplyFleetOverview: "/supply/franchise-owners",
  foSupplyNew: "/supply/franchise-owners/new",
  foSupplyDetail: (foId: string) => `/supply/franchise-owners/${foId}`,
  shipmentPlanner: "/supply/shipment-planner",
  supplyRules: "/supply/rules",
  supplyActivity: "/supply/activity",
  settings: "/settings",
} as const;

/** Root path for redirects */
export const ADMIN_ROUTE_ROOT = "/" as const;
