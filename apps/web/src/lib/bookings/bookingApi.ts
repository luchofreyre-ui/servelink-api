import { apiFetch } from "@/lib/api";
import type {
  AdminPaymentAnomalyRow,
  AdminPaymentOpsSummary,
  AssignBookingInput,
  AssignmentRecommendation,
  BookingCheckoutSession,
  BookingPaymentStatus,
  BookingRecord,
  BookingStatus,
  CreateBookingInput,
  TransitionBookingInput,
  UpdateBookingInput,
} from "./bookingApiTypes";

function readApiErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
    const maybeError = (payload as { error?: { message?: unknown } }).error;
    if (
      maybeError &&
      typeof maybeError === "object" &&
      typeof maybeError.message === "string" &&
      maybeError.message.trim()
    ) {
      return maybeError.message;
    }
  }
  return fallback;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function unwrapItem(body: unknown): BookingRecord {
  if (
    body &&
    typeof body === "object" &&
    "ok" in body &&
    (body as { ok?: unknown }).ok === true &&
    "item" in body
  ) {
    return (body as { item: BookingRecord }).item;
  }
  return body as BookingRecord;
}

function transitionPath(
  transition: Extract<TransitionBookingInput, { transition: string }>["transition"],
): string {
  switch (transition) {
    case "schedule":
      return "schedule";
    case "start":
      return "start";
    case "complete":
      return "complete";
    case "cancel":
      return "cancel";
    case "reopen":
      return "reopen";
    default:
      return "start";
  }
}

export async function createBooking(
  payload: CreateBookingInput,
): Promise<BookingRecord> {
  const res = await apiFetch("/api/v1/bookings", {
    method: "POST",
    json: {
      estimateInput: payload.estimateInput,
      note: payload.note,
    },
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Create booking failed (${res.status})`),
    );
  }
  const booking = (body as { booking?: BookingRecord })?.booking;
  if (!booking?.id) {
    throw new Error("Unexpected create booking response.");
  }
  return booking;
}

export async function getBooking(
  id: string,
  options?: { includeEvents?: boolean },
): Promise<BookingRecord> {
  const search = new URLSearchParams();
  if (options?.includeEvents) {
    search.set("includeEvents", "true");
  }
  const qs = search.toString();
  const res = await apiFetch(
    `/api/v1/bookings/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`,
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Get booking failed (${res.status})`),
    );
  }
  return unwrapItem(body);
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
  const search = new URLSearchParams();

  if (params?.role) search.set("role", params.role);
  if (params?.userId) search.set("userId", params.userId);
  if (params?.status) search.set("status", params.status);
  if (params?.assignedFoUserId) {
    search.set("assignedFoUserId", params.assignedFoUserId);
  }
  if (params?.customerUserId) {
    search.set("customerUserId", params.customerUserId);
  }
  if (params?.includeEvents) {
    search.set("includeEvents", "true");
  }
  if (params?.view) {
    search.set("view", params.view);
  }

  const res = await apiFetch(
    `/api/v1/bookings${search.toString() ? `?${search.toString()}` : ""}`,
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `List bookings failed (${res.status})`),
    );
  }
  if (
    body &&
    typeof body === "object" &&
    "ok" in body &&
    (body as { ok?: unknown }).ok === true &&
    "items" in body &&
    Array.isArray((body as { items: unknown }).items)
  ) {
    return (body as { items: BookingRecord[] }).items;
  }
  throw new Error("Unexpected list bookings response.");
}

export async function updateBooking(
  id: string,
  payload: UpdateBookingInput,
): Promise<BookingRecord> {
  const res = await apiFetch(`/api/v1/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    json: payload,
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Update booking failed (${res.status})`),
    );
  }
  return unwrapItem(body);
}

export async function fetchAssignmentRecommendations(
  bookingId: string,
): Promise<AssignmentRecommendation[]> {
  const res = await apiFetch(
    `/api/v1/bookings/${encodeURIComponent(bookingId)}/assignment-recommendations`,
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Assignment recommendations failed (${res.status})`),
    );
  }
  if (
    body &&
    typeof body === "object" &&
    "ok" in body &&
    (body as { ok?: unknown }).ok === true &&
    "items" in body &&
    Array.isArray((body as { items: unknown }).items)
  ) {
    return (body as { items: AssignmentRecommendation[] }).items;
  }
  throw new Error("Unexpected assignment recommendations response.");
}

export async function assignRecommendedBooking(bookingId: string): Promise<BookingRecord> {
  const res = await apiFetch(
    `/api/v1/bookings/${encodeURIComponent(bookingId)}/assign-recommended`,
    { method: "POST" },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Assign recommended failed (${res.status})`),
    );
  }
  if (body && typeof body === "object" && "id" in body) {
    return body as BookingRecord;
  }
  return getBooking(bookingId);
}

