import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../src/prisma";
import { AuthService } from "../src/auth/auth.service";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import { EstimatorService } from "../src/modules/estimate/estimator.service";
import type { CreateBookingDirectionIntakeDto } from "../src/modules/booking-direction-intake/dto/create-booking-direction-intake.dto";
import { BookingDirectionIntakeService } from "../src/modules/booking-direction-intake/booking-direction-intake.service";
import { IntakeBookingBridgeService } from "../src/modules/booking-direction-intake/intake-booking-bridge.service";
import {
  GeocodingNotFoundError,
  GeocodingService,
} from "../src/modules/geocoding/geocoding.service";
import { INTAKE_SERVICE_LOCATION_REQUIRED_CODE } from "../src/modules/booking-direction-intake/intake-estimator-reliability";

function baseDto(
  overrides: Partial<CreateBookingDirectionIntakeDto> = {},
): CreateBookingDirectionIntakeDto {
  return {
    serviceId: "recurring-home-cleaning",
    homeSize: "2200 sq ft",
    bedrooms: "2",
    bathrooms: "2",
    pets: "",
    frequency: "Weekly",
    preferredTime: "Friday",
    estimateFactors: undefined,
    serviceLocation: {
      street: "100 Market Street",
      city: "San Francisco",
      state: "CA",
      zip: "94103",
    },
    ...overrides,
  } as CreateBookingDirectionIntakeDto;
}

describe("IntakeBookingBridgeService — public service location", () => {
  it("returns SERVICE_LOCATION_REQUIRED when serviceLocation is missing", async () => {
    const geocoding = { geocodeServiceLocation: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        IntakeBookingBridgeService,
        { provide: PrismaService, useValue: {} },
        { provide: BookingDirectionIntakeService, useValue: { create: jest.fn() } },
        { provide: BookingsService, useValue: { createBooking: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: EstimatorService, useValue: { estimate: jest.fn() } },
        { provide: AuthService, useValue: {} },
        { provide: GeocodingService, useValue: geocoding },
      ],
    }).compile();

    const bridge = moduleRef.get(IntakeBookingBridgeService);
    const { serviceLocation: _s, ...rest } = baseDto();
    const r = await bridge.submitIntakeAndCreateBooking(rest as CreateBookingDirectionIntakeDto);

    expect(r.bookingCreated).toBe(false);
    expect(r.bookingError?.code).toBe(INTAKE_SERVICE_LOCATION_REQUIRED_CODE);
    expect(geocoding.geocodeServiceLocation).not.toHaveBeenCalled();
  });

  it("returns geocode failure as bookingError without creating an intake", async () => {
    const geocoding = {
      geocodeServiceLocation: jest
        .fn()
        .mockRejectedValue(
          new GeocodingNotFoundError("We could not match this address to a location."),
        ),
    };
    const intakesCreate = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [
        IntakeBookingBridgeService,
        { provide: PrismaService, useValue: {} },
        { provide: BookingDirectionIntakeService, useValue: { create: intakesCreate } },
        { provide: BookingsService, useValue: { createBooking: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: EstimatorService, useValue: { estimate: jest.fn() } },
        { provide: AuthService, useValue: {} },
        { provide: GeocodingService, useValue: geocoding },
      ],
    }).compile();

    const bridge = moduleRef.get(IntakeBookingBridgeService);
    const r = await bridge.submitIntakeAndCreateBooking(baseDto());

    expect(r.bookingCreated).toBe(false);
    expect(r.bookingError?.code).toBe("SERVICE_LOCATION_NOT_RESOLVABLE");
    expect(intakesCreate).not.toHaveBeenCalled();
  });
});
