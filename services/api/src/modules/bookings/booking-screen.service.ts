import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  BookingAuthorityReviewStatus,
  BookingOfferStatus,
  BookingPaymentStatus,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { BillingService } from "../billing/billing.service";
import { DeepCleanCalibrationService } from "./deep-clean-calibration.service";
import { DeepCleanVisitExecutionService } from "./deep-clean-visit-execution.service";
import { serializeDeepCleanCalibrationForScreen } from "./serializers/deep-clean-calibration.serializer";
import { serializeDeepCleanProgramForScreen } from "./serializers/deep-clean-program-screen.serializer";
import { buildDeepCleanExecutionForScreen } from "./serializers/deep-clean-program-progress.serializer";
import { parseAuthorityStringArrayJson } from "../authority/booking-authority-json.util";
import { buildCustomerAuthorityEducationalContext } from "../authority/customer-authority-education.mapper";
import { mapAuthorityTagsToFoKnowledgeLinks } from "../authority/fo-authority-knowledge.mapper";
import { BookingIntelligenceService } from "../authority/booking-intelligence.service";
import { BookingAuthorityPersistenceService } from "../authority/booking-authority-persistence.service";
import { resolveCanonicalBookingScheduledEnd } from "./booking-scheduled-window";

type JwtViewer = { userId: string; role: string };

type BookingAuthorityTagSource = {
  notes: string | null;
  estimateSnapshot: { inputJson: string; outputJson: string } | null;
};

function numFromDecimal(
  v: Prisma.Decimal | number | null | undefined,
): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const CUSTOMER_PAYMENT_ATTENTION: BookingPaymentStatus[] = [
  BookingPaymentStatus.unpaid,
  BookingPaymentStatus.checkout_created,
  BookingPaymentStatus.payment_pending,
  BookingPaymentStatus.failed,
];

const CUSTOMER_COMPLETION_READY_STATUS: BookingStatus[] = [
  BookingStatus.assigned,
  BookingStatus.accepted,
  BookingStatus.en_route,
  BookingStatus.active,
  BookingStatus.in_progress,
];

const FO_PAYMENT_ATTENTION: BookingPaymentStatus[] = [
  BookingPaymentStatus.unpaid,
  BookingPaymentStatus.checkout_created,
  BookingPaymentStatus.payment_pending,
  BookingPaymentStatus.failed,
];

const FO_COMPLETION_READY_STATUS: BookingStatus[] = [
  BookingStatus.active,
  BookingStatus.in_progress,
];

/** Cap FO `knowledgeLinks` per booking row / screen to keep payloads small. */
const MAX_FO_BOOKING_KNOWLEDGE_LINKS = 12;

@Injectable()
export class BookingScreenService {
  constructor(
    private readonly db: PrismaService,
    private readonly billing: BillingService,
    private readonly deepCleanExecution: DeepCleanVisitExecutionService,
    private readonly deepCleanCalibration: DeepCleanCalibrationService,
    private readonly bookingIntelligence: BookingIntelligenceService,
    private readonly bookingAuthorityPersistence: BookingAuthorityPersistenceService,
  ) {}

  private async resolveAuthorityTagsForBookingRow(
    bookingId: string,
    source: BookingAuthorityTagSource,
  ): Promise<{
    surfaces: string[];
    problems: string[];
    methods: string[];
  }> {
    const resolved = this.bookingIntelligence.resolveTags({
      notes: source.notes,
      metadata: source.estimateSnapshot
        ? {
            estimateInputJson: source.estimateSnapshot.inputJson,
            estimateOutputJson: source.estimateSnapshot.outputJson,
          }
        : null,
    });
    await this.bookingAuthorityPersistence.persistResolvedAuthorityIfChanged(
      bookingId,
      resolved,
    );
    return {
      surfaces: resolved.surfaces,
      problems: resolved.problems,
      methods: resolved.methods,
    };
  }

  /**
   * Prefer persisted `BookingAuthorityResult` (admin/overrides included).
   * **Fallback:** `BookingIntelligenceService.resolveTags` from `notes` + estimate snapshot
   * metadata, then `persistResolvedAuthorityIfChanged` (skipped when status is `overridden`).
   * Used for FO knowledge links and customer educational context.
   */
  private async resolveAuthorityTagsPreferringPersisted(
    bookingId: string,
    source: BookingAuthorityTagSource,
  ): Promise<{
    surfaces: string[];
    problems: string[];
    methods: string[];
    authorityTagSource: "persisted" | "derived";
    /** Present when a `BookingAuthorityResult` row exists; `null` when tags are resolver-only. */
    authorityReviewStatus: BookingAuthorityReviewStatus | null;
  }> {
    const row =
      await this.bookingAuthorityPersistence.findLatestByBookingId(bookingId);
    if (row) {
      return {
        surfaces: parseAuthorityStringArrayJson(row.surfacesJson),
        problems: parseAuthorityStringArrayJson(row.problemsJson),
        methods: parseAuthorityStringArrayJson(row.methodsJson),
        authorityTagSource: "persisted",
        authorityReviewStatus: row.status,
      };
    }
    const derived = await this.resolveAuthorityTagsForBookingRow(
      bookingId,
      source,
    );
    return {
      ...derived,
      authorityTagSource: "derived",
      authorityReviewStatus: null,
    };
  }

