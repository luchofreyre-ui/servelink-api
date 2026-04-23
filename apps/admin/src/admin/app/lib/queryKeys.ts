type FilterRecord = Record<string, string | number | boolean | undefined | null>;

export const queryKeys = {
  dispatchExceptions: {
    list: (filters: FilterRecord) => ["dispatchExceptions", "list", filters] as const,
  },
  booking: {
    detail: (bookingId: string) => ["booking", "detail", bookingId] as const,
    timeline: (bookingId: string) => ["booking", "timeline", bookingId] as const,
    explainer: (bookingId: string) => ["booking", "explainer", bookingId] as const,
    notes: (bookingId: string) => ["booking", "notes", bookingId] as const,
  },
  dispatchConfig: {
    active: ["dispatchConfig", "active"] as const,
    draft: ["dispatchConfig", "draft"] as const,
    compare: ["dispatchConfig", "compare"] as const,
    publishPreview: ["dispatchConfig", "publishPreview"] as const,
    publishHistory: (filters?: FilterRecord) =>
      ["dispatchConfig", "publishHistory", filters ?? {}] as const,
  },
  activity: {
    list: (filters: FilterRecord) => ["activity", "list", filters] as const,
  },
  anomalies: {
    list: (filters: FilterRecord) => ["anomalies", "list", filters] as const,
    counts: ["anomalies", "counts"] as const,
  },
  dashboard: {
    summary: ["dashboard", "summary"] as const,
  },
  supply: {
    overview: (filters: FilterRecord) => ["supply", "overview", filters] as const,
    foFleetOverview: (filters: { queue?: string }) =>
      ["supply", "foFleetOverview", filters] as const,
    foDetail: (foId: string) => ["supply", "foDetail", foId] as const,
    shipmentPlanner: (filters: FilterRecord) =>
      ["supply", "shipmentPlanner", filters] as const,
    rules: ["supply", "rules"] as const,
    activity: (filters: FilterRecord) => ["supply", "activity", filters] as const,
  },
  adminSession: ["admin", "session"] as const,
} as const;
