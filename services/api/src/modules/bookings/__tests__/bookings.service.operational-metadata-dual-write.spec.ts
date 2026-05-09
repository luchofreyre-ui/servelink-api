import { BookingStatus } from "@prisma/client";
import { createBookingsServiceTestHarness } from "../../../../test/helpers/createBookingsServiceTestHarness";
import {
  buildBookingOperationalMetadataPayloadV1,
} from "../booking-operational-metadata";

describe("BookingsService — operational metadata dual-write", () => {
  const provenance = {
    source: "booking_direction_intake" as const,
    capturedAt: new Date().toISOString(),
    legacyNotesTransport: "recurringInterest.note" as const,
  };

  it("creates BookingOperationalMetadata inside transaction when payload is valid", async () => {
    const bookingOperationalMetadataCreate = jest.fn().mockResolvedValue({});

    const db = {
      $transaction: jest.fn(async (cb: (tx: unknown) => unknown) =>
        cb({
          booking: {
            create: jest.fn().mockResolvedValue({
              id: "b_meta_1",
              status: BookingStatus.pending_payment,
            }),
            update: jest.fn(),
          },
          bookingEvent: { create: jest.fn().mockResolvedValue({}) },
          bookingOperationalMetadata: {
            create: bookingOperationalMetadataCreate,
          },
        }),
      ),
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b_meta_1",
          status: BookingStatus.pending_payment,
        }),
      },
    };

    const { service } = createBookingsServiceTestHarness({
      db: db as never,
    });

    const payload = buildBookingOperationalMetadataPayloadV1({
      customerTeamPrepFreeText: "Side entrance",
      provenance,
    });

    await service.createBooking({
      customerId: "cust_1",
      tenantId: "nustandard",
      operationalMetadataPayload: payload,
    });

    expect(bookingOperationalMetadataCreate).toHaveBeenCalledTimes(1);
    expect(bookingOperationalMetadataCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingId: "b_meta_1",
        schemaVersion: 1,
        payload: expect.objectContaining({
          customerTeamPrep: expect.objectContaining({
            freeText: "Side entrance",
          }),
        }),
      }),
    });
  });

  it("skips BookingOperationalMetadata create when payload fails validation", async () => {
    const bookingOperationalMetadataCreate = jest.fn().mockResolvedValue({});

    const db = {
      $transaction: jest.fn(async (cb: (tx: unknown) => unknown) =>
        cb({
          booking: {
            create: jest.fn().mockResolvedValue({
              id: "b_meta_2",
              status: BookingStatus.pending_payment,
            }),
            update: jest.fn(),
          },
          bookingEvent: { create: jest.fn().mockResolvedValue({}) },
          bookingOperationalMetadata: {
            create: bookingOperationalMetadataCreate,
          },
        }),
      ),
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b_meta_2",
          status: BookingStatus.pending_payment,
        }),
      },
    };

    const { service } = createBookingsServiceTestHarness({
      db: db as never,
    });

    await service.createBooking({
      customerId: "cust_1",
      tenantId: "nustandard",
      operationalMetadataPayload: {
        customerTeamPrep: { freeText: "x" },
        email: "leak@example.com",
      },
    });

    expect(bookingOperationalMetadataCreate).not.toHaveBeenCalled();
  });

  it("skips BookingOperationalMetadata create when payload omitted", async () => {
    const bookingOperationalMetadataCreate = jest.fn().mockResolvedValue({});

    const db = {
      $transaction: jest.fn(async (cb: (tx: unknown) => unknown) =>
        cb({
          booking: {
            create: jest.fn().mockResolvedValue({
              id: "b_meta_3",
              status: BookingStatus.pending_payment,
            }),
            update: jest.fn(),
          },
          bookingEvent: { create: jest.fn().mockResolvedValue({}) },
          bookingOperationalMetadata: {
            create: bookingOperationalMetadataCreate,
          },
        }),
      ),
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b_meta_3",
          status: BookingStatus.pending_payment,
        }),
      },
    };

    const { service } = createBookingsServiceTestHarness({
      db: db as never,
    });

    await service.createBooking({
      customerId: "cust_1",
      tenantId: "nustandard",
    });

    expect(bookingOperationalMetadataCreate).not.toHaveBeenCalled();
  });
});
