import { BookingStatus } from "@prisma/client";
import { BookingTeamContinuityService } from "../src/modules/bookings/booking-team-continuity.service";
import { FoService } from "../src/modules/fo/fo.service";
import { PrismaService } from "../src/prisma";

describe("BookingTeamContinuityService", () => {
  it("returns prior FO from most recent completed maintenance-like booking", async () => {
    const prisma = {
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            foId: "fo_new",
            estimateSnapshot: {
              inputJson: JSON.stringify({ service_type: "move_in" }),
            },
          },
          {
            foId: "fo_prior",
            estimateSnapshot: {
              inputJson: JSON.stringify({ service_type: "maintenance" }),
            },
          },
        ]),
      },
    } as unknown as PrismaService;

    const svc = new BookingTeamContinuityService(
      prisma,
      {} as unknown as FoService,
    );
    const id = await svc.findPriorFoIdForContinuityMaintenance("cust_1");
    expect(id).toBe("fo_prior");
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          customerId: "cust_1",
          status: BookingStatus.completed,
        }),
      }),
    );
  });

  it("orders primary team first when prior FO is still in authenticated_recurring match pool", async () => {
    const prisma = {
      recurringPlan: {
        findFirst: jest.fn().mockResolvedValue({
          id: "plan_1",
          serviceType: "recurring-home-cleaning",
          estimateSnapshot: {
            inputJson: JSON.stringify({
              sqft_band: "1200_1599",
              service_type: "maintenance",
              job_site_class: "residential",
            }),
            outputJson: JSON.stringify({
              adjustedLaborMinutes: 180,
              recommendedTeamSize: 2,
            }),
          },
          addressSnapshot: { latitude: 36.154, longitude: -95.993 },
        }),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            foId: "fo_prior",
            estimateSnapshot: {
              inputJson: JSON.stringify({ service_type: "maintenance" }),
            },
          },
        ]),
      },
    } as unknown as PrismaService;

    const matchFOs = jest.fn().mockResolvedValue([
      {
        id: "fo_other",
        displayName: "B",
        assignedCrewSize: 2,
        estimatedJobDurationMinutes: 120,
      },
      {
        id: "fo_prior",
        displayName: "A",
        assignedCrewSize: 2,
        estimatedJobDurationMinutes: 90,
      },
    ]);

    const fo = { matchFOs } as unknown as FoService;
    const svc = new BookingTeamContinuityService(prisma, fo);

    const r = await svc.resolveScheduleTeamOptionsForRecurringPlan(
      "plan_1",
      "cust_1",
      { includeAlternateTeams: true },
    );

    expect(r.ok).toBe(true);
    expect(r.teams[0]?.id).toBe("fo_prior");
    expect(r.primaryTeam?.id).toBe("fo_prior");
    expect(r.preferredPriorTeam?.id).toBe("fo_prior");
    expect(r.alternateTeams.map((t) => t.id)).toEqual(["fo_other"]);
    expect(r.teamContinuityReason).toBe("continuity");
    expect(matchFOs).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingMatchMode: "authenticated_recurring",
        serviceType: "maintenance",
      }),
    );
  });

  it("falls back to marketplace order when prior FO is not eligible", async () => {
    const prisma = {
      recurringPlan: {
        findFirst: jest.fn().mockResolvedValue({
          id: "plan_1",
          serviceType: "recurring-home-cleaning",
          estimateSnapshot: {
            inputJson: JSON.stringify({
              sqft_band: "1200_1599",
              service_type: "maintenance",
            }),
            outputJson: JSON.stringify({
              adjustedLaborMinutes: 120,
              recommendedTeamSize: 2,
            }),
          },
          addressSnapshot: { lat: 36.154, lng: -95.993 },
        }),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            foId: "fo_gone",
            estimateSnapshot: {
              inputJson: JSON.stringify({ service_type: "maintenance" }),
            },
          },
        ]),
      },
    } as unknown as PrismaService;

    const matchFOs = jest.fn().mockResolvedValue([
      {
        id: "fo_other",
        displayName: "B",
        assignedCrewSize: 2,
        estimatedJobDurationMinutes: 60,
      },
    ]);

    const svc = new BookingTeamContinuityService(
      prisma,
      { matchFOs } as unknown as FoService,
    );

    const r = await svc.resolveScheduleTeamOptionsForRecurringPlan(
      "plan_1",
      "cust_1",
      { includeAlternateTeams: true },
    );

    expect(r.primaryTeam?.id).toBe("fo_other");
    expect(r.preferredPriorTeam).toBeNull();
    expect(r.teamContinuityReason).toBe("prior_ineligible");
  });

  it("omits alternates when includeAlternateTeams is false", async () => {
    const prisma = {
      recurringPlan: {
        findFirst: jest.fn().mockResolvedValue({
          id: "plan_1",
          serviceType: "recurring-home-cleaning",
          estimateSnapshot: {
            inputJson: JSON.stringify({
              sqft_band: "1200_1599",
              service_type: "maintenance",
            }),
            outputJson: JSON.stringify({
              adjustedLaborMinutes: 100,
              recommendedTeamSize: 2,
            }),
          },
          addressSnapshot: { siteLat: 36.154, siteLng: -95.993 },
        }),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;

    const matchFOs = jest.fn().mockResolvedValue([
      {
        id: "fo_1",
        displayName: "One",
        assignedCrewSize: 2,
        estimatedJobDurationMinutes: 50,
      },
      {
        id: "fo_2",
        displayName: "Two",
        assignedCrewSize: 2,
        estimatedJobDurationMinutes: 50,
      },
    ]);

    const svc = new BookingTeamContinuityService(
      prisma,
      { matchFOs } as unknown as FoService,
    );

    const r = await svc.resolveScheduleTeamOptionsForRecurringPlan(
      "plan_1",
      "cust_1",
      { includeAlternateTeams: false },
    );

    expect(r.teams).toHaveLength(1);
    expect(r.alternateTeams).toHaveLength(0);
    expect(r.primaryTeam?.id).toBe("fo_1");
  });
});
