import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type AvailableCleanerRecord = {
  /** Franchise owner (dispatch) id — matches `RecurringPlan.preferredFoId` and booking `foId`. */
  cleanerId: string;
  /** Linked `ServiceProvider.id` when present (handoff may reference either). */
  providerId?: string | null;
  cleanerLabel: string;
  isActive: boolean;
  /**
   * When true, roster marks the provider as suitable for recurring plan flows.
   * Omitted when unknown (no dedicated column yet — do not guess).
   */
  supportsRecurring?: boolean;
  /** Five-digit ZIP service area when modeled; otherwise null (not inferred from lat/lng here). */
  serviceAreaZip5?: string | null;
  /** Informational `FoSchedule` rows; not a guarantee of slot-level capacity. */
  availableWindows?: Array<{
    label: string;
    start?: string | null;
    end?: string | null;
  }>;
};

export type RecurringContinuityContext = {
  priorCleanerId?: string | null;
  priorCleanerLabel?: string | null;
};

@Injectable()
export class RosterAvailabilityService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Active franchise owners with a linked provider — same eligibility basis as
   * `DispatchCandidateService` roster load (no geo/capacity filtering here).
   * Weekly `FoSchedule` rows are exposed as informational windows only; they are not
   * a guarantee of slot-level availability for arbitrary booking datetimes.
   */
  async getAvailableCleanersForBookingIntent(_args: {
    bookingId?: string | null;
    intakeId?: string | null;
    scheduling?: {
      mode: "preference_only" | "slot_selection";
      preferredTime?: string | null;
      preferredDayWindow?: string | null;
      selectedSlotId?: string | null;
      selectedSlotFoId?: string | null;
      selectedSlotWindowStart?: string | null;
      selectedSlotWindowEnd?: string | null;
      selectedSlotSource?: "preferred_provider" | "candidate_provider";
      selectedSlotProviderLabel?: string | null;
    };
    recurring?: {
      pathKind: "one_time" | "recurring";
      cadence?: string | null;
    };
  }): Promise<AvailableCleanerRecord[]> {
    void _args;
    const rows = await this.db.franchiseOwner.findMany({
      where: {
        providerId: { not: null },
        status: "active",
        safetyHold: false,
      },
      include: {
        provider: true,
        foSchedules: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
      orderBy: { id: "asc" },
    });

    return rows.map((fo) => {
      const label =
        fo.displayName?.trim() ||
        fo.provider?.displayName?.trim() ||
        "Provider";
      const windows = fo.foSchedules.map((s) => ({
        label: `${DAY_LABELS[s.dayOfWeek] ?? `d${s.dayOfWeek}`} ${s.startTime}–${s.endTime}`,
        start: s.startTime,
        end: s.endTime,
      }));
      return {
        cleanerId: fo.id,
        providerId: fo.providerId,
        cleanerLabel: label,
        isActive: true,
        serviceAreaZip5: null,
        availableWindows: windows.length ? windows : undefined,
      };
    });
  }

  /**
   * Prior franchise owner for recurring continuity from the customer's active recurring plan
   * (`preferredFoId`), optionally filtered by cadence string when it matches a stored plan.
   */
  async getRecurringContinuityContext(args: {
    bookingId?: string | null;
    intakeId?: string | null;
    customerEmail?: string | null;
    recurringCadence?: string | null;
  }): Promise<RecurringContinuityContext> {
    let email = args.customerEmail?.trim() || null;

    if (!email && args.intakeId?.trim()) {
      const intake = await this.db.bookingDirectionIntake.findUnique({
        where: { id: args.intakeId.trim() },
        select: { customerEmail: true },
      });
      email = intake?.customerEmail?.trim() || null;
    }

    if (!email && args.bookingId?.trim()) {
      const booking = await this.db.booking.findUnique({
        where: { id: args.bookingId.trim() },
        select: {
          customer: { select: { email: true } },
        },
      });
      email = booking?.customer?.email?.trim() || null;
    }

    if (!email) {
      return {};
    }

    const user = await this.db.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (!user) {
      return {};
    }

    const plans = await this.db.recurringPlan.findMany({
      where: { customerId: user.id, status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 8,
    });

    if (!plans.length) {
      return {};
    }

    const cadenceWant = args.recurringCadence?.trim().toLowerCase();
    const plan =
      cadenceWant != null && cadenceWant.length > 0
        ? plans.find((p) => String(p.cadence).toLowerCase() === cadenceWant) ??
          plans[0]
        : plans[0];

    const foId = plan.preferredFoId?.trim();
    if (!foId) {
      return {};
    }

    const fo = await this.db.franchiseOwner.findUnique({
      where: { id: foId },
      include: { provider: true },
    });
    const label =
      fo?.displayName?.trim() ||
      fo?.provider?.displayName?.trim() ||
      null;

    return {
      priorCleanerId: foId,
      priorCleanerLabel: label,
    };
  }
}
