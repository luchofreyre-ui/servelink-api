import { adminApiClient } from "../../../app/api/adminApiClient";
import type {
  SupplyOverviewResponse,
  SupplyOverviewParams,
  FoSupplyDetail,
  ShipmentPlannerResponse,
  SupplyRulesResponse,
  SupplyRule,
  SupplyActivityResponse,
  SupplyActivityParams,
} from "./types";

/** Paths relative to admin base /api/v1/admin. */
const BASE = "/supply";

export async function getSupplyOverview(
  params?: SupplyOverviewParams,
): Promise<SupplyOverviewResponse> {
  const q = new URLSearchParams();
  if (params?.foId != null) q.set("foId", String(params.foId));
  if (params?.riskLevel != null) q.set("riskLevel", String(params.riskLevel));
  const qs = q.toString();
  return adminApiClient.get<SupplyOverviewResponse>(`${BASE}${qs ? `?${qs}` : ""}`);
}

export async function getFoSupplyDetail(foId: string): Promise<FoSupplyDetail> {
  return adminApiClient.get<FoSupplyDetail>(`${BASE}/franchise-owners/${foId}`);
}

export async function getShipmentPlanner(
  params?: Record<string, string | number | undefined | null>,
): Promise<ShipmentPlannerResponse> {
  const q = new URLSearchParams();
  if (params?.riskLevel != null) q.set("riskLevel", String(params.riskLevel));
  if (params?.shipWindow != null) q.set("shipWindow", String(params.shipWindow));
  if (params?.search != null) q.set("search", String(params.search));
  const qs = q.toString();
  return adminApiClient.get<ShipmentPlannerResponse>(
    `${BASE}/shipment-planner${qs ? `?${qs}` : ""}`,
  );
}

export async function getSupplyRules(): Promise<SupplyRulesResponse> {
  return adminApiClient.get<SupplyRulesResponse>(`${BASE}/rules`);
}

export async function updateSupplyRule(
  ruleId: string,
  payload: { value?: string | number | boolean },
): Promise<SupplyRule> {
  return adminApiClient.patch<SupplyRule>(`${BASE}/rules/${ruleId}`, payload);
}

export async function getSupplyActivity(
  params?: SupplyActivityParams,
): Promise<SupplyActivityResponse> {
  const q = new URLSearchParams();
  if (params?.foId != null) q.set("foId", params.foId);
  if (params?.eventType != null) q.set("eventType", params.eventType);
  if (params?.dateFrom != null) q.set("dateFrom", params.dateFrom);
  if (params?.dateTo != null) q.set("dateTo", params.dateTo);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.pageSize != null) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  return adminApiClient.get<SupplyActivityResponse>(
    `${BASE}/activity${qs ? `?${qs}` : ""}`,
  );
}
