/**
 * Aligned to backend ops anomalies list response (data.anomalies, data.page).
 */
export type OpsAnomalyStatus = "open" | "acked" | "resolved";

export type OpsAnomalySeverity = "info" | "warning" | "critical";

export type OpsAnomalyItem = {
  id: string;
  fingerprint: string | null;
  anomalyType: string;
  severity?: string;
  opsStatus: string;
  createdAt: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  occurrences?: number;
  assignedToAdminId: string | null;
  slaDueAt: string | null;
  slaBreachedAt: string | null;
  bookingId: string | null;
  foId: string | null;
  bookingStatus: string | null;
  payload?: unknown;
};

export type OpsAnomalyListResponse = {
  anomalies: OpsAnomalyItem[];
  count: number;
  since?: string;
  limit: number;
  page?: {
    nextCursor?: string | null;
    cursor?: string;
    groupBy?: string;
  };
};

export type OpsAnomaliesParams = {
  sinceHours?: number;
  limit?: number;
  opsStatus?: string;
  severity?: string;
  type?: string;
  cursor?: string | null;
  acked?: 0 | 1;
  groupBy?: string;
  unassigned?: 0 | 1;
  mine?: 0 | 1;
};

export type OpsAnomalyCountsResponse = {
  total?: number;
  openTotal?: number;
  bySeverity?: Record<string, number>;
  byStatus?: Record<string, number>;
};
