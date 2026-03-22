import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/lib/queryKeys";
import { useAdminToast } from "../../../app/components/feedback/AdminToastProvider";
import {
  getDispatchExceptions,
  acknowledgeDispatchException,
  resolveDispatchException,
} from "../api/dispatchExceptionsApi";
import type { DispatchExceptionsParams } from "../api/types";

export function useDispatchExceptions(filters: DispatchExceptionsParams) {
  return useQuery({
    queryKey: queryKeys.dispatchExceptions.list(filters),
    queryFn: () => getDispatchExceptions(filters),
  });
}

export function useAcknowledgeDispatchException() {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (bookingId: string) => acknowledgeDispatchException(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatchExceptions"] });
      showToast("Exception acknowledged", "success");
    },
    onError: (err: { message?: string }) => {
      showToast(err?.message ?? "Failed to acknowledge", "error");
    },
  });
}

export function useResolveDispatchException() {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (bookingId: string) => resolveDispatchException(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatchExceptions"] });
      showToast("Exception resolved", "success");
    },
    onError: (err: { message?: string }) => {
      showToast(err?.message ?? "Failed to resolve", "error");
    },
  });
}
