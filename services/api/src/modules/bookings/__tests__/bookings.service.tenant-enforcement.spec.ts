import { BookingsService } from "../bookings.service";
import { MissingTenantContextException } from "../../tenant/tenant.errors";

function makeBookingsService(db: {
  $transaction: jest.Mock;
  booking: { findUnique: jest.Mock; update?: jest.Mock };
}) {
  return new BookingsService(
    db as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
}

describe("BookingsService — tenant enforcement on createBooking", () => {
  it("throws when tenantId is omitted and does not start a transaction", async () => {
    const $transaction = jest.fn();
    const svc = makeBookingsService({
      $transaction,
      booking: { findUnique: jest.fn() },
    });
    await expect(
      svc.createBooking({
        customerId: "c1",
      } as { customerId: string; tenantId?: string | null }),
    ).rejects.toThrow(MissingTenantContextException);
    expect($transaction).not.toHaveBeenCalled();
  });

  it("throws when tenantId is blank and does not start a transaction", async () => {
    const $transaction = jest.fn();
    const svc = makeBookingsService({
      $transaction,
      booking: { findUnique: jest.fn() },
    });
    await expect(
      svc.createBooking({
        customerId: "c1",
        tenantId: "   ",
      }),
    ).rejects.toThrow(MissingTenantContextException);
    expect($transaction).not.toHaveBeenCalled();
  });

  it("succeeds when tenantId present and Prisma create receives tenantId", async () => {
    let createData: Record<string, unknown> | undefined;
    const txBooking = {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        createData = data;
        return { id: "b1", ...data };
      }),
    };
    const db = {
      $transaction: jest.fn(async (cb: (tx: unknown) => unknown) =>
        cb({
          booking: txBooking,
          bookingEvent: { create: jest.fn() },
        }),
      ),
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          tenantId: "nustandard",
        }),
      },
    };
    const svc = makeBookingsService(db);
    await svc.createBooking({ customerId: "c1", tenantId: "nustandard" });
    expect(createData?.tenantId).toBe("nustandard");
    expect(txBooking.create).toHaveBeenCalled();
  });
});
