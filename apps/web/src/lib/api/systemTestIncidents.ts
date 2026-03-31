import { API_BASE_URL } from "@/lib/api";
import type {
  SystemTestFamilyLifecycle,
  SystemTestFamilyOperatorState,
  SystemTestResolutionPreview,
} from "@/types/systemTestResolution";

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

export type SystemTestIncidentListItemApi = {
  runId: string;
  incidentKey: string;
  incidentVersion: string;
  displayTitle: string;
  rootCauseCategory: string;
  summary: string;
  severity: string;
  status: string;
  trendKind: string;
  leadFamilyId: string | null;
  affectedFamilyCount: number;
  affectedFileCount: number;
  currentRunFailureCount: number;
  lastSeenRunId: string | null;
  firstSeenRunId: string | null;
  updatedAt: string;
  resolutionPreview: SystemTestResolutionPreview | null;
  familyOperatorState: SystemTestFamilyOperatorState | null;
  familyLifecycle: SystemTestFamilyLifecycle | null;
  leadFamilyTitle: string | null;
};

export type SystemTestIncidentFixTrackApi = {
  primaryArea: string;
  recommendedSteps: string[];
  validationSteps: string[];
  representativeFiles: string[];
  representativeFamilyKeys: string[];
  suggestedOwnerHint: string | null;
};

export type SystemTestIncidentMemberApi = {
  familyId: string;
  displayTitle: string;
  matchBasis: string;
  role: string;
  familyStatus: string;
  trendKind: string;
};

export type SystemTestIncidentDetailApi = SystemTestIncidentListItemApi & {
  fixTrack: SystemTestIncidentFixTrackApi;
  metadataJson: unknown;
  members: SystemTestIncidentMemberApi[];
};

export async function fetchAdminSystemTestIncidents(
  accessToken: string,
  opts?: {
    limit?: number;
    status?: string;
    runId?: string;
    diagnosisCategory?: string;
    confidenceTier?: "high" | "medium" | "low";
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    showDismissed?: boolean;
    lifecycleState?: string;
    includeDormant?: boolean;
    includeResolved?: boolean;
  },
): Promise<SystemTestIncidentListItemApi[]> {
  const q = new URLSearchParams();
  if (opts?.limit != null) q.set("limit", String(opts.limit));
  if (opts?.status) q.set("status", opts.status);
  if (opts?.runId) q.set("runId", opts.runId);
  if (opts?.diagnosisCategory) q.set("diagnosisCategory", opts.diagnosisCategory);
  if (opts?.confidenceTier) q.set("confidenceTier", opts.confidenceTier);
  if (opts?.sortBy) q.set("sortBy", opts.sortBy);
  if (opts?.sortDirection) q.set("sortDirection", opts.sortDirection);
  if (opts?.showDismissed) q.set("showDismissed", "true");
  if (opts?.lifecycleState) q.set("lifecycleState", opts.lifecycleState);
  if (opts?.includeDormant === false) q.set("includeDormant", "false");
  if (opts?.includeResolved === true) q.set("includeResolved", "true");
  const qs = q.toString();
  return adminJson<SystemTestIncidentListItemApi[]>(
    accessToken,
    `/api/v1/admin/system-tests/incidents${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchAdminSystemTestIncidentDetail(
  accessToken: string,
  incidentKey: string,
  opts?: { runId?: string },
): Promise<SystemTestIncidentDetailApi> {
  const q = new URLSearchParams();
  if (opts?.runId) q.set("runId", opts.runId);
  const qs = q.toString();
  return adminJson<SystemTestIncidentDetailApi>(
    accessToken,
    `/api/v1/admin/system-tests/incidents/${encodeURIComponent(incidentKey)}${qs ? `?${qs}` : ""}`,
  );
}
