import { Logger } from "@nestjs/common";
import {
  BookingDepositRefundStatus,
  BookingPublicDepositStatus,
  BookingRemainingBalancePaymentStatus,
} from "@prisma/client";
import { PaymentLifecycleReconciliationCronService } from "../src/modules/billing/payment-lifecycle-reconciliation.cron.service";
import { PaymentLifecycleReconciliationService } from "../src/modules/billing/payment-lifecycle-reconciliation.service";
import { isCronDisabledByExplicitFalse } from "../src/modules/billing/payment-lifecycle-cron-env";
import { RemainingBalanceAuthorizationCronService } from "../src/modules/billing/remaining-balance-authorization.cron.service";
import { StripePaymentService } from "../src/modules/bookings/stripe/stripe-payment.service";

type RefundShape = {
  id: string;
  status: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
};

function makeReconciliationService(
  booking: Record<string, unknown>,
  opts?: {
    pi?: { status: string };
    refund?: RefundShape | "throw";
  },
): {
  svc: PaymentLifecycleReconciliationService;
  prisma: any;
  stripe: StripePaymentService;
} {
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  const bookingUpdate = jest.fn().mockResolvedValue({});
  const prisma = {
    booking: {
      findUnique: jest.fn().mockResolvedValue(booking),
      update: bookingUpdate,
    },
  } as any;
  const stripe = new StripePaymentService(prisma, {} as any);
  if (opts?.pi) {
    jest.spyOn(stripe, "retrievePaymentIntent").mockResolvedValue(opts.pi as any);
  } else {
    jest.spyOn(stripe, "retrievePaymentIntent");
  }
  if (opts?.refund === "throw") {
    jest
      .spyOn(stripe, "retrieveRefundForDepositReconciliation")
      .mockRejectedValue(new Error("stripe_refund_missing"));
  } else if (opts?.refund) {
    jest.spyOn(stripe, "retrieveRefundForDepositReconciliation").mockResolvedValue(opts.refund);
  } else {
    jest.spyOn(stripe, "retrieveRefundForDepositReconciliation");
  }
  return {
    svc: new PaymentLifecycleReconciliationService(prisma, stripe),
    prisma,
    stripe,
  };
}

describe("PaymentLifecycleReconciliationService", () => {
  const OLD_STRIPE = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = OLD_STRIPE;
  });

  it("requires_capture reconciles to balance_authorized", async () => {
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus:
          BookingRemainingBalancePaymentStatus.balance_pending_authorization,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: null,
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
        depositRefundId: null,
        depositRefundedAt: null,
      },
      { pi: { status: "requires_capture" } },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_authorized,
        }),
      }),
    );
  });

  it("succeeded reconciles to balance_captured", async () => {
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_authorized,
        remainingBalanceAuthorizedAt: new Date(),
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: null,
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
        depositRefundId: null,
        depositRefundedAt: null,
      },
      { pi: { status: "succeeded" } },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_captured,
        }),
      }),
    );
  });

  it("requires_payment_method reconciles to balance_authorization_required", async () => {
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus:
          BookingRemainingBalancePaymentStatus.balance_authorization_failed,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: "prior",
        publicDepositPaymentIntentId: null,
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
        depositRefundId: null,
        depositRefundedAt: null,
      },
      { pi: { status: "requires_payment_method" } },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_authorization_required,
        }),
      }),
    );
  });

  it("failed reconciles to balance_authorization_failed", async () => {
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus:
          BookingRemainingBalancePaymentStatus.balance_pending_authorization,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: null,
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
        depositRefundId: null,
        depositRefundedAt: null,
      },
      { pi: { status: "failed" } },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_authorization_failed,
        }),
      }),
    );
  });

  it("does not downgrade balance_captured", async () => {
    const { svc, prisma, stripe } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_captured,
        remainingBalanceAuthorizedAt: new Date(),
        remainingBalanceCapturedAt: new Date(),
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: null,
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
        depositRefundId: null,
        depositRefundedAt: null,
      },
      { pi: { status: "requires_capture" } },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(false);
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(stripe.retrievePaymentIntent).not.toHaveBeenCalled();
  });

  it("does not change balance_canceled", async () => {
    const { svc, prisma, stripe } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_canceled,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: null,
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
        depositRefundId: null,
        depositRefundedAt: null,
      },
      { pi: { status: "succeeded" } },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(false);
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(stripe.retrievePaymentIntent).not.toHaveBeenCalled();
  });

  it("depositRefundId + Stripe refund succeeded → refund_succeeded and depositRefundedAt", async () => {
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: null,
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_not_required,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: "pi_dep",
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_pending,
        depositRefundId: "re_1",
        depositRefundedAt: null,
      },
      {
        refund: {
          id: "re_1",
          status: "succeeded",
          paymentIntentId: "pi_dep",
          chargeId: "ch_1",
        },
      },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          depositRefundStatus: BookingDepositRefundStatus.refund_succeeded,
          publicDepositStatus: BookingPublicDepositStatus.refunded,
        }),
      }),
    );
    const patch = prisma.booking.update.mock.calls[0][0].data;
    expect(patch.depositRefundedAt).toBeTruthy();
  });

  it("depositRefundId + Stripe refund pending → refund_pending", async () => {
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: null,
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_not_required,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: "pi_dep",
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_failed,
        depositRefundId: "re_1",
        depositRefundedAt: null,
      },
      {
        refund: {
          id: "re_1",
          status: "pending",
          paymentIntentId: "pi_dep",
          chargeId: null,
        },
      },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          depositRefundStatus: BookingDepositRefundStatus.refund_pending,
        }),
      }),
    );
  });

  it("depositRefundId + Stripe refund failed → refund_failed", async () => {
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: null,
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_not_required,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: "pi_dep",
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_pending,
        depositRefundId: "re_1",
        depositRefundedAt: null,
      },
      {
        refund: {
          id: "re_1",
          status: "failed",
          paymentIntentId: "pi_dep",
          chargeId: null,
        },
      },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          depositRefundStatus: BookingDepositRefundStatus.refund_failed,
        }),
      }),
    );
    expect(prisma.booking.update.mock.calls[0][0].data.depositRefundedAt).toBeUndefined();
  });

  it("depositRefundId + Stripe refund canceled → refund_failed", async () => {
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: null,
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_not_required,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: "pi_dep",
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_pending,
        depositRefundId: "re_1",
        depositRefundedAt: null,
      },
      {
        refund: {
          id: "re_1",
          status: "canceled",
          paymentIntentId: "pi_dep",
          chargeId: null,
        },
      },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          depositRefundStatus: BookingDepositRefundStatus.refund_failed,
        }),
      }),
    );
  });

  it("existing refund_succeeded is not downgraded by Stripe pending", async () => {
    const { svc, prisma, stripe } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: null,
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_not_required,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: "pi_dep",
        publicDepositStatus: BookingPublicDepositStatus.refunded,
        depositRefundStatus: BookingDepositRefundStatus.refund_succeeded,
        depositRefundId: "re_1",
        depositRefundedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        refund: {
          id: "re_1",
          status: "pending",
          paymentIntentId: "pi_dep",
          chargeId: null,
        },
      },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(false);
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(stripe.retrieveRefundForDepositReconciliation).not.toHaveBeenCalled();
    expect(r.detail).toContain("deposit_refund_already_succeeded_no_downgrade");
  });

  it("paymentIntentId mismatch does not mutate booking", async () => {
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: null,
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_not_required,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: "pi_dep",
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_pending,
        depositRefundId: "re_1",
        depositRefundedAt: null,
      },
      {
        refund: {
          id: "re_1",
          status: "succeeded",
          paymentIntentId: "pi_other",
          chargeId: null,
        },
      },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(false);
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(r.detail).toContain("deposit_refund_pi_mismatch");
  });

  it("refund_pending with null depositRefundId logs and skips without mutation", async () => {
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: null,
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_not_required,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: "pi_dep",
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_pending,
        depositRefundId: null,
        depositRefundedAt: null,
      },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(false);
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "payment_lifecycle_reconcile",
        event: "refund_pending_missing_refund_id",
        bookingId: "b1",
      }),
    );
    expect(r.detail).toContain("refund_pending_missing_refund_id");
    warn.mockRestore();
  });

  it("allows refund reconciliation when Stripe omits paymentIntentId", async () => {
    const { svc, prisma } = makeReconciliationService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: null,
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_not_required,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: "pi_dep",
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        depositRefundStatus: BookingDepositRefundStatus.refund_pending,
        depositRefundId: "re_1",
        depositRefundedAt: null,
      },
      {
        refund: {
          id: "re_1",
          status: "succeeded",
          paymentIntentId: null,
          chargeId: "ch_1",
        },
      },
    );
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(true);
    expect(prisma.booking.update).toHaveBeenCalled();
  });
});

