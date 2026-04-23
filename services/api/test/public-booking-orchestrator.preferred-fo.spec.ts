import { BookingStatus } from "@prisma/client";
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../src/prisma";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import { FoService } from "../src/modules/fo/fo.service";
import { SlotAvailabilityService } from "../src/modules/slot-holds/slot-availability.service";
import { SlotHoldsService } from "../src/modules/slot-holds/slot-holds.service";
import { PublicBookingOrchestratorService } from "../src/modules/public-booking-orchestrator/public-booking-orchestrator.service";

function schedulableBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "bk1",
    status: BookingStatus.pending_payment,
    foId: null,
    preferredFoId: null,
    scheduledStart: null,
    estimatedHours: 1,
    siteLat: null,
    siteLng: null,
    estimateSnapshot: {
      outputJson: JSON.stringify({
        matchedCleaners: [{ id: "fo_a" }, { id: "fo_b" }, { id: "fo_c" }],
      }),
      inputJson: "{}",
    },
    ...overrides,
  };
}

describe("PublicBookingOrchestratorService — team options + team-specific availability", () => {
  it("returns at most two ranked team options when foId is omitted", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableBooking()),
      },
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([
          { id: "fo_a", displayName: "Team A" },
          { id: "fo_b", displayName: "Team B" },
        ]),
      },
    } as unknown as PrismaService;

    const fo = {
      getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
      matchFOs: jest.fn(),
    } as unknown as FoService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      {} as BookingsService,
      fo,
    );

    const res = await svc.availability({ bookingId: "bk1" });
    expect(res.kind).toBe("public_booking_team_options");
    if (res.kind !== "public_booking_team_options") throw new Error("unexpected kind");
    expect(res.teams.length).toBeLessThanOrEqual(2);
    expect(res.teams[0]?.isRecommended).toBe(true);
    expect(fo.getEligibility).toHaveBeenCalled();
  });

  it("returns windows only for the selected team when foId is provided", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableBooking()),
      },
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([{ id: "fo_b", displayName: "Team B" }]),
        findUnique: jest.fn().mockResolvedValue({ id: "fo_b" }),
      },
    } as unknown as PrismaService;

    const fo = {
      getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
      matchFOs: jest.fn(),
    } as unknown as FoService;

    const slotAvailability = {
      listAvailableWindows: jest.fn().mockResolvedValue([
        {
          startAt: new Date("2030-01-01T14:00:00.000Z"),
          endAt: new Date("2030-01-01T16:00:00.000Z"),
        },
      ]),
    } as unknown as SlotAvailabilityService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      slotAvailability,
      {} as SlotHoldsService,
      {} as BookingsService,
      fo,
    );

    const res = await svc.availability({ bookingId: "bk1", foId: "fo_b" });
    expect(res.kind).toBe("public_booking_team_availability");
    if (res.kind !== "public_booking_team_availability") throw new Error("unexpected kind");
    expect(res.selectedTeam.id).toBe("fo_b");
    expect(res.windows).toHaveLength(1);
    expect(slotAvailability.listAvailableWindows).toHaveBeenCalledWith(
      expect.objectContaining({ foId: "fo_b" }),
    );
  });

  it("rejects foId that is not in the candidate set", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableBooking()),
      },
      franchiseOwner: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    const fo = {
      getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
      matchFOs: jest.fn(),
    } as unknown as FoService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      {} as BookingsService,
      fo,
    );

    await expect(
      svc.availability({ bookingId: "bk1", foId: "fo_not_candidate" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("passes serviceType from estimate snapshot inputJson into matchFOs fallback", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(
          schedulableBooking({
            siteLat: 36.154,
            siteLng: -95.993,
            estimateSnapshot: {
              outputJson: JSON.stringify({
                estimateMinutes: 120,
                recommendedTeamSize: 2,
              }),
              inputJson: JSON.stringify({
                sqft_band: "1200_1599",
                service_type: "move_in",
              }),
            },
          }),
        ),
      },
      franchiseOwner: {
        findMany: jest.fn().mockResolvedValue([{ id: "fo_x", displayName: "Team X" }]),
      },
    } as unknown as PrismaService;

    const matchFOs = jest.fn().mockResolvedValue([{ id: "fo_x", displayName: "Team X" }]);
    const fo = {
      getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
      matchFOs,
    } as unknown as FoService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      {} as BookingsService,
      fo,
    );

    const res = await svc.availability({ bookingId: "bk1" });
    expect(res.kind).toBe("public_booking_team_options");
    expect(matchFOs).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceType: "move_in",
        lat: 36.154,
        lng: -95.993,
      }),
    );
  });

  it("returns PUBLIC_BOOKING_LOCATION_NOT_RESOLVED when there are no candidates and site coordinates are missing", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(
          schedulableBooking({
            siteLat: null,
            siteLng: null,
            estimateSnapshot: {
              outputJson: JSON.stringify({}),
              inputJson: JSON.stringify({ sqft_band: "1200_1599" }),
            },
          }),
        ),
      },
    } as unknown as PrismaService;

    const fo = { matchFOs: jest.fn() } as unknown as FoService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      {} as BookingsService,
      fo,
    );

    const res = await svc.availability({ bookingId: "bk1" });
    expect(res.kind).toBe("public_booking_team_options");
    if (res.kind !== "public_booking_team_options") throw new Error("unexpected kind");
    expect(res.teams).toEqual([]);
    expect(res.unavailableReason?.code).toBe("PUBLIC_BOOKING_LOCATION_NOT_RESOLVED");
    expect(fo.matchFOs).not.toHaveBeenCalled();
  });

  it("returns structured team-options unavailable when booking is not schedulable", async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(
          schedulableBooking({ status: BookingStatus.completed }),
        ),
      },
    } as unknown as PrismaService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      {} as BookingsService,
      {} as FoService,
    );

    const res = await svc.availability({ bookingId: "bk1" });
    expect(res.kind).toBe("public_booking_team_options");
    if (res.kind !== "public_booking_team_options") throw new Error("unexpected kind");
    expect(res.teams).toEqual([]);
    expect(res.unavailableReason?.code).toBeDefined();
  });
});
