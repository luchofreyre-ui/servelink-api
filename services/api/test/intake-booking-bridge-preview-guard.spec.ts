import { BadRequestException, type INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { Role, type BookingDirectionIntake } from "@prisma/client";
import request from "supertest";
import type { CreateBookingDirectionIntakeDto } from "../src/modules/booking-direction-intake/dto/create-booking-direction-intake.dto";
import { BookingDirectionIntakeSubmitController } from "../src/modules/booking-direction-intake/booking-direction-intake-submit.controller";
import { IntakeBookingBridgeService } from "../src/modules/booking-direction-intake/intake-booking-bridge.service";
import {
  INTAKE_ESTIMATE_INPUT_INVALID_MESSAGE,
  INTAKE_PREVIEW_ESTIMATE_FAILED_MESSAGE,
} from "../src/modules/booking-direction-intake/intake-estimator-reliability";
import { TenantResolver } from "../src/modules/tenant/tenant.resolver";
import {
  EstimatorExecutionError,
  EstimatorInputValidationError,
} from "../src/modules/estimate/errors/estimator.errors";
import { EstimateEngineV2Service } from "../src/modules/estimate/estimate-engine-v2.service";
import { EstimatorService } from "../src/modules/estimate/estimator.service";
import { PrismaService } from "../src/prisma";
import { BookingDirectionIntakeService } from "../src/modules/booking-direction-intake/booking-direction-intake.service";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import { AuthService } from "../src/auth/auth.service";
import type { GeocodingService } from "../src/modules/geocoding/geocoding.service";
import { RecurringPlanService } from "../src/modules/recurring-plan/recurring-plan.service";

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

const estimateEngineV2Mock = {} as EstimateEngineV2Service;

function estimateEngineV2SuccessMock() {
  return {
    estimateV2: jest.fn().mockReturnValue({
      snapshotVersion: "estimate_engine_v2_core_v1",
      expectedMinutes: 180,
      pricedMinutes: 190,
      customerVisible: { estimatedPrice: 50000 },
    }),
    calculateReconciliation: jest.fn().mockReturnValue({
      classification: "aligned",
      flags: [],
    }),
  } as unknown as EstimateEngineV2Service;
}

function successfulEstimator() {
  return {
    estimate: jest.fn().mockResolvedValue({
      estimatedPriceCents: 50000,
      estimatedDurationMinutes: 180,
      confidence: 0.85,
      deepCleanProgram: null,
    }),
  } as unknown as EstimatorService;
}

describe("BookingDirectionIntakeSubmitController preview validation", () => {
  let app: INestApplication;
  const bridge = {
    previewEstimateFromDto: jest.fn().mockResolvedValue({
      kind: "booking_direction_estimate_preview",
      estimate: { priceCents: 0, durationMinutes: 0 },
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BookingDirectionIntakeSubmitController],
      providers: [
        { provide: IntakeBookingBridgeService, useValue: bridge },
        {
          provide: TenantResolver,
          useValue: { resolve: jest.fn().mockReturnValue({ tenantId: "nustandard" }) },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    bridge.previewEstimateFromDto.mockClear();
  });

  it("accepts requestedEnhancementIds on preview-estimate", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/booking-direction-intake/preview-estimate")
      .send({
        serviceId: "recurring-home-cleaning",
        homeSize: "2200 sq ft",
        bedrooms: "2",
        bathrooms: "2",
        frequency: "Weekly",
        preferredTime: "Weekday Morning",
        serviceLocation: testServiceLocation,
        requestedEnhancementIds: ["inside_fridge", "inside_oven"],
      });

    expect(response.status).toBe(200);
    expect(bridge.previewEstimateFromDto).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedEnhancementIds: ["inside_fridge", "inside_oven"],
      }),
    );
  });

  it("accepts recurringInterest on preview-estimate", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/booking-direction-intake/preview-estimate")
      .send({
        serviceId: "deep-cleaning",
        homeSize: "2200 sq ft",
        bedrooms: "2",
        bathrooms: "2",
        frequency: "Weekly",
        preferredTime: "Weekday Morning",
        serviceLocation: testServiceLocation,
        recurringInterest: {
          interested: true,
          cadence: "every_10_days",
          sourceIntent: "review",
          note: "Prefers mornings",
          capturedAt: "2026-05-04T16:00:00.000Z",
        },
      });

    expect(response.status).toBe(200);
    expect(bridge.previewEstimateFromDto).toHaveBeenCalledWith(
      expect.objectContaining({
        recurringInterest: {
          interested: true,
          cadence: "every_10_days",
          sourceIntent: "review",
          note: "Prefers mornings",
          capturedAt: "2026-05-04T16:00:00.000Z",
        },
      }),
    );
  });
});

