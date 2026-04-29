export type PublicSlotIdentity = {
  foId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function normalizePublicSlotInstant(value: Date | string): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

function normalizePublicSlotIdentity(input: {
  foId: string;
  startAt: Date | string;
  endAt: Date | string;
  durationMinutes?: number;
}): PublicSlotIdentity | null {
  const foId = input.foId.trim();
  if (!foId) return null;
  const startAt = normalizePublicSlotInstant(input.startAt);
  const endAt = normalizePublicSlotInstant(input.endAt);
  if (!startAt || !endAt) return null;
  const start = new Date(startAt);
  const end = new Date(endAt);
  const durationMinutes =
    typeof input.durationMinutes === "number"
      ? Math.floor(input.durationMinutes)
      : Math.round((end.getTime() - start.getTime()) / (60 * 1000));
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return null;
  if (end.getTime() <= start.getTime()) return null;
  if (durationMinutes !== Math.round((end.getTime() - start.getTime()) / (60 * 1000))) {
    return null;
  }
  return { foId, startAt, endAt, durationMinutes };
}

export function encodePublicSlotId(input: {
  foId: string;
  startAt: Date | string;
  endAt: Date | string;
  durationMinutes?: number;
}): string {
  const identity = normalizePublicSlotIdentity(input);
  if (!identity) {
    throw new Error("Invalid public slot identity");
  }
  return base64UrlEncode(JSON.stringify(identity));
}

export function decodePublicSlotId(slotId: string): PublicSlotIdentity | null {
  const trimmed = slotId.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(trimmed)) as Partial<PublicSlotIdentity>;
    if (!parsed || typeof parsed !== "object") return null;
    return normalizePublicSlotIdentity({
      foId: typeof parsed.foId === "string" ? parsed.foId : "",
      startAt: typeof parsed.startAt === "string" ? parsed.startAt : "",
      endAt: typeof parsed.endAt === "string" ? parsed.endAt : "",
      durationMinutes:
        typeof parsed.durationMinutes === "number" ? parsed.durationMinutes : undefined,
    });
  } catch {
    return null;
  }
}
