import { ConfigService } from "@nestjs/config";
import type { BookingDirectionIntake } from "@prisma/client";
import { Role } from "@prisma/client";
import { PrismaService } from "../src/prisma";
import { AuthService } from "../src/auth/auth.service";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import { EstimatorService } from "../src/modules/estimate/estimator.service";
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

function buildIntake(id: string, preferredFoId: string | null): BookingDirectionIntake {
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
    customerEmail: "preferred-fo-bridge@example.com",
    source: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    preferredFoId,
    createdAt: new Date(),
  } as unknown as BookingDirectionIntake;
}

describe("IntakeBookingBridgeService — preferredFoId → createBooking", () => {
  it("forwards intake.preferredFoId to BookingsService.createBooking", async () => {
    const intakeId = "intake_pref_bridge_1";
    const createBooking = jest.fn().mockResolvedValue({
      booking: { id: "booking_pref_1" },
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
            return Promise.resolve(buildIntake(intakeId, "fo_from_intake"));
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
          id: "user_pref",
          role: Role.customer,
        }),
      },
    } as unknown as PrismaService;

    const bridge = new IntakeBookingBridgeService(
      prismaMock,
      {
        create: jest.fn().mockResolvedValue({ intakeId }),
      } as unknown as BookingDirectionIntakeService,
      { createBooking } as unknown as BookingsService,
      { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
      {} as unknown as EstimatorService,
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
      preferredFoId: "fo_from_intake",
      estimateFactors: VALID_ESTIMATE_FACTORS,
      customerName: "Test",
      customerEmail: "preferred-fo-bridge@example.com",
      serviceLocation: testServiceLocation,
    } as unknown as CreateBookingDirectionIntakeDto;

    const result = await bridge.submitIntakeAndCreateBooking(dto);

    expect(result.bookingCreated).toBe(true);
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredFoId: "fo_from_intake",
      }),
    );
  });
});
