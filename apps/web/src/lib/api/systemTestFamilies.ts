import { API_BASE_URL } from "@/lib/api";

const FETCH_TIMEOUT_MS = 25_000;

async function adminJson<T>(accessToken: string, path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    const payload = JSON.parse(text) as T & { message?: string };
    if (!response.ok) {
      const msg =
        typeof (payload as { message?: unknown }).message === "string"
          ? String((payload as { message: string }).message)
          : `Request failed: ${response.status}`;
      throw new Error(msg);
    }
    return payload as T;
  } finally {
    clearTimeout(timeout);
  }
}

export type SystemTestFamilyListItemApi = {
  id: string;
  displayTitle: string;
  status: string;
  trendKind: string;
  lastSeenRunId: string | null;
  firstSeenRunId: string | null;
  affectedRunCount: number;
  affectedFileCount: number;
  totalOccurrencesAcrossRuns: number;
  recurrenceLine: string | null;
  primaryAssertionType: string | null;
  primaryLocator: string | null;
  primaryRouteUrl: string | null;
  updatedAt: string;
};

export type SystemTestFamilyMembershipApi = {
  runId: string;
  failureGroupId: string;
  canonicalKey: string;
  matchBasis: string;
  file: string;
  title: string;
  shortMessage: string;
  occurrences: number;
  createdAt: string;
};

export type SystemTestFamilyDetailApi = SystemTestFamilyListItemApi & {
  familyKey: string;
  familyVersion: string;
  familyKind: string;
  rootCauseSummary: string;
  primarySelector: string | null;
  primaryActionName: string | null;
  primaryErrorCode: string | null;
  metadataJson: unknown;
  createdAt: string;
  memberships: SystemTestFamilyMembershipApi[];
  incident: {
    incidentKey: string;
    displayTitle: string;
    severity: string;
    status: string;
    role: string;
  } | null;
};

export async function fetchAdminSystemTestFamilies(
  accessToken: string,
  params?: { limit?: number; status?: string },
): Promise<SystemTestFamilyListItemApi[]> {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  const q = qs.toString();
  return adminJson<SystemTestFamilyListItemApi[]>(
    accessToken,
    `/api/v1/admin/system-tests/families${q ? `?${q}` : ""}`,
  );
}

export async function fetchAdminSystemTestFamilyDetail(
  accessToken: string,
  familyId: string,
): Promise<SystemTestFamilyDetailApi> {
  return adminJson<SystemTestFamilyDetailApi>(
    accessToken,
    `/api/v1/admin/system-tests/families/${encodeURIComponent(familyId)}`,
  );
}
