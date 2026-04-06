import { apiFetch } from "@/lib/api";
import { readApiJson } from "@/lib/api-response";

export type OpsMutationResult = {
  ok: boolean;
  action?: string;
  bookingId?: string;
  dispatchExceptionKey?: string;
  status?: string;
  message?: string;
};

async function postSystemOpsBookingAction(
  bookingId: string,
  suffix:
    | "release-dispatch-lock"
    | "clear-review-required"
    | "trigger-redispatch",
): Promise<OpsMutationResult> {
  const path = `/api/v1/system/ops/bookings/${encodeURIComponent(bookingId)}/${suffix}`;
  const res = await apiFetch(path, {
    method: "POST",
    json: {},
  });
  return readApiJson<OpsMutationResult>(res);
}

export function releaseDispatchLock(bookingId: string) {
  return postSystemOpsBookingAction(bookingId, "release-dispatch-lock");
}

export function clearReviewRequired(bookingId: string) {
  return postSystemOpsBookingAction(bookingId, "clear-review-required");
}

export function triggerRedispatch(bookingId: string) {
  return postSystemOpsBookingAction(bookingId, "trigger-redispatch");
}

function dispatchExceptionKeyForBooking(bookingId: string) {
  return `dex_v1_${bookingId}`;
}

async function postSystemOpsExceptionAction(
  dispatchExceptionKey: string,
  suffix: "assign-to-me" | "resolve",
): Promise<OpsMutationResult> {
  const path = `/api/v1/system/ops/exception-actions/${encodeURIComponent(dispatchExceptionKey)}/${suffix}`;
  const res = await apiFetch(path, {
    method: "POST",
    json: {},
  });
  return readApiJson<OpsMutationResult>(res);
}

/** Uses the stable dispatch exception key for the booking (same as API `dex_v1_${bookingId}`). */
export function assignExceptionToMeForBooking(bookingId: string) {
  return postSystemOpsExceptionAction(
    dispatchExceptionKeyForBooking(bookingId),
    "assign-to-me",
  );
}

export function resolveExceptionForBooking(bookingId: string) {
  return postSystemOpsExceptionAction(
    dispatchExceptionKeyForBooking(bookingId),
    "resolve",
  );
}
