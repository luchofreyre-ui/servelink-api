"use client";

import { useCallback, useState } from "react";
import type { AdminBookingCommandCenterPayload } from "@/lib/api/adminBookingCommandCenter";
import {
  patchAdminOperatorNote,
  postAdminBookingApprove,
  postAdminBookingHold,
  postAdminBookingReassign,
  postAdminBookingReview,
} from "@/lib/api/adminBookingCommandCenter";

export function useAdminBookingCommandCenterMutations(
  apiBase: string,
  token: string | null,
  bookingId: string,
  onSuccess: (payload: AdminBookingCommandCenterPayload) => void,
) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, fn: () => Promise<AdminBookingCommandCenterPayload>) => {
      if (!token) {
        throw new Error("Not authenticated");
      }
      setPendingAction(key);
      try {
        const payload = await fn();
        onSuccess(payload);
        return payload;
      } finally {
        setPendingAction(null);
      }
    },
    [onSuccess, token],
  );

  const patchNote = useCallback(
    (note: string) => run("operator_note", () => patchAdminOperatorNote(apiBase, token!, bookingId, note)),
    [apiBase, bookingId, run, token],
  );

  const hold = useCallback(
    () => run("hold", () => postAdminBookingHold(apiBase, token!, bookingId)),
    [apiBase, bookingId, run, token],
  );

  const markReview = useCallback(
    () => run("review", () => postAdminBookingReview(apiBase, token!, bookingId)),
    [apiBase, bookingId, run, token],
  );

  const approve = useCallback(
    () => run("approve", () => postAdminBookingApprove(apiBase, token!, bookingId)),
    [apiBase, bookingId, run, token],
  );

  const reassign = useCallback(
    () => run("reassign", () => postAdminBookingReassign(apiBase, token!, bookingId, {})),
    [apiBase, bookingId, run, token],
  );

  return {
    pendingAction,
    patchNote,
    hold,
    markReview,
    approve,
    reassign,
  };
}
