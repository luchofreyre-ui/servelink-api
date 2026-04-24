import {
  BookingPublicDepositStatus,
  BookingRemainingBalancePaymentStatus,
  BookingStatus,
} from "@prisma/client";
import {
  computeCancellationPolicy,
  computeRemainingBalanceAuthorizationEligibility,
  computeRemainingBalanceCaptureEligibility,
  computeRemainingBalanceCents,
} from "../src/modules/bookings/payment-lifecycle-policy";

describe("payment-lifecycle-policy", () => {
  it("remaining balance = total - deposit, never below 0", () => {
    expect(
      computeRemainingBalanceCents({
        estimatedTotalCents: 50_000,
        depositAmountCents: 10_000,
      }),
    ).toBe(40_000);
    expect(
      computeRemainingBalanceCents({
        estimatedTotalCents: 5_000,
        depositAmountCents: 10_000,
      }),
    ).toBe(0);
  });

  it("cancel >48h = refundable, fee 0", () => {
    const scheduledStart = new Date("2030-06-10T12:00:00.000Z");
    const now = new Date("2030-06-08T11:00:00.000Z");
    const r = computeCancellationPolicy({
      scheduledStart,
      now,
      depositAmountCents: 10_000,
    });
    expect(r.depositRefundable).toBe(true);
    expect(r.cancellationFeeCents).toBe(0);
  });

  it("cancel <=48h = not refundable, fee min(10000, deposit)", () => {
    const scheduledStart = new Date("2030-06-10T12:00:00.000Z");
    const now = new Date("2030-06-10T11:00:00.000Z");
    const r = computeCancellationPolicy({
      scheduledStart,
      now,
      depositAmountCents: 10_000,
    });
    expect(r.depositRefundable).toBe(false);
    expect(r.cancellationFeeCents).toBe(10_000);
    const r2 = computeCancellationPolicy({
      scheduledStart,
      now,
      depositAmountCents: 5_000,
    });
    expect(r2.cancellationFeeCents).toBe(5_000);
  });

  it("T-24h authorization eligibility boundaries", () => {
    const scheduledStart = new Date("2030-06-10T12:00:00.000Z");
    const base = {
      remainingBalanceCents: 5_000,
      bookingStatus: BookingStatus.assigned,
      depositStatus: BookingPublicDepositStatus.deposit_succeeded,
      balanceStatus: BookingRemainingBalancePaymentStatus.balance_pending_authorization,
    };
    const inside = new Date("2030-06-09T13:00:00.000Z");
    expect(
      computeRemainingBalanceAuthorizationEligibility({
        ...base,
        scheduledStart,
        now: inside,
      }).eligible,
    ).toBe(true);

    const tooEarly = new Date("2030-06-08T11:00:00.000Z");
    expect(
      computeRemainingBalanceAuthorizationEligibility({
        ...base,
        scheduledStart,
        now: tooEarly,
      }).eligible,
    ).toBe(false);

    const afterStart = new Date("2030-06-10T13:00:00.000Z");
    expect(
      computeRemainingBalanceAuthorizationEligibility({
        ...base,
        scheduledStart,
        now: afterStart,
      }).eligible,
    ).toBe(false);
  });

  it("capture eligibility only after completion", () => {
    expect(
      computeRemainingBalanceCaptureEligibility({
        bookingStatus: BookingStatus.in_progress,
        balanceStatus: BookingRemainingBalancePaymentStatus.balance_authorized,
        completedAt: null,
      }).eligible,
    ).toBe(false);
    expect(
      computeRemainingBalanceCaptureEligibility({
        bookingStatus: BookingStatus.completed,
        balanceStatus: BookingRemainingBalancePaymentStatus.balance_authorized,
        completedAt: new Date(),
      }).eligible,
    ).toBe(true);
  });
});
