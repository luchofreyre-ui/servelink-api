import { createHmac, timingSafeEqual } from "node:crypto";

export type PublicSlotIdentity = {
  foId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
};

type PublicSlotEnvelope = {
  v: 1;
  payload: PublicSlotIdentity;
  sig: string;
};

const LOCAL_PUBLIC_SLOT_ID_SECRET = "local-public-slot-id-secret-for-dev-and-test";

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function resolvePublicSlotIdSecret(): string {
  const configured = process.env.PUBLIC_SLOT_ID_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PUBLIC_SLOT_ID_SECRET is required in production");
  }
  return LOCAL_PUBLIC_SLOT_ID_SECRET;
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

function canonicalPublicSlotPayloadJson(identity: PublicSlotIdentity): string {
  return JSON.stringify({
    foId: identity.foId,
    startAt: identity.startAt,
    endAt: identity.endAt,
    durationMinutes: identity.durationMinutes,
  });
}

function signPublicSlotIdentity(identity: PublicSlotIdentity): string {
  return createHmac("sha256", resolvePublicSlotIdSecret())
    .update(canonicalPublicSlotPayloadJson(identity))
    .digest("base64url");
}

function signaturesMatch(observed: string, expected: string): boolean {
  const observedBuffer = Buffer.from(observed);
  const expectedBuffer = Buffer.from(expected);
  return (
    observedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(observedBuffer, expectedBuffer)
  );
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
  const envelope: PublicSlotEnvelope = {
    v: 1,
    payload: identity,
    sig: signPublicSlotIdentity(identity),
  };
  return base64UrlEncode(JSON.stringify(envelope));
}

export function decodePublicSlotId(slotId: string): PublicSlotIdentity | null {
  const trimmed = slotId.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(trimmed)) as Partial<PublicSlotEnvelope>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.v !== 1 || typeof parsed.sig !== "string") return null;
    const payload =
      parsed.payload && typeof parsed.payload === "object" ? parsed.payload : null;
    if (!payload) return null;
    const identity = normalizePublicSlotIdentity({
      foId: typeof payload.foId === "string" ? payload.foId : "",
      startAt: typeof payload.startAt === "string" ? payload.startAt : "",
      endAt: typeof payload.endAt === "string" ? payload.endAt : "",
      durationMinutes:
        typeof payload.durationMinutes === "number"
          ? payload.durationMinutes
          : undefined,
    });
    if (!identity) return null;
    if (!signaturesMatch(parsed.sig, signPublicSlotIdentity(identity))) {
      return null;
    }
    return identity;
  } catch {
    return null;
  }
}
