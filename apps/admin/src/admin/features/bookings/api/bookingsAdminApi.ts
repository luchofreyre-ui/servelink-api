import { adminApiClient } from "../../../app/api/adminApiClient";
import { adminBookingReadClient } from "../../../app/api/adminBookingReadClient";
import type {
  BookingDispatchDetail,
  BookingDispatchExplainer,
  ManualDispatchActionPayload,
} from "./types";

/** Read-only booking endpoints live at /api/v1/bookings (not under admin prefix). */
const BOOKINGS_READ = "/bookings";
/** Admin mutations live at /api/v1/admin/bookings. */
const BOOKINGS_ADMIN = "/bookings";

export async function getBookingDispatchDetail(
  bookingId: string,
): Promise<BookingDispatchDetail> {
  return adminBookingReadClient.get<BookingDispatchDetail>(`${BOOKINGS_READ}/${bookingId}`);
}

export async function getBookingTimeline(
  bookingId: string,
): Promise<{ bookingId: string; decisions: unknown[]; totalDispatchPasses: number }> {
  return adminBookingReadClient.get(`${BOOKINGS_READ}/${bookingId}/dispatch-timeline`);
}

export async function getBookingDispatchExplainer(
  bookingId: string,
): Promise<BookingDispatchExplainer> {
  return adminBookingReadClient.get<BookingDispatchExplainer>(
    `${BOOKINGS_READ}/${bookingId}/dispatch-explainer`,
  );
}

export async function getBookingExceptionDetail(
  bookingId: string,
): Promise<unknown> {
  return adminBookingReadClient.get(`${BOOKINGS_READ}/${bookingId}/dispatch-exception-detail`);
}

export async function addBookingAdminNote(
  bookingId: string,
  payload: { note: string; adminUserId?: string | null },
): Promise<unknown> {
  return adminBookingReadClient.post(
    `${BOOKINGS_READ}/${bookingId}/dispatch-operator-notes`,
    payload,
  );
}

export async function forceRedispatch(
  bookingId: string,
  payload: { adminId?: string },
): Promise<unknown> {
  return adminApiClient.post(
    `${BOOKINGS_ADMIN}/${bookingId}/dispatch/manual-redispatch`,
    payload,
  );
}

export async function assignFo(
  bookingId: string,
  payload: ManualDispatchActionPayload,
): Promise<unknown> {
  return adminApiClient.post(
    `${BOOKINGS_ADMIN}/${bookingId}/dispatch/manual-assign`,
    payload,
  );
}

export async function excludeProvider(
  bookingId: string,
  payload: { franchiseOwnerId: string; adminId?: string },
): Promise<unknown> {
  return adminApiClient.post(
    `${BOOKINGS_ADMIN}/${bookingId}/dispatch/exclude-provider`,
    payload,
  );
}

// TODO: Backend does not yet expose cancel-offer or resolve-exception on AdminDispatchOpsController.
// When added, uncomment and use. Until then, UI shows these actions disabled with "Backend action not yet available".
// export async function cancelActiveOffer(bookingId: string, payload?: { adminId?: string }): Promise<unknown> {
//   return adminApiClient.post(`${BOOKINGS_ADMIN}/${bookingId}/dispatch/cancel-offer`, payload ?? {});
// }
// export async function resolveDispatchExceptionFromBooking(bookingId: string, payload?: { note?: string }): Promise<unknown> {
//   return adminApiClient.post(`${BOOKINGS_ADMIN}/${bookingId}/dispatch/resolve-exception`, payload ?? {});
// }
