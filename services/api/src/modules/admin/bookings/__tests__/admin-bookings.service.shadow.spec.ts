import { Logger } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { AdminBookingsService } from "../admin-bookings.service";

describe("AdminBookingsService — structured metadata shadow", () => {
  const key = "ENABLE_STRUCTURED_BOOKING_METADATA_SHADOW";
  const prev = process.env[key];

  afterEach(() => {
    if (prev === undefined) delete process.env[key];
    else process.env[key] = prev;
    jest.restoreAllMocks();
  });

  function makeService(prisma: {
    booking: { findUnique: jest.Mock };
    bookingOperationalMetadata?: { findUnique: jest.Mock };
  }) {
    return new AdminBookingsService(
      prisma as never,
      {
        findLatestByBookingId: jest.fn().mockResolvedValue(null),
      } as never,
      {
        resolveTags: jest.fn().mockReturnValue({
          surfaces: [],
          problems: [],
          methods: [],
        }),
      } as never,
    );
  }

  const bookingRow = {
    id: "bk_shadow_1",
    status: BookingStatus.pending_payment,
    customerId: "c1",
    hourlyRateCents: 0,
    estimatedHours: 0,
    currency: "usd",
    tenantId: "nustandard",
    notes:
      "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m | customerPrep=Prep A",
    payments: [],
    trustEvents: [],
    opsAnomalies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("does not query operational metadata when shadow flag is off", async () => {
    delete process.env[key];
    const bookingOperationalMetadataFindUnique = jest.fn();
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(bookingRow),
      },
      bookingOperationalMetadata: {
        findUnique: bookingOperationalMetadataFindUnique,
      },
    };
    const svc = makeService(prisma);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});

    await svc.getBookingOperationalDetail("bk_shadow_1");

    expect(bookingOperationalMetadataFindUnique).not.toHaveBeenCalled();
    expect(Logger.prototype.log).not.toHaveBeenCalled();
  });

  it("runs shadow compare and logs when flag is on", async () => {
    process.env[key] = "true";
    const bookingOperationalMetadataFindUnique = jest
      .fn()
      .mockResolvedValue({ payload: null, schemaVersion: 1 });
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(bookingRow),
      },
      bookingOperationalMetadata: {
        findUnique: bookingOperationalMetadataFindUnique,
      },
    };
    const logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});

    const svc = makeService(prisma);
    const result = await svc.getBookingOperationalDetail("bk_shadow_1");

    expect(bookingOperationalMetadataFindUnique).toHaveBeenCalledWith({
      where: { bookingId: "bk_shadow_1" },
      select: { payload: true, schemaVersion: true },
    });
    expect(logSpy).toHaveBeenCalled();
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.event).toBe("structured_booking_metadata_shadow");
    expect(payload.bookingId).toBe("bk_shadow_1");
    expect(payload.status).toBe("notes_only");
    expect(payload).not.toHaveProperty("notes");
    expect(payload).not.toHaveProperty("payload");
    expect(result).toMatchObject({
      id: "bk_shadow_1",
      authority: expect.any(Object),
    });
  });

  it("logs shadow failure without affecting response shape", async () => {
    process.env[key] = "true";
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(bookingRow),
      },
      bookingOperationalMetadata: {
        findUnique: jest.fn().mockRejectedValue(new Error("db boom")),
      },
    };
    const warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});

    const svc = makeService(prisma);
    const result = await svc.getBookingOperationalDetail("bk_shadow_1");

    expect(warnSpy).toHaveBeenCalled();
    const payload = JSON.parse(String(warnSpy.mock.calls[0]?.[0]));
    expect(payload.event).toBe("structured_booking_metadata_shadow_failure");
    expect(payload.bookingId).toBe("bk_shadow_1");
    expect(payload.errorName).toBe("Error");
    expect(result?.id).toBe("bk_shadow_1");
    expect(result?.authority).toBeDefined();
  });
});
