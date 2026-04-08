import { apiGet } from "./client";
import type { SystemTestResolution } from "@/types/systemTestResolution";

export async function fetchAdminSystemTestFamilyResolution(
  familyId: string,
): Promise<SystemTestResolution> {
  return apiGet<SystemTestResolution>(
    `/admin/system-tests/families/${encodeURIComponent(familyId)}/resolution`,
  );
}
