import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/lib/queryKeys";
import { isRouteUnavailableError } from "../../../app/lib/apiErrors";
import { useAdminToast } from "../../../app/components/feedback/AdminToastProvider";
import {
  getSupplyOverview,
  getFoSupplyDetail,
  getShipmentPlanner,
  getSupplyRules,
  updateSupplyRule,
  getSupplyActivity,
} from "../api/supplyApi";
import type { SupplyOverviewParams, SupplyActivityParams } from "../api/types";

export function useSupplyOverview(params?: SupplyOverviewParams) {
  return useQuery({
    queryKey: queryKeys.supply.overview(params ?? {}),
    queryFn: () => getSupplyOverview(params),
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
