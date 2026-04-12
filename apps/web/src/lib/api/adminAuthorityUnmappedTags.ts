export type BookingAuthorityUnmappedTagsPayload = {
  kind: "booking_authority_unmapped_tags";
  generatedAt: string;
  windowUsed: { fromIso: string; toIso: string } | null;
  rowsScanned: number;
  maxRowsScan: number;
  items: Array<{ axis: string; tag: string; bookingCount: number }>;
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

export async function fetchAdminAuthorityUnmappedTags(
  apiBase: string,
  token: string,
  params?: { windowHours?: number; updatedSince?: string; maxRowsScan?: number },
): Promise<BookingAuthorityUnmappedTagsPayload> {
  const sp = new URLSearchParams();
  if (params?.windowHours != null) sp.set("windowHours", String(params.windowHours));
  if (params?.updatedSince?.trim()) sp.set("updatedSince", params.updatedSince.trim());
  if (params?.maxRowsScan != null) sp.set("maxRowsScan", String(params.maxRowsScan));
  const qs = sp.toString();
  const url = `${apiBase}/admin/authority/knowledge-unmapped-tags${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new Error(
      readApiErrorMessage(payload, `Unmapped tags failed (${response.status})`),
    );
  }
  return payload as BookingAuthorityUnmappedTagsPayload;
}
