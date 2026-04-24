import { describe, expect, it, vi } from "vitest";
import {
  DEPOSIT_PREPARE_POLL_MAX_MS,
  depositPreparePollBackoffMs,
  pollDepositPrepareUntilSatisfiedOrCap,
} from "./bookingDepositPreparePoll";
import type { PublicBookingDepositPrepareResponse } from "./bookingPaymentClient";

describe("bookingDepositPreparePoll", () => {
  it("uses the documented backoff sequence then caps at 4000ms", () => {
    expect(depositPreparePollBackoffMs(0)).toBe(500);
    expect(depositPreparePollBackoffMs(1)).toBe(1000);
    expect(depositPreparePollBackoffMs(2)).toBe(1500);
    expect(depositPreparePollBackoffMs(3)).toBe(2500);
    expect(depositPreparePollBackoffMs(4)).toBe(4000);
    expect(depositPreparePollBackoffMs(5)).toBe(4000);
    expect(depositPreparePollBackoffMs(99)).toBe(4000);
  });

  it("stops within the 15s cap and returns satisfied when prepare eventually succeeds", async () => {
    let t = 0;
    let calls = 0;
    const clock = {
      now: () => t,
      sleep: vi.fn(async (ms: number) => {
        t += ms;
      }),
    };
    const fetchPrepare = vi.fn(
      async (): Promise<PublicBookingDepositPrepareResponse> => {
        calls += 1;
        if (calls < 3) {
          return {
            kind: "public_booking_deposit_prepare",
            bookingId: "bk1",
            paymentMode: "deposit",
            classification: "processing",
          };
        }
        return {
          kind: "public_booking_deposit_prepare",
          bookingId: "bk1",
          paymentMode: "none",
          classification: "deposit_succeeded",
        };
      },
    );
    const outcome = await pollDepositPrepareUntilSatisfiedOrCap(
      "bk1",
      fetchPrepare,
      clock,
    );
    expect(outcome).toBe("satisfied");
    expect(t).toBeLessThanOrEqual(DEPOSIT_PREPARE_POLL_MAX_MS);
    expect(fetchPrepare).toHaveBeenCalledTimes(3);
    expect(clock.sleep).toHaveBeenNthCalledWith(1, 500);
    expect(clock.sleep).toHaveBeenNthCalledWith(2, 1000);
  });

  it("returns timeout when the window is exhausted without satisfaction", async () => {
    let t = 0;
    const clock = {
      now: () => t,
      sleep: vi.fn(async (ms: number) => {
        t += ms;
      }),
    };
    const fetchPrepare = vi.fn(
      async (): Promise<PublicBookingDepositPrepareResponse> => ({
        kind: "public_booking_deposit_prepare",
        bookingId: "bk1",
        paymentMode: "deposit",
        classification: "processing",
      }),
    );
    const outcome = await pollDepositPrepareUntilSatisfiedOrCap(
      "bk1",
      fetchPrepare,
      clock,
    );
    expect(outcome).toBe("timeout");
    expect(t).toBeLessThanOrEqual(DEPOSIT_PREPARE_POLL_MAX_MS);
  });
});
