import {
  BookingPublicDepositStatus,
  BookingStatus,
} from "@prisma/client";
import { BookingCancellationPaymentInvariantService } from "../src/modules/bookings/payment-lifecycle/booking-cancellation-payment-invariant.service";
import { BookingCancellationPaymentService } from "../src/modules/bookings/payment-lifecycle/booking-cancellation-payment.service";

describe("BookingCancellationPaymentInvariantService", () => {
  it("no-ops when booking is not canceled", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.assigned,
        }),
      },
    } as any;
    const pay = {
      enforcePublicDepositOnCancellation: jest.fn(),
    } as unknown as BookingCancellationPaymentService;

    const svc = new BookingCancellationPaymentInvariantService(prisma, pay);
    await svc.enforceCancellationPaymentInvariantForBooking("b1");
    expect(pay.enforcePublicDepositOnCancellation).not.toHaveBeenCalled();
  });

  it("delegates when canceled; inner no-ops without succeeded deposit", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.canceled,
        }),
      },
    } as any;
    const pay = {
      enforcePublicDepositOnCancellation: jest
        .fn()
        .mockResolvedValue({ ok: true, skipped: "no_deposit_succeeded" }),
    } as unknown as BookingCancellationPaymentService;

    const svc = new BookingCancellationPaymentInvariantService(prisma, pay);
    await svc.enforceCancellationPaymentInvariantForBooking("b1");
    expect(pay.enforcePublicDepositOnCancellation).toHaveBeenCalledTimes(1);
    expect(pay.enforcePublicDepositOnCancellation).toHaveBeenCalledWith({
      bookingId: "b1",
    });
  });

  it("calls cancellation payment once for canceled booking with succeeded deposit", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.canceled,
        }),
      },
    } as any;
    const pay = {
      enforcePublicDepositOnCancellation: jest
        .fn()
        .mockResolvedValue({ ok: true, skipped: "cancellation_fee_already_retained" }),
    } as unknown as BookingCancellationPaymentService;

    const svc = new BookingCancellationPaymentInvariantService(prisma, pay);
    await svc.enforceCancellationPaymentInvariantForBooking("b1");
    expect(pay.enforcePublicDepositOnCancellation).toHaveBeenCalledTimes(1);
  });

  it("is idempotent on repeated calls", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.canceled,
        }),
      },
    } as any;
    const pay = {
      enforcePublicDepositOnCancellation: jest
        .fn()
        .mockResolvedValue({ ok: true, skipped: "refund_already_recorded" }),
    } as unknown as BookingCancellationPaymentService;

    const svc = new BookingCancellationPaymentInvariantService(prisma, pay);
    await svc.enforceCancellationPaymentInvariantForBooking("b1");
    await svc.enforceCancellationPaymentInvariantForBooking("b1");
    expect(pay.enforcePublicDepositOnCancellation).toHaveBeenCalledTimes(2);
  });

  it("suppresses non-ok financial outcomes by default", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.canceled,
        }),
      },
    } as any;
    const pay = {
      enforcePublicDepositOnCancellation: jest
        .fn()
        .mockResolvedValue({ ok: false, skipped: "missing_deposit_pi" }),
    } as unknown as BookingCancellationPaymentService;

    const svc = new BookingCancellationPaymentInvariantService(prisma, pay);
    await expect(svc.enforceCancellationPaymentInvariantForBooking("b1")).resolves.toBeUndefined();
  });

  it("rethrows in strict mode when financial outcome is not ok", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.canceled,
        }),
      },
    } as any;
    const pay = {
      enforcePublicDepositOnCancellation: jest
        .fn()
        .mockResolvedValue({ ok: false, skipped: "missing_deposit_pi" }),
    } as unknown as BookingCancellationPaymentService;

    const svc = new BookingCancellationPaymentInvariantService(prisma, pay);
    await expect(
      svc.enforceCancellationPaymentInvariantForBooking("b1", { strict: true }),
    ).rejects.toThrow("missing_deposit_pi");
  });

  it("rethrows in strict mode when inner throws", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.canceled,
        }),
      },
    } as any;
    const pay = {
      enforcePublicDepositOnCancellation: jest.fn().mockRejectedValue(new Error("stripe_down")),
    } as unknown as BookingCancellationPaymentService;

    const svc = new BookingCancellationPaymentInvariantService(prisma, pay);
    await expect(
      svc.enforceCancellationPaymentInvariantForBooking("b1", { strict: true }),
    ).rejects.toThrow("stripe_down");
  });

  it("swallows inner throw when not strict", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          status: BookingStatus.canceled,
        }),
      },
    } as any;
    const pay = {
      enforcePublicDepositOnCancellation: jest.fn().mockRejectedValue(new Error("stripe_down")),
    } as unknown as BookingCancellationPaymentService;

    const svc = new BookingCancellationPaymentInvariantService(prisma, pay);
    await expect(svc.enforceCancellationPaymentInvariantForBooking("b1")).resolves.toBeUndefined();
  });
});
