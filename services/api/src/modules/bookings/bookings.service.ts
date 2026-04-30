import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  Booking,
  BookingEventType,
  BookingPaymentStatus,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { BookingEventsService } from "./booking-events.service";
import { getTransition, Transition } from "./booking-state.machine";
import { FoService } from "../fo/fo.service";
import type { BookingMatchMode } from "../fo/service-matching-policy";
import {
  EstimatorService,
  EstimateInput,
  EstimateResult,
} from "../estimate/estimator.service";
import { EstimateEngineV2Service } from "../estimate/estimate-engine-v2.service";
import type { EstimateV2Reconciliation } from "../estimate/estimate-engine-v2.types";
import { EstimateLearningService } from "../estimate/estimate-learning.service";
import { LedgerService } from "../ledger/ledger.service";
import { DispatchService } from "../dispatch/dispatch.service";
import { ReputationService } from "../dispatch/reputation.service";
import { BookingPaymentService } from "./payment/payment.service";
import { SlotHoldMetrics } from "../slot-holds/slot-holds.metrics";
import {
  CLEANING_PRICING_POLICY_V1,
  PLATFORM_FEE_POLICY_V1,
} from "../pricing/pricing-policy";
import { splitCharge } from "../billing/pricing.policy";
import type { ListBookingsDto } from "./dto/list-bookings.dto";
import type { BookingMainTransitionDto } from "./dto/booking-main-transition.dto";
import { CreateBookingCheckoutDto } from "./dto/create-booking-checkout.dto";
import { UpdateBookingPaymentStatusDto } from "./dto/update-booking-payment-status.dto";
import type { UpdateBookingPatchDto } from "./dto/update-booking-patch.dto";
import { resolveTransitionName } from "./booking-status-flow";
import {
  isAssignedState,
  isInvalidAssignmentState,
} from "./utils/assignment-state.util";
import { assertConfirmHoldSlotDuration } from "./confirm-hold-slot-duration";
import { resolveBookingCalendarEndMs } from "./booking-scheduling-calendar-end";
import { BookingCancellationPaymentInvariantService } from "./payment-lifecycle/booking-cancellation-payment-invariant.service";
import { RemainingBalanceCaptureService } from "./payment-lifecycle/remaining-balance-capture.service";
import { requireReadTenantId, requireTenantId } from "../tenant/tenant.enforcement";

@Injectable()
export class BookingsService {
  private readonly log = new Logger(BookingsService.name);

  constructor(
    private readonly db: PrismaService,
    private readonly events: BookingEventsService,
    private readonly fo: FoService,
    private readonly estimator: EstimatorService,
    private readonly estimateEngineV2: EstimateEngineV2Service,
    private readonly estimateLearning: EstimateLearningService,
    private readonly ledger: LedgerService,
    @Inject(forwardRef(() => DispatchService))
    private readonly dispatch: DispatchService,
    private readonly reputationService: ReputationService,
    private readonly bookingPaymentService: BookingPaymentService,
    private readonly remainingBalanceCapture: RemainingBalanceCaptureService,
    private readonly cancellationPaymentInvariant: BookingCancellationPaymentInvariantService,
  ) {}

  /**
   * Reusable cancellation **financial** invariant: refund vs retained fee after status is canceled.
   * Default: log and swallow Stripe/DB outcome errors. `strict: true` surfaces failures after logging.
   */
  async enforceCancellationPaymentInvariantForBooking(
    bookingId: string,
    options?: { strict?: boolean; reason?: string },
  ): Promise<void> {
    await this.cancellationPaymentInvariant.enforceCancellationPaymentInvariantForBooking(
      bookingId,
      options,
    );
  }

