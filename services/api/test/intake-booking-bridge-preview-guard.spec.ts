import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";
import type { CreateBookingDirectionIntakeDto } from "../src/modules/booking-direction-intake/dto/create-booking-direction-intake.dto";
import { IntakeBookingBridgeService } from "../src/modules/booking-direction-intake/intake-booking-bridge.service";
import {
  INTAKE_ESTIMATE_INPUT_INVALID_MESSAGE,
  INTAKE_PREVIEW_ESTIMATE_FAILED_MESSAGE,
} from "../src/modules/booking-direction-intake/intake-estimator-reliability";
import {
  EstimatorExecutionError,
  EstimatorInputValidationError,
} from "../src/modules/estimate/errors/estimator.errors";
import { EstimatorService } from "../src/modules/estimate/estimator.service";
import { PrismaService } from "../src/prisma";
import { BookingDirectionIntakeService } from "../src/modules/booking-direction-intake/booking-direction-intake.service";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import { AuthService } from "../src/auth/auth.service";

describe("IntakeBookingBridgeService preview estimator guard", () => {
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
      {} as AuthService,
    );

    const dto = {
      serviceId: "recurring-home-cleaning",
      homeSize: "2200 sq ft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Weekday Morning",
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
      {} as AuthService,
    );

    const dto = {
      serviceId: "recurring-home-cleaning",
      homeSize: "2200 sq ft",
      bedrooms: "2",
      bathrooms: "2",
      frequency: "Weekly",
      preferredTime: "Weekday Morning",
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
  };

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
      {} as AuthService,
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
    } as CreateBookingDirectionIntakeDto;

    const result = await bridge.submitIntakeAndCreateBooking(dto);
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
      {} as AuthService,
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
    } as CreateBookingDirectionIntakeDto;

    const result = await bridge.submitIntakeAndCreateBooking(dto);
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
      {} as AuthService,
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
    } as CreateBookingDirectionIntakeDto;

    const result = await bridge.submitIntakeAndCreateBooking(dto);
    expect(result.bookingCreated).toBe(false);
    expect(result.bookingError?.code).toBe("BOOKING_CREATE_FAILED");
  });
});