  private buildCappedFoKnowledgeLinks(tags: {
    surfaces: string[];
    problems: string[];
    methods: string[];
  }): ReturnType<typeof mapAuthorityTagsToFoKnowledgeLinks> {
    return mapAuthorityTagsToFoKnowledgeLinks(tags).slice(
      0,
      MAX_FO_BOOKING_KNOWLEDGE_LINKS,
    );
  }

  async assertCanViewBooking(viewer: JwtViewer, bookingId: string): Promise<void> {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, customerId: true, foId: true },
    });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");

    const role = String(viewer.role ?? "");
    if (role === "admin") return;

    if (role === "customer") {
      if (booking.customerId !== viewer.userId) {
        throw new ForbiddenException("BOOKING_FORBIDDEN");
      }
      return;
    }

    if (role === "fo") {
      const fo = await this.db.franchiseOwner.findUnique({
        where: { userId: viewer.userId },
        select: { id: true },
      });
      if (!fo) throw new ForbiddenException("FO_PROFILE_REQUIRED");

      if (booking.foId === fo.id) return;

      const linked = await this.db.bookingOffer.findFirst({
        where: { bookingId, foId: fo.id },
        select: { id: true },
      });
      if (linked) return;

      throw new ForbiddenException("BOOKING_FORBIDDEN");
    }

    throw new ForbiddenException("BOOKING_FORBIDDEN");
  }

  /**
   * Aggregated read model for booking detail UIs (customer / FO / admin).
   * When `includeFoKnowledgeLinks`, FO clients receive `knowledgeLinks`, `authorityTagSource`,
   * `authorityReviewStatus` (null when derived-only), and `authorityHasTaggedRows`.
   * When `includeCustomerAuthorityEducation`, customers may receive `authorityEducationalContext`.
   */
  async buildBookingScreen(
    bookingId: string,
    options?: {
      includeFoKnowledgeLinks?: boolean;
      includeCustomerAuthorityEducation?: boolean;
    },
  ): Promise<Record<string, unknown>> {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      include: {
        estimateSnapshot: true,
        deepCleanProgram: true,
        fo: { select: { id: true, displayName: true } },
        customer: { select: { id: true, email: true } },
      },
    });

    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");

    const billingLedger = await this.billing
      .summarizeBooking({ bookingId })
      .catch(() => null);

    const events = await this.db.bookingEvent.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    const lastDecision = await this.db.dispatchDecision.findFirst({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
      include: {
        candidates: {
          orderBy: [{ finalRank: "asc" }, { baseRank: "asc" }],
          include: {
            franchiseOwner: {
              select: { id: true, displayName: true, reliabilityScore: true },
            },
          },
        },
      },
    });

    const estimate = this.parseEstimateSnapshot(booking.estimateSnapshot);
    const deepCleanProgram = serializeDeepCleanProgramForScreen({
      bookingDeepCleanProgram: booking.deepCleanProgram,
    });

    let deepCleanExecution: ReturnType<typeof buildDeepCleanExecutionForScreen> =
      null;
    let deepCleanCalibration: ReturnType<
      typeof serializeDeepCleanCalibrationForScreen
    > | null = null;
    if (booking.deepCleanProgram) {
      await this.deepCleanExecution.ensureExecutionRowsForBooking(bookingId);
      await this.deepCleanCalibration.syncCalibrationForBooking(bookingId);
      const executionRows =
        await this.deepCleanExecution.getExecutionRowsForBooking(bookingId);
      deepCleanExecution = buildDeepCleanExecutionForScreen({
        executions: executionRows,
        totalVisits: booking.deepCleanProgram.visitCount,
      });
      const programCal =
        await this.deepCleanCalibration.getProgramCalibrationForBooking(
          bookingId,
        );
      const visitCals =
        await this.deepCleanCalibration.getVisitCalibrationForBooking(
          bookingId,
        );
      if (programCal && visitCals.length > 0) {
        deepCleanCalibration = serializeDeepCleanCalibrationForScreen({
          program: programCal,
          visits: visitCals,
        });
      }
    }
    const dispatchCandidates = this.buildDispatchCandidates(
      lastDecision,
      estimate.matchedCleaners,
    );

    const customerTotal =
      numFromDecimal(booking.quotedTotal) ?? booking.priceTotal ?? undefined;
    const platformRevenue =
      numFromDecimal(booking.quotedMargin) ?? booking.margin ?? undefined;
    const subtotal =
      numFromDecimal(booking.quotedSubtotal) ?? booking.priceSubtotal;

    let marginPercent: number | undefined;
    if (
      customerTotal != null &&
      customerTotal > 0 &&
      platformRevenue != null
    ) {
      marginPercent = (platformRevenue / customerTotal) * 100;
    }

    const dispatchHistory = events.map((e, index) => ({
      id: e.id,
      timestamp: e.createdAt.toISOString(),
      title: e.type,
      detail:
        e.note?.trim() ||
        (e.fromStatus && e.toStatus
          ? `${e.fromStatus} → ${e.toStatus}`
          : "Booking event"),
      tone: "neutral" as const,
    }));

    const bookingCore = {
      id: booking.id,
      status: booking.status,
      serviceLabel: estimate.serviceTypeLabel,
      customerName: booking.customer?.email ?? undefined,
      locationLabel: undefined as string | undefined,
      scheduledStart: booking.scheduledStart?.toISOString() ?? undefined,
      scheduledEnd:
        resolveCanonicalBookingScheduledEnd({
          scheduledStart: booking.scheduledStart,
          scheduledEnd: booking.scheduledEnd,
          estimatedHours: booking.estimatedHours,
          estimateSnapshotOutputJson: booking.estimateSnapshot?.outputJson,
          preferWallClockFromSnapshot: true,
          hold: null,
        })?.toISOString() ?? undefined,
      paymentStatus: booking.paymentStatus,
      foId: booking.foId,
      hourlyRateCents: booking.hourlyRateCents,
      estimatedHours: booking.estimatedHours,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    };

    let foAuthorityExtras: Record<string, unknown> = {};
    if (options?.includeFoKnowledgeLinks) {
      const auth = await this.resolveAuthorityTagsPreferringPersisted(bookingId, {
        notes: booking.notes,
        estimateSnapshot: booking.estimateSnapshot
          ? {
              inputJson: booking.estimateSnapshot.inputJson,
              outputJson: booking.estimateSnapshot.outputJson,
            }
          : null,
      });
      const links = this.buildCappedFoKnowledgeLinks(auth);
      const authorityHasTaggedRows =
        auth.surfaces.length +
          auth.problems.length +
          auth.methods.length >
        0;
      foAuthorityExtras = {
        knowledgeLinks: links,
        authorityTagSource: auth.authorityTagSource,
        authorityReviewStatus: auth.authorityReviewStatus,
        authorityHasTaggedRows,
      };
    }

    let customerAuthorityExtras: Record<string, unknown> = {};
    if (options?.includeCustomerAuthorityEducation) {
      const auth = await this.resolveAuthorityTagsPreferringPersisted(bookingId, {
        notes: booking.notes,
        estimateSnapshot: booking.estimateSnapshot
          ? {
              inputJson: booking.estimateSnapshot.inputJson,
              outputJson: booking.estimateSnapshot.outputJson,
            }
          : null,
      });
      const ctx = buildCustomerAuthorityEducationalContext({
        surfaces: auth.surfaces,
        problems: auth.problems,
        methods: auth.methods,
        authorityTagSource: auth.authorityTagSource,
        authorityReviewStatus: auth.authorityReviewStatus,
      });
      if (ctx) {
        customerAuthorityExtras = { authorityEducationalContext: ctx };
      }
    }

    return {
      booking: bookingCore,
      assignedFoId: booking.foId ?? undefined,
      assignedFoLabel: booking.fo?.displayName ?? undefined,
      dispatchCandidates,
      billing: {
        subtotal: subtotal ?? customerTotal,
        total: customerTotal,
        customerTotal,
        franchiseOwnerPayout: undefined,
        cleanerPayout: undefined,
        platformRevenue,
        marginPercent,
        marginPct: marginPercent,
        sessions: billingLedger?.sessions ?? [],
        totals: billingLedger?.totals ?? {
          totalBillableMin: 0,
          totalBillableCents: 0,
        },
      },
      billingLedger,
      estimateSnapshot: booking.estimateSnapshot
        ? {
            estimatorVersion: booking.estimateSnapshot.estimatorVersion,
            mode: booking.estimateSnapshot.mode,
            confidence: booking.estimateSnapshot.confidence,
            createdAt: booking.estimateSnapshot.createdAt.toISOString(),
            estimatedPriceCents: estimate.estimatedPriceCents,
            estimatedDurationMinutes: estimate.estimatedDurationMinutes,
            serviceType: estimate.serviceTypeLabel,
          }
        : null,
      dispatch: lastDecision
        ? {
            lastDecisionId: lastDecision.id,
            decisionStatus: lastDecision.decisionStatus,
            trigger: lastDecision.trigger,
            createdAt: lastDecision.createdAt.toISOString(),
            selectedFranchiseOwnerId: lastDecision.selectedFranchiseOwnerId,
          }
        : null,
      dispatchHistory,
      timeline: { events: dispatchHistory },
      signals: {
        bookingId: booking.id,
        foId: booking.foId ?? undefined,
        signalTimestamp: booking.updatedAt.toISOString(),
        noAcceptance: false,
        offerExpired: false,
        slaMiss: false,
        reassignment: false,
        noShowRisk: false,
        overloadRisk: false,
      },
      deepCleanProgram,
      deepCleanExecution,
      deepCleanCalibration,
      ...foAuthorityExtras,
      ...customerAuthorityExtras,
    };
  }

  private parseEstimateSnapshot(
    row: {
      outputJson: string;
      inputJson: string;
    } | null,
  ): {
    estimatedPriceCents?: number;
    estimatedDurationMinutes?: number;
    matchedCleaners: unknown[];
    serviceTypeLabel?: string;
  } {
    if (!row) {
      return { matchedCleaners: [] };
    }
    try {
      const out = JSON.parse(row.outputJson) as Record<string, unknown>;
      const inp = JSON.parse(row.inputJson) as Record<string, unknown>;
      const matchedCleaners = Array.isArray(out.matchedCleaners)
        ? out.matchedCleaners
        : [];
      const serviceType =
        typeof inp.service_type === "string" ? inp.service_type : undefined;
      return {
        estimatedPriceCents:
          typeof out.estimatedPriceCents === "number"
            ? out.estimatedPriceCents
            : undefined,
        estimatedDurationMinutes:
          typeof out.estimatedDurationMinutes === "number"
            ? out.estimatedDurationMinutes
            : undefined,
        matchedCleaners,
        serviceTypeLabel: serviceType,
      };
    } catch {
      return { matchedCleaners: [] };
    }
  }

  private buildDispatchCandidates(
    lastDecision: null | {
      candidates: Array<{
        franchiseOwnerId: string;
        finalRank: number | null;
        baseRank: number | null;
        finalScore: Prisma.Decimal | null;
        baseScore: Prisma.Decimal | null;
        distanceMiles: Prisma.Decimal | null;
        acceptanceRate: Prisma.Decimal | null;
        completionRate: Prisma.Decimal | null;
        cancellationRate: Prisma.Decimal | null;
        franchiseOwner: {
          id: string;
          displayName: string | null;
          reliabilityScore: number | null;
        };
      }>;
    },
    fallbackCleaners: unknown[],
  ): unknown[] {
    if (lastDecision?.candidates?.length) {
      return lastDecision.candidates.map((c, index) => {
        const rank = c.finalRank ?? c.baseRank ?? index + 1;
        const score = numFromDecimal(c.finalScore ?? c.baseScore) ?? 0;
        return {
          foId: c.franchiseOwnerId,
          label: c.franchiseOwner.displayName ?? `FO ${c.franchiseOwnerId}`,
          rank,
          score,
          recommended: rank === 1 || index === 0,
          distanceMiles: numFromDecimal(c.distanceMiles),
          acceptanceRate: numFromDecimal(c.acceptanceRate),
          completionRate: numFromDecimal(c.completionRate),
          cancellationRate: numFromDecimal(c.cancellationRate),
          strengths: [] as string[],
          degraders: [] as string[],
          riskFlags: [] as string[],
        };
      });
    }

    if (fallbackCleaners.length) {
      return fallbackCleaners.map((raw, index) => {
        const o =
          raw && typeof raw === "object"
            ? (raw as Record<string, unknown>)
            : {};
        const id = String(o.id ?? o.foId ?? `candidate-${index + 1}`);
        const label =
          typeof o.displayName === "string" && o.displayName
            ? o.displayName
            : `FO ${id}`;
        return {
          foId: id,
          label,
          rank: index + 1,
          score: typeof o.reliabilityScore === "number" ? o.reliabilityScore : 0,
          recommended: index === 0,
          distanceMiles:
            typeof o.travelMinutes === "number" ? o.travelMinutes : undefined,
          strengths: [],
          degraders: [],
          riskFlags: [],
        };
      });
    }

    return [];
  }

  async getCustomerScreenSummary(customerUserId: string): Promise<{
    counts: Record<string, number>;
    rows: Array<Record<string, unknown>>;
    queue: { rows: Array<Record<string, unknown>> };
  }> {
    const bookings = await this.db.booking.findMany({
      where: { customerId: customerUserId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        scheduledStart: true,
        updatedAt: true,
        notes: true,
        estimateSnapshot: {
          select: { inputJson: true, outputJson: true },
        },
      },
    });

    const rows = await Promise.all(
      bookings.map(async (b) => ({
        bookingId: b.id,
        status: b.status,
        paymentStatus: b.paymentStatus,
        scheduledStart: b.scheduledStart?.toISOString() ?? null,
        updatedAt: b.updatedAt.toISOString(),
        authorityTags: await this.resolveAuthorityTagsForBookingRow(b.id, {
          notes: b.notes,
          estimateSnapshot: b.estimateSnapshot,
        }),
      })),
    );

    const actionRequired = rows.filter((r) =>
      CUSTOMER_PAYMENT_ATTENTION.includes(
        r.paymentStatus as BookingPaymentStatus,
      ),
    ).length;

    const completionReady = rows.filter((r) =>
      CUSTOMER_COMPLETION_READY_STATUS.includes(r.status as BookingStatus),
    ).length;

    return {
      counts: {
        actionRequired,
        completionReady,
        total: rows.length,
      },
      rows,
      queue: { rows },
    };
  }

  async getFoScreenSummary(franchiseOwnerId: string): Promise<{
    counts: Record<string, number>;
    queue: { rows: Array<Record<string, unknown>> };
  }> {
    const assigned = await this.db.booking.findMany({
      where: { foId: franchiseOwnerId },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        scheduledStart: true,
        updatedAt: true,
        estimatedHours: true,
        hourlyRateCents: true,
        notes: true,
        estimateSnapshot: {
          select: { inputJson: true, outputJson: true },
        },
      },
    });

    const offerRows = await this.db.bookingOffer.findMany({
      where: {
        foId: franchiseOwnerId,
        status: BookingOfferStatus.offered,
      },
      select: { bookingId: true },
      take: 30,
    });

    const assignedIds = new Set(assigned.map((b) => b.id));
    const extraIds = offerRows
      .map((o) => o.bookingId)
      .filter((id) => !assignedIds.has(id));

    const extra =
      extraIds.length > 0
        ? await this.db.booking.findMany({
            where: { id: { in: extraIds } },
            select: {
              id: true,
              status: true,
              paymentStatus: true,
              scheduledStart: true,
              updatedAt: true,
              estimatedHours: true,
              hourlyRateCents: true,
              notes: true,
              estimateSnapshot: {
                select: { inputJson: true, outputJson: true },
              },
            },
          })
        : [];

    const merged = [...assigned, ...extra].slice(0, 50);

    const queueRows = await Promise.all(
      merged.map(async (b) => {
        const auth = await this.resolveAuthorityTagsPreferringPersisted(b.id, {
          notes: b.notes,
          estimateSnapshot: b.estimateSnapshot,
        });
        return {
          bookingId: b.id,
          status: b.status,
          paymentStatus: b.paymentStatus,
          scheduledStart: b.scheduledStart?.toISOString() ?? null,
          updatedAt: b.updatedAt.toISOString(),
          estimatedHours: b.estimatedHours,
          hourlyRateCents: b.hourlyRateCents,
          queueLabel: assignedIds.has(b.id) ? "assigned" : "offered",
          authorityTags: {
            surfaces: auth.surfaces,
            problems: auth.problems,
            methods: auth.methods,
          },
          authorityTagSource: auth.authorityTagSource,
          authorityReviewStatus: auth.authorityReviewStatus,
          authorityHasTaggedRows:
            auth.surfaces.length +
              auth.problems.length +
              auth.methods.length >
            0,
          knowledgeLinks: this.buildCappedFoKnowledgeLinks(auth),
        };
      }),
    );

    const paymentActionRequired = queueRows.filter((r) =>
      FO_PAYMENT_ATTENTION.includes(r.paymentStatus as BookingPaymentStatus),
    ).length;

    const completionReady = queueRows.filter((r) =>
      FO_COMPLETION_READY_STATUS.includes(r.status as BookingStatus),
    ).length;

    return {
      counts: {
        paymentActionRequired,
        completionReady,
        total: queueRows.length,
      },
      queue: { rows: queueRows },
    };
  }
}