  async createBooking(input: {
    customerId: string;
    tenantId: string;
    note?: string;
    idempotencyKey?: string | null;
    estimateInput?: EstimateInput;
    /** Optional public funnel preference only; does not assign `foId`. */
    preferredFoId?: string | null;
    /** Forwarded to `EstimatorService` → `matchFOs` allow-list policy. */
    bookingMatchMode?: BookingMatchMode;
  }): Promise<{
    booking: any;
    estimate?: EstimateResult;
  }> {
    const tenantId = requireTenantId(input.tenantId, "BookingsService.createBooking");

    const { bookingId, estimate, reconciliation } = await this.db.$transaction(async (tx: any) => {
      const siteLat =
        typeof input.estimateInput?.siteLat === "number" &&
        Number.isFinite(input.estimateInput.siteLat)
          ? input.estimateInput.siteLat
          : null;

      const siteLng =
        typeof input.estimateInput?.siteLng === "number" &&
        Number.isFinite(input.estimateInput.siteLng)
          ? input.estimateInput.siteLng
          : null;

      const preferredFoId =
        typeof input.preferredFoId === "string" && input.preferredFoId.trim()
          ? input.preferredFoId.trim()
          : null;

      const booking = await tx.booking.create({
        data: {
          status: BookingStatus.pending_payment,
          hourlyRateCents: 0,
          estimatedHours: 0,
          currency: "usd",
          tenantId,
          customer: { connect: { id: input.customerId } },
          notes: input.note ?? null,
          siteLat,
          siteLng,
          preferredFoId,
        },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: BookingEventType.CREATED,
          fromStatus: null,
          toStatus: booking.status,
          note: input.note ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
        },
      });

      let est: EstimateResult | undefined;
      let reconciliation: EstimateV2Reconciliation | undefined;

      if (input.estimateInput) {
        est = await this.estimator.estimate(input.estimateInput, {
          bookingMatchMode: input.bookingMatchMode,
        });
        const estimateV2 = this.estimateEngineV2.estimateV2(input.estimateInput);
        reconciliation = this.estimateEngineV2.calculateReconciliation({
          v1Minutes: est.estimatedDurationMinutes,
          v1PriceCents: est.estimatedPriceCents,
          v2ExpectedMinutes: estimateV2.expectedMinutes,
          v2PricedMinutes: estimateV2.pricedMinutes,
          v2PriceCents: estimateV2.customerVisible.estimatedPrice ?? 0,
        });
        const outputJson = JSON.stringify({
          ...est,
          estimateVersion: estimateV2.snapshotVersion,
          estimateV2,
          reconciliation,
          legacy: {
            durationMinutes: est.estimatedDurationMinutes,
            priceCents: est.estimatedPriceCents,
            confidence: est.confidence,
          },
          rawNormalizedIntake: input.estimateInput,
        });

        await tx.bookingEstimateSnapshot.create({
          data: {
            bookingId: booking.id,
            estimatorVersion: est.estimatorVersion,
            mode: est.mode,
            confidence: est.confidence,
            riskPercentUncapped: est.riskPercentUncapped,
            riskPercentCappedForRange: est.riskPercentCappedForRange,
            riskCapped: est.riskCapped,
            inputJson: JSON.stringify(input.estimateInput),
            outputJson,
            deepCleanEstimatorConfigId: est.deepCleanEstimatorConfigId ?? null,
            deepCleanEstimatorConfigVersion: est.deepCleanEstimatorConfigVersion ?? null,
            deepCleanEstimatorConfigLabel: est.deepCleanEstimatorConfigLabel ?? null,
          },
        });

        if (est.deepCleanProgram) {
          await tx.bookingDeepCleanProgram.create({
            data: {
              bookingId: booking.id,
              programType: est.deepCleanProgram.programType,
              visitCount: est.deepCleanProgram.visitCount,
              visitsJson: JSON.stringify(est.deepCleanProgram.visits),
            },
          });
        }

        const estimatedHours =
          Math.round((est.estimateMinutes / 60) * 100) / 100;

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            estimatedHours,
          },
        });
      }

      return {
        bookingId: booking.id,
        estimate: est,
        reconciliation,
      };
    });

    if (input.estimateInput && estimate) {
      // Customer quote = estimator labor total at canonical hourly rate (estimatedPriceCents).
      // Platform fee (margin) is the platform share of that same total via splitCharge — not an add-on tax line.
      const quoteCents = Math.max(0, Math.floor(estimate.estimatedPriceCents));
      const { platformFeeCents } = splitCharge(quoteCents, PLATFORM_FEE_POLICY_V1);
      const subtotalDollars = quoteCents / 100;
      const marginDollars = platformFeeCents / 100;
      const totalDollars = subtotalDollars;

      await this.db.booking.update({
        where: { id: bookingId },
        data: {
          hourlyRateCents: CLEANING_PRICING_POLICY_V1.hourlyRateCents,
          priceSubtotal: subtotalDollars,
          priceTotal: totalDollars,
          margin: marginDollars,
          paymentStatus: BookingPaymentStatus.payment_pending,
          quotedSubtotal: new Prisma.Decimal(subtotalDollars.toFixed(2)),
          quotedMargin: new Prisma.Decimal(marginDollars.toFixed(2)),
          quotedTotal: new Prisma.Decimal(totalDollars.toFixed(2)),
        },
      });
    }

    await this.recordEstimateV2LargeDeltaAnomalyIfNeeded(
      bookingId,
      reconciliation,
    );

    const refreshed = await this.db.booking.findUnique({
      where: { id: bookingId },
    });

    return { booking: refreshed, estimate };
  }

  private async recordEstimateV2LargeDeltaAnomalyIfNeeded(
    bookingId: string,
    reconciliation: EstimateV2Reconciliation | undefined,
  ): Promise<void> {
    if (!reconciliation) return;
    if (
      Math.abs(reconciliation.expectedDeltaPercent) <= 0.4 &&
      Math.abs(reconciliation.priceDeltaPercent) <= 0.25
    ) {
      return;
    }
    const paymentAnomaly = (this.db as unknown as {
      paymentAnomaly?: {
        create?: (args: unknown) => Promise<unknown>;
      };
    }).paymentAnomaly;
    if (!paymentAnomaly?.create) return;
    try {
      await paymentAnomaly.create({
        data: {
          bookingId,
          kind: "estimate_v2_large_delta",
          severity: "warning",
          status: "open",
          message: "Estimate Engine v2 shadow output diverged from legacy estimate.",
          details: {
            bookingId,
            v1Minutes: reconciliation.v1Minutes,
            v1PriceCents: reconciliation.v1PriceCents,
            v2ExpectedMinutes: reconciliation.v2ExpectedMinutes,
            v2PricedMinutes: reconciliation.v2PricedMinutes,
            v2PriceCents: reconciliation.v2PriceCents,
            expectedDeltaMinutes: reconciliation.expectedDeltaMinutes,
            expectedDeltaPercent: reconciliation.expectedDeltaPercent,
            priceDeltaCents: reconciliation.priceDeltaCents,
            priceDeltaPercent: reconciliation.priceDeltaPercent,
            classification: reconciliation.classification,
            flags: reconciliation.flags,
            at: new Date().toISOString(),
          } satisfies Prisma.InputJsonObject,
        },
      });
    } catch (err: unknown) {
      this.log.warn({
        kind: "estimate_v2_large_delta",
        event: "anomaly_record_failed",
        bookingId,
        message: err instanceof Error ? err.message : String(err ?? "unknown"),
      });
    }
  }

  async getBooking(id: string) {
    const booking = await this.db.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");
    return booking;
  }

  async getBookingForTenant(id: string, tenantId: string): Promise<Booking | null> {
    const scopedTenantId = requireReadTenantId(
      tenantId,
      "BookingsService.getBookingForTenant",
    );

    return this.db.booking.findFirst({
      where: {
        id,
        tenantId: scopedTenantId,
      },
    });
  }

  private readEstimatedDurationMinutesFromSnapshot(
    snapshot: { outputJson?: string | null } | null | undefined,
  ): number | null {
    const text = snapshot?.outputJson?.trim();
    if (!text) return null;
    try {
      const output = JSON.parse(text) as Record<string, unknown>;
      const value = output.estimatedDurationMinutes;
      return typeof value === "number" && Number.isFinite(value) && value > 0
        ? Math.floor(value)
        : null;
    } catch {
      return null;
    }
  }

  async completeBookingControlledByAdmin(args: {
    bookingId: string;
    actualMinutes: number;
    confirmControlledCompletion: boolean;
    note?: string | null;
  }) {
    const actualMinutes = Math.floor(args.actualMinutes);
    if (!args.bookingId?.trim()) {
      throw new BadRequestException("bookingId is required");
    }
    if (args.confirmControlledCompletion !== true) {
      throw new BadRequestException("confirmControlledCompletion must be true");
    }
    if (
      !Number.isFinite(actualMinutes) ||
      actualMinutes <= 0 ||
      actualMinutes > 24 * 60
    ) {
      throw new BadRequestException("actualMinutes must be between 1 and 1440");
    }

    const booking = await this.db.booking.findUnique({
      where: { id: args.bookingId },
      include: {
        estimateSnapshot: { select: { outputJson: true } },
      },
    });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");
    if (booking.status === BookingStatus.completed) {
      throw new ConflictException("BOOKING_ALREADY_COMPLETED");
    }
    if (!booking.estimateSnapshot?.outputJson?.trim()) {
      throw new BadRequestException("BOOKING_ESTIMATE_SNAPSHOT_REQUIRED");
    }
    if (
      booking.status !== BookingStatus.assigned &&
      booking.status !== BookingStatus.in_progress
    ) {
      throw new ConflictException("BOOKING_CONTROLLED_COMPLETION_STATE_INVALID");
    }

    const beforeStatus = booking.status;
    const estimatedDurationMinutes = this.readEstimatedDurationMinutesFromSnapshot(
      booking.estimateSnapshot,
    );
    const learningIdempotencyKey = `estimate-learning-result:${booking.id}`;
    const existingLearning = await this.db.bookingEvent.findFirst({
      where: {
        bookingId: booking.id,
        idempotencyKey: learningIdempotencyKey,
      },
      select: { id: true },
    });

    const note = args.note?.trim() || "CONTROLLED_LEARNING_VALIDATION";
    if (booking.status === BookingStatus.assigned) {
      await this.transitionBooking({
        id: booking.id,
        transition: "start",
        note,
        idempotencyKey: `controlled-completion-start:${booking.id}`,
      });
    }

    const completed = await this.transitionBooking({
      id: booking.id,
      transition: "complete",
      note,
      actualMinutes,
      idempotencyKey: `controlled-completion-complete:${booking.id}`,
    });

    const learningEvent = await this.db.bookingEvent.findFirst({
      where: {
        bookingId: booking.id,
        idempotencyKey: learningIdempotencyKey,
      },
      select: { id: true },
    });

    return {
      bookingId: booking.id,
      beforeStatus,
      afterStatus: completed.status,
      estimatedDurationMinutes,
      actualMinutes,
      learningReady:
        completed.status === BookingStatus.completed &&
        actualMinutes > 0 &&
        Boolean(booking.estimateSnapshot?.outputJson?.trim()),
      learningEventCreated: Boolean(learningEvent && !existingLearning),
    };
  }

  /**
   * Single transactional write for assignment-related booking rows + one audit event.
   * Idempotent via @@unique([bookingId, idempotencyKey]) on BookingEvent.
   */
  async applyAssignmentTransition(args: {
    bookingId: string;
    toStatus: BookingStatus;
    foId: string | null;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
    note?: string | null;
    updateWhere?: Prisma.BookingWhereInput;
    optimisticFailure?: "default" | "booking_not_offered";
    onOptimisticWriteMiss?: () => void;
  }): Promise<Booking> {
    const r = await this.db.$transaction(async (tx) =>
      this.applyAssignmentTransitionInTx(tx, args),
    );
    return r.booking;
  }

  async applyAssignmentTransitionInTx(
    tx: Prisma.TransactionClient,
    args: {
      bookingId: string;
      toStatus: BookingStatus;
      foId: string | null;
      idempotencyKey: string;
      metadata?: Record<string, unknown>;
      note?: string | null;
      updateWhere?: Prisma.BookingWhereInput;
      optimisticFailure?: "default" | "booking_not_offered";
      onOptimisticWriteMiss?: () => void;
    },
  ): Promise<{ booking: Booking; bookingRowUpdated: boolean }> {
    const idem = String(args.idempotencyKey ?? "").trim();
    if (!idem) {
      throw new BadRequestException("idempotencyKey is required");
    }

    const existing = await tx.bookingEvent.findUnique({
      where: {
        bookingId_idempotencyKey: {
          bookingId: args.bookingId,
          idempotencyKey: idem,
        },
      },
    });
    if (existing) {
      const row = await tx.booking.findUnique({ where: { id: args.bookingId } });
      if (!row) throw new NotFoundException("BOOKING_NOT_FOUND");
      return { booking: row, bookingRowUpdated: false };
    }

    const before = await tx.booking.findUnique({
      where: { id: args.bookingId },
    });
    if (!before) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    let bookingRowUpdated = false;
    if (args.updateWhere) {
      const where: Prisma.BookingWhereInput = {
        AND: [{ id: args.bookingId }, args.updateWhere],
      };
      const { count } = await tx.booking.updateMany({
        where,
        data: {
          status: args.toStatus,
          foId: args.foId,
          ...(args.toStatus === BookingStatus.accepted
            ? { acceptedAt: new Date() }
            : {}),
        },
      });
      if (count === 1) {
        bookingRowUpdated = true;
      } else {
        const refetched = await tx.booking.findUnique({
          where: { id: args.bookingId },
        });
        if (!refetched) throw new NotFoundException("BOOKING_NOT_FOUND");
        if (
          refetched.status === args.toStatus &&
          this.sameFo(refetched.foId, args.foId)
        ) {
          await this.insertAssignmentBookingEvent(tx, {
            bookingId: args.bookingId,
            fromStatus: before.status,
            toStatus: args.toStatus,
            foId: args.foId,
            idempotencyKey: idem,
            metadata: args.metadata,
            note: args.note ?? null,
          });
          return { booking: refetched, bookingRowUpdated: false };
        }
        args.onOptimisticWriteMiss?.();
        if (args.optimisticFailure === "booking_not_offered") {
          throw new ConflictException("BOOKING_NOT_OFFERED");
        }
        throw new ConflictException({
          code: "CONFLICT",
          message: "Booking was modified by another request",
        });
      }
    } else {
      await tx.booking.update({
        where: { id: args.bookingId },
        data: {
          status: args.toStatus,
          foId: args.foId,
          ...(args.toStatus === BookingStatus.accepted
            ? { acceptedAt: new Date() }
            : {}),
        },
      });
      bookingRowUpdated = true;
    }

    if (bookingRowUpdated) {
      await this.insertAssignmentBookingEvent(tx, {
        bookingId: args.bookingId,
        fromStatus: before.status,
        toStatus: args.toStatus,
        foId: args.foId,
        idempotencyKey: idem,
        metadata: args.metadata,
        note: args.note ?? null,
      });
    }

    const out = await tx.booking.findUnique({ where: { id: args.bookingId } });
    if (!out) throw new NotFoundException("BOOKING_NOT_FOUND");
    return { booking: out, bookingRowUpdated };
  }

  private sameFo(a: string | null, b: string | null): boolean {
    return String(a ?? "") === String(b ?? "");
  }

  private async insertAssignmentBookingEvent(
    tx: Prisma.TransactionClient,
    args: {
      bookingId: string;
      fromStatus: BookingStatus;
      toStatus: BookingStatus;
      foId: string | null;
      idempotencyKey: string;
      metadata?: Record<string, unknown>;
      note: string | null;
    },
  ): Promise<void> {
    const eventType =
      args.toStatus === BookingStatus.assigned && args.foId
        ? BookingEventType.BOOKING_ASSIGNED
        : BookingEventType.STATUS_CHANGED;

    const payload: Prisma.InputJsonValue = {
      foId: args.foId,
      ...(args.metadata ?? {}),
      ...(args.note ? { note: args.note } : {}),
    };

    await tx.bookingEvent.upsert({
      where: {
        bookingId_idempotencyKey: {
          bookingId: args.bookingId,
          idempotencyKey: args.idempotencyKey,
        },
      },
      create: {
        bookingId: args.bookingId,
        type: eventType,
        fromStatus: args.fromStatus,
        toStatus: args.toStatus,
        idempotencyKey: args.idempotencyKey,
        note: args.note,
        payload,
      },
      update: {
        note: args.note,
        payload,
      },
    });
  }

  async createCheckout(id: string, dto: CreateBookingCheckoutDto) {
    const booking = await this.getBooking(id);
    return this.bookingPaymentService.createCheckout(booking, dto);
  }

  async updatePaymentStatus(id: string, dto: UpdateBookingPaymentStatusDto) {
    const booking = await this.getBooking(id);
    return this.bookingPaymentService.updatePaymentStatus(booking, dto);
  }

  async getEvents(id: string) {
    await this.getBooking(id);
    return this.db.bookingEvent.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: "asc" },
    });
  }

  async setSiteLocation(args: {
    id: string;
    siteLat: number;
    siteLng: number;
    geofenceRadiusMeters?: number;
  }) {
    const booking = await this.getBooking(args.id);

    const radius =
      typeof args.geofenceRadiusMeters === "number" &&
      Number.isFinite(args.geofenceRadiusMeters) &&
      args.geofenceRadiusMeters > 0
        ? Math.floor(args.geofenceRadiusMeters)
        : (booking as any).geofenceRadiusMeters ?? 100;

    return this.db.booking.update({
      where: { id: booking.id },
      data: {
        siteLat: args.siteLat,
        siteLng: args.siteLng,
        geofenceRadiusMeters: radius,
      } as any,
    });
  }

  private async assertFoAvailableForWindow(args: {
    bookingId: string;
    foId: string;
    scheduledStart: Date | string;
    estimatedHours: number | null | undefined;
    requestedDurationMinutes?: number | null;
    requestedEstimateSnapshotOutputJson?: string | null;
  }) {
    const requestedStart = new Date(args.scheduledStart);
    const requestedEstimatedHours = Number(args.estimatedHours ?? 0);
    const requestedDurationMinutes = Number(args.requestedDurationMinutes ?? 0);

    if (!Number.isFinite(requestedStart.getTime())) {
      throw new BadRequestException("BOOKING_SCHEDULED_START_INVALID");
    }

    if (
      !(requestedDurationMinutes > 0) &&
      !(requestedEstimatedHours > 0)
    ) {
      throw new ConflictException(
        "BOOKING_ESTIMATED_HOURS_REQUIRED_FOR_AVAILABILITY_CHECK",
      );
    }

    const requestedEnd =
      requestedDurationMinutes > 0
        ? new Date(requestedStart.getTime() + Math.floor(requestedDurationMinutes) * 60 * 1000)
        : new Date(
            resolveBookingCalendarEndMs({
              scheduledStart: requestedStart,
              estimatedHours: requestedEstimatedHours,
              estimateSnapshotOutputJson: args.requestedEstimateSnapshotOutputJson,
              preferWallClockFromSnapshot: true,
            }),
          );

    const existingBookings = await this.db.booking.findMany({
      where: {
        id: { not: args.bookingId },
        foId: args.foId,
        scheduledStart: { not: null },
        status: {
          in: [
            BookingStatus.pending_dispatch,
            BookingStatus.offered,
            BookingStatus.assigned,
            BookingStatus.in_progress,
          ],
        },
      },
      select: {
        id: true,
        scheduledStart: true,
        estimatedHours: true,
        estimateSnapshot: { select: { outputJson: true } },
      },
    });

    const conflicting = existingBookings.find((existing) => {
      if (!existing.scheduledStart) return false;

      const existingStart = new Date(existing.scheduledStart);
      const existingEstimatedHours = Number(existing.estimatedHours ?? 0);

      if (!Number.isFinite(existingStart.getTime())) return false;
      if (!(existingEstimatedHours > 0)) return false;

      // estimatedHours is labor-oriented and must only be a legacy fallback for calendar overlap.
      const existingEnd = new Date(
        resolveBookingCalendarEndMs({
          scheduledStart: existingStart,
          estimatedHours: existingEstimatedHours,
          estimateSnapshotOutputJson: existing.estimateSnapshot?.outputJson,
          preferWallClockFromSnapshot: true,
        }),
      );

      return requestedStart < existingEnd && existingStart < requestedEnd;
    });

    if (conflicting) {
      throw new ConflictException("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME");
    }
  }

  async confirmBookingFromHold(args: {
    bookingId: string;
    holdId: string;
    note?: string;
    idempotencyKey?: string | null;
    /**
     * Public funnel: slot/hold duration follows crew-adjusted elapsed minutes from
     * `PublicBookingOrchestratorService`, while `Booking.estimatedHours` reflects labor hours.
     * When true, confirm validates hold window bounds only — not raw `estimatedHours * 60`.
     */
    useHoldElapsedDurationModel?: boolean;
  }) {
    try {
      return await this.db.$transaction(async (tx: any) => {
        const current = await tx.booking.findUnique({
          where: { id: args.bookingId },
        });

        if (!current) {
          throw new NotFoundException("BOOKING_NOT_FOUND");
        }

        const idem = args.idempotencyKey ?? null;

        if (idem) {
          const existingEvent = await tx.bookingEvent.findFirst({
            where: {
              bookingId: current.id,
              idempotencyKey: idem,
              type: BookingEventType.STATUS_CHANGED,
              fromStatus: BookingStatus.pending_payment,
              toStatus: BookingStatus.assigned,
            },
            select: { id: true },
          });

          if (existingEvent) {
            return { ...current, alreadyApplied: true };
          }
        }

        const hold = await tx.bookingSlotHold.findUnique({
          where: { id: args.holdId },
        });

        if (!hold) {
          throw new NotFoundException("BOOKING_SLOT_HOLD_NOT_FOUND");
        }

        const now = new Date();
        if (hold.expiresAt.getTime() <= now.getTime()) {
          throw new ConflictException("BOOKING_SLOT_HOLD_EXPIRED");
        }

        if (hold.startAt.getTime() <= now.getTime()) {
          throw new ConflictException({
            code: "PUBLIC_BOOKING_SLOT_IN_PAST",
            message:
              "Selected arrival time is no longer available. Please choose a future time.",
          });
        }

        const estimatedHours = Number(current.estimatedHours ?? 0);
        if (!(estimatedHours > 0)) {
          throw new ConflictException(
            "BOOKING_ESTIMATED_HOURS_REQUIRED_FOR_CONFIRMATION",
          );
        }

        if (current.status !== BookingStatus.pending_payment) {
          if (
            current.status === BookingStatus.assigned &&
            current.foId === hold.foId &&
            current.scheduledStart &&
            new Date(current.scheduledStart).getTime() === hold.startAt.getTime()
          ) {
            return { ...current, alreadyApplied: true };
          }

          throw new ConflictException("BOOKING_CONFIRMATION_STATE_INVALID");
        }

        const holdDurationMinutes = Math.round(
          (hold.endAt.getTime() - hold.startAt.getTime()) / (60 * 1000),
        );
        const bookingDurationMinutesFromEstimatedHours = Math.round(
          estimatedHours * 60,
        );

        assertConfirmHoldSlotDuration({
          useHoldElapsedDurationModel: args.useHoldElapsedDurationModel,
          holdDurationMinutes,
          bookingDurationMinutesFromEstimatedHours,
        });

        const foEligibility = await this.fo.getEligibility(hold.foId);
        if (!foEligibility.canAcceptBooking) {
          throw new ConflictException("FO_NOT_ELIGIBLE");
        }

        const requestedStart = new Date(hold.startAt);
        const requestedEnd = new Date(hold.endAt);
        const useWallClockOverlap = args.useHoldElapsedDurationModel === true;

        const existingBookings = await tx.booking.findMany({
          where: {
            id: { not: current.id },
            foId: hold.foId,
            scheduledStart: { not: null },
            status: {
              in: [
                BookingStatus.pending_dispatch,
                BookingStatus.offered,
                BookingStatus.assigned,
                BookingStatus.in_progress,
              ],
            },
          },
          select: {
            id: true,
            scheduledStart: true,
            estimatedHours: true,
            estimateSnapshot: { select: { outputJson: true } },
          },
        });

        const conflicting = existingBookings.find((existing: any) => {
          if (!existing.scheduledStart) return false;

          const existingStart = new Date(existing.scheduledStart);
          const existingEstimatedHours = Number(existing.estimatedHours ?? 0);

          if (!Number.isFinite(existingStart.getTime())) return false;
          if (!(existingEstimatedHours > 0)) return false;

          const existingEndMs = resolveBookingCalendarEndMs({
            scheduledStart: existingStart,
            estimatedHours: existingEstimatedHours,
            estimateSnapshotOutputJson: existing.estimateSnapshot?.outputJson,
            preferWallClockFromSnapshot: useWallClockOverlap,
          });
          const existingEnd = new Date(existingEndMs);

          return requestedStart < existingEnd && existingStart < requestedEnd;
        });

        if (conflicting) {
          throw new ConflictException("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME");
        }

        const otherBookings = await tx.booking.findMany({
          where: {
            id: { not: current.id },
            foId: hold.foId,
            status: {
              in: [BookingStatus.assigned, BookingStatus.in_progress],
            },
            scheduledStart: {
              not: null,
              lt: hold.endAt,
            },
          },
          select: {
            id: true,
            scheduledStart: true,
            estimatedHours: true,
            estimateSnapshot: { select: { outputJson: true } },
          },
        });

        const conflict = otherBookings.find(
          (b: {
            scheduledStart: Date | null;
            estimatedHours: number | null;
            estimateSnapshot: { outputJson: string } | null;
          }) => {
            if (b.scheduledStart == null || b.estimatedHours == null) return false;
            const eh = Number(b.estimatedHours);
            if (!(eh > 0)) return false;
            const endMs = resolveBookingCalendarEndMs({
              scheduledStart: new Date(b.scheduledStart),
              estimatedHours: eh,
              estimateSnapshotOutputJson: b.estimateSnapshot?.outputJson,
              preferWallClockFromSnapshot: useWallClockOverlap,
            });
            return endMs > hold.startAt.getTime();
          },
        );

        if (conflict) {
          throw new ConflictException("FO_SLOT_ALREADY_BOOKED");
        }

        const { count } = await tx.booking.updateMany({
          where: {
            id: current.id,
            status: BookingStatus.pending_payment,
          },
          data: {
            status: BookingStatus.assigned,
            foId: hold.foId,
            scheduledStart: hold.startAt,
          },
        });

        if (count !== 1) {
          const refetched = await tx.booking.findUnique({
            where: { id: current.id },
          });

          if (
            refetched &&
            refetched.status === BookingStatus.assigned &&
            refetched.foId === hold.foId &&
            refetched.scheduledStart &&
            new Date(refetched.scheduledStart).getTime() === hold.startAt.getTime()
          ) {
            return { ...refetched, alreadyApplied: true };
          }

          throw new ConflictException({
            code: "CONFLICT",
            message: "Booking was modified by another request",
          });
        }

        try {
          await tx.bookingEvent.create({
            data: {
              bookingId: current.id,
              type: BookingEventType.STATUS_CHANGED,
              fromStatus: BookingStatus.pending_payment,
              toStatus: BookingStatus.assigned,
              note: args.note ?? null,
              idempotencyKey: idem,
            },
          });
        } catch (e: any) {
          if (e?.code === "P2002") {
            throw new IdempotencyReplayError(current.id);
          }
          throw e;
        }

        await tx.bookingSlotHold.delete({
          where: { id: hold.id },
        });

        const updated = await tx.booking.findUnique({
          where: { id: current.id },
        });

        SlotHoldMetrics.confirmed++;
        return updated;
      });
    } catch (e: any) {
      if (e instanceof IdempotencyReplayError) {
        const refetched = await this.db.booking.findUnique({
          where: { id: e.bookingId },
        });
        if (refetched) {
          SlotHoldMetrics.confirmed++;
          return { ...refetched, alreadyApplied: true };
        }
      }
      throw e;
    }
  }

  /**
   * Booking status transitions. For `cancel`, public deposit / fee enforcement runs via
   * {@link enforceCancellationPaymentInvariantForBooking}. Any future code that sets a booking to
   * `canceled` / `cancelled` without going through this method must call that invariant explicitly
   * (repository search: no other production writers today).
   */
  async transitionBooking(args: {
    id: string;
    transition: Transition;
    note?: string;
    scheduledStart?: string;
    actualMinutes?: number | null;
    idempotencyKey?: string | null;
  }) {
    const revRecEnabled = process.env.LEDGER_REVREC_ENABLED !== "0";

    const booking = await this.getBooking(args.id);

    const expectedCurrentStatus = booking.status;
    let to: BookingStatus;
    try {
      to = getTransition(args.transition, expectedCurrentStatus).to;
    } catch (e: any) {
      if (
        typeof e?.message === "string" &&
        e.message.startsWith("INVALID_TRANSITION:")
      ) {
        throw new ConflictException({
          code: "INVALID_TRANSITION",
          message: "Invalid booking transition for current status",
        });
      }
      throw e;
    }

    if (
      args.transition === "schedule" &&
      expectedCurrentStatus === BookingStatus.pending_payment &&
      to === BookingStatus.pending_dispatch
    ) {
      if (!this.bookingPaymentService.canConfirm(booking.paymentStatus)) {
        throw new BadRequestException(
          "Booking cannot be confirmed until payment is authorized, paid, or waived",
        );
      }
    }

    if (booking.foId && args.scheduledStart) {
      await this.assertFoAvailableForWindow({
        bookingId: booking.id,
        foId: booking.foId,
        scheduledStart: args.scheduledStart,
        estimatedHours: booking.estimatedHours,
        // Generic/manual scheduling currently has no snapshot payload in this path;
        // availability falls back explicitly to estimatedHours when wall minutes are unavailable.
      });
    }

    try {
      const { result, prevStatus } = await this.db.$transaction(async (tx: any) => {
        const prevStatus = booking.status;
        const { count } = await tx.booking.updateMany({
          where: { id: booking.id, status: expectedCurrentStatus },
          data: {
            status: to,
            ...(args.scheduledStart
              ? { scheduledStart: new Date(args.scheduledStart) }
              : {}),
            ...(to === BookingStatus.canceled &&
            expectedCurrentStatus !== BookingStatus.canceled &&
            expectedCurrentStatus !== BookingStatus.cancelled
              ? {
                  canceledAt: new Date(),
                  canceledReason: args.note?.trim()
                    ? args.note.trim().slice(0, 2000)
                    : null,
                }
              : {}),
            ...(to === BookingStatus.completed &&
            expectedCurrentStatus !== BookingStatus.completed
              ? { completedAt: new Date() }
              : {}),
          },
        });

        if (count === 1) {
          try {
            await tx.bookingEvent.create({
              data: {
                bookingId: booking.id,
                type: BookingEventType.STATUS_CHANGED,
                fromStatus: expectedCurrentStatus,
                toStatus: to,
                note: args.note ?? null,
                idempotencyKey: args.idempotencyKey ?? null,
              },
            });
          } catch (e: any) {
            if (e?.code === "P2002") {
              throw new IdempotencyReplayError(booking.id);
            }
            throw e;
          }

          const updated = await tx.booking.findUnique({
            where: { id: booking.id },
          });
          return { result: updated, prevStatus };
        }

        const refetched = await tx.booking.findUnique({
          where: { id: booking.id },
        });
        if (!refetched) throw new NotFoundException("BOOKING_NOT_FOUND");

        if (refetched.status === to) {
          return { result: { ...refetched, alreadyApplied: true }, prevStatus };
        }

        throw new ConflictException({
          code: "CONFLICT",
          message: "Booking was modified by another request",
        });
      });

      if (!result.currency) {
        throw new Error(`Booking currency missing for bookingId=${result.id}`);
      }
      if (revRecEnabled) {
        const idem = args.idempotencyKey ?? null;

        if (
          result.status === BookingStatus.completed &&
          prevStatus !== BookingStatus.completed
        ) {
          await this.ledger.recognizeRevenueForBooking({
            bookingId: result.id,
            currency: result.currency,
            idempotencyKey: idem,
          });
        } else if (
          prevStatus === BookingStatus.completed &&
          result.status !== BookingStatus.completed
        ) {
          await this.ledger.reverseRevenueRecognitionForBooking({
            bookingId: result.id,
            currency: result.currency,
            idempotencyKey: idem,
          });
        }
      }

      if (
        result.status === BookingStatus.pending_dispatch &&
        prevStatus !== BookingStatus.pending_dispatch
      ) {
        try {
          await this.dispatch.startDispatch(result.id);
        } catch (err) {
          console.error("DISPATCH_START_FAILED", {
            bookingId: result.id,
            error: err,
          });
        }
      }

      if (
        result.status === BookingStatus.in_progress &&
        prevStatus !== BookingStatus.in_progress &&
        result.foId
      ) {
        await this.db.franchiseOwnerReliabilityStats.upsert({
          where: { foId: result.foId },
          create: {
            foId: result.foId,
            inProgressCount: 1,
            activeAssignedCount: 0,
            activeInProgressCount: 1,
          },
          update: {
            inProgressCount: { increment: 1 },
            activeAssignedCount: { decrement: 1 },
            activeInProgressCount: { increment: 1 },
          },
        });
      }

      if (
        result.status === BookingStatus.completed &&
        prevStatus !== BookingStatus.completed &&
        result.foId
      ) {
        await this.db.franchiseOwnerReliabilityStats.upsert({
          where: { foId: result.foId },
          create: {
            foId: result.foId,
            completionsCount: 1,
            activeInProgressCount: 0,
          },
          update: {
            completionsCount: { increment: 1 },
            activeInProgressCount: { decrement: 1 },
          },
        });
        await this.db.franchiseOwner.update({
          where: { id: result.foId },
          data: {
            completedJobsCount: { increment: 1 },
          },
        });
        if (result.foId) {
          void this.reputationService.recomputeForFoSafe(result.foId);
        }
      }

      if (
        result.status === BookingStatus.completed &&
        prevStatus !== BookingStatus.completed
      ) {
        await this.recordEstimateLearningResultForCompletion({
          bookingId: result.id,
          actualMinutes: args.actualMinutes,
          foId: result.foId ?? null,
        });
        void this.remainingBalanceCapture
          .captureRemainingBalanceForBooking(result.id)
          .catch((err) => {
            console.error("REMAINING_BALANCE_CAPTURE_FAILED", {
              bookingId: result.id,
              error: err,
            });
          });
      }

      if (
        result.status === BookingStatus.canceled &&
        prevStatus !== BookingStatus.canceled &&
        result.foId
      ) {
        const cancelFromAssigned = prevStatus === BookingStatus.assigned;
        const cancelFromInProgress = prevStatus === BookingStatus.in_progress;
        await this.db.franchiseOwnerReliabilityStats.upsert({
          where: { foId: result.foId },
          create: {
            foId: result.foId,
            cancellationsCount: 1,
          },
          update: {
            cancellationsCount: { increment: 1 },
            ...(cancelFromAssigned && { activeAssignedCount: { decrement: 1 } }),
            ...(cancelFromInProgress && { activeInProgressCount: { decrement: 1 } }),
          },
        });
        if (result.foId) {
          void this.reputationService.recomputeForFoSafe(result.foId);
        }
      }

      if (
        result.status === BookingStatus.canceled &&
        prevStatus !== BookingStatus.canceled &&
        prevStatus !== BookingStatus.cancelled
      ) {
        void this.enforceCancellationPaymentInvariantForBooking(result.id, {
          reason: "transitionBooking:cancel",
        }).catch((err) => {
          this.log.error({
            kind: "cancellation_payment_invariant",
            event: "unexpected_reject",
            bookingId: result.id,
            message: err instanceof Error ? err.message : String(err),
          });
        });
      }

      return result;
    } catch (e: any) {
      if (e instanceof IdempotencyReplayError) {
        const refetched = await this.db.booking.findUnique({
          where: { id: e.bookingId },
        });
        if (refetched) return { ...refetched, alreadyApplied: true };
      }
      throw e;
    }
  }

  private async recordEstimateLearningResultForCompletion(args: {
    bookingId: string;
    actualMinutes?: number | null;
    foId?: string | null;
  }): Promise<void> {
    const actualMinutes =
      typeof args.actualMinutes === "number" &&
      Number.isFinite(args.actualMinutes) &&
      args.actualMinutes > 0
        ? Math.floor(args.actualMinutes)
        : null;
    if (actualMinutes == null) {
      this.log.log({
        kind: "estimate_learning",
        event: "actual_minutes_missing",
        bookingId: args.bookingId,
      });
      return;
    }

    try {
      const row = await this.db.booking.findUnique({
        where: { id: args.bookingId },
        select: {
          id: true,
          foId: true,
          estimateSnapshot: { select: { outputJson: true } },
        },
      });
      if (!row?.estimateSnapshot?.outputJson) return;
      const existing = await this.db.bookingEvent.findFirst({
        where: {
          bookingId: args.bookingId,
          idempotencyKey: `estimate-learning-result:${args.bookingId}`,
        },
        select: { id: true },
      });
      if (existing) return;

      const inputs = this.estimateLearning.extractLearningInputsFromSnapshot(
        row.estimateSnapshot.outputJson,
      );
      const result = this.estimateLearning.calculateEstimateLearningResult({
        bookingId: args.bookingId,
        actualMinutes,
        legacyV1Minutes: inputs.legacyV1Minutes,
        estimateV2ExpectedMinutes: inputs.estimateV2ExpectedMinutes,
        snapshotVersion: inputs.snapshotVersion,
        serviceType: inputs.serviceType,
        riskLevel: inputs.riskLevel,
        foId: args.foId ?? row.foId ?? null,
      });
      const payload = JSON.parse(
        JSON.stringify({
          kind: "estimate_learning_result",
          ...result,
        }),
      ) as Prisma.InputJsonValue;

      await this.db.bookingEvent.create({
        data: {
          bookingId: args.bookingId,
          type: BookingEventType.NOTE,
          note: "Estimate learning result recorded.",
          idempotencyKey: `estimate-learning-result:${args.bookingId}`,
          actorRole: "system",
          payload,
        },
      });
    } catch (err: unknown) {
      this.log.warn({
        kind: "estimate_learning",
        event: "learning_result_write_failed",
        bookingId: args.bookingId,
        message: err instanceof Error ? err.message : String(err ?? "unknown"),
      });
    }
  }

  async assignBooking(params: {
    bookingId: string;
    foId: string;
    note?: string;
    idempotencyKey?: string | null;
    assignmentSource?: "manual" | "recommended";
    actorUserId?: string | null;
    actorRole?: string | null;
    recommendationSummary?: Record<string, unknown> | null;
  }) {
    const foId = params.foId != null ? String(params.foId).trim() : "";
    if (!foId) {
      throw new BadRequestException("foId is required");
    }

    const booking = await this.getBooking(params.bookingId);

    const expectedCurrentStatus = booking.status;
    let to: BookingStatus;
    try {
      to = getTransition("assign", expectedCurrentStatus).to;
    } catch (e: any) {
      if (
        typeof e?.message === "string" &&
        e.message.startsWith("INVALID_TRANSITION:")
      ) {
        throw new ConflictException({
          code: "INVALID_TRANSITION",
          message: "Invalid booking transition for current status",
        });
      }
      throw e;
    }

    const currentFoId = booking.foId ?? null;

    const currentBooking = await this.db.booking.findUnique({
      where: { id: params.bookingId },
      select: {
        id: true,
        status: true,
        foId: true,
        dispatchLockedAt: true,
      },
    });

    if (!currentBooking) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    if (currentBooking.dispatchLockedAt) {
      throw new BadRequestException("BOOKING_DISPATCH_LOCKED");
    }

    if (isInvalidAssignmentState(currentBooking)) {
      throw new BadRequestException("BOOKING_INVALID_STATE");
    }

    // IMPORTANT: allow reassignment
    // only block if already assigned AND same FO target
    if (isAssignedState(currentBooking) && currentBooking.foId === foId) {
      const row = await this.db.booking.findUnique({
        where: { id: params.bookingId },
      });
      if (!row) throw new NotFoundException("BOOKING_NOT_FOUND");
      return { ...row, alreadyApplied: true };
    }

    const ok = await this.fo.getEligibility(foId);
    if (!(ok as any).canAcceptBooking) {
      throw new ConflictException("FO_NOT_ELIGIBLE");
    }

    if (booking.scheduledStart) {
      await this.assertFoAvailableForWindow({
        bookingId: booking.id,
        foId,
        scheduledStart: booking.scheduledStart,
        estimatedHours: booking.estimatedHours,
        // Assignment reads the booking row only; use explicit estimatedHours fallback.
      });
    }

    const idempotencyKey =
      params.idempotencyKey != null && String(params.idempotencyKey).trim()
        ? String(params.idempotencyKey).trim()
        : `assign:${params.bookingId}:${foId}`;

    return await this.db.$transaction(async (tx: any) => {
      const txBooking = await tx.booking.findUnique({
        where: { id: booking.id },
        select: {
          id: true,
          status: true,
          foId: true,
          dispatchLockedAt: true,
        },
      });

      if (!txBooking) {
        throw new NotFoundException("BOOKING_NOT_FOUND");
      }

      if (txBooking.dispatchLockedAt) {
        throw new BadRequestException("BOOKING_DISPATCH_LOCKED");
      }

      if (isInvalidAssignmentState(txBooking)) {
        throw new BadRequestException("BOOKING_INVALID_STATE");
      }

      if (isAssignedState(txBooking) && txBooking.foId === foId) {
        const row = await tx.booking.findUnique({ where: { id: booking.id } });
        if (!row) throw new NotFoundException("BOOKING_NOT_FOUND");
        return { ...row, alreadyApplied: true };
      }

      const updateWhere: Prisma.BookingWhereInput = {
        status: expectedCurrentStatus,
      };
      if (expectedCurrentStatus === BookingStatus.assigned && currentFoId != null) {
        (updateWhere as any).foId = currentFoId;
      }

      const { booking: updated, bookingRowUpdated } =
        await this.applyAssignmentTransitionInTx(tx, {
          bookingId: booking.id,
          toStatus: to,
          foId,
          idempotencyKey,
          note: params.note ?? null,
          metadata: {
            kind: "booking_assigned" as const,
            assignmentSource: params.assignmentSource ?? "manual",
            actorUserId: String(params.actorUserId ?? "").trim(),
            actorRole: String(params.actorRole ?? "").trim(),
            selectedFoId: foId,
            recommendationSummary: params.recommendationSummary ?? null,
          },
          updateWhere,
          optimisticFailure: "default",
        });

      if (
        bookingRowUpdated &&
        expectedCurrentStatus === BookingStatus.assigned &&
        currentFoId != null &&
        currentFoId !== foId
      ) {
        await tx.franchiseOwnerReliabilityStats.upsert({
          where: { foId: currentFoId },
          create: {
            foId: currentFoId,
            activeAssignedCount: 0,
          },
          update: {
            activeAssignedCount: { decrement: 1 },
          },
        });
        await tx.franchiseOwnerReliabilityStats.upsert({
          where: { foId },
          create: {
            foId,
            assignmentsCount: 1,
            activeAssignedCount: 1,
          },
          update: {
            assignmentsCount: { increment: 1 },
            activeAssignedCount: { increment: 1 },
          },
        });
      }

      return updated;
    });
  }

  async listBookingsForApi(
    dto: ListBookingsDto,
    actor: { userId: string; role: string },
  ) {
    const where: Prisma.BookingWhereInput = {};
    const includeEvents = dto.includeEvents === "true";
    const include: Prisma.BookingInclude | undefined = includeEvents
      ? {
          BookingEvent: {
            orderBy: { createdAt: "asc" },
          },
        }
      : undefined;

    const role = actor.role;
    const uid = actor.userId;

    if (dto.status) {
      where.status = dto.status;
    }

    if (role === "customer") {
      where.customerId = uid;
    } else if (role === "fo") {
      const fo = await this.db.franchiseOwner.findUnique({
        where: { userId: uid },
        select: { id: true },
      });
      if (!fo) {
        return [];
      }
      where.foId = fo.id;
      if (dto.view === "fo" || !dto.view) {
        where.status = {
          in: [
            BookingStatus.assigned,
            BookingStatus.accepted,
            BookingStatus.en_route,
            BookingStatus.in_progress,
            BookingStatus.completed,
          ],
        };
      }
    } else if (role === "admin") {
      if (dto.customerUserId) {
        where.customerId = dto.customerUserId;
      }
      if (dto.assignedFoUserId) {
        const fo = await this.db.franchiseOwner.findUnique({
          where: { userId: dto.assignedFoUserId },
          select: { id: true },
        });
        if (!fo) {
          return [];
        }
        where.foId = fo.id;
      }
      if (dto.view === "dispatch") {
        where.status = {
          in: [
            BookingStatus.pending_dispatch,
            BookingStatus.offered,
            BookingStatus.assigned,
            BookingStatus.hold,
            BookingStatus.review,
            BookingStatus.in_progress,
            BookingStatus.accepted,
            BookingStatus.en_route,
            BookingStatus.active,
          ],
        };
      }
      if (dto.view === "fo" && dto.userId) {
        const fo = await this.db.franchiseOwner.findUnique({
          where: { userId: dto.userId },
          select: { id: true },
        });
        if (!fo) {
          return [];
        }
        where.foId = fo.id;
        where.status = {
          in: [
            BookingStatus.assigned,
            BookingStatus.accepted,
            BookingStatus.en_route,
            BookingStatus.in_progress,
            BookingStatus.completed,
          ],
        };
      }
      if (dto.view === "customer" && dto.userId) {
        where.customerId = dto.userId;
      }
    }

    return this.db.booking.findMany({
      where,
      orderBy: [{ scheduledStart: "asc" }, { createdAt: "desc" }],
      take: role === "admin" ? 100 : 50,
      include,
    });
  }

  mapBookingWithEvents(
    booking: Record<string, unknown> & {
      BookingEvent?: Array<Record<string, unknown>>;
    },
  ) {
    const { BookingEvent, ...rest } = booking;
    return {
      ...rest,
      events: BookingEvent ?? [],
    };
  }

  async patchBookingForApi(id: string, dto: UpdateBookingPatchDto) {
    const booking = await this.getBooking(id);
    return this.db.booking.update({
      where: { id: booking.id },
      data: {
        notes: dto.notes === undefined ? undefined : dto.notes,
        scheduledStart:
          dto.scheduledStart === undefined
            ? undefined
            : dto.scheduledStart
              ? new Date(dto.scheduledStart)
              : null,
        status: dto.status ?? undefined,
        estimatedHours: dto.estimatedHours ?? undefined,
      },
    });
  }

  async transitionToNextStatusForApi(
    id: string,
    dto: BookingMainTransitionDto,
    idempotencyKey: string | null,
  ) {
    const booking = await this.getBooking(id);
    if (dto.nextStatus === booking.status) {
      return booking;
    }

    if (dto.nextStatus === BookingStatus.assigned && dto.foId) {
      return this.assignBooking({
        bookingId: id,
        foId: dto.foId,
        note: dto.note,
        idempotencyKey,
      });
    }

    const transitionName = resolveTransitionName(booking.status, dto.nextStatus);
    if (!transitionName) {
      throw new BadRequestException(
        `Invalid booking transition: ${booking.status} -> ${dto.nextStatus}`,
      );
    }
    if (transitionName === "assign") {
      throw new BadRequestException(
        "Assignment requires foId on the transition payload.",
      );
    }

    return this.transitionBooking({
      id,
      transition: transitionName,
      note: dto.note,
      scheduledStart: dto.scheduledStart,
      actualMinutes: dto.actualMinutes,
      idempotencyKey,
    });
  }
}

class IdempotencyReplayError extends Error {
  constructor(public readonly bookingId: string) {
    super("IDEMPOTENCY_REPLAY");
    this.name = "IdempotencyReplayError";
  }
}
