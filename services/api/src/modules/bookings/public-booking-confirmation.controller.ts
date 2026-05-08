import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { BookingPublicDepositStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { serializeDeepCleanProgramForScreen } from "./serializers/deep-clean-program-screen.serializer";
import { resolveCanonicalBookingScheduledEnd } from "./booking-scheduled-window";

type PublicRecurringCadence = "weekly" | "every_10_days" | "biweekly" | "monthly";
type PublicVisitStructure = "one_visit" | "three_visit_reset";

const cadenceDays: Record<PublicRecurringCadence, number> = {
  weekly: 7,
  every_10_days: 10,
  biweekly: 14,
  monthly: 30,
};

function isPublicRecurringCadence(
  value: unknown,
): value is PublicRecurringCadence {
  return (
    value === "weekly" ||
    value === "every_10_days" ||
    value === "biweekly" ||
    value === "monthly"
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function parsePublicEstimateSnapshot(
  outputJson: string | null | undefined,
  inputJson: string | null | undefined,
): {
  estimatedPriceCents: number;
  estimatedDurationMinutes: number;
  confidence: number;
  serviceType: string | null;
  selectedRecurringCadence: PublicRecurringCadence | null;
  visitStructure: PublicVisitStructure | null;
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
    const cadence =
      inp.recurring_cadence_intent ?? inp.recurringCadenceIntent ?? null;
    const selectedRecurringCadence = isPublicRecurringCadence(cadence)
      ? cadence
      : null;
    const firstTimeVisitProgram =
      inp.first_time_visit_program ?? inp.firstTimeVisitProgram ?? null;
    const visitStructure =
      firstTimeVisitProgram === "three_visit_reset" ||
      firstTimeVisitProgram === "three_visit"
        ? "three_visit_reset"
        : firstTimeVisitProgram === "one_visit"
          ? "one_visit"
          : null;
    return {
      estimatedPriceCents,
      estimatedDurationMinutes,
      confidence,
      serviceType,
      selectedRecurringCadence,
      visitStructure,
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
        scheduledEnd: true,
        estimatedHours: true,
        publicDepositStatus: true,
        estimateSnapshot: { select: { outputJson: true, inputJson: true } },
        deepCleanProgram: true,
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
    const scheduledEndIso =
      resolveCanonicalBookingScheduledEnd({
        scheduledStart: booking.scheduledStart,
        scheduledEnd: booking.scheduledEnd,
        estimatedHours: booking.estimatedHours,
        estimateSnapshotOutputJson: booking.estimateSnapshot?.outputJson,
        preferWallClockFromSnapshot: true,
        hold: null,
      })?.toISOString() ?? null;
    const latestRecurringPlan = booking.recurringPlans[0] ?? null;
    const planCadence = isPublicRecurringCadence(latestRecurringPlan?.cadence)
      ? latestRecurringPlan.cadence
      : null;
    const selectedRecurringCadence =
      snap?.selectedRecurringCadence ?? planCadence ?? null;
    const visitStructure = snap?.visitStructure ?? null;
    const recurringBeginsAt =
      latestRecurringPlan?.nextRunAt?.toISOString() ??
      (booking.scheduledStart && selectedRecurringCadence
        ? addDays(
            booking.scheduledStart,
            (visitStructure === "three_visit_reset" ? 28 : 0) +
              cadenceDays[selectedRecurringCadence],
          ).toISOString()
        : null);
    const resetSchedule =
      visitStructure === "three_visit_reset" && booking.scheduledStart
        ? {
            visit1At: booking.scheduledStart.toISOString(),
            visit2At: addDays(booking.scheduledStart, 14).toISOString(),
            visit3At: addDays(booking.scheduledStart, 28).toISOString(),
          }
        : null;

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
      deepCleanProgram: serializeDeepCleanProgramForScreen({
        bookingDeepCleanProgram: booking.deepCleanProgram,
      }),
      selectedRecurringCadence,
      visitStructure,
      recurringPlan: latestRecurringPlan
        ? {
            id: latestRecurringPlan.id,
            cadence: latestRecurringPlan.cadence,
            status: latestRecurringPlan.status,
            pricePerVisitCents: latestRecurringPlan.pricePerVisitCents,
            nextRunAt: latestRecurringPlan.nextRunAt.toISOString(),
          }
        : null,
      resetSchedule,
      recurringBeginsAt,
    };
  }
}
