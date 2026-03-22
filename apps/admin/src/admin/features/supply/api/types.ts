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
