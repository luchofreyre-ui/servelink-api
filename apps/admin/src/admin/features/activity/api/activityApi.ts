import { adminApiClient } from "../../../app/api/adminApiClient";
import type { AdminActivityListResponse, AdminActivityParams } from "./types";

const BASE = "/activity";

export async function getAdminActivity(
  params?: AdminActivityParams,
): Promise<AdminActivityListResponse> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.entityType != null) search.set("entityType", params.entityType);
  if (params?.actorType != null) search.set("actorType", params.actorType);
  if (params?.dateFrom != null) search.set("dateFrom", params.dateFrom);
  if (params?.dateTo != null) search.set("dateTo", params.dateTo);
  if (params?.search != null) search.set("search", params.search);
  const qs = search.toString();
  return adminApiClient.get<AdminActivityListResponse>(
    `${BASE}${qs ? `?${qs}` : ""}`,
  );
}
