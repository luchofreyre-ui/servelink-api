import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma";
import { BookingsService } from "../bookings/bookings.service";
import type { DeepCleanProgramEstimate } from "../estimate/deep-clean-program";
import { BookingDirectionIntakeService } from "./booking-direction-intake.service";
import type { CreateBookingDirectionIntakeDto } from "./dto/create-booking-direction-intake.dto";
import { mapIntakeToEstimateInput } from "./intake-to-estimate.mapper";

export type DeepCleanProgramVisitSubmitDisplay = {
  visitIndex: number;
  label: string;
  estimatedPriceCents: number;
  estimatedDurationMinutes: number;
  summary: string;
  bundleLabels: string[];
  taskLabels: string[];
};

export type DeepCleanProgramSubmitDisplay = {
  programType: string;
  visitCount: number;
  visits: DeepCleanProgramVisitSubmitDisplay[];
};

function mapDeepCleanProgramForSubmitResponse(
  program: DeepCleanProgramEstimate,
): DeepCleanProgramSubmitDisplay {
  return {
    programType: program.programType,
    visitCount: program.visitCount,
    visits: program.visits.map((v) => ({
      visitIndex: v.visitIndex,
      label: v.label,
      estimatedPriceCents: Math.max(0, Math.floor(v.estimatedPriceCents)),
      estimatedDurationMinutes: Math.max(
        0,
        Math.floor(v.estimatedDurationMinutes),
      ),
      summary: v.summary,
      bundleLabels: [...v.bundleLabels],
      taskLabels: [...v.taskLabels],
    })),
  };
}

export type IntakeSubmitBookingError = {
  code: string;
  message: string;
};

export type IntakeSubmitSuccess = {
  kind: "booking_direction_intake_submit";
  intakeId: string;
  bookingCreated: true;
  bookingId: string;
  estimate: {
    priceCents: number;
    durationMinutes: number;
    confidence: number;
  };
  /** Present when estimate included a deep clean program breakdown. */
  deepCleanProgram: DeepCleanProgramSubmitDisplay | null;
  bookingError: null;
};

export type IntakeSubmitPartial = {
  kind: "booking_direction_intake_submit";
  intakeId: string;
  bookingCreated: false;
  bookingId: null;
  estimate: null;
  deepCleanProgram: null;
  bookingError: IntakeSubmitBookingError;
};

export type IntakeSubmitResponse = IntakeSubmitSuccess | IntakeSubmitPartial;

@Injectable()
export class IntakeBookingBridgeService {
  private readonly logger = new Logger(IntakeBookingBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly intakes: BookingDirectionIntakeService,
    private readonly bookings: BookingsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Persists intake (existing path), then creates a Booking via BookingsService.createBooking
   * so estimate + snapshot + quote run on the canonical path.
   */
  async submitIntakeAndCreateBooking(
    dto: CreateBookingDirectionIntakeDto,
  ): Promise<IntakeSubmitResponse> {
    const created = await this.intakes.create(dto);

    const intake = await this.prisma.bookingDirectionIntake.findUnique({
      where: { id: created.intakeId },
    });

    if (!intake) {
      return {
        kind: "booking_direction_intake_submit",
        intakeId: created.intakeId,
        bookingCreated: false,
        bookingId: null,
        estimate: null,
        deepCleanProgram: null,
        bookingError: {
          code: "INTAKE_ROW_MISSING",
          message: "Intake was created but could not be reloaded.",
        },
      };
    }

    const customerId = this.config
      .get<string>("BOOKING_INTAKE_BRIDGE_CUSTOMER_ID")
      ?.trim();

    if (!customerId) {
      this.logger.warn(
        "BOOKING_INTAKE_BRIDGE_CUSTOMER_ID is not set; intake stored without booking.",
      );
      return {
        kind: "booking_direction_intake_submit",
        intakeId: intake.id,
        bookingCreated: false,
        bookingId: null,
        estimate: null,
        deepCleanProgram: null,
        bookingError: {
          code: "INTAKE_BRIDGE_CUSTOMER_NOT_CONFIGURED",
          message:
            "Server is not configured to create bookings from public intake. Set BOOKING_INTAKE_BRIDGE_CUSTOMER_ID to a valid customer user id.",
        },
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
    });
    if (!user) {
      return {
        kind: "booking_direction_intake_submit",
        intakeId: intake.id,
        bookingCreated: false,
        bookingId: null,
        estimate: null,
        deepCleanProgram: null,
        bookingError: {
          code: "INTAKE_BRIDGE_CUSTOMER_NOT_FOUND",
          message:
            "BOOKING_INTAKE_BRIDGE_CUSTOMER_ID does not match an existing user.",
        },
      };
    }

    const estimateInput = mapIntakeToEstimateInput(intake);
    const note = [
      `Booking direction intake ${intake.id}`,
      `serviceId=${intake.serviceId}`,
      `frequency=${intake.frequency}`,
      `preferredTime=${intake.preferredTime}`,
    ].join(" | ");

    try {
      const { booking, estimate } = await this.bookings.createBooking({
        customerId,
        estimateInput,
        note,
      });

      if (!booking?.id) {
        return {
          kind: "booking_direction_intake_submit",
          intakeId: intake.id,
          bookingCreated: false,
          bookingId: null,
          estimate: null,
          deepCleanProgram: null,
          bookingError: {
            code: "BOOKING_CREATE_EMPTY",
            message: "Booking create returned no booking id.",
          },
        };
      }

      if (!estimate) {
        return {
          kind: "booking_direction_intake_submit",
          intakeId: intake.id,
          bookingCreated: false,
          bookingId: null,
          estimate: null,
          deepCleanProgram: null,
          bookingError: {
            code: "ESTIMATE_FAILED",
            message: "Estimator did not return a result for this intake.",
          },
        };
      }

      const deepCleanProgram = estimate.deepCleanProgram
        ? mapDeepCleanProgramForSubmitResponse(estimate.deepCleanProgram)
        : null;

      return {
        kind: "booking_direction_intake_submit",
        intakeId: intake.id,
        bookingCreated: true,
        bookingId: booking.id,
        estimate: {
          priceCents: Math.max(0, Math.floor(estimate.estimatedPriceCents)),
          durationMinutes: Math.max(
            0,
            Math.floor(estimate.estimatedDurationMinutes),
          ),
          confidence: estimate.confidence,
        },
        deepCleanProgram,
        bookingError: null,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err ?? "unknown error");
      this.logger.error(
        `createBooking from intake failed intakeId=${intake.id}: ${message}`,
      );
      return {
        kind: "booking_direction_intake_submit",
        intakeId: intake.id,
        bookingCreated: false,
        bookingId: null,
        estimate: null,
        deepCleanProgram: null,
        bookingError: {
          code: "BOOKING_CREATE_FAILED",
          message,
        },
      };
    }
  }
}
