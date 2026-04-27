import { MissingTenantContextException } from "../../tenant/tenant.errors";
import { createBookingsServiceTestHarness } from "../../../../test/helpers/createBookingsServiceTestHarness";

function makeBookingsService(db: {
  booking: { findUnique: jest.Mock; findFirst: jest.Mock };
  $transaction?: jest.Mock;
}) {
  return createBookingsServiceTestHarness({ db: db as never }).service;
}

describe("BookingsService — tenant-required read enforcement", () => {
  it("getBookingForTenant throws when tenant missing and does not call findFirst", async () => {
    const findFirst = jest.fn();
    const findUnique = jest.fn();
    const svc = makeBookingsService({
      booking: { findUnique, findFirst },
    });
    await expect(
      svc.getBookingForTenant("b1", undefined as unknown as string),
    ).rejects.toThrow(MissingTenantContextException);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("getBookingForTenant throws when tenant blank and does not call findFirst", async () => {
    const findFirst = jest.fn();
    const findUnique = jest.fn();
    const svc = makeBookingsService({
      booking: { findUnique, findFirst },
    });
    await expect(svc.getBookingForTenant("b1", " ")).rejects.toThrow(
      MissingTenantContextException,
    );
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("getBookingForTenant scopes query with tenant", async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: "b1",
      tenantId: "nustandard",
    });
    const findUnique = jest.fn();
    const svc = makeBookingsService({
      booking: { findUnique, findFirst },
    });
    await svc.getBookingForTenant("b1", "nustandard");
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "b1", tenantId: "nustandard" },
    });
  });

  it("getBookingForTenant returns null when tenant does not match", async () => {
    const findUnique = jest.fn();
    const findFirst = jest.fn().mockResolvedValue(null);
    const svc = makeBookingsService({
      booking: { findUnique, findFirst },
    });
    await expect(svc.getBookingForTenant("b1", "other")).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "b1", tenantId: "other" },
    });
    expect(findUnique).not.toHaveBeenCalled();
  });
});
