import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  postPublicBookingConfirm,
  PublicBookingDepositProcessingError,
  PublicBookingPaymentRequiredError,
} from "./bookingDirectionIntakeApi";

describe("postPublicBookingConfirm — deposit error mapping", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws PublicBookingPaymentRequiredError when API returns PAYMENT_REQUIRED + details", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      text: async () =>
        JSON.stringify({
          ok: false,
          error: {
            code: "PAYMENT_REQUIRED",
            message: "A $100 deposit is required.",
            details: {
              kind: "public_booking_deposit_required",
              code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
              message: "A $100 deposit is required.",
              amountCents: 10_000,
              currency: "usd",
              clientSecret: "cs_test_123",
              paymentIntentId: "pi_test_123",
            },
          },
        }),
    });

    await expect(
      postPublicBookingConfirm({ bookingId: "bk_1", holdId: "hold_1" }, "idem-1"),
    ).rejects.toSatisfy((e: unknown) => {
      if (!(e instanceof PublicBookingPaymentRequiredError)) return false;
      return (
        e.code === "PAYMENT_REQUIRED" &&
        e.details.paymentIntentId === "pi_test_123" &&
        e.details.clientSecret === "cs_test_123" &&
        e.details.amountCents === 10_000
      );
    });
  });

  it("throws PublicBookingDepositProcessingError on 409 processing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({
          ok: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Deposit payment is processing.",
            details: {
              kind: "public_booking_deposit_processing",
              code: "PUBLIC_BOOKING_DEPOSIT_PROCESSING",
              message: "Deposit payment is processing.",
              paymentIntentId: "pi_proc",
            },
          },
        }),
    });

    await expect(
      postPublicBookingConfirm({ bookingId: "bk_1", holdId: "hold_1" }, "idem-1"),
    ).rejects.toBeInstanceOf(PublicBookingDepositProcessingError);
  });
});
