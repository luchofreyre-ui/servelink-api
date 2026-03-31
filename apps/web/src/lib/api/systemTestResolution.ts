import { apiGet } from "./client";
import type { SystemTestResolution } from "@/types/systemTestResolution";

export async function fetchAdminSystemTestFamilyResolution(
  familyId: string,
): Promise<SystemTestResolution> {
  return apiGet<SystemTestResolution>(
    `/api/v1/admin/system-tests/families/${encodeURIComponent(familyId)}/resolution`,
  );
}
