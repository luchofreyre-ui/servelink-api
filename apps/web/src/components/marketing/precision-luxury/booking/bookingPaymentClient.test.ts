import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isDepositFullySatisfied,
  postPublicBookingDepositPrepare,
} from "./bookingPaymentClient";

describe("bookingPaymentClient", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("postPublicBookingDepositPrepare parses ok envelope", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          kind: "public_booking_deposit_prepare",
          bookingId: "bk_1",
          paymentMode: "deposit",
          classification: "payment_required",
          clientSecret: "cs_test",
          paymentIntentId: "pi_test",
          amountCents: 10_000,
          currency: "usd",
          stripeStatus: "requires_payment_method",
        }),
    });

    const res = await postPublicBookingDepositPrepare({
      bookingId: "bk_1",
      holdId: "hold_1",
    });
    expect(res.paymentMode).toBe("deposit");
    expect(res.clientSecret).toBe("cs_test");
    expect(res.amountCents).toBe(10_000);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ bookingId: "bk_1", holdId: "hold_1" }),
      }),
    );
  });

  it("isDepositFullySatisfied is true for skip and succeeded none modes", () => {
    expect(
      isDepositFullySatisfied({
        kind: "public_booking_deposit_prepare",
        bookingId: "b",
        paymentMode: "none",
        classification: "skip_deposit_env",
      }),
    ).toBe(true);
    expect(
      isDepositFullySatisfied({
        kind: "public_booking_deposit_prepare",
        bookingId: "b",
        paymentMode: "none",
        classification: "deposit_succeeded",
      }),
    ).toBe(true);
    expect(
      isDepositFullySatisfied({
        kind: "public_booking_deposit_prepare",
        bookingId: "b",
        paymentMode: "deposit",
        classification: "payment_required",
      }),
    ).toBe(false);
  });
});
