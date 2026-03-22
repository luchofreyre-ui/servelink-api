import { adminApiClient } from "../../../app/api/adminApiClient";
import type {
  DispatchConfigRecord,
  UpdateDraftDispatchConfigPayload,
  DispatchConfigCompareResponse,
  DispatchConfigPublishPreviewResponse,
  DispatchConfigPublishHistoryResponse,
  DispatchConfigPublishAuditPayload,
} from "./types";

const BASE = "/dispatch-config";

export async function getActiveDispatchConfig(): Promise<DispatchConfigRecord> {
  return adminApiClient.get<DispatchConfigRecord>(`${BASE}/active`);
}

export async function getDraftDispatchConfig(): Promise<DispatchConfigRecord> {
  return adminApiClient.get<DispatchConfigRecord>(`${BASE}/draft`);
}

export async function updateDraftDispatchConfig(
  payload: UpdateDraftDispatchConfigPayload,
): Promise<DispatchConfigRecord> {
  return adminApiClient.post<DispatchConfigRecord>(`${BASE}/draft`, payload);
}

// TODO: derive acting admin from server auth/session rather than client-supplied id
export async function publishDraftDispatchConfig(adminUserId?: string | null): Promise<DispatchConfigRecord> {
  return adminApiClient.post<DispatchConfigRecord>(`${BASE}/publish`, {
    adminUserId: adminUserId ?? null,
  });
}

export async function getEnginePreview(): Promise<DispatchConfigPublishPreviewResponse> {
  return adminApiClient.get<DispatchConfigPublishPreviewResponse>(`${BASE}/publish-preview`);
}

export async function compareDraftToActive(): Promise<DispatchConfigCompareResponse> {
  return adminApiClient.get<DispatchConfigCompareResponse>(`${BASE}/compare`);
}

export async function getPublishHistory(params?: {
  limit?: number;
  cursor?: string | null;
}): Promise<DispatchConfigPublishHistoryResponse> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.cursor != null) search.set("cursor", params.cursor);
  const qs = search.toString();
  return adminApiClient.get<DispatchConfigPublishHistoryResponse>(
    `${BASE}/publish-history${qs ? `?${qs}` : ""}`,
  );
}

export async function getLatestPublishAudit(): Promise<DispatchConfigPublishAuditPayload> {
  return adminApiClient.get<DispatchConfigPublishAuditPayload>(
    `${BASE}/publish-history/latest`,
  );
}

export async function rollbackDraftFromAudit(auditId: string): Promise<DispatchConfigRecord> {
  return adminApiClient.post<DispatchConfigRecord>(`${BASE}/rollback-from-audit`, {
    auditId,
  });
}
