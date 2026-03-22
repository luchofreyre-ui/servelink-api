import { adminApiClient } from "../../../app/api/adminApiClient";
import type {
  OpsAnomalyListResponse,
  OpsAnomalyCountsResponse,
  OpsAnomaliesParams,
} from "./types";

const BASE = "/ops/anomalies";

type OkResponse<T> = { ok: true; data: T };

function unwrap<T>(body: OkResponse<T>): T {
  return body.data;
}

export async function getOpsAnomalies(
  params?: OpsAnomaliesParams,
): Promise<OpsAnomalyListResponse> {
  const search = new URLSearchParams();
  if (params?.sinceHours != null) search.set("sinceHours", String(params.sinceHours));
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.opsStatus != null) search.set("opsStatus", params.opsStatus);
  if (params?.severity != null) search.set("severity", params.severity);
  if (params?.type != null) search.set("type", params.type);
  if (params?.cursor != null) search.set("cursor", params.cursor);
  if (params?.acked != null) search.set("acked", String(params.acked));
  if (params?.groupBy != null) search.set("groupBy", params.groupBy);
  if (params?.unassigned != null) search.set("unassigned", String(params.unassigned));
  if (params?.mine != null) search.set("mine", String(params.mine));
  const qs = search.toString();
  const body = await adminApiClient.get<OkResponse<OpsAnomalyListResponse>>(
    `${BASE}${qs ? `?${qs}` : ""}`,
  );
  return unwrap(body);
}

export async function getOpsAnomalyCounts(params?: {
  sinceHours?: number;
  groupBy?: string;
  opsStatus?: string;
}): Promise<OpsAnomalyCountsResponse> {
  const search = new URLSearchParams();
  if (params?.sinceHours != null) search.set("sinceHours", String(params.sinceHours));
  if (params?.groupBy != null) search.set("groupBy", params.groupBy);
  if (params?.opsStatus != null) search.set("opsStatus", params.opsStatus);
  const qs = search.toString();
  const body = await adminApiClient.get<OkResponse<OpsAnomalyCountsResponse>>(
    `${BASE}/counts${qs ? `?${qs}` : ""}`,
  );
  return unwrap(body);
}

export async function acknowledgeOpsAnomaly(payload: {
  eventId?: string;
  fingerprint?: string;
  note?: string;
}): Promise<unknown> {
  const body = await adminApiClient.post<OkResponse<{ matched?: number; acked?: number }>>(
    `${BASE}/ack`,
    payload,
  );
  return unwrap(body);
}

export async function resolveOpsAnomaly(payload: {
  eventId?: string;
  fingerprint?: string;
  note?: string;
}): Promise<unknown> {
  const body = await adminApiClient.post<OkResponse<unknown>>(
    `${BASE}/resolve`,
    payload,
  );
  return unwrap(body);
}

export async function assignOpsAnomaly(payload: {
  eventId?: string;
  fingerprint?: string;
  adminId?: string | null;
}): Promise<unknown> {
  const body = await adminApiClient.post<OkResponse<unknown>>(
    `${BASE}/assign`,
    payload,
  );
  return unwrap(body);
}
