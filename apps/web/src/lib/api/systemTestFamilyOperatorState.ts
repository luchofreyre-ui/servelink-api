import { API_BASE_URL } from "@/lib/api";
import type { SystemTestFamilyOperatorState } from "@/types/systemTestResolution";

const FETCH_TIMEOUT_MS = 25_000;

export async function updateAdminSystemTestFamilyOperatorState(
  accessToken: string,
  familyId: string,
  input: {
    state: "open" | "acknowledged" | "dismissed";
    note?: string;
  },
): Promise<SystemTestFamilyOperatorState> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/system-tests/families/${encodeURIComponent(familyId)}/operator-state`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        cache: "no-store",
        signal: controller.signal,
      },
    );
    const text = await response.text();
    const payload = JSON.parse(text) as SystemTestFamilyOperatorState & { message?: string };
    if (!response.ok) {
      const msg =
        typeof (payload as { message?: unknown }).message === "string"
          ? String((payload as { message: string }).message)
          : `Request failed: ${response.status}`;
      throw new Error(msg);
    }
    return payload as SystemTestFamilyOperatorState;
  } finally {
    clearTimeout(timeout);
  }
}
