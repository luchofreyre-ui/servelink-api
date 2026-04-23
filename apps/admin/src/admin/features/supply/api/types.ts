/**
 * Supply feature types. Backend endpoints to be implemented.
 */
export type SupplyRiskLevel = "low" | "medium" | "high" | "critical";

export type SupplyOverviewItem = {
  foId: string;
  foName: string;
  territory: string | null;
  lastRestockAt: string | null;
  daysUntilStockout: number | null;
  riskLevel: SupplyRiskLevel;
  totalOpenDemand: number;
  recommendedShipmentValue: number;
  topNeededSkus: string[];
};

export type SupplyOverviewResponse = {
  items: SupplyOverviewItem[];
  total?: number;
};

export type FoSupplyOpsCategory =
  | "ready"
  | "blocked_configuration"
  | "inactive_or_restricted";

/** Server `FoSupplyReadinessDiagnosticItem` — do not infer client-side. */
export type FoSupplyReadinessSnapshot = {
  franchiseOwnerId: string;
  displayName: string;
  email: string;
  status: string;
  safetyHold: boolean;
  opsCategory: FoSupplyOpsCategory;
  supply: { ok: boolean; reasons: string[] };
  eligibility: { canAcceptBooking: boolean; reasons: string[] };
  /** Provider linkage required for dispatch / execution paths. */
  execution?: { ok: boolean; reasons: string[] };
  configSummary: {
    hasCoordinates: boolean;
    homeLat: number | null;
    homeLng: number | null;
    maxTravelMinutes: number | null;
    scheduleRowCount: number;
    matchableServiceTypes: string[];
    maxDailyLaborMinutes: number | null;
    maxLaborMinutes: number | null;
    maxSquareFootage: number | null;
  };
};

export type FoWeeklyScheduleSlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type FoSupplyQueueState =
  | "READY_TO_ACTIVATE"
  | "BLOCKED_CONFIGURATION"
  | "ACTIVE_AND_READY"
  | "ACTIVE_BUT_BLOCKED";

export type FoSupplyDetail = {
  foId: string;
  foName: string;
  territory: string | null;
  riskLevel: SupplyRiskLevel;
  daysUntilStockout: number | null;
  totalOpenDemand: number;
  lastRestockAt: string | null;
  skuNeeds: Array<{ skuId: string; skuName: string; quantityNeeded: number; priority: number }>;
  shipmentHistory: Array<{
    id: string;
    shippedAt: string;
    value: number;
    status: string;
  }>;
  /** Present when `GET /api/v1/admin/supply/franchise-owners/:foId` is implemented. */
  readiness?: FoSupplyReadinessSnapshot;
  /** Server-derived; same rules as fleet overview. */
  queueState?: FoSupplyQueueState;
  mergedReasonCodes?: string[];
  schedules?: FoWeeklyScheduleSlot[];
};

export type ShipmentPlannerItem = {
  foId: string;
  foName: string;
  riskLevel: SupplyRiskLevel;
  suggestedShipDate: string | null;
  shipmentValue: number;
  prioritySkus: string[];
  notes: string | null;
};

export type ShipmentPlannerResponse = {
  items: ShipmentPlannerItem[];
};

export type SupplyRule = {
  id: string;
  key: string;
  label: string;
  value: string | number | boolean;
  description: string | null;
  updatedAt: string;
};

export type SupplyRulesResponse = {
  rules: SupplyRule[];
};

export type SupplyActivityItem = {
  id: string;
  createdAt: string;
  foId: string | null;
  eventType: string;
  summary: string;
  metadata: Record<string, unknown>;
};

export type SupplyActivityResponse = {
  items: SupplyActivityItem[];
  nextCursor: string | null;
};

export type SupplyOverviewParams = Record<string, string | number | undefined | null>;
export type SupplyActivityParams = {
  foId?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type FoSupplyFleetOverviewItem = {
  id: string;
  displayName: string;
  email: string;
  status: string;
  safetyHold: boolean;
  supplyOk: boolean;
  executionOk: boolean;
  bookingEligible: boolean;
  mergedReasonCodes: string[];
  queueState: FoSupplyQueueState;
  configSummary: {
    hasCoordinates: boolean;
    scheduleRowCount: number;
    maxTravelMinutes: number | null;
    matchableServiceTypes: string[];
    maxDailyLaborMinutes: number | null;
  };
};

export type FoSupplyFleetOverviewResponse = {
  items: FoSupplyFleetOverviewItem[];
};

export type FoSupplyFleetOverviewParams = {
  queue?: FoSupplyQueueState;
};
