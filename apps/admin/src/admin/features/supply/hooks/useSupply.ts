import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/lib/queryKeys";
import { isRouteUnavailableError } from "../../../app/lib/apiErrors";
import { useAdminToast } from "../../../app/components/feedback/AdminToastProvider";
import {
  getSupplyOverview,
  postCreateDraftFranchiseOwner,
  getFoSupplyFleetOverview,
  getFoSupplyDetail,
  patchFoSupplyDetail,
  putFoWeeklySchedule,
  getShipmentPlanner,
  getSupplyRules,
  updateSupplyRule,
  getSupplyActivity,
} from "../api/supplyApi";
import type {
  FoWeeklyScheduleSlot,
  FoSupplyFleetOverviewParams,
  SupplyOverviewParams,
  SupplyActivityParams,
} from "../api/types";

export function useSupplyOverview(params?: SupplyOverviewParams) {
  return useQuery({
    queryKey: queryKeys.supply.overview(params ?? {}),
    queryFn: () => getSupplyOverview(params),
  });
}

export function useCreateDraftFranchiseOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { displayName: string; email: string }) =>
      postCreateDraftFranchiseOwner(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply", "foFleetOverview"] });
    },
  });
}

export function useFoSupplyFleetOverview(params?: FoSupplyFleetOverviewParams) {
  const filters = { queue: params?.queue };
  return useQuery({
    queryKey: queryKeys.supply.foFleetOverview(filters),
    queryFn: () => getFoSupplyFleetOverview(params),
    retry: (_, error) => !isRouteUnavailableError(error),
  });
}

export function useFoSupplyDetail(foId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.supply.foDetail(foId ?? ""),
    queryFn: () => getFoSupplyDetail(foId!),
    enabled: Boolean(foId),
    retry: (_, error) => !isRouteUnavailableError(error),
  });
}

export function usePatchFoSupplyDetail(foId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => patchFoSupplyDetail(foId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.supply.foDetail(foId),
      });
      void queryClient.invalidateQueries({ queryKey: ["supply", "foFleetOverview"] });
    },
  });
}

export function usePutFoWeeklySchedule(foId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schedule: FoWeeklyScheduleSlot[]) =>
      putFoWeeklySchedule(foId, schedule),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.supply.foDetail(foId),
      });
      void queryClient.invalidateQueries({ queryKey: ["supply", "foFleetOverview"] });
    },
  });
}

export function useShipmentPlanner(params?: Record<string, string | number | undefined | null>) {
  return useQuery({
    queryKey: queryKeys.supply.shipmentPlanner(params ?? {}),
    queryFn: () => getShipmentPlanner(params),
  });
}

export function useSupplyRules() {
  return useQuery({
    queryKey: queryKeys.supply.rules,
    queryFn: getSupplyRules,
  });
}

export function useUpdateSupplyRule() {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: ({
      ruleId,
      payload,
    }: {
      ruleId: string;
      payload: { value?: string | number | boolean };
    }) => updateSupplyRule(ruleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supply.rules });
      showToast("Rule updated", "success");
    },
    onError: (err: { message?: string }) =>
      showToast(err?.message ?? "Failed to update rule", "error"),
  });
}

export function useSupplyActivity(params?: SupplyActivityParams) {
  return useQuery({
    queryKey: queryKeys.supply.activity(params ?? {}),
    queryFn: () => getSupplyActivity(params),
  });
}
