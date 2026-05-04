import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { BookingPublicDepositStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { serializeDeepCleanProgramForScreen } from "./serializers/deep-clean-program-screen.serializer";
import { computePublicBookingConfirmationScheduledEndIso } from "./public-booking-confirmation-scheduled-end";

function parsePublicEstimateSnapshot(
  outputJson: string | null | undefined,
  inputJson: string | null | undefined,
): {
  estimatedPriceCents: number;
  estimatedDurationMinutes: number;
  confidence: number;
  serviceType: string | null;
  selectedRecurringCadence:
    | "weekly"
    | "every_10_days"
    | "biweekly"
    | "monthly"
    | null;
} | null {
  if (!outputJson?.trim()) return null;
  try {
    const out = JSON.parse(outputJson) as Record<string, unknown>;
    const inp = inputJson?.trim()
      ? (JSON.parse(inputJson) as Record<string, unknown>)
      : {};
    const estimatedPriceCents =
      typeof out.estimatedPriceCents === "number" &&
      Number.isFinite(out.estimatedPriceCents)
        ? Math.max(0, Math.floor(out.estimatedPriceCents))
        : 0;
    const estimatedDurationMinutes =
      typeof out.estimatedDurationMinutes === "number" &&
      Number.isFinite(out.estimatedDurationMinutes)
        ? Math.max(0, Math.floor(out.estimatedDurationMinutes))
        : 0;
    const confidence =
      typeof out.confidence === "number" && Number.isFinite(out.confidence)
        ? out.confidence
        : 0;
    const serviceType =
      typeof inp.service_type === "string" ? inp.service_type : null;
    const recurringCadence =
      inp.recurring_cadence_intent === "weekly" ||
      inp.recurring_cadence_intent === "every_10_days" ||
      inp.recurring_cadence_intent === "biweekly" ||
      inp.recurring_cadence_intent === "monthly"
        ? inp.recurring_cadence_intent
        : null;
    return {
      estimatedPriceCents,
      estimatedDurationMinutes,
      confidence,
      serviceType,
      selectedRecurringCadence: recurringCadence,
    };
  } catch {
    return null;
  }
}

/**
 * Unauthenticated read for marketing confirmation + cold deep-links.
 * Exposes only booking id, headline estimate figures, and deep clean program (when persisted).
 */
@Controller("/api/v1/public/bookings")
export class PublicBookingConfirmationController {
  constructor(private readonly db: PrismaService) {}

  @Get(":id/confirmation")
  async confirmation(@Param("id") id: string) {
    const booking = await this.db.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        scheduledStart: true,
        estimatedHours: true,
        publicDepositStatus: true,
        estimateSnapshot: { select: { outputJson: true, inputJson: true } },
        recurringPlans: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            cadence: true,
            status: true,
            pricePerVisitCents: true,
            nextRunAt: true,
          },
        },
        deepCleanProgram: true,
        fo: { select: { displayName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    const scheduledStartIso = booking.scheduledStart?.toISOString() ?? null;
    const snap = parsePublicEstimateSnapshot(
      booking.estimateSnapshot?.outputJson,
      booking.estimateSnapshot?.inputJson,
    );
    // `estimatedHours` is labor-weighted; public calendar end uses wall minutes from the
    // persisted estimate snapshot when available (hold row is deleted after confirm).
    const scheduledEndIso = computePublicBookingConfirmationScheduledEndIso(
      booking.scheduledStart,
      {
        wallClockDurationMinutes: snap?.estimatedDurationMinutes,
        estimatedHours: booking.estimatedHours,
      },
    );

    return {
      kind: "public_booking_confirmation" as const,
      bookingId: booking.id,
      bookingStatus: booking.status,
      scheduledStart: scheduledStartIso,
      scheduledEnd: scheduledEndIso,
      assignedTeamDisplayName: booking.fo?.displayName?.trim() || null,
      publicDepositPaid:
        booking.publicDepositStatus === BookingPublicDepositStatus.deposit_succeeded,
      estimateSnapshot: snap,
      selectedRecurringCadence: snap?.selectedRecurringCadence ?? null,
      recurringPlan: booking.recurringPlans[0]
        ? {
            id: booking.recurringPlans[0].id,
            cadence: booking.recurringPlans[0].cadence,
            status: booking.recurringPlans[0].status,
            pricePerVisitCents: booking.recurringPlans[0].pricePerVisitCents,
            nextRunAt: booking.recurringPlans[0].nextRunAt.toISOString(),
          }
        : null,
      deepCleanProgram: serializeDeepCleanProgramForScreen({
        bookingDeepCleanProgram: booking.deepCleanProgram,
      }),
    };
  }
}
