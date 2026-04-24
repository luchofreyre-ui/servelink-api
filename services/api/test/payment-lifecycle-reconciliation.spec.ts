import {
  BookingDepositRefundStatus,
  BookingRemainingBalancePaymentStatus,
} from "@prisma/client";
import { PaymentLifecycleReconciliationCronService } from "../src/modules/billing/payment-lifecycle-reconciliation.cron.service";
import { PaymentLifecycleReconciliationService } from "../src/modules/billing/payment-lifecycle-reconciliation.service";
import { isCronDisabledByExplicitFalse } from "../src/modules/billing/payment-lifecycle-cron-env";
import { RemainingBalanceAuthorizationCronService } from "../src/modules/billing/remaining-balance-authorization.cron.service";
import { StripePaymentService } from "../src/modules/bookings/stripe/stripe-payment.service";

describe("PaymentLifecycleReconciliationService", () => {
  const OLD_STRIPE = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = OLD_STRIPE;
  });

  function makeService(
    booking: Record<string, unknown>,
    pi: { status: string },
  ): PaymentLifecycleReconciliationService {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(booking),
        update: bookingUpdate,
      },
    } as any;
    const stripePayments = new StripePaymentService(prisma, {} as any);
    jest.spyOn(stripePayments, "retrievePaymentIntent").mockResolvedValue(pi as any);
    return new PaymentLifecycleReconciliationService(prisma, stripePayments);
  }

  it("requires_capture reconciles to balance_authorized", async () => {
    const svc = makeService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus:
          BookingRemainingBalancePaymentStatus.balance_pending_authorization,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: null,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
      },
      { status: "requires_capture" },
    );
    const prisma = (svc as any).prisma;
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
    const svc = makeService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_authorized,
        remainingBalanceAuthorizedAt: new Date(),
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: null,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
      },
      { status: "succeeded" },
    );
    const prisma = (svc as any).prisma;
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
    const svc = makeService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus:
          BookingRemainingBalancePaymentStatus.balance_authorization_failed,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: "prior",
        publicDepositPaymentIntentId: null,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
      },
      { status: "requires_payment_method" },
    );
    const prisma = (svc as any).prisma;
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
    const svc = makeService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus:
          BookingRemainingBalancePaymentStatus.balance_pending_authorization,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: null,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
      },
      { status: "failed" },
    );
    const prisma = (svc as any).prisma;
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
    const svc = makeService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_captured,
        remainingBalanceAuthorizedAt: new Date(),
        remainingBalanceCapturedAt: new Date(),
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: null,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
      },
      { status: "requires_capture" },
    );
    const prisma = (svc as any).prisma;
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(false);
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect((svc as any).stripePayments.retrievePaymentIntent).not.toHaveBeenCalled();
  });

  it("does not change balance_canceled", async () => {
    const svc = makeService(
      {
        id: "b1",
        remainingBalancePaymentIntentId: "pi_1",
        remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_canceled,
        remainingBalanceAuthorizedAt: null,
        remainingBalanceCapturedAt: null,
        remainingBalanceAuthorizationFailureReason: null,
        publicDepositPaymentIntentId: null,
        depositRefundStatus: BookingDepositRefundStatus.refund_not_required,
      },
      { status: "succeeded" },
    );
    const prisma = (svc as any).prisma;
    const r = await svc.reconcileBookingPaymentLifecycle("b1");
    expect(r.touched).toBe(false);
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect((svc as any).stripePayments.retrievePaymentIntent).not.toHaveBeenCalled();
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
