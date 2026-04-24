import {
  PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
  computePublicDepositCancellationPolicy,
  computeRemainingBalanceAfterDepositCents,
} from "../src/modules/bookings/public-deposit-policy";

describe("public-deposit-policy", () => {
  it("exposes $100 deposit constant", () => {
    expect(PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS).toBe(10_000);
  });

  it("remaining balance = total minus deposit", () => {
    expect(
      computeRemainingBalanceAfterDepositCents({
        estimatedTotalCents: 27_100,
        depositAmountCents: 10_000,
      }),
    ).toBe(17_100);
  });

  it("refundable when canceling more than 48h before start", () => {
    const scheduledStart = new Date("2030-06-10T12:00:00.000Z");
    const now = new Date("2030-06-08T11:00:00.000Z");
    const r = computePublicDepositCancellationPolicy({
      scheduledStart,
      now,
      depositAmountCents: 10_000,
    });
    expect(r.depositRefundable).toBe(true);
    expect(r.cancellationFeeCents).toBe(0);
  });

  it("non-refundable inside 48h window; fee caps at deposit", () => {
    const scheduledStart = new Date("2030-06-10T12:00:00.000Z");
    const now = new Date("2030-06-10T11:00:00.000Z");
    const r = computePublicDepositCancellationPolicy({
      scheduledStart,
      now,
      depositAmountCents: 10_000,
    });
    expect(r.depositRefundable).toBe(false);
    expect(r.cancellationFeeCents).toBe(10_000);
  });
});
