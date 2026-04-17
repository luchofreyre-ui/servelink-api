import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import type { BookingDirectionIntake } from "@prisma/client";
import { Role } from "@prisma/client";
import { PrismaService } from "../../../prisma";
import { AuthService } from "../../../auth/auth.service";
import { BookingsService } from "../../bookings/bookings.service";
import { EstimatorService } from "../../estimate/estimator.service";
import { LifecycleOrchestratorService } from "../../lifecycle/lifecycle-orchestrator.service";
import type { CreateBookingDirectionIntakeDto } from "../dto/create-booking-direction-intake.dto";
import { BookingDirectionIntakeService } from "../booking-direction-intake.service";
import { IntakeBookingBridgeService } from "../intake-booking-bridge.service";

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

function makeEnforcingBookingsService(db: { $transaction: jest.Mock }) {
  return new BookingsService(
    db as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
}

function buildIntakeRow(id: string): BookingDirectionIntake {
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
    customerEmail: "tenant-host-spec@example.com",
    source: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    preferredFoId: null,
    createdAt: new Date(),
  };
}

describe("IntakeBookingBridgeService — tenant host propagation", () => {
  it("passes read host into orchestrator with validateExplicitTenant and persists tenant on createBooking", async () => {
    const intakeId = "intake_host_spec_1";
    const createBookingFromAuthority = jest.fn().mockResolvedValue({
      ok: true,
      bookingId: null,
      source: "booking_direction_submit",
      created: false,
      dispatchEligible: false,
      paymentRequired: false,
      message: "ok",
      authorityOwner: "orchestrator",
      mode: "wrapper_only",
      tenantId: "nustandard",
    });
    const evaluateDispatchReadiness = jest.fn().mockResolvedValue({
      bookingId: "booking_1",
      paymentRequired: true,
      paymentSatisfied: false,
      dispatchEligible: false,
      reason: "booking_status_pending_payment",
    });
    const createBooking = jest.fn().mockResolvedValue({
      booking: { id: "booking_1" },
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
            return Promise.resolve(buildIntakeRow(intakeId));
          }
          return Promise.resolve(null);
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: "user_1",
          role: Role.customer,
        }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IntakeBookingBridgeService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: BookingDirectionIntakeService,
          useValue: {
            create: jest.fn().mockResolvedValue({ intakeId }),
          },
        },
        {
          provide: BookingsService,
          useValue: { createBooking },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
        { provide: EstimatorService, useValue: {} },
        { provide: AuthService, useValue: {} },
        {
          provide: LifecycleOrchestratorService,
          useValue: {
            createBookingFromAuthority,
            evaluateDispatchReadiness,
          },
        },
      ],
    }).compile();

    const bridge = moduleRef.get(IntakeBookingBridgeService);
    const dto = {} as CreateBookingDirectionIntakeDto;
    const requestLike = {
      headers: { host: "www.nustandardcleaning.com" },
    };

    await bridge.submitIntakeAndCreateBooking(dto, requestLike);

    expect(evaluateDispatchReadiness).toHaveBeenCalledWith(
      "booking_1",
      "nustandard",
    );
    expect(createBookingFromAuthority).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "www.nustandardcleaning.com",
        validateExplicitTenant: true,
      }),
    );
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "nustandard",
      }),
    );
  });

  it("prefers x-forwarded-host over host for orchestrator host hint", async () => {
    const intakeId = "intake_host_spec_2";
    const createBookingFromAuthority = jest.fn().mockResolvedValue({
      ok: true,
      bookingId: null,
      source: "booking_direction_submit",
      created: false,
      dispatchEligible: false,
      paymentRequired: false,
      message: "ok",
      authorityOwner: "orchestrator",
      mode: "wrapper_only",
      tenantId: "nustandard",
    });
    const evaluateDispatchReadiness = jest.fn().mockResolvedValue({
      bookingId: "booking_2",
      paymentRequired: true,
      paymentSatisfied: false,
      dispatchEligible: false,
      reason: "booking_status_pending_payment",
    });
    const createBooking = jest.fn().mockResolvedValue({
      booking: { id: "booking_2" },
      estimate: {
        estimatedPriceCents: 10000,
        estimatedDurationMinutes: 120,
        confidence: 0.9,
        deepCleanProgram: null,
      },
    });

    const prismaMock = {
      bookingDirectionIntake: {
        findUnique: jest.fn().mockResolvedValue(buildIntakeRow(intakeId)),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: "user_2",
          role: Role.customer,
        }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IntakeBookingBridgeService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: BookingDirectionIntakeService,
          useValue: {
            create: jest.fn().mockResolvedValue({ intakeId }),
          },
        },
        { provide: BookingsService, useValue: { createBooking } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
        { provide: EstimatorService, useValue: {} },
        { provide: AuthService, useValue: {} },
        {
          provide: LifecycleOrchestratorService,
          useValue: {
            createBookingFromAuthority,
            evaluateDispatchReadiness,
          },
        },
      ],
    }).compile();

    const bridge = moduleRef.get(IntakeBookingBridgeService);
    await bridge.submitIntakeAndCreateBooking({} as CreateBookingDirectionIntakeDto, {
      headers: {
        "x-forwarded-host": "www.nustandardcleaning.com",
        host: "should-not-win.example.com",
      },
    });

    expect(evaluateDispatchReadiness).toHaveBeenCalledWith(
      "booking_2",
      "nustandard",
    );
    expect(createBookingFromAuthority).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "www.nustandardcleaning.com",
        validateExplicitTenant: true,
      }),
    );
  });

  it("fails closed with TENANT_CONTEXT_MISSING when orchestrator returns empty tenantId (booking service rejects before tx)", async () => {
    const intakeId = "intake_host_spec_empty_tenant";
    const $transaction = jest.fn();
    const enforcingBookings = makeEnforcingBookingsService({ $transaction });
    const createBookingFromAuthority = jest.fn().mockResolvedValue({
      ok: true,
      bookingId: null,
      source: "booking_direction_submit",
      created: false,
      dispatchEligible: false,
      paymentRequired: false,
      message: "ok",
      authorityOwner: "orchestrator",
      mode: "wrapper_only",
      tenantId: "",
    });
    const evaluateDispatchReadiness = jest.fn();

    const prismaMock = {
      bookingDirectionIntake: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === intakeId) {
            return Promise.resolve(buildIntakeRow(intakeId));
          }
          return Promise.resolve(null);
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: "user_empty_tenant",
          role: Role.customer,
        }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IntakeBookingBridgeService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: BookingDirectionIntakeService,
          useValue: {
            create: jest.fn().mockResolvedValue({ intakeId }),
          },
        },
        { provide: BookingsService, useValue: enforcingBookings },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
        { provide: EstimatorService, useValue: {} },
        { provide: AuthService, useValue: {} },
        {
          provide: LifecycleOrchestratorService,
          useValue: {
            createBookingFromAuthority,
            evaluateDispatchReadiness,
          },
        },
      ],
    }).compile();

    const bridge = moduleRef.get(IntakeBookingBridgeService);
    const dto = {} as CreateBookingDirectionIntakeDto;
    const requestLike = {
      headers: { host: "www.nustandardcleaning.com" },
    };

    const r = await bridge.submitIntakeAndCreateBooking(dto, requestLike);

    expect(r.bookingError?.code).toBe("TENANT_CONTEXT_MISSING");
    expect(r.bookingCreated).toBe(false);
    expect($transaction).not.toHaveBeenCalled();
    expect(evaluateDispatchReadiness).not.toHaveBeenCalled();
    expect(r.bookingError?.message).toMatch(/Missing tenant context/);
  });
});