export async function assignBooking(
  id: string,
  payload: AssignBookingInput,
): Promise<BookingRecord> {
  const res = await apiFetch(`/api/v1/bookings/${encodeURIComponent(id)}/assign`, {
    method: "POST",
    json: {
      foId: payload.foId,
      note: payload.note,
      ...(payload.assignmentSource != null
        ? { assignmentSource: payload.assignmentSource }
        : {}),
      ...(payload.recommendationSummary != null
        ? { recommendationSummary: payload.recommendationSummary }
        : {}),
    },
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Assign booking failed (${res.status})`),
    );
  }
  if (body && typeof body === "object" && "id" in body) {
    return body as BookingRecord;
  }
  return getBooking(id);
}

export async function transitionBooking(
  id: string,
  payload: TransitionBookingInput,
): Promise<BookingRecord> {
  if ("nextStatus" in payload) {
    const res = await apiFetch(
      `/api/v1/bookings/${encodeURIComponent(id)}/transition`,
      {
        method: "POST",
        json: {
          nextStatus: payload.nextStatus,
          note: payload.note,
          scheduledStart: payload.scheduledStart,
          foId: payload.foId,
          actorUserId: payload.actorUserId,
          actorRole: payload.actorRole,
        },
      },
    );
    const body = await parseJson(res);
    if (!res.ok) {
      throw new Error(
        readApiErrorMessage(body, `Transition booking failed (${res.status})`),
      );
    }
    return unwrapItem(body);
  }

  const segment = transitionPath(payload.transition);
  const res = await apiFetch(
    `/api/v1/bookings/${encodeURIComponent(id)}/${segment}`,
    {
      method: "POST",
      json: {
        note: payload.note,
        scheduledStart: payload.scheduledStart,
      },
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Transition booking failed (${res.status})`),
    );
  }
  if (body && typeof body === "object" && "id" in body) {
    return body as BookingRecord;
  }
  return getBooking(id);
}

function defaultBookingCheckoutUrls(bookingId: string): {
  successUrl: string;
  cancelUrl: string;
} {
  const webOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_WEB_BASE_URL ?? "http://localhost:3000").replace(
          /\/$/,
          "",
        );
  return {
    successUrl: `${webOrigin}/customer/bookings/${encodeURIComponent(bookingId)}?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${webOrigin}/customer/bookings/${encodeURIComponent(bookingId)}?checkout=canceled`,
  };
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
  const defaults = defaultBookingCheckoutUrls(id);
  const res = await apiFetch(
    `/api/v1/bookings/${encodeURIComponent(id)}/create-checkout`,
    {
      method: "POST",
      json: {
        successUrl: payload?.successUrl ?? defaults.successUrl,
        cancelUrl: payload?.cancelUrl ?? defaults.cancelUrl,
        actorUserId: payload?.actorUserId,
        actorRole: payload?.actorRole,
      },
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Create checkout failed (${res.status})`),
    );
  }
  if (
    body &&
    typeof body === "object" &&
    "ok" in body &&
    (body as { ok?: unknown }).ok === true &&
    "item" in body
  ) {
    return (body as { item: BookingCheckoutSession }).item;
  }
  throw new Error("Unexpected create checkout response.");
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
  const res = await apiFetch(
    `/api/v1/bookings/${encodeURIComponent(id)}/payment-status`,
    {
      method: "POST",
      json: payload,
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Update payment status failed (${res.status})`),
    );
  }
  if (
    body &&
    typeof body === "object" &&
    "ok" in body &&
    (body as { ok?: unknown }).ok === true &&
    "item" in body
  ) {
    return (body as { item: BookingRecord }).item;
  }
  throw new Error("Unexpected payment status response.");
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
  const res = await apiFetch(`/api/v1/bookings/${encodeURIComponent(id)}/hold`, {
    method: "POST",
    json: payload ?? {},
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Hold booking failed (${res.status})`),
    );
  }
  return unwrapItem(body);
}

export async function getAdminPaymentOpsSummary(): Promise<AdminPaymentOpsSummary> {
  const res = await apiFetch("/api/v1/admin/payments/ops-summary");
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Payment ops summary failed (${res.status})`),
    );
  }
  if (
    body &&
    typeof body === "object" &&
    "ok" in body &&
    (body as { ok?: unknown }).ok === true &&
    "item" in body
  ) {
    return (body as { item: AdminPaymentOpsSummary }).item;
  }
  throw new Error("Unexpected payment ops summary response.");
}

export async function listAdminPaymentAnomalies(options?: {
  bookingId?: string;
}): Promise<AdminPaymentAnomalyRow[]> {
  const search = new URLSearchParams();
  if (options?.bookingId?.trim()) {
    search.set("bookingId", options.bookingId.trim());
  }
  const qs = search.toString();
  const res = await apiFetch(
    `/api/v1/admin/payments/anomalies${qs ? `?${qs}` : ""}`,
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(
      readApiErrorMessage(body, `Payment anomalies failed (${res.status})`),
    );
  }
  if (
    body &&
    typeof body === "object" &&
    "ok" in body &&
    (body as { ok?: unknown }).ok === true &&
    "items" in body &&
    Array.isArray((body as { items: unknown }).items)
  ) {
    return (body as { items: AdminPaymentAnomalyRow[] }).items;
  }
  throw new Error("Unexpected payment anomalies response.");
}
