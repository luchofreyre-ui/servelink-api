import { adminApiClient } from "../../../app/api/adminApiClient";
import type { DispatchExceptionListResponse, DispatchExceptionsParams } from "./types";

const BASE = "/dispatch/exceptions";

function buildQuery(params: DispatchExceptionsParams): string {
  const q = new URLSearchParams();
  if (params.type != null) q.set("type", params.type);
  if (params.bookingStatus != null) q.set("bookingStatus", params.bookingStatus);
  if (params.priorityBucket != null) q.set("priorityBucket", params.priorityBucket);
  if (params.requiresFollowUp === true) q.set("requiresFollowUp", "true");
  if (params.minDispatchPasses != null) q.set("minDispatchPasses", String(params.minDispatchPasses));
  const limit = params.limit ?? params.pageSize ?? 25;
  q.set("limit", String(Math.min(100, Math.max(1, limit))));
  if (params.cursor != null && params.cursor) q.set("cursor", params.cursor);
  if (params.sortBy != null) q.set("sortBy", params.sortBy);
  if (params.sortOrder != null) q.set("sortOrder", params.sortOrder);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function getDispatchExceptions(
  params: DispatchExceptionsParams = {},
): Promise<DispatchExceptionListResponse> {
  const query = buildQuery(params);
  return adminApiClient.get<DispatchExceptionListResponse>(`${BASE}${query}`);
}

/**
 * Acknowledge a dispatch exception (by bookingId).
 * Backend may expose POST /admin/dispatch/exceptions/:bookingId/acknowledge later.
 */
export async function acknowledgeDispatchException(bookingId: string): Promise<void> {
  await adminApiClient.post(`${BASE}/${bookingId}/acknowledge`);
}

/**
 * Resolve a dispatch exception (by bookingId).
 * Backend may expose POST /admin/dispatch/exceptions/:bookingId/resolve later.
 */
export async function resolveDispatchException(bookingId: string): Promise<void> {
  await adminApiClient.post(`${BASE}/${bookingId}/resolve`);
}
