import { randomUUID } from "crypto";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  Booking,
  BookingStatus,
  Prisma,
  RecurringCadence,
  RecurringOccurrence,
  RecurringOccurrenceStatus,
  RecurringPlan,
  RecurringPlanStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { BookingsService } from "../bookings/bookings.service";
import type { EstimateFactorsDto } from "../booking-direction-intake/dto/estimate-factors.dto";
import {
  IntakeEstimateMappingError,
  mapIntakeFieldsToEstimateInput,
  type IntakeFieldsForEstimate,
} from "../booking-direction-intake/intake-to-estimate.mapper";
import type { CreateRecurringPlanDto } from "./dto/create-recurring-plan.dto";
import { RecurringCadenceDto } from "./dto/create-recurring-plan.dto";
import type { UpdateNextOccurrenceDto } from "./dto/update-next-occurrence.dto";
import type { UpdateRecurringPlanDto } from "./dto/update-recurring-plan.dto";
import {
  BOOKING_FINALIZE_ERROR_PREFIX,
  BOOKING_NOTE_FINGERPRINT_KEY,
  buildOccurrenceBookingFingerprint,
  formatBookingNoteWithFingerprint,
  parseBookingIdFromFinalizeError,
} from "./recurring-occurrence-identity";
import type {
  NextOccurrenceDisposition,
  OccurrenceGenerationResult,
  PlanCancellationEffect,
  PlanReconciliationFields,
  ProcessOccurrenceResult,
  RecurringPlanLifecycleResponseMeta,
} from "./recurring.types";

const MOVE_IN_OUT_SLUG = "move-in-move-out";

const RECURRING_ELIGIBLE_SERVICE_TYPES = new Set([
  "recurring-home-cleaning",
  "deep-cleaning",
]);

const NEXT_MUTABLE_OCCURRENCE_STATUSES: RecurringOccurrenceStatus[] = [
  RecurringOccurrenceStatus.pending_generation,
  RecurringOccurrenceStatus.booking_created,
  RecurringOccurrenceStatus.scheduled,
  RecurringOccurrenceStatus.needs_review,
];

const MAX_OCCURRENCE_PROCESSING_ATTEMPTS = 3;
const PROC_READY = "ready";
const PROC_PROCESSING = "processing";
const PROC_FAILED = "failed";
const PROC_COMPLETED = "completed";

const RECON_CLEAN = "clean";
const RECON_BOOKING_PENDING = "booking_created_occurrence_pending";
const RECON_MANUAL = "needs_manual_review";

export function computeNextOccurrenceDate(
  anchor: Date,
  cadence: "weekly" | "biweekly" | "monthly",
): Date {
  const d = new Date(anchor.getTime());
  if (cadence === "weekly") {
    d.setDate(d.getDate() + 7);
    return d;
  }
  if (cadence === "biweekly") {
    d.setDate(d.getDate() + 14);
    return d;
  }
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const daysInTargetMonth = new Date(y, m + 2, 0).getDate();
  const clampedDay = Math.min(day, daysInTargetMonth);
  return new Date(
    y,
    m + 1,
    clampedDay,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds(),
  );
}

function mapCadenceDtoToPrisma(c: RecurringCadenceDto): RecurringCadence {
  switch (c) {
    case RecurringCadenceDto.weekly:
      return RecurringCadence.weekly;
    case RecurringCadenceDto.biweekly:
      return RecurringCadence.biweekly;
    case RecurringCadenceDto.monthly:
      return RecurringCadence.monthly;
    default:
      return RecurringCadence.weekly;
  }
}

function cadenceUpdateStringToPrisma(
  c: "weekly" | "biweekly" | "monthly",
): RecurringCadence {
  switch (c) {
    case "weekly":
      return RecurringCadence.weekly;
    case "biweekly":
      return RecurringCadence.biweekly;
    case "monthly":
      return RecurringCadence.monthly;
    default:
      return RecurringCadence.weekly;
  }
}

function cadenceDtoToLiteral(
  c: RecurringCadenceDto,
): "weekly" | "biweekly" | "monthly" {
  switch (c) {
    case RecurringCadenceDto.weekly:
      return "weekly";
    case RecurringCadenceDto.biweekly:
      return "biweekly";
    case RecurringCadenceDto.monthly:
      return "monthly";
    default:
      return "weekly";
  }
}

function cadencePrismaToLiteral(
  c: RecurringCadence,
): "weekly" | "biweekly" | "monthly" {
  switch (c) {
    case RecurringCadence.weekly:
      return "weekly";
    case RecurringCadence.biweekly:
      return "biweekly";
    case RecurringCadence.monthly:
      return "monthly";
    default:
      return "weekly";
  }
}

