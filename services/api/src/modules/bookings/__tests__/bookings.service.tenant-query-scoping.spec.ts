import { createBookingsServiceTestHarness } from "../../../../test/helpers/createBookingsServiceTestHarness";

function makeBookingsService(db: {
  booking: { findUnique: jest.Mock; findFirst: jest.Mock };
  $transaction?: jest.Mock;
}) {
  return createBookingsServiceTestHarness({ db: db as never }).service;
}

describe("BookingsService — tenant query scoping on reads", () => {
  it("getBooking without tenant uses findUnique and where has no tenantId", async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: "b1",
      tenantId: "nustandard",
    });
    const findFirst = jest.fn();
    const svc = makeBookingsService({
      booking: { findUnique, findFirst },
    });

    await svc.getBooking("b1");

    expect(findUnique).toHaveBeenCalledWith({ where: { id: "b1" } });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("getBookingForTenant uses findFirst with scoped where", async () => {
    const findUnique = jest.fn();
    const findFirst = jest.fn().mockResolvedValue({
      id: "b1",
      tenantId: "nustandard",
    });
    const svc = makeBookingsService({
      booking: { findUnique, findFirst },
    });

    await svc.getBookingForTenant("b1", "nustandard");

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "b1", tenantId: "nustandard" },
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("getBookingForTenant with blank tenant fails closed before querying", async () => {
    const findUnique = jest.fn();
    const findFirst = jest.fn();
    const svc = makeBookingsService({
      booking: { findUnique, findFirst },
    });

    await expect(svc.getBookingForTenant("b1", "   ")).rejects.toThrow();

    expect(findUnique).not.toHaveBeenCalled();
    expect(findFirst).not.toHaveBeenCalled();
  });
});
