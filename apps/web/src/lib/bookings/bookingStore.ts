import type {
  AdminPaymentAnomalyRow,
  AdminPaymentOpsSummary,
  AssignBookingInput,
  BookingCheckoutSession,
  BookingPaymentStatus,
  BookingRecord,
  BookingStatus,
  CreateBookingInput,
  TransitionBookingInput,
  UpdateBookingInput,
} from "./bookingApiTypes";
import {
  assignBooking as apiAssignBooking,
  assignRecommendedBooking as apiAssignRecommendedBooking,
  createBooking as apiCreateBooking,
  createBookingCheckout as apiCreateBookingCheckout,
  fetchAssignmentRecommendations as apiFetchAssignmentRecommendations,
  getBooking as apiGetBooking,
  holdBooking as apiHoldBooking,
  listBookings as apiListBookings,
  transitionBooking as apiTransitionBooking,
  updateBooking as apiUpdateBooking,
  updateBookingPaymentStatus as apiUpdateBookingPaymentStatus,
  getAdminPaymentOpsSummary as apiGetAdminPaymentOpsSummary,
  listAdminPaymentAnomalies as apiListAdminPaymentAnomalies,
} from "./bookingApi";

export async function createBooking(
  payload: CreateBookingInput,
): Promise<BookingRecord> {
  return apiCreateBooking(payload);
}

export async function listBookings(params?: {
  role?: "admin" | "fo" | "customer";
  userId?: string;
  status?: BookingStatus;
  assignedFoUserId?: string;
  customerUserId?: string;
  includeEvents?: boolean;
  view?: "default" | "dispatch" | "fo" | "customer";
}): Promise<BookingRecord[]> {
  return apiListBookings(params);
}

export async function getBookingById(
  id: string,
  options?: { includeEvents?: boolean },
): Promise<BookingRecord> {
  return apiGetBooking(id, options);
}

export async function updateBooking(
  id: string,
  payload: UpdateBookingInput,
): Promise<BookingRecord> {
  return apiUpdateBooking(id, payload);
}

export async function fetchAssignmentRecommendations(
  bookingId: string,
) {
  return apiFetchAssignmentRecommendations(bookingId);
}

export async function assignRecommendedBooking(bookingId: string) {
  return apiAssignRecommendedBooking(bookingId);
}

export async function assignBooking(
  id: string,
  payload: AssignBookingInput,
): Promise<BookingRecord> {
  return apiAssignBooking(id, payload);
}

export async function transitionBooking(
  id: string,
  payload: TransitionBookingInput,
): Promise<BookingRecord> {
  return apiTransitionBooking(id, payload);
}

export async function holdBooking(
  id: string,
  payload?: {
    actorUserId?: string | null;
    actorRole?: string | null;
    note?: string | null;
    payload?: Record<string, unknown> | null;
  },
): Promise<BookingRecord> {
  return apiHoldBooking(id, payload);
}

export async function createBookingCheckout(
  id: string,
  payload?: {
    actorUserId?: string | null;
    actorRole?: string | null;
    successUrl?: string | null;
    cancelUrl?: string | null;
  },
): Promise<BookingCheckoutSession> {
  return apiCreateBookingCheckout(id, payload);
}

export async function updateBookingPaymentStatus(
  id: string,
  payload: {
    nextStatus: BookingPaymentStatus;
    actorUserId?: string | null;
    actorRole?: string | null;
    note?: string | null;
    payload?: Record<string, unknown> | null;
  },
): Promise<BookingRecord> {
  return apiUpdateBookingPaymentStatus(id, payload);
}

export async function getAdminPaymentOpsSummary(): Promise<AdminPaymentOpsSummary> {
  return apiGetAdminPaymentOpsSummary();
}

export async function listAdminPaymentAnomalies(options?: {
  bookingId?: string;
}): Promise<AdminPaymentAnomalyRow[]> {
  return apiListAdminPaymentAnomalies(options);
}
