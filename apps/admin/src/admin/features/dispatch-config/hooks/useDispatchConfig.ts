import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/lib/queryKeys";
import { useAdminToast } from "../../../app/components/feedback/AdminToastProvider";
import {
  getActiveDispatchConfig,
  getDraftDispatchConfig,
  updateDraftDispatchConfig,
  publishDraftDispatchConfig,
  getEnginePreview,
  compareDraftToActive,
  getPublishHistory,
  rollbackDraftFromAudit,
} from "../api/dispatchConfigApi";
import type { UpdateDraftDispatchConfigPayload } from "../api/types";

export function useActiveDispatchConfig() {
  return useQuery({
    queryKey: queryKeys.dispatchConfig.active,
    queryFn: getActiveDispatchConfig,
  });
}

export function useDraftDispatchConfig() {
  return useQuery({
    queryKey: queryKeys.dispatchConfig.draft,
    queryFn: getDraftDispatchConfig,
  });
}

export function useDispatchConfigCompare() {
  return useQuery({
    queryKey: queryKeys.dispatchConfig.compare,
    queryFn: compareDraftToActive,
  });
}

export function usePublishPreview() {
  return useQuery({
    queryKey: queryKeys.dispatchConfig.publishPreview,
    queryFn: getEnginePreview,
  });
}

export function usePublishHistory(params?: { limit?: number; cursor?: string | null }) {
  return useQuery({
    queryKey: [...queryKeys.dispatchConfig.publishHistory(params ?? {}), params],
    queryFn: () => getPublishHistory(params),
  });
}

export function useUpdateDraftDispatchConfig() {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (payload: UpdateDraftDispatchConfigPayload) =>
      updateDraftDispatchConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatchConfig.draft });
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatchConfig.compare });
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatchConfig.publishPreview });
      showToast("Draft saved", "success");
    },
    onError: (err: { message?: string }) =>
      showToast(err?.message ?? "Failed to save draft", "error"),
  });
}

export function usePublishDraftDispatchConfig() {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (adminUserId?: string | null) => publishDraftDispatchConfig(adminUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatchConfig.active });
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatchConfig.draft });
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatchConfig.compare });
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatchConfig.publishPreview });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dispatchConfig.publishHistory({}),
      });
      showToast("Config published", "success");
    },
    onError: (err: { message?: string }) =>
      showToast(err?.message ?? "Failed to publish", "error"),
  });
}

export function useRollbackDraftFromAudit() {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (auditId: string) => rollbackDraftFromAudit(auditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatchConfig.draft });
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatchConfig.compare });
      queryClient.invalidateQueries({ queryKey: queryKeys.dispatchConfig.publishPreview });
      showToast("Draft rolled back", "success");
    },
    onError: (err: { message?: string }) =>
      showToast(err?.message ?? "Failed to rollback", "error"),
  });
}