describe("IntakeBookingBridgeService preview estimator guard", () => {
  it("returns recurringQuoteOptions when recurringInterest is selected", async () => {
    const estimator = successfulEstimator();
    const bridge = new IntakeBookingBridgeService(
      {} as PrismaService,
      {} as BookingDirectionIntakeService,
      {} as BookingsService,
      { get: jest.fn() } as unknown as ConfigService,
      estimator,
      estimateEngineV2SuccessMock(),
      {} as AuthService,
      geocodingMock,
      new RecurringPlanService({} as any),
    );

    const dto = {
      serviceId: "deep-cleaning",
      homeSize: "2200 sq ft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "One-Time",
      preferredTime: "Deferred to team scheduling after estimate",
      serviceLocation: testServiceLocation,
      recurringInterest: {
        interested: true,
        cadence: "weekly",
      },
      estimateFactors: {
        recurringCadenceIntent: "weekly",
        kitchenIntensity: "average_use",
        clutterAccess: "mostly_clear",
        petImpact: "none",
        occupancyLevel: "ppl_1_2",
      },
    } as CreateBookingDirectionIntakeDto;

    const result = await bridge.previewEstimateFromDto(dto);

    expect(result.recurringQuoteOptions?.map((quote) => quote.cadence)).toEqual([
      "weekly",
      "every_10_days",
      "biweekly",
      "monthly",
    ]);
    expect(result.recurringQuoteOptions?.[1]).toEqual(
      expect.objectContaining({
        cadence: "every_10_days",
        cadenceDays: 10,
      }),
    );
    expect(result.recurringQuoteOptions?.[0]?.recurringPriceCents).toBeLessThan(
      result.recurringQuoteOptions?.[0]?.firstCleanPriceCents ?? 0,
    );
  });

  it("omits recurringQuoteOptions when recurring is not selected", async () => {
    const estimator = successfulEstimator();
    const bridge = new IntakeBookingBridgeService(
      {} as PrismaService,
      {} as BookingDirectionIntakeService,
      {} as BookingsService,
      { get: jest.fn() } as unknown as ConfigService,
      estimator,
      estimateEngineV2SuccessMock(),
      {} as AuthService,
      geocodingMock,
      new RecurringPlanService({} as any),
    );

    const dto = {
      serviceId: "deep-cleaning",
      homeSize: "2200 sq ft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "One-Time",
      preferredTime: "Deferred to team scheduling after estimate",
      serviceLocation: testServiceLocation,
      estimateFactors: {
        recurringCadenceIntent: "none",
      },
    } as CreateBookingDirectionIntakeDto;

    const result = await bridge.previewEstimateFromDto(dto);

    expect(result.recurringQuoteOptions).toBeUndefined();
  });

  it("maps EstimatorExecutionError to BadRequestException with ESTIMATE_EXECUTION_FAILED", async () => {
    const root = new Error("internal boom");
    const estimator = {
      estimate: jest
        .fn()
        .mockRejectedValue(
          new EstimatorExecutionError("wrapped", { cause: root, context: { service_type: "maintenance" } }),
        ),
    } as unknown as EstimatorService;

    const bridge = new IntakeBookingBridgeService(
      {} as PrismaService,
      {} as BookingDirectionIntakeService,
      {} as BookingsService,
      { get: jest.fn() } as unknown as ConfigService,
      estimator,
      estimateEngineV2Mock,
      {} as AuthService,
      geocodingMock,
    );

    const dto = {
      serviceId: "recurring-home-cleaning",
      homeSize: "2200 sq ft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Weekday Morning",
      serviceLocation: testServiceLocation,
    } as CreateBookingDirectionIntakeDto;

    try {
      await bridge.previewEstimateFromDto(dto);
      throw new Error("expected BadRequestException");
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({
          code: "ESTIMATE_EXECUTION_FAILED",
          message: INTAKE_PREVIEW_ESTIMATE_FAILED_MESSAGE,
        }),
      );
    }
    expect(estimator.estimate).toHaveBeenCalledTimes(1);
  });

  it("maps EstimatorInputValidationError to BadRequestException with ESTIMATE_INPUT_INVALID", async () => {
    const estimator = {
      estimate: jest.fn().mockRejectedValue(
        new EstimatorInputValidationError("bad field", {
          context: { field: "sqft_band" },
        }),
      ),
    } as unknown as EstimatorService;

    const bridge = new IntakeBookingBridgeService(
      {} as PrismaService,
      {} as BookingDirectionIntakeService,
      {} as BookingsService,
      { get: jest.fn() } as unknown as ConfigService,
      estimator,
      estimateEngineV2Mock,
      {} as AuthService,
      geocodingMock,
    );

    const dto = {
      serviceId: "recurring-home-cleaning",
      homeSize: "2200 sq ft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Weekday Morning",
      serviceLocation: testServiceLocation,
    } as CreateBookingDirectionIntakeDto;

    try {
      await bridge.previewEstimateFromDto(dto);
      throw new Error("expected BadRequestException");
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({
          code: "ESTIMATE_INPUT_INVALID",
          message: INTAKE_ESTIMATE_INPUT_INVALID_MESSAGE,
        }),
      );
    }
  });
});

