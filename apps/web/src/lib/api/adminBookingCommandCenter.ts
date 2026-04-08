export type BookingAuthorityReviewStatus = "auto" | "reviewed" | "overridden";

export type AdminBookingAuthorityPersistedSnapshot = {
  surfaces: string[];
  problems: string[];
  methods: string[];
  status: BookingAuthorityReviewStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  /** ISO timestamps when API includes row audit fields (optional for older payloads). */
  createdAt?: string;
  updatedAt?: string;
};

export type AdminBookingAuthorityDerivedSnapshot = {
  surfaces: string[];
  problems: string[];
  methods: string[];
};

export type AdminBookingAuthorityOperatorHints = {
  hasPersistedRow: boolean;
  persistedStatus: BookingAuthorityReviewStatus | null;
  recomputeSkipsOverwrite: boolean;
  recomputeMayRefreshPersistedRow: boolean;
  recomputePreviewOnly: boolean;
};

export type AdminBookingAuthorityBlock = {
  persisted: AdminBookingAuthorityPersistedSnapshot | null;
  derived: AdminBookingAuthorityDerivedSnapshot | null;
  operatorHints?: AdminBookingAuthorityOperatorHints;
};

export type AdminBookingCommandCenterPayload = {
  success: true;
  bookingId: string;
  status: string;
  workflowState: "open" | "held" | "in_review" | "approved" | "reassign_requested";
  operatorNote: string | null;
  /**
   * Persisted vs runtime-derived cleaning authority tags (API 14G+).
   * Older responses may omit this; clients should treat as empty.
   */
  authority?: AdminBookingAuthorityBlock;
  anomaly: {
    id: string;
    status: string;
    reviewState: string | null;
    commandCenterHeld: boolean;
    reassignmentRequested: boolean;
  } | null;
  availableActions: {
    canSaveOperatorNote: boolean;
    canHold: boolean;
    canMarkInReview: boolean;
    canApprove: boolean;
    canReassign: boolean;
  };
  activityPreview: Array<{
    id: string;
    type: string;
    summary: string;
    actorUserId: string;
    actorRole: string;
    createdAt: string;
    metadata: Record<string, unknown>;
  }>;
};

function readApiErrorMessage(payload: unknown, fallback: string) {
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

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchAdminCommandCenter(
  apiBase: string,
  token: string,
  bookingId: string,
): Promise<AdminBookingCommandCenterPayload> {
  const response = await fetch(`${apiBase}/admin/bookings/${bookingId}/command-center`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, `Command center failed (${response.status})`));
  }
  return payload as AdminBookingCommandCenterPayload;
}

export async function patchAdminOperatorNote(
  apiBase: string,
  token: string,
  bookingId: string,
  note: string,
): Promise<AdminBookingCommandCenterPayload> {
  const response = await fetch(`${apiBase}/admin/bookings/${bookingId}/operator-note`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note }),
    cache: "no-store",
  });
  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, `Save note failed (${response.status})`));
  }
  return payload as AdminBookingCommandCenterPayload;
}

export async function postAdminBookingHold(
  apiBase: string,
  token: string,
  bookingId: string,
): Promise<AdminBookingCommandCenterPayload> {
  const response = await fetch(
    `${apiBase}/bookings/${encodeURIComponent(bookingId)}/hold`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actorRole: "admin" }),
      cache: "no-store",
    },
  );
  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, `Hold failed (${response.status})`));
  }
  return fetchAdminCommandCenter(apiBase, token, bookingId);
}

export async function postAdminBookingReview(
  apiBase: string,
  token: string,
  bookingId: string,
): Promise<AdminBookingCommandCenterPayload> {
  const response = await fetch(`${apiBase}/admin/bookings/${bookingId}/review`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, `Review failed (${response.status})`));
  }
  return payload as AdminBookingCommandCenterPayload;
}

export async function postAdminBookingApprove(
  apiBase: string,
  token: string,
  bookingId: string,
): Promise<AdminBookingCommandCenterPayload> {
  const response = await fetch(`${apiBase}/admin/bookings/${bookingId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, `Approve failed (${response.status})`));
  }
  return payload as AdminBookingCommandCenterPayload;
}

export async function postAdminBookingReassign(
  apiBase: string,
  token: string,
  bookingId: string,
  body: Record<string, unknown> = {},
): Promise<AdminBookingCommandCenterPayload> {
  const response = await fetch(`${apiBase}/admin/bookings/${bookingId}/reassign`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, `Reassign failed (${response.status})`));
  }
  return payload as AdminBookingCommandCenterPayload;
}