function coerceIntakeFields(
  intakeSnapshot: Record<string, unknown>,
): IntakeFieldsForEstimate {
  const serviceId = String(intakeSnapshot.serviceId ?? "").trim();
  const homeSize = String(intakeSnapshot.homeSize ?? "").trim();
  const bedrooms = String(intakeSnapshot.bedrooms ?? "").trim();
  const bathrooms = String(intakeSnapshot.bathrooms ?? "").trim();
  const frequency = String(intakeSnapshot.frequency ?? "").trim();
  const rawFactors = intakeSnapshot.estimateFactors;

  if (
    !serviceId ||
    !homeSize ||
    !bedrooms ||
    !bathrooms ||
    !frequency ||
    !rawFactors ||
    typeof rawFactors !== "object" ||
    Array.isArray(rawFactors)
  ) {
    throw new BadRequestException(
      "intakeSnapshot must include serviceId, homeSize, bedrooms, bathrooms, frequency, and estimateFactors.",
    );
  }

  const deepRaw = intakeSnapshot.deepCleanProgram;
  const deepCleanProgram =
    deepRaw === "phased_3_visit" || deepRaw === "single_visit"
      ? String(deepRaw)
      : null;

  return {
    serviceId,
    homeSize,
    bedrooms,
    bathrooms,
    frequency,
    deepCleanProgram,
    estimateFactors: rawFactors as EstimateFactorsDto,
  };
}

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
  ) {}

  assertServiceEligibleForRecurring(serviceType: string) {
    const t = String(serviceType ?? "").trim();
    if (!t) {
      throw new BadRequestException("serviceType is required.");
    }
    if (t === MOVE_IN_OUT_SLUG) {
      throw new BadRequestException(
        "Recurring plans are not available for move-in / move-out.",
      );
    }
    if (!RECURRING_ELIGIBLE_SERVICE_TYPES.has(t)) {
      throw new BadRequestException(
        `Service type "${t}" is not eligible for recurring plans.`,
      );
    }
  }

  async assertPlanOwnedByCustomer(planId: string, customerId: string) {
    const plan = await this.prisma.recurringPlan.findFirst({
      where: { id: planId, customerId },
    });
    if (!plan) {
      throw new NotFoundException("Recurring plan not found.");
    }
    return plan;
  }

  private async findNextMutableOccurrence(
    planId: string,
  ): Promise<RecurringOccurrence | null> {
    return this.prisma.recurringOccurrence.findFirst({
      where: {
        recurringPlanId: planId,
        status: { in: NEXT_MUTABLE_OCCURRENCE_STATUSES },
      },
      orderBy: { targetDate: "asc" },
    });
  }

  private startOfUtcDay(d = new Date()): Date {
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );
  }

  private computePlanReconciliation(
    plan: { id: string; status: RecurringPlanStatus },
    occs: Array<{
      id: string;
      status: RecurringOccurrenceStatus;
      bookingId: string | null;
      targetDate: Date;
    }>,
  ): PlanReconciliationFields {
    const start = this.startOfUtcDay();
    const bookedCandidates = occs
      .filter(
        (o) =>
          Boolean(o.bookingId) &&
          (o.status === RecurringOccurrenceStatus.booking_created ||
            o.status === RecurringOccurrenceStatus.scheduled) &&
          o.targetDate.getTime() >= start.getTime(),
      )
      .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
    const firstBooked = bookedCandidates[0];
    const hasUpcomingBookedOccurrence = Boolean(firstBooked);

    let planCancellationEffect: PlanCancellationEffect = "none";
    if (plan.status === RecurringPlanStatus.canceled) {
      if (hasUpcomingBookedOccurrence) {
        planCancellationEffect = "booking_linked_but_not_canceled";
      } else if (
        occs.some(
          (o) =>
            o.status === RecurringOccurrenceStatus.canceled &&
            o.bookingId != null,
        )
      ) {
        planCancellationEffect = "booking_canceled";
      } else if (
        occs.some(
          (o) =>
            o.status === RecurringOccurrenceStatus.canceled &&
            o.bookingId == null,
        )
      ) {
        planCancellationEffect = "plan_and_unbooked_occurrence";
      } else {
        planCancellationEffect = "plan_only";
      }
    }

    return {
      hasUpcomingBookedOccurrence,
      ...(firstBooked
        ? {
            upcomingBookedOccurrenceId: firstBooked.id,
            upcomingBookedOccurrenceStatus: firstBooked.status,
          }
        : {}),
      planCancellationEffect,
    };
  }

  private async tryCancelLinkedBookingForCustomer(args: {
    customerId: string;
    planId: string;
    occurrence: RecurringOccurrence;
  }): Promise<
    | { ok: true }
    | { ok: false; reason: "linked_booking_not_found" | "linked_booking_customer_mismatch" | "booking_cancellation_transition_failed" }
  > {
    const bid = args.occurrence.bookingId;
    if (!bid) {
      return {
        ok: false,
        reason: "booking_cancellation_transition_failed",
      };
    }
    let booking;
    try {
      booking = await this.bookings.getBooking(bid);
    } catch (e: unknown) {
      if (e instanceof NotFoundException) {
        this.logger.warn(
          `RECURRING_PLAN_CANCEL_BOOKING_NOT_FOUND planId=${args.planId} bookingId=${bid}`,
        );
        return { ok: false, reason: "linked_booking_not_found" };
      }
      throw e;
    }
    if (booking.customerId !== args.customerId) {
      this.logger.warn(
        `RECURRING_PLAN_CANCEL_BOOKING_CUSTOMER_MISMATCH planId=${args.planId} bookingId=${bid}`,
      );
      return { ok: false, reason: "linked_booking_customer_mismatch" };
    }
    if (booking.status === BookingStatus.canceled) {
      return { ok: true };
    }
    try {
      await this.bookings.transitionBooking({
        id: bid,
        transition: "cancel",
        note: `Recurring plan ${args.planId} canceled by customer`,
      });
      return { ok: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err ?? "unknown error");
      this.logger.warn(
        `RECURRING_PLAN_CANCEL_LINKED_BOOKING_FAILED planId=${args.planId} bookingId=${bid} message=${message}`,
      );
      return { ok: false, reason: "booking_cancellation_transition_failed" };
    }
  }

  async getNextOccurrenceForCustomer(planId: string, customerId: string) {
    await this.assertPlanOwnedByCustomer(planId, customerId);
    const occurrence = await this.findNextMutableOccurrence(planId);
    return {
      ok: true as const,
      item: occurrence
        ? this.serializeOccurrenceFull(occurrence)
        : null,
    };
  }

  async patchNextOccurrenceForCustomer(
    planId: string,
    customerId: string,
    dto: UpdateNextOccurrenceDto,
  ) {
    const planRow = await this.assertPlanOwnedByCustomer(planId, customerId);
    if (planRow.status === RecurringPlanStatus.canceled) {
      throw new BadRequestException(
        "This recurring plan has been canceled; visits cannot be edited.",
      );
    }
    const occurrence = await this.findNextMutableOccurrence(planId);
    if (!occurrence) {
      this.logger.warn(
        `RECURRING_NEXT_PATCH_NO_MUTABLE_OCCURRENCE planId=${planId} customerId=${customerId}`,
      );
      throw new NotFoundException("No editable next visit found for this plan.");
    }

    const hasAnyPatch =
      dto.targetDate !== undefined ||
      dto.preferredTimeWindow !== undefined ||
      dto.preferredFoId !== undefined ||
      dto.overrideInstructions !== undefined ||
      dto.overrideAddonIds !== undefined;

    if (!hasAnyPatch) {
      throw new BadRequestException("Provide at least one field to update.");
    }

    const data: Prisma.RecurringOccurrenceUpdateInput = {};

    if (dto.targetDate !== undefined) {
      const d = new Date(dto.targetDate);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException("targetDate must be a valid ISO date.");
      }
      data.targetDate = d;
    }

    if (dto.preferredFoId !== undefined) {
      const v = dto.preferredFoId?.trim();
      data.overridePreferredFoId = v && v.length > 0 ? v : null;
    }

    if (dto.overrideInstructions !== undefined) {
      const v = dto.overrideInstructions?.trim();
      data.overrideInstructions = v && v.length > 0 ? v : null;
    }

    if (dto.overrideAddonIds !== undefined) {
      data.overrideAddonIds = dto.overrideAddonIds.map((x) => String(x)) as object;
    }

    if (dto.preferredTimeWindow !== undefined) {
      const v = dto.preferredTimeWindow?.trim();
      const prevSnap =
        occurrence.bookingSnapshot &&
        typeof occurrence.bookingSnapshot === "object" &&
        !Array.isArray(occurrence.bookingSnapshot)
          ? (occurrence.bookingSnapshot as Record<string, unknown>)
          : {};
      data.bookingSnapshot = {
        ...prevSnap,
        preferredTimeWindow: v && v.length > 0 ? v : null,
      } as object;
    }

    const updated = await this.prisma.recurringOccurrence.update({
      where: { id: occurrence.id },
      data,
    });

    return {
      ok: true as const,
      item: this.serializeOccurrenceFull(updated),
      bookingSync: "not_attempted" as const,
    };
  }

  async getRecurringPlanForCustomer(planId: string, customerId: string) {
    const plan = await this.assertPlanOwnedByCustomer(planId, customerId);
    const [nextOccurrence, recentRows, reconRows] = await Promise.all([
      this.findNextMutableOccurrence(planId),
      this.prisma.recurringOccurrence.findMany({
        where: { recurringPlanId: planId },
        orderBy: { sequenceNumber: "desc" },
        take: 5,
      }),
      this.prisma.recurringOccurrence.findMany({
        where: { recurringPlanId: planId },
        select: {
          id: true,
          status: true,
          bookingId: true,
          targetDate: true,
        },
        orderBy: { sequenceNumber: "desc" },
        take: 200,
      }),
    ]);
    const reconciliation = this.computePlanReconciliation(plan, reconRows);
    return {
      ok: true as const,
      item: {
        plan: this.serializePlan(plan),
        nextOccurrence: nextOccurrence
          ? this.serializeOccurrenceFull(nextOccurrence)
          : null,
        recentOccurrences: recentRows.map((o) =>
          this.serializeOccurrenceFull(o),
        ),
        reconciliation,
      },
    };
  }

  async skipNextOccurrenceForCustomer(planId: string, customerId: string) {
    const plan = await this.assertPlanOwnedByCustomer(planId, customerId);
    if (plan.status === RecurringPlanStatus.canceled) {
      throw new BadRequestException(
        "This recurring plan has been canceled; visits cannot be skipped.",
      );
    }
    const occurrence = await this.findNextMutableOccurrence(planId);
    if (!occurrence) {
      throw new NotFoundException(
        "No skippable upcoming visit found for this plan.",
      );
    }
    const updated = await this.prisma.recurringOccurrence.update({
      where: { id: occurrence.id },
      data: { status: RecurringOccurrenceStatus.skipped },
    });
    return {
      ok: true as const,
      item: this.serializeOccurrenceFull(updated),
      nextOccurrenceDisposition: "skipped" as const,
    };
  }

  async getProcessableOccurrences(): Promise<RecurringOccurrence[]> {
    return this.prisma.recurringOccurrence.findMany({
      where: {
        recurringPlan: { status: RecurringPlanStatus.active },
        OR: [
          {
            status: {
              in: [
                RecurringOccurrenceStatus.pending_generation,
                RecurringOccurrenceStatus.needs_review,
              ],
            },
            processingState: { in: [PROC_READY, PROC_FAILED] },
            processingAttempts: { lt: MAX_OCCURRENCE_PROCESSING_ATTEMPTS },
          },
          {
            reconciliationState: RECON_BOOKING_PENDING,
            bookingId: null,
            generationError: { contains: BOOKING_FINALIZE_ERROR_PREFIX },
          },
        ],
      },
      take: 10,
      orderBy: [{ updatedAt: "asc" }],
    });
  }

  private async finishOccurrenceFailure(
    occurrenceId: string,
    message: string,
  ): Promise<void> {
    const row = await this.prisma.recurringOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status: RecurringOccurrenceStatus.needs_review,
        processingState: PROC_FAILED,
        generationError: message,
        processingToken: null,
      },
    });
    if (row.processingAttempts >= MAX_OCCURRENCE_PROCESSING_ATTEMPTS) {
      this.logger.warn(
        `RECURRING_OCCURRENCE_GENERATION_EXHAUSTED occurrenceId=${occurrenceId} attempts=${row.processingAttempts} message=${message}`,
      );
    } else {
      this.logger.log(
        `RECURRING_OCCURRENCE_GENERATION_RETRY_PENDING occurrenceId=${occurrenceId} attempts=${row.processingAttempts} nextState=${PROC_FAILED}`,
      );
    }
  }

  async processOccurrence(occurrenceId: string): Promise<ProcessOccurrenceResult> {
    const initial = await this.prisma.recurringOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { recurringPlan: true },
    });
    if (!initial) {
      return {
        kind: "processed_failure",
        occurrenceId,
        generationError: "Occurrence not found.",
      };
    }

    const reconResult = await this.reconcileSplitWriteIfPending(initial);
    if (reconResult) {
      return reconResult;
    }

    if (
      initial.processingState === PROC_COMPLETED &&
      initial.bookingId != null
    ) {
      return {
        kind: "already_completed",
        occurrenceId,
        bookingId: initial.bookingId,
      };
    }

    const statusAllowsWork =
      initial.status === RecurringOccurrenceStatus.pending_generation ||
      initial.status === RecurringOccurrenceStatus.needs_review;
    if (!statusAllowsWork) {
      return {
        kind: "already_completed",
        occurrenceId,
        bookingId: initial.bookingId ?? undefined,
      };
    }

    if (initial.recurringPlan.status !== RecurringPlanStatus.active) {
      return {
        kind: "already_completed",
        occurrenceId,
        bookingId: initial.bookingId ?? undefined,
      };
    }

    const hadPriorFailureBeforeClaim =
      initial.processingState === PROC_FAILED ||
      Boolean(initial.generationError) ||
      initial.status === RecurringOccurrenceStatus.needs_review;

    const processingToken = randomUUID();
    const claim = await this.prisma.recurringOccurrence.updateMany({
      where: {
        id: occurrenceId,
        status: {
          in: [
            RecurringOccurrenceStatus.pending_generation,
            RecurringOccurrenceStatus.needs_review,
          ],
        },
        processingState: { in: [PROC_READY, PROC_FAILED] },
        processingAttempts: { lt: MAX_OCCURRENCE_PROCESSING_ATTEMPTS },
      },
      data: {
        processingState: PROC_PROCESSING,
        processingAttempts: { increment: 1 },
        lastProcessingAt: new Date(),
        processingToken,
      },
    });
    if (claim.count !== 1) {
      this.logger.log(
        `RECURRING_OCCURRENCE_CLAIM_SKIPPED occurrenceId=${occurrenceId} reason=updateMany_count_${claim.count}`,
      );
      return { kind: "already_claimed", occurrenceId };
    }

    const occ = await this.prisma.recurringOccurrence.findFirst({
      where: { id: occurrenceId, processingToken },
      include: { recurringPlan: true },
    });
    if (!occ) {
      this.logger.log(
        `RECURRING_OCCURRENCE_CLAIM_SKIPPED occurrenceId=${occurrenceId} reason=token_re_read_miss`,
      );
      return { kind: "already_claimed", occurrenceId };
    }

    const plan = occ.recurringPlan;
    const customerId = plan.customerId;

    const targetDateIso = occ.targetDate.toISOString();
    const fingerprint = buildOccurrenceBookingFingerprint({
      recurringPlanId: plan.id,
      occurrenceId: occ.id,
      customerId,
      targetDateIso,
      serviceType: plan.serviceType,
    });

    await this.prisma.recurringOccurrence.updateMany({
      where: {
        id: occurrenceId,
        processingToken,
        bookingFingerprint: null,
      },
      data: { bookingFingerprint: fingerprint },
    });

    if (occ.bookingId) {
      const booking = await this.prisma.booking.findFirst({
        where: { id: occ.bookingId, customerId },
      });
      if (booking) {
        const fin = await this.finalizeOccurrenceAfterBookingCreated({
          occurrenceId,
          processingToken,
          plan,
          booking,
          targetDate: occ.targetDate,
          fingerprint: occ.bookingFingerprint ?? fingerprint,
          requireTokenMatch: true,
        });
        if (fin.finalized) {
          if (hadPriorFailureBeforeClaim) {
            this.logger.log(
              `RECURRING_OCCURRENCE_GENERATION_RECOVERED occurrenceId=${occurrenceId} planId=${plan.id} bookingId=${booking.id}`,
            );
          }
          return {
            kind: "already_completed",
            occurrenceId,
            bookingId: booking.id,
          };
        }
        await this.applySplitWriteFinalizeFailure({
          occurrenceId,
          processingToken,
          bookingId: booking.id,
        });
        return {
          kind: "processed_failure",
          occurrenceId,
          generationError: `${BOOKING_FINALIZE_ERROR_PREFIX}${booking.id}`,
        };
      }
    }

    const duplicate = await this.findBookingByFingerprintNote(
      customerId,
      fingerprint,
    );
    if (duplicate) {
      const fin = await this.finalizeOccurrenceAfterBookingCreated({
        occurrenceId,
        processingToken,
        plan,
        booking: duplicate,
        targetDate: occ.targetDate,
        fingerprint,
        requireTokenMatch: true,
      });
      if (fin.finalized) {
        this.logger.log(
          `RECURRING_OCCURRENCE_DUPLICATE_BOOKING_RECONCILED occurrenceId=${occurrenceId} planId=${plan.id} bookingId=${duplicate.id}`,
        );
        if (hadPriorFailureBeforeClaim) {
          this.logger.log(
            `RECURRING_OCCURRENCE_GENERATION_RECOVERED occurrenceId=${occurrenceId} planId=${plan.id} bookingId=${duplicate.id}`,
          );
        } else {
          this.logger.log(
            `RECURRING_OCCURRENCE_GENERATION_SUCCESS occurrenceId=${occurrenceId} planId=${plan.id} bookingId=${duplicate.id}`,
          );
        }
        return {
          kind: "processed_success",
          occurrenceId,
          bookingId: duplicate.id,
        };
      }
      await this.applySplitWriteFinalizeFailure({
        occurrenceId,
        processingToken,
        bookingId: duplicate.id,
      });
      return {
        kind: "processed_failure",
        occurrenceId,
        generationError: `${BOOKING_FINALIZE_ERROR_PREFIX}${duplicate.id}`,
      };
    }

    let estimateInput;
    try {
      estimateInput = mapIntakeFieldsToEstimateInput(
        coerceIntakeFields(plan.intakeSnapshot as Record<string, unknown>),
      );
    } catch (err: unknown) {
      let message: string;
      if (err instanceof IntakeEstimateMappingError) {
        message = err.message;
      } else if (err instanceof BadRequestException) {
        const r = err.getResponse();
        message = typeof r === "string" ? r : err.message;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err ?? "unknown error");
      }
      await this.finishOccurrenceFailure(occurrenceId, message);
      return {
        kind: "processed_failure",
        occurrenceId,
        generationError: message,
      };
    }

    const noteParts = [
      `Recurring plan ${plan.id}`,
      `occurrence=${occ.id}`,
      `seq=${occ.sequenceNumber}`,
      `serviceType=${plan.serviceType}`,
      `cadence=${plan.cadence}`,
    ];
    const baseNote = noteParts.join(" | ");
    const note = formatBookingNoteWithFingerprint(baseNote, fingerprint);

    try {
      const { booking, estimate } = await this.bookings.createBooking({
        customerId,
        estimateInput,
        note,
      });

      if (!booking?.id || !estimate) {
        const msg = !booking?.id
          ? "Booking create returned no booking id."
          : "Estimator did not return a result.";
        await this.finishOccurrenceFailure(occurrenceId, msg);
        return {
          kind: "processed_failure",
          occurrenceId,
          generationError: msg,
        };
      }

      const fin = await this.finalizeOccurrenceAfterBookingCreated({
        occurrenceId,
        processingToken,
        plan,
        booking,
        targetDate: occ.targetDate,
        fingerprint,
        requireTokenMatch: true,
      });
      if (fin.finalized) {
        if (hadPriorFailureBeforeClaim) {
          this.logger.log(
            `RECURRING_OCCURRENCE_GENERATION_RECOVERED occurrenceId=${occurrenceId} planId=${plan.id} bookingId=${booking.id}`,
          );
        } else {
          this.logger.log(
            `RECURRING_OCCURRENCE_GENERATION_SUCCESS occurrenceId=${occurrenceId} planId=${plan.id} bookingId=${booking.id}`,
          );
        }
        return {
          kind: "processed_success",
          occurrenceId,
          bookingId: booking.id,
        };
      }

      await this.applySplitWriteFinalizeFailure({
        occurrenceId,
        processingToken,
        bookingId: booking.id,
      });
      this.logger.error(
        `RECURRING_OCCURRENCE_BOOKING_CREATED_OCCURRENCE_FINALIZE_FAILED occurrenceId=${occurrenceId} bookingId=${booking.id}`,
      );
      return {
        kind: "processed_failure",
        occurrenceId,
        generationError: `${BOOKING_FINALIZE_ERROR_PREFIX}${booking.id}`,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err ?? "unknown error");
      this.logger.warn(
        `RECURRING_OCCURRENCE_GENERATION_ERROR occurrenceId=${occurrenceId} planId=${plan.id} message=${message}`,
      );
      await this.finishOccurrenceFailure(occurrenceId, message);
      return {
        kind: "processed_failure",
        occurrenceId,
        generationError: message,
      };
    }
  }

  async getExhaustedRecurringOccurrences(limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);
    const rows = await this.prisma.recurringOccurrence.findMany({
      where: {
        status: RecurringOccurrenceStatus.needs_review,
        processingState: PROC_FAILED,
        processingAttempts: { gte: MAX_OCCURRENCE_PROCESSING_ATTEMPTS },
      },
      take,
      orderBy: { updatedAt: "desc" },
      include: {
        recurringPlan: {
          include: {
            customer: { select: { id: true, email: true } },
          },
        },
      },
    });
    return rows.map((o) => ({
      occurrenceId: o.id,
      planId: o.recurringPlanId,
      customerId: o.recurringPlan.customerId,
      customerEmail: o.recurringPlan.customer.email,
      processingAttempts: o.processingAttempts,
      status: o.status,
      reconciliationState: o.reconciliationState,
      bookingId: o.bookingId,
      bookingFingerprint: o.bookingFingerprint,
      generationError: o.generationError,
      updatedAt: o.updatedAt.toISOString(),
    }));
  }

  async getRecurringOpsSummary() {
    const [
      pendingGenerationCount,
      processingCount,
      failedRetryableCount,
      exhaustedCount,
      reconciliationDriftCount,
      canceledPlanWithBookedNextCount,
    ] = await Promise.all([
      this.prisma.recurringOccurrence.count({
        where: {
          status: RecurringOccurrenceStatus.pending_generation,
          recurringPlan: { status: RecurringPlanStatus.active },
        },
      }),
      this.prisma.recurringOccurrence.count({
        where: { processingState: PROC_PROCESSING },
      }),
      this.prisma.recurringOccurrence.count({
        where: {
          status: RecurringOccurrenceStatus.needs_review,
          processingState: PROC_FAILED,
          processingAttempts: { lt: MAX_OCCURRENCE_PROCESSING_ATTEMPTS },
        },
      }),
      this.prisma.recurringOccurrence.count({
        where: {
          status: RecurringOccurrenceStatus.needs_review,
          processingState: PROC_FAILED,
          processingAttempts: { gte: MAX_OCCURRENCE_PROCESSING_ATTEMPTS },
        },
      }),
      this.prisma.recurringOccurrence.count({
        where: {
          OR: [
            { reconciliationState: RECON_BOOKING_PENDING },
            { reconciliationState: RECON_MANUAL },
          ],
        },
      }),
      this.prisma.recurringPlan.count({
        where: {
          status: RecurringPlanStatus.canceled,
          occurrences: {
            some: {
              bookingId: { not: null },
            },
          },
        },
      }),
    ]);

    this.logger.log("RECURRING_OPS_SUMMARY_REQUESTED");

    return {
      pendingGenerationCount,
      processingCount,
      failedRetryableCount,
      exhaustedCount,
      reconciliationDriftCount,
      canceledPlanWithBookedNextCount,
    };
  }

  private async reconcileSplitWriteIfPending(
    occ: RecurringOccurrence & { recurringPlan: RecurringPlan },
  ): Promise<ProcessOccurrenceResult | null> {
    if (occ.reconciliationState !== RECON_BOOKING_PENDING || occ.bookingId) {
      return null;
    }
    if (!occ.generationError?.includes(BOOKING_FINALIZE_ERROR_PREFIX)) {
      return null;
    }
    const parsedId = parseBookingIdFromFinalizeError(occ.generationError);
    if (!parsedId) {
      return {
        kind: "processed_failure",
        occurrenceId: occ.id,
        generationError:
          "Invalid reconciliation marker on occurrence (missing booking id).",
      };
    }
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: parsedId,
        customerId: occ.recurringPlan.customerId,
      },
    });
    if (!booking) {
      this.logger.warn(
        `RECURRING_OCCURRENCE_RECONCILE_MISSING_BOOKING occurrenceId=${occ.id} bookingId=${parsedId}`,
      );
      return {
        kind: "processed_failure",
        occurrenceId: occ.id,
        generationError: `RECURRING_RECONCILE_BOOKING_NOT_FOUND:${parsedId}`,
      };
    }

    const targetDateIso = occ.targetDate.toISOString();
    const fingerprint = buildOccurrenceBookingFingerprint({
      recurringPlanId: occ.recurringPlanId,
      occurrenceId: occ.id,
      customerId: occ.recurringPlan.customerId,
      targetDateIso,
      serviceType: occ.recurringPlan.serviceType,
    });

    const fin = await this.finalizeOccurrenceAfterBookingCreated({
      occurrenceId: occ.id,
      processingToken: null,
      plan: occ.recurringPlan,
      booking,
      targetDate: occ.targetDate,
      fingerprint: occ.bookingFingerprint ?? fingerprint,
      requireTokenMatch: false,
    });
    if (!fin.finalized) {
      return {
        kind: "processed_failure",
        occurrenceId: occ.id,
        generationError:
          occ.generationError ??
          "Reconciliation finalize transaction failed; will retry.",
      };
    }
    this.logger.log(
      `RECURRING_OCCURRENCE_RECONCILED_AFTER_PARTIAL_FAILURE occurrenceId=${occ.id} bookingId=${booking.id}`,
    );
    return {
      kind: "processed_success",
      occurrenceId: occ.id,
      bookingId: booking.id,
    };
  }

  private async findBookingByFingerprintNote(
    customerId: string,
    fingerprint: string,
  ): Promise<Booking | null> {
    const needle = `${BOOKING_NOTE_FINGERPRINT_KEY}=${fingerprint}`;
    return this.prisma.booking.findFirst({
      where: { customerId, notes: { contains: needle } },
    });
  }

  private async finalizeOccurrenceAfterBookingCreated(params: {
    occurrenceId: string;
    processingToken: string | null;
    plan: RecurringPlan;
    booking: Pick<Booking, "id" | "status" | "scheduledStart" | "customerId">;
    targetDate: Date;
    fingerprint: string;
    requireTokenMatch: boolean;
  }): Promise<{ finalized: boolean }> {
    const {
      occurrenceId,
      processingToken,
      plan,
      booking,
      targetDate,
      fingerprint,
      requireTokenMatch,
    } = params;

    if (booking.customerId !== plan.customerId) {
      this.logger.warn(
        `RECURRING_OCCURRENCE_FINALIZE_CUSTOMER_MISMATCH occurrenceId=${occurrenceId} bookingId=${booking.id}`,
      );
      return { finalized: false };
    }

    const hasScheduledSlot = booking.scheduledStart != null;
    const occStatus = hasScheduledSlot
      ? RecurringOccurrenceStatus.scheduled
      : RecurringOccurrenceStatus.booking_created;

    try {
      await this.prisma.$transaction(async (tx) => {
        const occWhere: Prisma.RecurringOccurrenceWhereInput = { id: occurrenceId };
        if (requireTokenMatch) {
          if (!processingToken) {
            throw new Error("MISSING_PROCESSING_TOKEN");
          }
          Object.assign(occWhere, { processingToken });
        } else {
          Object.assign(occWhere, {
            reconciliationState: RECON_BOOKING_PENDING,
            bookingId: null,
          });
        }

        const occUpdated = await tx.recurringOccurrence.updateMany({
          where: occWhere,
          data: {
            bookingId: booking.id,
            status: occStatus,
            generationError: null,
            processingState: PROC_COMPLETED,
            reconciliationState: RECON_CLEAN,
            processingToken: null,
            bookingCreatedAt: new Date(),
            bookingFingerprint: fingerprint,
            bookingSnapshot: {
              bookingId: booking.id,
              status: booking.status,
              scheduledStart: booking.scheduledStart,
            } as object,
          },
        });
        if (occUpdated.count !== 1) {
          throw new Error("OCCURRENCE_FINALIZE_CONFLICT");
        }

        if (plan.status === RecurringPlanStatus.active) {
          await tx.recurringPlan.update({
            where: { id: plan.id },
            data: {
              // createdFromBookingId is the first successfully generated booking for this recurring plan.
              createdFromBookingId: plan.createdFromBookingId ?? booking.id,
              lastGeneratedAt: new Date(),
              nextAnchorAt: computeNextOccurrenceDate(
                targetDate,
                cadencePrismaToLiteral(plan.cadence),
              ),
            },
          });
        }
      });
      return { finalized: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `RECURRING_OCCURRENCE_FINALIZE_TX_ERROR occurrenceId=${occurrenceId} bookingId=${booking.id} message=${msg}`,
      );
      return { finalized: false };
    }
  }

  private async applySplitWriteFinalizeFailure(params: {
    occurrenceId: string;
    processingToken: string;
    bookingId: string;
  }): Promise<void> {
    const err = `${BOOKING_FINALIZE_ERROR_PREFIX}${params.bookingId}`;
    const updated = await this.prisma.recurringOccurrence.updateMany({
      where: {
        id: params.occurrenceId,
        processingToken: params.processingToken,
      },
      data: {
        processingState: PROC_FAILED,
        reconciliationState: RECON_BOOKING_PENDING,
        generationError: err,
        processingToken: null,
      },
    });
    if (updated.count !== 1) {
      this.logger.warn(
        `RECURRING_OCCURRENCE_SPLIT_WRITE_FALLBACK_PARTIAL occurrenceId=${params.occurrenceId} bookingId=${params.bookingId} updated=${updated.count}`,
      );
    }
  }

  async updateRecurringPlanForCustomer(
    planId: string,
    customerId: string,
    dto: UpdateRecurringPlanDto,
  ): Promise<{
    ok: true;
    item: Record<string, unknown>;
  } & RecurringPlanLifecycleResponseMeta> {
    let plan = await this.assertPlanOwnedByCustomer(planId, customerId);

    const hasScalarPatch =
      dto.cadence !== undefined ||
      dto.preferredTimeWindow !== undefined ||
      dto.preferredFoId !== undefined ||
      dto.bookingNotes !== undefined;

    if (dto.action === undefined && !hasScalarPatch) {
      throw new BadRequestException("Provide at least one field to update.");
    }

    let downstreamBookingEffect: "not_attempted" | "unsupported" | "applied" =
      "not_attempted";
    let downstreamBookingEffectReason: string | undefined;
    let nextOccurrenceDisposition: NextOccurrenceDisposition = "unchanged";

    if (dto.action === "pause") {
      if (plan.status !== RecurringPlanStatus.active) {
        throw new BadRequestException("Only an active plan can be paused.");
      }
      await this.prisma.recurringPlan.update({
        where: { id: plan.id },
        data: {
          status: RecurringPlanStatus.paused,
          pausedAt: new Date(),
        },
      });
      plan = await this.prisma.recurringPlan.findUniqueOrThrow({
        where: { id: plan.id },
      });
      nextOccurrenceDisposition = "unchanged";
    } else if (dto.action === "resume") {
      if (plan.status !== RecurringPlanStatus.paused) {
        throw new BadRequestException("Only a paused plan can be resumed.");
      }
      await this.prisma.recurringPlan.update({
        where: { id: plan.id },
        data: { status: RecurringPlanStatus.active },
      });
      plan = await this.prisma.recurringPlan.findUniqueOrThrow({
        where: { id: plan.id },
      });
      nextOccurrenceDisposition = "unchanged";
    } else if (dto.action === "cancel") {
      if (
        plan.status !== RecurringPlanStatus.active &&
        plan.status !== RecurringPlanStatus.paused
      ) {
        throw new BadRequestException("This plan is already canceled.");
      }
      const next = await this.findNextMutableOccurrence(planId);
      nextOccurrenceDisposition = "unchanged";
      if (next) {
        if (
          next.status === RecurringOccurrenceStatus.pending_generation ||
          next.status === RecurringOccurrenceStatus.needs_review
        ) {
          await this.prisma.recurringOccurrence.update({
            where: { id: next.id },
            data: { status: RecurringOccurrenceStatus.canceled },
          });
          downstreamBookingEffect = "not_attempted";
          nextOccurrenceDisposition = "canceled";
          this.logger.log(
            `RECURRING_PLAN_CANCEL_UNBOOKED_OCCURRENCE planId=${planId} occurrenceId=${next.id} status=${next.status}`,
          );
        } else if (
          next.status === RecurringOccurrenceStatus.booking_created ||
          next.status === RecurringOccurrenceStatus.scheduled
        ) {
          if (!next.bookingId) {
            this.logger.warn(
              `RECURRING_PLAN_CANCEL_LINKED_BOOKING_INVARIANT planId=${planId} occurrenceId=${next.id} status=${next.status} missingBookingId=true`,
            );
            downstreamBookingEffect = "not_attempted";
            downstreamBookingEffectReason =
              "linked_booking_exists_but_no_safe_cancellation_path";
            nextOccurrenceDisposition = "booking_retained";
          } else {
            const cancelResult = await this.tryCancelLinkedBookingForCustomer({
              customerId,
              planId,
              occurrence: next,
            });
            if (cancelResult.ok) {
              downstreamBookingEffect = "applied";
              await this.prisma.recurringOccurrence.update({
                where: { id: next.id },
                data: { status: RecurringOccurrenceStatus.canceled },
              });
              nextOccurrenceDisposition = "canceled";
            } else {
              downstreamBookingEffect = "unsupported";
              downstreamBookingEffectReason = cancelResult.reason;
              nextOccurrenceDisposition = "booking_retained";
              this.logger.warn(
                `RECURRING_PLAN_CANCEL_LINKED_BOOKING_NOT_CLEARED planId=${planId} occurrenceId=${next.id} bookingId=${next.bookingId} reason=${cancelResult.reason}`,
              );
            }
          }
        }
      }
      await this.prisma.recurringPlan.update({
        where: { id: plan.id },
        data: {
          status: RecurringPlanStatus.canceled,
          canceledAt: new Date(),
        },
      });
      plan = await this.prisma.recurringPlan.findUniqueOrThrow({
        where: { id: plan.id },
      });
    }

    if (plan.status === RecurringPlanStatus.canceled) {
      return {
        ok: true,
        item: this.serializePlan(plan),
        downstreamBookingEffect,
        ...(downstreamBookingEffectReason
          ? { downstreamBookingEffectReason }
          : {}),
        nextOccurrenceDisposition,
      };
    }

    const data: Prisma.RecurringPlanUpdateInput = {};
    if (dto.cadence !== undefined) {
      data.cadence = cadenceUpdateStringToPrisma(dto.cadence);
    }
    if (dto.preferredTimeWindow !== undefined) {
      const v = dto.preferredTimeWindow.trim();
      data.preferredTimeWindow = v.length > 0 ? v : null;
    }
    if (dto.preferredFoId !== undefined) {
      const v = dto.preferredFoId.trim();
      data.preferredFoId = v.length > 0 ? v : null;
    }
    if (dto.bookingNotes !== undefined) {
      const v = dto.bookingNotes.trim();
      data.bookingNotes = v.length > 0 ? v : null;
    }

    if (Object.keys(data).length > 0) {
      plan = await this.prisma.recurringPlan.update({
        where: { id: plan.id },
        data,
      });
    }

    return {
      ok: true,
      item: this.serializePlan(plan),
      downstreamBookingEffect,
      ...(downstreamBookingEffectReason
        ? { downstreamBookingEffectReason }
        : {}),
      nextOccurrenceDisposition,
    };
  }

  async listPlansForCustomer(customerId: string) {
    const plans = await this.prisma.recurringPlan.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: {
        occurrences: {
          orderBy: { sequenceNumber: "desc" },
          take: 1,
        },
      },
    });
    const planIds = plans.map((p) => p.id);
    const reconRows =
      planIds.length === 0
        ? []
        : await this.prisma.recurringOccurrence.findMany({
            where: { recurringPlanId: { in: planIds } },
            select: {
              id: true,
              recurringPlanId: true,
              status: true,
              bookingId: true,
              targetDate: true,
            },
            take: 500,
          });
    const byPlan = new Map<
      string,
      Array<{
        id: string;
        status: RecurringOccurrenceStatus;
        bookingId: string | null;
        targetDate: Date;
      }>
    >();
    for (const row of reconRows) {
      const list = byPlan.get(row.recurringPlanId) ?? [];
      list.push({
        id: row.id,
        status: row.status,
        bookingId: row.bookingId,
        targetDate: row.targetDate,
      });
      byPlan.set(row.recurringPlanId, list);
    }

    return plans.map((p) => {
      const occs = byPlan.get(p.id) ?? [];
      const reconciliation = this.computePlanReconciliation(p, occs);
      return {
        id: p.id,
        status: p.status,
        cadence: p.cadence,
        serviceType: p.serviceType,
        nextAnchorAt: p.nextAnchorAt.toISOString(),
        lastGeneratedAt: p.lastGeneratedAt?.toISOString() ?? null,
        latestOccurrence: p.occurrences[0]
          ? {
              id: p.occurrences[0].id,
              sequenceNumber: p.occurrences[0].sequenceNumber,
              status: p.occurrences[0].status,
              targetDate: p.occurrences[0].targetDate.toISOString(),
              bookingId: p.occurrences[0].bookingId,
            }
          : null,
        ...reconciliation,
      };
    });
  }

  async createRecurringPlan(
    customerId: string,
    dto: CreateRecurringPlanDto,
  ): Promise<{
    recurringPlan: Record<string, unknown>;
    firstOccurrence: Record<string, unknown>;
    firstOccurrenceGenerationResult: OccurrenceGenerationResult;
  }> {
    this.assertServiceEligibleForRecurring(dto.serviceType);

    const nextAnchorAt = new Date(dto.nextAnchorAt);
    if (Number.isNaN(nextAnchorAt.getTime())) {
      throw new BadRequestException("nextAnchorAt must be a valid date.");
    }

    try {
      mapIntakeFieldsToEstimateInput(
        coerceIntakeFields(dto.intakeSnapshot as Record<string, unknown>),
      );
    } catch (err: unknown) {
      if (err instanceof IntakeEstimateMappingError) {
        throw new BadRequestException({
          code: err.code,
          message: err.message,
        });
      }
      throw err;
    }

    const cadencePrisma = mapCadenceDtoToPrisma(dto.cadence);
    const addonIds = Array.isArray(dto.defaultAddonIds)
      ? dto.defaultAddonIds.map((x) => String(x))
      : [];

    const plan = await this.prisma.recurringPlan.create({
      data: {
        customerId,
        status: RecurringPlanStatus.active,
        cadence: cadencePrisma,
        serviceType: dto.serviceType.trim(),
        preferredTimeWindow: dto.preferredTimeWindow?.trim() || null,
        preferredFoId: dto.preferredFoId?.trim() || null,
        bookingNotes: dto.bookingNotes?.trim() || null,
        estimateSnapshot: dto.estimateSnapshot as object,
        pricingSnapshot: dto.pricingSnapshot as object,
        intakeSnapshot: dto.intakeSnapshot as object,
        defaultAddonIds: addonIds as unknown as object,
        addressSnapshot: dto.addressSnapshot as object,
        nextAnchorAt,
        createdFromBookingId: null,
      },
    });

    const occurrence = await this.prisma.recurringOccurrence.create({
      data: {
        recurringPlanId: plan.id,
        sequenceNumber: 1,
        targetDate: nextAnchorAt,
        status: RecurringOccurrenceStatus.pending_generation,
        processingState: PROC_READY,
        processingAttempts: 0,
      },
    });

    const generation: OccurrenceGenerationResult = {
      occurrenceId: occurrence.id,
      status: "pending_generation",
    };

    this.logger.log(
      `RECURRING_PLAN_CREATED_ASYNC_DEFERRED planId=${plan.id} occurrenceId=${occurrence.id} customerId=${customerId}`,
    );

    const refreshedPlan = await this.prisma.recurringPlan.findUniqueOrThrow({
      where: { id: plan.id },
    });
    const refreshedOcc = await this.prisma.recurringOccurrence.findUniqueOrThrow(
      { where: { id: occurrence.id } },
    );

    return {
      recurringPlan: this.serializePlan(refreshedPlan),
      firstOccurrence: this.serializeOccurrence(refreshedOcc),
      firstOccurrenceGenerationResult: generation,
    };
  }

  private serializePlan(p: {
    id: string;
    customerId: string;
    status: RecurringPlanStatus;
    cadence: RecurringCadence;
    serviceType: string;
    preferredTimeWindow: string | null;
    preferredFoId: string | null;
    bookingNotes: string | null;
    estimateSnapshot: unknown;
    pricingSnapshot: unknown;
    intakeSnapshot: unknown;
    defaultAddonIds: unknown;
    addressSnapshot: unknown;
    createdFromBookingId: string | null;
    nextAnchorAt: Date;
    lastGeneratedAt: Date | null;
    canceledAt: Date | null;
    pausedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: p.id,
      customerId: p.customerId,
      status: p.status,
      cadence: p.cadence,
      serviceType: p.serviceType,
      preferredTimeWindow: p.preferredTimeWindow,
      preferredFoId: p.preferredFoId,
      bookingNotes: p.bookingNotes,
      estimateSnapshot: p.estimateSnapshot,
      pricingSnapshot: p.pricingSnapshot,
      intakeSnapshot: p.intakeSnapshot,
      defaultAddonIds: p.defaultAddonIds,
      addressSnapshot: p.addressSnapshot,
      createdFromBookingId: p.createdFromBookingId,
      nextAnchorAt: p.nextAnchorAt.toISOString(),
      lastGeneratedAt: p.lastGeneratedAt?.toISOString() ?? null,
      canceledAt: p.canceledAt?.toISOString() ?? null,
      pausedAt: p.pausedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private serializeOccurrence(o: RecurringOccurrence) {
    return {
      id: o.id,
      recurringPlanId: o.recurringPlanId,
      sequenceNumber: o.sequenceNumber,
      targetDate: o.targetDate.toISOString(),
      status: o.status,
      bookingId: o.bookingId,
      generationError: o.generationError,
      processingState: o.processingState,
      processingAttempts: o.processingAttempts,
      lastProcessingAt: o.lastProcessingAt?.toISOString() ?? null,
      bookingFingerprint: o.bookingFingerprint,
      bookingCreatedAt: o.bookingCreatedAt?.toISOString() ?? null,
      reconciliationState: o.reconciliationState,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    };
  }

  private serializeOccurrenceFull(o: RecurringOccurrence) {
    return {
      ...this.serializeOccurrence(o),
      overrideAddonIds: o.overrideAddonIds,
      overrideInstructions: o.overrideInstructions,
      overridePreferredFoId: o.overridePreferredFoId,
      bookingSnapshot: o.bookingSnapshot,
    };
  }
}
