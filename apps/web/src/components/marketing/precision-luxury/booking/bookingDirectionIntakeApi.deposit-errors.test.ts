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

  it("throws PublicBookingPaymentRequiredError for deployed top-level 402 payment fields", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      text: async () =>
        JSON.stringify({
          ok: false,
          code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
          message: "Deposit required",
          clientSecret: "cs_top",
          paymentIntentId: "pi_top",
          amountCents: 10_000,
          currency: "usd",
          bookingId: "bk_1",
          holdId: "hold_1",
          paymentSessionKey: "public-booking:bk_1:hold:hold_1",
        }),
    });

    await expect(
      postPublicBookingConfirm({ bookingId: "bk_1", holdId: "hold_1" }, "idem-1"),
    ).rejects.toSatisfy((e: unknown) => {
      if (!(e instanceof PublicBookingPaymentRequiredError)) return false;
      return (
        e.details.clientSecret === "cs_top" &&
        e.details.paymentIntentId === "pi_top" &&
        e.details.bookingId === "bk_1" &&
        e.details.holdId === "hold_1" &&
        e.details.paymentSessionKey === "public-booking:bk_1:hold:hold_1"
      );
    });
  });

  it("throws PublicBookingPaymentRequiredError for nested 402 details payment fields", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      text: async () =>
        JSON.stringify({
          ok: false,
          error: {
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
            message: "Deposit required",
            details: {
              clientSecret: "cs_nested",
              paymentIntentId: "pi_nested",
              amountCents: 10_000,
              currency: "usd",
            },
          },
        }),
    });

    await expect(
      postPublicBookingConfirm({ bookingId: "bk_1", holdId: "hold_1" }, "idem-1"),
    ).rejects.toSatisfy((e: unknown) => {
      if (!(e instanceof PublicBookingPaymentRequiredError)) return false;
      return (
        e.details.clientSecret === "cs_nested" &&
        e.details.paymentIntentId === "pi_nested" &&
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
