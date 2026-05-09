import { ConfigService } from "@nestjs/config";
import type { BookingDirectionIntake } from "@prisma/client";
import { Role } from "@prisma/client";
import { PrismaService } from "../src/prisma";
import { AuthService } from "../src/auth/auth.service";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import { EstimatorService } from "../src/modules/estimate/estimator.service";
import { EstimateEngineV2Service } from "../src/modules/estimate/estimate-engine-v2.service";
import { BookingDirectionIntakeService } from "../src/modules/booking-direction-intake/booking-direction-intake.service";
import type { CreateBookingDirectionIntakeDto } from "../src/modules/booking-direction-intake/dto/create-booking-direction-intake.dto";
import { IntakeBookingBridgeService } from "../src/modules/booking-direction-intake/intake-booking-bridge.service";
import type { GeocodingService } from "../src/modules/geocoding/geocoding.service";

const testServiceLocation = {
  street: "100 Market St",
  city: "San Francisco",
  state: "CA",
  zip: "94103",
};

const geocodingMock = {
  geocodeServiceLocation: jest
    .fn()
    .mockResolvedValue({ siteLat: 37.7749, siteLng: -122.4194 }),
} as unknown as GeocodingService;

const VALID_ESTIMATE_FACTORS = {
  propertyType: "house",
  floors: "1",
  firstTimeWithServelink: "no",
  lastProfessionalClean: "1_3_months",
  clutterLevel: "light",
  kitchenCondition: "normal",
  stovetopType: "not_sure",
  bathroomCondition: "normal",
  glassShowers: "none",
  petPresence: "none",
  petAccidentsOrLitterAreas: "no",
  occupancyState: "occupied_normal",
  floorVisibility: "mostly_clear",
  carpetPercent: "26_50",
  stairsFlights: "none",
  addonIds: [] as string[],
};

function buildIntake(id: string): BookingDirectionIntake {
  return {
    id,
    serviceId: "recurring-home-cleaning",
    homeSize: "Single family about 2200 sqft",
    bedrooms: "2",
    bathrooms: "2",
    pets: "",
    frequency: "weekly",
    preferredTime: "morning",
    deepCleanProgram: null,
    estimateFactors: VALID_ESTIMATE_FACTORS,
    customerName: "Test",
    customerEmail: "team-prep-bridge@example.com",
    source: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    preferredFoId: null,
    createdAt: new Date(),
  } as unknown as BookingDirectionIntake;
}

describe("IntakeBookingBridgeService — team prep on booking note", () => {
  it("appends recurringInterest.note into createBooking note as customerPrep", async () => {
    const intakeId = "intake_team_prep_1";
    const createBooking = jest.fn().mockResolvedValue({
      booking: { id: "booking_team_prep_1" },
      estimate: {
        estimatedPriceCents: 10000,
        estimatedDurationMinutes: 120,
        confidence: 0.9,
        deepCleanProgram: null,
      },
    });

    const prismaMock = {
      bookingDirectionIntake: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === intakeId) {
            return Promise.resolve(buildIntake(intakeId));
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          estimatedHours: 2,
          status: "pending_payment",
          scheduledStart: null,
          estimateSnapshot: { id: "snap1" },
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: "user_team_prep",
          role: Role.customer,
        }),
      },
    } as unknown as PrismaService;

    const estimateEngineV2 = {
      estimateV2: jest.fn().mockReturnValue({
        snapshotVersion: "estimate_engine_v2_core_v1",
        expectedMinutes: 120,
        pricedMinutes: 120,
        customerVisible: {
          estimatedMinutes: 120,
          estimatedPrice: 10_000,
          explanation: "",
        },
      }),
      calculateReconciliation: jest.fn().mockReturnValue({}),
    } as unknown as EstimateEngineV2Service;

    const bridge = new IntakeBookingBridgeService(
      prismaMock,
      {
        create: jest.fn().mockResolvedValue({ intakeId }),
      } as unknown as BookingDirectionIntakeService,
      { createBooking } as unknown as BookingsService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
      {} as unknown as EstimatorService,
      estimateEngineV2,
      {} as unknown as AuthService,
      geocodingMock,
    );

    const dto = {
      serviceId: "recurring-home-cleaning",
      homeSize: "Single family about 2200 sqft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Friday",
      estimateFactors: VALID_ESTIMATE_FACTORS,
      customerName: "Test",
      customerEmail: "team-prep-bridge@example.com",
      serviceLocation: testServiceLocation,
      recurringInterest: {
        interested: false,
        note: "Access: side gate | Parking: street",
      },
    } as unknown as CreateBookingDirectionIntakeDto;

    const result = await bridge.submitIntakeAndCreateBooking(dto, "nustandard");

    expect(result.bookingCreated).toBe(true);
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        note: expect.stringMatching(
          /customerPrep=Access: side gate\s+—\s+Parking: street/,
        ),
        operationalMetadataPayload: expect.objectContaining({
          customerTeamPrep: expect.objectContaining({
            freeText: "Access: side gate  —  Parking: street",
          }),
          provenance: expect.objectContaining({
            source: "booking_direction_intake",
            legacyNotesTransport: "recurringInterest.note",
            capturedAt: expect.any(String),
          }),
        }),
      }),
    );
  });

  it("does not pass operationalMetadataPayload when recurringInterest.note is absent", async () => {
    const intakeId = "intake_team_prep_no_note";
    const createBooking = jest.fn().mockResolvedValue({
      booking: { id: "booking_team_prep_no_note" },
      estimate: {
        estimatedPriceCents: 10000,
        estimatedDurationMinutes: 120,
        confidence: 0.9,
        deepCleanProgram: null,
      },
    });

    const prismaMock = {
      bookingDirectionIntake: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === intakeId) {
            return Promise.resolve(buildIntake(intakeId));
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          estimatedHours: 2,
          status: "pending_payment",
          scheduledStart: null,
          estimateSnapshot: { id: "snap1" },
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: "user_team_prep",
          role: Role.customer,
        }),
      },
    } as unknown as PrismaService;

    const estimateEngineV2 = {
      estimateV2: jest.fn().mockReturnValue({
        snapshotVersion: "estimate_engine_v2_core_v1",
        expectedMinutes: 120,
        pricedMinutes: 120,
        customerVisible: {
          estimatedMinutes: 120,
          estimatedPrice: 10_000,
          explanation: "",
        },
      }),
      calculateReconciliation: jest.fn().mockReturnValue({}),
    } as unknown as EstimateEngineV2Service;

    const bridge = new IntakeBookingBridgeService(
      prismaMock,
      {
        create: jest.fn().mockResolvedValue({ intakeId }),
      } as unknown as BookingDirectionIntakeService,
      { createBooking } as unknown as BookingsService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
      {} as unknown as EstimatorService,
      estimateEngineV2,
      {} as unknown as AuthService,
      geocodingMock,
    );

    const dto = {
      serviceId: "recurring-home-cleaning",
      homeSize: "Single family about 2200 sqft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Friday",
      estimateFactors: VALID_ESTIMATE_FACTORS,
      customerName: "Test",
      customerEmail: "team-prep-bridge-no-note@example.com",
      serviceLocation: testServiceLocation,
      recurringInterest: {
        interested: false,
      },
    } as unknown as CreateBookingDirectionIntakeDto;

    const result = await bridge.submitIntakeAndCreateBooking(dto, "nustandard");

    expect(result.bookingCreated).toBe(true);
    const createArgs = createBooking.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(createArgs.operationalMetadataPayload).toBeUndefined();
    expect(String(createArgs.note ?? "")).not.toMatch(/customerPrep=/);
  });
});
