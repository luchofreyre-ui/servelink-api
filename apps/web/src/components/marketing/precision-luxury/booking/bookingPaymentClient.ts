import { API_BASE_URL } from "@/lib/api";

/**
 * Mirrors `PublicBookingDepositPrepareResult` from the API
 * (`POST /api/v1/public-booking/deposit-prepare`).
 */
export type PublicBookingDepositPrepareResponse = {
  kind: "public_booking_deposit_prepare";
  bookingId: string;
  paymentMode: "none" | "deposit";
  classification: string;
  publicDepositStatus?: string;
  clientSecret?: string | null;
  paymentIntentId?: string;
  amountCents?: number;
  currency?: string;
  stripeStatus?: string;
};

function parsePrepareJson(raw: unknown): PublicBookingDepositPrepareResponse {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid deposit prepare response");
  }
  const o = raw as Record<string, unknown>;
  if (o.kind !== "public_booking_deposit_prepare") {
    throw new Error("Unexpected deposit prepare response kind");
  }
  if (typeof o.bookingId !== "string" || !o.bookingId.trim()) {
    throw new Error("deposit prepare: missing bookingId");
  }
  if (o.paymentMode !== "none" && o.paymentMode !== "deposit") {
    throw new Error("deposit prepare: invalid paymentMode");
  }
  if (typeof o.classification !== "string") {
    throw new Error("deposit prepare: missing classification");
  }
  return {
    kind: "public_booking_deposit_prepare",
    bookingId: o.bookingId.trim(),
    paymentMode: o.paymentMode,
    classification: o.classification,
    publicDepositStatus:
      typeof o.publicDepositStatus === "string"
        ? o.publicDepositStatus
        : undefined,
    clientSecret:
      o.clientSecret === null || typeof o.clientSecret === "string"
        ? (o.clientSecret as string | null)
        : undefined,
    paymentIntentId:
      typeof o.paymentIntentId === "string" ? o.paymentIntentId : undefined,
    amountCents:
      typeof o.amountCents === "number" && Number.isFinite(o.amountCents)
        ? o.amountCents
        : undefined,
    currency: typeof o.currency === "string" ? o.currency : undefined,
    stripeStatus:
      typeof o.stripeStatus === "string" ? o.stripeStatus : undefined,
  };
}

/**
 * Prepare (or sync) the public booking deposit PaymentIntent for `/book` review step.
 * Unauthenticated — booking id is the pre-schedule capability key; hold id is
 * included only when syncing an older hold-scoped payment.
 */
export async function postPublicBookingDepositPrepare(body: {
  bookingId: string;
  holdId?: string | null;
}): Promise<PublicBookingDepositPrepareResponse> {
  const bookingId = body.bookingId.trim();
  const holdId = body.holdId?.trim() || "";
  if (!bookingId) {
    throw new Error("bookingId is required");
  }

  const response = await fetch(`${API_BASE_URL}/public-booking/deposit-prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingId,
      ...(holdId ? { holdId } : {}),
    }),
    cache: "no-store",
  });

  const text = await response.text().catch(() => "");
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const err =
      parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as { message?: unknown }).message ?? "")
        : "";
    const code =
      parsed && typeof parsed === "object" && "code" in parsed
        ? String((parsed as { code?: unknown }).code ?? "")
        : "";
    const error = new Error(
      err.trim() ||
        (response.status === 503
          ? "Payment service is temporarily unavailable."
          : "Could not prepare deposit payment."),
    );
    if (code.trim()) {
      (error as Error & { code?: string }).code = code.trim();
    }
    throw error;
  }

  return parsePrepareJson(parsed);
}

export function isDepositFullySatisfied(
  res: PublicBookingDepositPrepareResponse,
): boolean {
  if (res.paymentMode !== "none") return false;
  return (
    res.classification === "deposit_succeeded" ||
    res.classification === "deposit_inconsistent" ||
    res.classification === "skip_deposit_env" ||
    res.classification === "booking_not_pending_payment"
  );
}
