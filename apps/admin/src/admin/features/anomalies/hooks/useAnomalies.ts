import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/lib/queryKeys";
import { useAdminToast } from "../../../app/components/feedback/AdminToastProvider";
import {
  getOpsAnomalies,
  getOpsAnomalyCounts,
  acknowledgeOpsAnomaly,
  resolveOpsAnomaly,
} from "../api/anomaliesApi";
import type { OpsAnomaliesParams } from "../api/types";

export function useOpsAnomalies(params?: OpsAnomaliesParams) {
  return useQuery({
    queryKey: queryKeys.anomalies.list(params ?? {}),
    queryFn: () => getOpsAnomalies(params),
  });
}

export function useOpsAnomalyCounts(params?: {
  sinceHours?: number;
  groupBy?: string;
  opsStatus?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.anomalies.counts, params ?? {}],
    queryFn: () => getOpsAnomalyCounts(params),
  });
}

export function useAcknowledgeOpsAnomaly() {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (payload: { eventId?: string; fingerprint?: string; note?: string }) =>
      acknowledgeOpsAnomaly(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.anomalies.counts });
      showToast("Anomaly acknowledged", "success");
    },
    onError: (err: { message?: string }) =>
      showToast(err?.message ?? "Failed to acknowledge", "error"),
  });
}

export function useResolveOpsAnomaly() {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (payload: { eventId?: string; fingerprint?: string; note?: string }) =>
      resolveOpsAnomaly(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.anomalies.counts });
      showToast("Anomaly resolved", "success");
    },
    onError: (err: { message?: string }) =>
      showToast(err?.message ?? "Failed to resolve", "error"),
  });
}
