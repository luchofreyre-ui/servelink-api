import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/lib/queryKeys";
import { getAdminActivity } from "../api/activityApi";
import type { AdminActivityParams } from "../api/types";

export function useActivityList(params?: AdminActivityParams) {
  return useQuery({
    queryKey: queryKeys.activity.list(params ?? {}),
    queryFn: () => getAdminActivity(params),
  });
}
