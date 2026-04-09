import { apiFetch } from "@/lib/api/apiFetch";
import { readApiJson } from "@/lib/api-response";
import type { SystemTestsRunsResponse, SystemTestsSummaryResponse } from "@/types/systemTests";

export async function loadAdminSystemTestsSummary() {
  const res = await apiFetch("/admin/system-tests/summary");
  return readApiJson<SystemTestsSummaryResponse>(res);
}

export async function loadAdminSystemTestRuns(limit = 10) {
  const qs = new URLSearchParams({ page: "1", limit: String(limit) });
  const res = await apiFetch(`/admin/system-tests/runs?${qs.toString()}`);
  return readApiJson<SystemTestsRunsResponse>(res);
}

/** Incident queue length (API summary has no `openIncidents`; list is bounded by limit). */
export async function loadAdminSystemTestOpenIncidentsCount() {
  const res = await apiFetch("/admin/system-tests/incidents?limit=200");
  const items = await readApiJson<unknown[]>(res);
  return Array.isArray(items) ? items.length : 0;
}
