import { randomBytes } from "node:crypto";

import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Role, type BookingDirectionIntake } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { AuthService } from "../../auth/auth.service";
import { BookingsService } from "../bookings/bookings.service";
import type { DeepCleanProgramEstimate } from "../estimate/deep-clean-program";
import { EstimatorService } from "../estimate/estimator.service";
import { BookingDirectionIntakeService } from "./booking-direction-intake.service";
import type { CreateBookingDirectionIntakeDto } from "./dto/create-booking-direction-intake.dto";
import {
  IntakeEstimateMappingError,
  mapIntakeFieldsToEstimateInput,
  mapIntakeToEstimateInput,
} from "./intake-to-estimate.mapper";
import { defaultIntakeQuestionnaireFactors } from "./intake-default-questionnaire";

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

export type IntakeEstimatePreviewResponse = {
  kind: "booking_direction_estimate_preview";
  estimate: {
    priceCents: number;
    durationMinutes: number;
    confidence: number;
  };
  deepCleanProgram: DeepCleanProgramSubmitDisplay | null;
};

@Injectable()
export class IntakeBookingBridgeService {
  private readonly logger = new Logger(IntakeBookingBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly intakes: BookingDirectionIntakeService,
    private readonly bookings: BookingsService,
    private readonly config: ConfigService,
    private readonly estimator: EstimatorService,
    private readonly auth: AuthService,
  ) {}

  /**
   * Stateless estimate for the public booking review step — same mapper as submit,
   * does not persist intake or create a booking.
   */
  async previewEstimateFromDto(
    dto: CreateBookingDirectionIntakeDto,
  ): Promise<IntakeEstimatePreviewResponse> {
    let estimateInput;
    try {
      estimateInput = mapIntakeFieldsToEstimateInput({
        homeSize: dto.homeSize,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        serviceId: dto.serviceId,
        frequency: dto.frequency,
        deepCleanProgram: dto.deepCleanProgram ?? null,
        estimateFactors:
          dto.estimateFactors ?? defaultIntakeQuestionnaireFactors(),
      });
    } catch (err: unknown) {
      if (err instanceof IntakeEstimateMappingError) {
        throw new BadRequestException({
          code: err.code,
          message: err.message,
        });
      }
      throw err;
    }

    const result = await this.estimator.estimate(estimateInput);
    const deepCleanProgram = result.deepCleanProgram
      ? mapDeepCleanProgramForSubmitResponse(result.deepCleanProgram)
      : null;

    return {
      kind: "booking_direction_estimate_preview",
      estimate: {
        priceCents: Math.max(0, Math.floor(result.estimatedPriceCents)),
        durationMinutes: Math.max(
          0,
          Math.floor(result.estimatedDurationMinutes),
        ),
        confidence: result.confidence,
      },
      deepCleanProgram,
    };
  }

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

    const customerResolution =
      await this.resolveCustomerIdForIntakeBridge(intake);
    if ("error" in customerResolution) {
      return {
        kind: "booking_direction_intake_submit",
        intakeId: intake.id,
        bookingCreated: false,
        bookingId: null,
        estimate: null,
        deepCleanProgram: null,
        bookingError: customerResolution.error,
      };
    }

    const customerId = customerResolution.customerId;

    let estimateInput;
    try {
      estimateInput = mapIntakeToEstimateInput(intake);
    } catch (err: unknown) {
      if (err instanceof IntakeEstimateMappingError) {
        return {
          kind: "booking_direction_intake_submit",
          intakeId: intake.id,
          bookingCreated: false,
          bookingId: null,
          estimate: null,
          deepCleanProgram: null,
          bookingError: {
            code: err.code,
            message: err.message,
          },
        };
      }
      throw err;
    }

    const noteParts = [
      `Booking direction intake ${intake.id}`,
      `serviceId=${intake.serviceId}`,
      `frequency=${intake.frequency}`,
      `preferredTime=${intake.preferredTime}`,
    ];
    const displayName = intake.customerName?.trim();
    if (displayName) {
      noteParts.push(`customerName=${displayName}`);
    }
    const note = noteParts.join(" | ");

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

  /**
   * Prefer persisted intake contact: resolve existing `User` by email (case-insensitive)
   * or provision a lightweight `Role.customer` account via `AuthService.register`
   * (random password; user can recover access through normal password flows later).
   * If the intake has no email (legacy), fall back to `BOOKING_INTAKE_BRIDGE_CUSTOMER_ID`.
   */
  private async resolveCustomerIdForIntakeBridge(
    intake: BookingDirectionIntake,
  ): Promise<{ customerId: string } | { error: IntakeSubmitBookingError }> {
    const rawEmail = intake.customerEmail?.trim();
    const normalizedEmail = rawEmail ? rawEmail.toLowerCase() : "";

    if (normalizedEmail) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
        },
      });

      if (existing) {
        if (existing.role !== Role.customer) {
          return {
            error: {
              code: "INTAKE_CONTACT_EMAIL_INELIGIBLE",
              message:
                "This email is tied to a non-customer account. Use a different email or contact support.",
            },
          };
        }
        return { customerId: existing.id };
      }

      const randomPassword = randomBytes(32).toString("base64url");
      try {
        const registered = await this.auth.register(
          normalizedEmail,
          randomPassword,
        );
        return { customerId: registered.id };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : String(err ?? "unknown error");
        this.logger.error(
          `Customer provision from intake failed email=${normalizedEmail}: ${message}`,
        );
        return {
          error: {
            code: "INTAKE_CUSTOMER_PROVISION_FAILED",
            message:
              "We could not create an account for this email. Please try again shortly.",
          },
        };
      }
    }

    const bridgeId = this.config
      .get<string>("BOOKING_INTAKE_BRIDGE_CUSTOMER_ID")
      ?.trim();

    if (!bridgeId) {
      this.logger.warn(
        "Intake missing customerEmail and BOOKING_INTAKE_BRIDGE_CUSTOMER_ID unset; booking not created.",
      );
      return {
        error: {
          code: "INTAKE_BRIDGE_CUSTOMER_NOT_CONFIGURED",
          message:
            "Add a valid email on the booking form so we can attach this booking to you, or set BOOKING_INTAKE_BRIDGE_CUSTOMER_ID for legacy intakes without contact.",
        },
      };
    }

    const fallbackUser = await this.prisma.user.findUnique({
      where: { id: bridgeId },
    });
    if (!fallbackUser) {
      return {
        error: {
          code: "INTAKE_BRIDGE_CUSTOMER_NOT_FOUND",
          message:
            "BOOKING_INTAKE_BRIDGE_CUSTOMER_ID does not match an existing user.",
        },
      };
    }

    this.logger.log(
      `Intake ${intake.id} using legacy BOOKING_INTAKE_BRIDGE_CUSTOMER_ID fallback (no customerEmail on row).`,
    );
    return { customerId: bridgeId };
  }
}