describe("payment lifecycle crons default-enabled", () => {
  const OLD_AUTH = process.env.ENABLE_REMAINING_BALANCE_AUTH_CRON;
  const OLD_REC = process.env.ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON;

  afterEach(() => {
    process.env.ENABLE_REMAINING_BALANCE_AUTH_CRON = OLD_AUTH;
    process.env.ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON = OLD_REC;
  });

  it("remaining balance auth cron runs when env unset", async () => {
    delete process.env.ENABLE_REMAINING_BALANCE_AUTH_CRON;
    const authz = {
      findBookingsNeedingAuthorizationWindow: jest.fn().mockResolvedValue([]),
      authorizeRemainingBalanceForBooking: jest.fn(),
    };
    const cron = new RemainingBalanceAuthorizationCronService(authz as any);
    await cron.run();
    expect(authz.findBookingsNeedingAuthorizationWindow).toHaveBeenCalled();
  });

  it("remaining balance auth cron skips when env is false", async () => {
    process.env.ENABLE_REMAINING_BALANCE_AUTH_CRON = "false";
    const authz = {
      findBookingsNeedingAuthorizationWindow: jest.fn().mockResolvedValue(["b1"]),
      authorizeRemainingBalanceForBooking: jest.fn(),
    };
    const cron = new RemainingBalanceAuthorizationCronService(authz as any);
    await cron.run();
    expect(authz.findBookingsNeedingAuthorizationWindow).not.toHaveBeenCalled();
  });

  it("reconciliation cron runs when env unset", async () => {
    delete process.env.ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON;
    const recon = {
      findBookingsForLifecycleReconciliation: jest.fn().mockResolvedValue([]),
      reconcileBookingPaymentLifecycle: jest.fn(),
    };
    const cron = new PaymentLifecycleReconciliationCronService(recon as any);
    await cron.run();
    expect(recon.findBookingsForLifecycleReconciliation).toHaveBeenCalled();
  });

  it("reconciliation cron skips when env is false", async () => {
    process.env.ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON = "false";
    const recon = {
      findBookingsForLifecycleReconciliation: jest.fn().mockResolvedValue(["b1"]),
      reconcileBookingPaymentLifecycle: jest.fn(),
    };
    const cron = new PaymentLifecycleReconciliationCronService(recon as any);
    await cron.run();
    expect(recon.findBookingsForLifecycleReconciliation).not.toHaveBeenCalled();
  });

  it("documents shared env convention", () => {
    expect(isCronDisabledByExplicitFalse(undefined)).toBe(false);
    expect(isCronDisabledByExplicitFalse("false")).toBe(true);
  });
});
