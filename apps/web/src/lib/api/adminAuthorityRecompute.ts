export type BookingAuthorityRecomputeUiOutcome =
  | "recomputed"
  | "recomputed_unchanged"
  | "skipped_overridden"
  | "derived_preview_only";

export type BookingAuthorityRecomputeResponse = {
  kind: "booking_authority_recompute_result";
  outcome: string;
  uiOutcome: BookingAuthorityRecomputeUiOutcome;
  uiSummary: string;
  uiDetail: string;
  bookingId: string;
  unchanged?: boolean;
  resolvedPreview?: unknown;
  persisted?: unknown;
};

function readApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return fallback;
}

export async function postAdminAuthorityRecompute(
  apiBase: string,
  token: string,
  bookingId: string,
): Promise<BookingAuthorityRecomputeResponse> {
  const response = await fetch(
    `${apiBase}/api/v1/admin/authority/bookings/${encodeURIComponent(bookingId)}/recompute`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      readApiErrorMessage(payload, `Recompute failed (${response.status})`),
    );
  }

  return payload as BookingAuthorityRecomputeResponse;
}