describe("IntakeBookingBridgeService submit estimator guard", () => {
  const intakeRow = {
    id: "intake_x",
    serviceId: "recurring-home-cleaning",
    homeSize: "2200 sq ft",
    bedrooms: "2",
    bathrooms: "2",
    pets: "",
    frequency: "Weekly",
    preferredTime: "Weekday Morning",
    deepCleanProgram: null,
    estimateFactors: {},
    customerName: "A",
    customerEmail: "cust@example.com",
    source: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    createdAt: new Date(),
  } as BookingDirectionIntake;

  it("returns ESTIMATE_EXECUTION_FAILED when createBooking fails with EstimatorExecutionError", async () => {
    const prisma = {
      bookingDirectionIntake: {
        findUnique: jest.fn().mockResolvedValue(intakeRow),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: "u1", role: Role.customer }),
      },
    } as unknown as PrismaService;

    const createBooking = jest
      .fn()
      .mockRejectedValue(new EstimatorExecutionError("wrapped", { cause: new Error("root") }));

    const bridge = new IntakeBookingBridgeService(
      prisma,
      {
        create: jest.fn().mockResolvedValue({
          intakeId: "intake_x",
          kind: "booking_direction_intake",
          createdAt: new Date().toISOString(),
        }),
      } as unknown as BookingDirectionIntakeService,
      { createBooking } as unknown as BookingsService,
      { get: jest.fn() } as unknown as ConfigService,
      { estimate: jest.fn() } as unknown as EstimatorService,
      estimateEngineV2Mock,
      {} as AuthService,
      geocodingMock,
    );

    const dto = {
      serviceId: "recurring-home-cleaning",
      homeSize: "2200 sq ft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Weekday Morning",
      customerName: "A",
      customerEmail: "cust@example.com",
      serviceLocation: testServiceLocation,
    } as CreateBookingDirectionIntakeDto;

    const result = await bridge.submitIntakeAndCreateBooking(dto, "nustandard");
    expect(result.bookingCreated).toBe(false);
    expect(result.bookingError?.code).toBe("ESTIMATE_EXECUTION_FAILED");
  });

  it("returns ESTIMATE_INPUT_INVALID when createBooking fails with EstimatorInputValidationError", async () => {
    const prisma = {
      bookingDirectionIntake: {
        findUnique: jest.fn().mockResolvedValue(intakeRow),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: "u1", role: Role.customer }),
      },
    } as unknown as PrismaService;

    const createBooking = jest
      .fn()
      .mockRejectedValue(
        new EstimatorInputValidationError("bad", { context: { field: "bedrooms" } }),
      );

    const bridge = new IntakeBookingBridgeService(
      prisma,
      {
        create: jest.fn().mockResolvedValue({
          intakeId: "intake_x",
          kind: "booking_direction_intake",
          createdAt: new Date().toISOString(),
        }),
      } as unknown as BookingDirectionIntakeService,
      { createBooking } as unknown as BookingsService,
      { get: jest.fn() } as unknown as ConfigService,
      { estimate: jest.fn() } as unknown as EstimatorService,
      estimateEngineV2Mock,
      {} as AuthService,
      geocodingMock,
    );

    const dto = {
      serviceId: "recurring-home-cleaning",
      homeSize: "2200 sq ft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Weekday Morning",
      customerName: "A",
      customerEmail: "cust@example.com",
      serviceLocation: testServiceLocation,
    } as CreateBookingDirectionIntakeDto;

    const result = await bridge.submitIntakeAndCreateBooking(dto, "nustandard");
    expect(result.bookingCreated).toBe(false);
    expect(result.bookingError?.code).toBe("ESTIMATE_INPUT_INVALID");
  });

  it("returns BOOKING_CREATE_FAILED for non-estimator createBooking failures", async () => {
    const prisma = {
      bookingDirectionIntake: {
        findUnique: jest.fn().mockResolvedValue(intakeRow),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: "u1", role: Role.customer }),
      },
    } as unknown as PrismaService;

    const createBooking = jest.fn().mockRejectedValue(new Error("unique constraint"));

    const bridge = new IntakeBookingBridgeService(
      prisma,
      {
        create: jest.fn().mockResolvedValue({
          intakeId: "intake_x",
          kind: "booking_direction_intake",
          createdAt: new Date().toISOString(),
        }),
      } as unknown as BookingDirectionIntakeService,
      { createBooking } as unknown as BookingsService,
      { get: jest.fn() } as unknown as ConfigService,
      { estimate: jest.fn() } as unknown as EstimatorService,
      estimateEngineV2Mock,
      {} as AuthService,
      geocodingMock,
    );

    const dto = {
      serviceId: "recurring-home-cleaning",
      homeSize: "2200 sq ft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Weekday Morning",
      customerName: "A",
      customerEmail: "cust@example.com",
      serviceLocation: testServiceLocation,
    } as CreateBookingDirectionIntakeDto;

    const result = await bridge.submitIntakeAndCreateBooking(dto, "nustandard");
    expect(result.bookingCreated).toBe(false);
    expect(result.bookingError?.code).toBe("BOOKING_CREATE_FAILED");
  });
});
