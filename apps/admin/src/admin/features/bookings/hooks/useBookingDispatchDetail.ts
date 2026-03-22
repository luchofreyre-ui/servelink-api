import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/lib/queryKeys";
import { useAdminToast } from "../../../app/components/feedback/AdminToastProvider";
import {
  getBookingDispatchDetail,
  getBookingTimeline,
  getBookingDispatchExplainer,
  addBookingAdminNote,
  forceRedispatch,
  assignFo,
  excludeProvider,
} from "../api/bookingsAdminApi";

export function useBookingDispatchDetail(bookingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.booking.detail(bookingId ?? ""),
    queryFn: () => getBookingDispatchDetail(bookingId!),
    enabled: Boolean(bookingId),
  });
}

export function useBookingTimeline(bookingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.booking.timeline(bookingId ?? ""),
    queryFn: () => getBookingTimeline(bookingId!),
    enabled: Boolean(bookingId),
  });
}

export function useBookingDispatchExplainer(bookingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.booking.explainer(bookingId ?? ""),
    queryFn: () => getBookingDispatchExplainer(bookingId!),
    enabled: Boolean(bookingId),
  });
}

export function useAddBookingNote(bookingId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (payload: { note: string; adminUserId?: string | null }) =>
      addBookingAdminNote(bookingId!, payload),
    onSuccess: () => {
      if (bookingId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.detail(bookingId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.explainer(bookingId) });
      }
      showToast("Note added", "success");
    },
    onError: (err: { message?: string }) => showToast(err?.message ?? "Failed to add note", "error"),
  });
}

export function useForceRedispatch(bookingId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (payload?: { adminId?: string }) => forceRedispatch(bookingId!, payload ?? {}),
    onSuccess: () => {
      if (bookingId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.detail(bookingId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.timeline(bookingId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.explainer(bookingId) });
      }
      showToast("Redispatch triggered", "success");
    },
    onError: (err: { message?: string }) => showToast(err?.message ?? "Failed to redispatch", "error"),
  });
}

export function useAssignFo(bookingId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (payload: { franchiseOwnerId: string; adminId?: string }) =>
      assignFo(bookingId!, payload),
    onSuccess: () => {
      if (bookingId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.detail(bookingId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.timeline(bookingId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.explainer(bookingId) });
      }
      showToast("FO assigned", "success");
    },
    onError: (err: { message?: string }) => showToast(err?.message ?? "Failed to assign", "error"),
  });
}

export function useExcludeProvider(bookingId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useAdminToast();

  return useMutation({
    mutationFn: (payload: { franchiseOwnerId: string; adminId?: string }) =>
      excludeProvider(bookingId!, payload),
    onSuccess: () => {
      if (bookingId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.detail(bookingId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.timeline(bookingId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.booking.explainer(bookingId) });
      }
      showToast("Provider excluded", "success");
    },
    onError: (err: { message?: string }) => showToast(err?.message ?? "Failed to exclude", "error"),
  });
}
