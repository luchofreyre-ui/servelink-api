import * as bcrypt from "bcrypt";
import {
  AdminDispatchDecisionAction,
  AdminDispatchDecisionExecutionStatus,
  BookingEventType,
  BookingPaymentStatus,
  BookingStatus,
  DispatchDecisionStatus,
  OpsAlertSeverity,
  OpsAlertStatus,
  OpsAnomalyType,
  Prisma,
} from "@prisma/client";
import { seedBookingPaymentAuthorized } from "../booking-payment-seed.util";
import { DispatchDecisionService } from "../modules/bookings/dispatch-decision.service";
import { DispatchConfigService } from "../modules/dispatch/dispatch-config.service";
import { ensureProviderForFranchiseOwner } from "../modules/fo/fo-provider-sync";
import { PrismaService } from "../prisma";
import { setBookingWindowFromDuration } from "../modules/bookings/booking-window-mutation";
import { ADMIN_CC_ACTIVITY } from "../modules/admin/bookings/admin-bookings.service";

export const PLAYWRIGHT_ADMIN_SCENARIO_MARKER = "playwright_admin_scenario" as const;

export const PLAYWRIGHT_ADMIN_SCENARIO_EMAILS = {
  admin: `${PLAYWRIGHT_ADMIN_SCENARIO_MARKER}_admin@servelink.local`,
  customer: `${PLAYWRIGHT_ADMIN_SCENARIO_MARKER}_customer@servelink.local`,
  fo1: `${PLAYWRIGHT_ADMIN_SCENARIO_MARKER}_fo1@servelink.local`,
  fo2: `${PLAYWRIGHT_ADMIN_SCENARIO_MARKER}_fo2@servelink.local`,
} as const;

export const PLAYWRIGHT_ADMIN_SCENARIO_PASSWORD = "Passw0rd!" as const;

const MARKER = PLAYWRIGHT_ADMIN_SCENARIO_MARKER;
const ADMIN_EMAIL = PLAYWRIGHT_ADMIN_SCENARIO_EMAILS.admin;
const CUSTOMER_EMAIL = PLAYWRIGHT_ADMIN_SCENARIO_EMAILS.customer;
const FO1_EMAIL = PLAYWRIGHT_ADMIN_SCENARIO_EMAILS.fo1;
const FO2_EMAIL = PLAYWRIGHT_ADMIN_SCENARIO_EMAILS.fo2;
const ADMIN_PASSWORD = PLAYWRIGHT_ADMIN_SCENARIO_PASSWORD;

/** Tulsa hub — matches other dev fixtures; required for FO supply + activation guards. */
const PLAYWRIGHT_FO_HOME = { lat: 36.15398, lng: -95.99277 } as const;

async function replaceWeeklyScheduleForPlaywrightFo(
  prisma: PrismaService,
  franchiseOwnerId: string,
): Promise<void> {
  await prisma.foSchedule.deleteMany({ where: { franchiseOwnerId } });
  const rows = [];
  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
    rows.push({
      franchiseOwnerId,
      dayOfWeek,
      startTime: "06:00",
      endTime: "22:00",
    });
  }
  await prisma.foSchedule.createMany({ data: rows });
}

const NOTE_PENDING = `${MARKER}:pending_dispatch`;
const NOTE_HOLD = `${MARKER}:hold`;
const NOTE_REVIEW = `${MARKER}:review`;
const NOTE_ACTIVE = `${MARKER}:active`;
const NOTE_EXCEPTION = `${MARKER}:exception_passes`;
const NOTE_CC_OPERATOR_NOTE = `${MARKER}:cc_mutation_operator_note`;
const NOTE_CC_HOLD = `${MARKER}:cc_mutation_hold`;
const NOTE_CC_REVIEW = `${MARKER}:cc_mutation_review`;
const NOTE_CC_APPROVE = `${MARKER}:cc_mutation_approve`;
const NOTE_CC_REASSIGN = `${MARKER}:cc_mutation_reassign`;

export type PlaywrightAdminScenarioPayload = {
  ok: true;
  scenario: {
    adminEmail: string;
    adminPassword: string;
    customerEmail: string;
    customerPassword: string;
    foEmail: string;
    foPassword: string;
    foIds: string[];
    bookingIds: {
      pendingDispatch: string;
      hold: string;
      review: string;
      active: string;
    };
    exceptionId: string | null;
    anomalyId: string | null;
    commandCenterMutationBookingIds: {
      operatorNote: string;
      hold: string;
      markReview: string;
      approve: string;
      reassign: string;
    };
    dispatchConfig: {
      activeId: string | null;
      draftId: string | null;
    };
  };
};

export type PlaywrightAdminScenarioDeps = {
  prisma: PrismaService;
  dispatchDecisionService: DispatchDecisionService;
  dispatchConfigService: DispatchConfigService;
};

export async function runPlaywrightAdminScenario(
  deps: PlaywrightAdminScenarioDeps,
): Promise<PlaywrightAdminScenarioPayload> {
  const { prisma, dispatchDecisionService, dispatchConfigService } = deps;

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, role: "admin" },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: CUSTOMER_EMAIL },
    update: { passwordHash, role: "customer" },
    create: {
      email: CUSTOMER_EMAIL,
      passwordHash,
      role: "customer",
    },
  });

  const foUser1 = await prisma.user.upsert({
    where: { email: FO1_EMAIL },
    update: { passwordHash, role: "fo" },
    create: {
      email: FO1_EMAIL,
      passwordHash,
      role: "fo",
    },
  });

  const foUser2 = await prisma.user.upsert({
    where: { email: FO2_EMAIL },
    update: { passwordHash, role: "fo" },
    create: {
      email: FO2_EMAIL,
      passwordHash,
      role: "fo",
    },
  });

  const fo1 = await prisma.franchiseOwner.upsert({
    where: { userId: foUser1.id },
    update: {
      status: "onboarding",
      displayName: `${MARKER} FO1`,
      safetyHold: false,
      homeLat: PLAYWRIGHT_FO_HOME.lat,
      homeLng: PLAYWRIGHT_FO_HOME.lng,
      maxTravelMinutes: 60,
      maxSquareFootage: 5000,
      maxLaborMinutes: 960,
      maxDailyLaborMinutes: 960,
    },
    create: {
      userId: foUser1.id,
      status: "onboarding",
      displayName: `${MARKER} FO1`,
      safetyHold: false,
      homeLat: PLAYWRIGHT_FO_HOME.lat,
      homeLng: PLAYWRIGHT_FO_HOME.lng,
      maxTravelMinutes: 60,
      maxSquareFootage: 5000,
      maxLaborMinutes: 960,
      maxDailyLaborMinutes: 960,
    },
  });

  const fo2 = await prisma.franchiseOwner.upsert({
    where: { userId: foUser2.id },
    update: {
      status: "onboarding",
      displayName: `${MARKER} FO2`,
      safetyHold: false,
      homeLat: PLAYWRIGHT_FO_HOME.lat,
      homeLng: PLAYWRIGHT_FO_HOME.lng,
      maxTravelMinutes: 60,
      maxSquareFootage: 5000,
      maxLaborMinutes: 960,
      maxDailyLaborMinutes: 960,
    },
    create: {
      userId: foUser2.id,
      status: "onboarding",
      displayName: `${MARKER} FO2`,
      safetyHold: false,
      homeLat: PLAYWRIGHT_FO_HOME.lat,
      homeLng: PLAYWRIGHT_FO_HOME.lng,
      maxTravelMinutes: 60,
      maxSquareFootage: 5000,
      maxLaborMinutes: 960,
      maxDailyLaborMinutes: 960,
    },
  });

  await replaceWeeklyScheduleForPlaywrightFo(prisma, fo1.id);
  await replaceWeeklyScheduleForPlaywrightFo(prisma, fo2.id);
  await ensureProviderForFranchiseOwner(prisma, fo1.id);
  await ensureProviderForFranchiseOwner(prisma, fo2.id);

  await prisma.franchiseOwner.update({
    where: { id: fo1.id },
    data: { status: "active" },
  });
  await prisma.franchiseOwner.update({
    where: { id: fo2.id },
    data: { status: "active" },
  });

  const foIds = [fo1.id, fo2.id];

  const bookingPending = await ensureBooking(prisma, {
    customerId: customer.id,
    notes: NOTE_PENDING,
    status: "pending_dispatch",
    foId: null,
  });

  const bookingHold = await ensureBooking(prisma, {
    customerId: customer.id,
    notes: NOTE_HOLD,
    status: "assigned",
    foId: fo1.id,
  });

  await prisma.bookingDispatchControl.upsert({
    where: { bookingId: bookingHold.id },
    update: {
      holdActive: true,
      holdReason: `${MARKER} hold`,
      holdSource: "playwright_scenario",
      holdSetByAdminId: admin.id,
      holdSetAt: new Date(),
      holdReleasedAt: null,
      workflowState: "held",
    },
    create: {
      bookingId: bookingHold.id,
      holdActive: true,
      holdReason: `${MARKER} hold`,
      holdSource: "playwright_scenario",
      holdSetByAdminId: admin.id,
      holdSetAt: new Date(),
      workflowState: "held",
    },
  });

  const bookingReview = await ensureBooking(prisma, {
    customerId: customer.id,
    notes: NOTE_REVIEW,
    status: "assigned",
    foId: fo1.id,
  });

  await prisma.bookingDispatchControl.upsert({
    where: { bookingId: bookingReview.id },
    update: {
      reviewRequired: true,
      reviewReason: `${MARKER} review`,
      reviewSource: "playwright_scenario",
      reviewRequestedByAdminId: admin.id,
      reviewRequestedAt: new Date(),
      reviewCompletedAt: null,
      holdActive: false,
      workflowState: "in_review",
    },
    create: {
      bookingId: bookingReview.id,
      holdActive: false,
      reviewRequired: true,
      reviewReason: `${MARKER} review`,
      reviewSource: "playwright_scenario",
      reviewRequestedByAdminId: admin.id,
      reviewRequestedAt: new Date(),
      workflowState: "in_review",
    },
  });

  const bookingActive = await ensureBooking(prisma, {
    customerId: customer.id,
    notes: NOTE_ACTIVE,
    status: "in_progress",
    foId: fo1.id,
  });

  const bookingException = await ensureBooking(prisma, {
    customerId: customer.id,
    notes: NOTE_EXCEPTION,
    status: "pending_dispatch",
    foId: null,
  });

  await ensureMultiPassDispatchDecisions(prisma, dispatchDecisionService, bookingException.id);
  await ensureExceptionBookingOperatorNote(prisma, bookingException.id, admin.id);

  await ensureOpsAlert(prisma, bookingException.id);
  const commandCenterMutationBookingIds = await ensureCommandCenterMutationBookings(prisma, {
    customerId: customer.id,
    fo1Id: fo1.id,
    adminId: admin.id,
  });

  await ensureActivityNote(prisma, bookingPending.id, admin.id);
  await ensureSeededCommandCenterActivityRow(prisma, bookingPending.id, admin.id);
  await ensurePlaywrightDraftConfig(prisma, dispatchConfigService, admin.id);

  await ensurePlaywrightBookingEvents(prisma, {
    adminId: admin.id,
    fo1UserId: foUser1.id,
    fo1Id: fo1.id,
    bookings: {
      pendingDispatch: bookingPending.id,
      hold: bookingHold.id,
      review: bookingReview.id,
      active: bookingActive.id,
      exception: bookingException.id,
      ccOperatorNote: commandCenterMutationBookingIds.operatorNote,
      ccHold: commandCenterMutationBookingIds.hold,
      ccReview: commandCenterMutationBookingIds.markReview,
      ccApprove: commandCenterMutationBookingIds.approve,
      ccReassign: commandCenterMutationBookingIds.reassign,
    },
  });

  const activeConfig = await prisma.dispatchConfig.findFirst({
    where: { status: "active" },
    orderBy: { version: "desc" },
  });

  await ensurePlaywrightAdminActivityFeedSources(prisma, {
    adminId: admin.id,
    fo1Id: fo1.id,
    activeDispatchConfigId: activeConfig?.id ?? null,
    bookings: {
      pendingDispatch: bookingPending.id,
      hold: bookingHold.id,
      review: bookingReview.id,
      active: bookingActive.id,
      exception: bookingException.id,
      ccApprove: commandCenterMutationBookingIds.approve,
      ccReassign: commandCenterMutationBookingIds.reassign,
    },
  });

  const draftConfig = await prisma.dispatchConfig.findFirst({
    where: {
      status: "draft",
      label: { contains: MARKER },
    },
    orderBy: { version: "desc" },
  });

  const anomaly = await prisma.opsAlert.findFirst({
    where: { fingerprint: `${MARKER}_anomaly` },
  });

  return {
    ok: true,
    scenario: {
      adminEmail: ADMIN_EMAIL,
      adminPassword: ADMIN_PASSWORD,

      customerEmail: CUSTOMER_EMAIL,
      customerPassword: ADMIN_PASSWORD,

      foEmail: FO1_EMAIL,
      foPassword: ADMIN_PASSWORD,
      foIds,

      bookingIds: {
        pendingDispatch: bookingPending.id,
        hold: bookingHold.id,
        review: bookingReview.id,
        active: bookingActive.id,
      },

      exceptionId: bookingException.id,
      anomalyId: anomaly?.id ?? null,

      commandCenterMutationBookingIds,

      dispatchConfig: {
        activeId: activeConfig?.id ?? null,
        draftId: draftConfig?.id ?? null,
      },
    },
  };
}

const ACTIVITY_FEED_PUBLISH_SUMMARY = `${MARKER} activity feed seed: dispatch publish audit row`;
const ACTIVITY_FEED_ROLLUP_FP = `${MARKER}_rollup_activity_feed`;

type PlaywrightAdminActivityFeedBookings = {
  pendingDispatch: string;
  hold: string;
  review: string;
  active: string;
  exception: string;
  ccApprove: string;
  ccReassign: string;
};

/**
 * Seeds rows read by `AdminActivityService` (dispatchConfigPublishAudit, dispatchOperatorNote,
 * dispatchDecision manual triggers, adminDispatchDecision, adminCommandCenterActivity, opsAlertAudit).
 * Idempotent via marker-prefixed keys / findFirst guards.
 */
async function ensurePlaywrightAdminActivityFeedSources(
  prisma: PrismaService,
  ctx: {
    adminId: string;
    fo1Id: string;
    activeDispatchConfigId: string | null;
    bookings: PlaywrightAdminActivityFeedBookings;
  },
) {
  const { adminId, fo1Id, activeDispatchConfigId, bookings: b } = ctx;
  const recent = (offsetMs: number) => new Date(Date.now() - offsetMs);

  if (activeDispatchConfigId) {
    const existingAudit = await prisma.dispatchConfigPublishAudit.findFirst({
      where: { publishSummary: ACTIVITY_FEED_PUBLISH_SUMMARY },
    });
    if (!existingAudit) {
      const active = await prisma.dispatchConfig.findUnique({
        where: { id: activeDispatchConfigId },
      });
      if (active) {
        await prisma.dispatchConfigPublishAudit.create({
          data: {
            dispatchConfigId: active.id,
            fromVersion: active.version > 1 ? active.version - 1 : null,
            toVersion: active.version,
            publishedByAdminUserId: adminId,
            publishedAt: recent(90_000),
            diffSnapshot: [] as unknown as Prisma.InputJsonValue,
            warningsSnapshot: [] as unknown as Prisma.InputJsonValue,
            highlightsSnapshot: [] as unknown as Prisma.InputJsonValue,
            publishSummary: ACTIVITY_FEED_PUBLISH_SUMMARY,
          },
        });
      }
    }
  }

  const extraNote = await prisma.dispatchOperatorNote.findFirst({
    where: {
      bookingId: b.review,
      note: { contains: `${MARKER}_feed_operator_surface` },
    },
  });
  if (!extraNote) {
    await prisma.dispatchOperatorNote.create({
      data: {
        bookingId: b.review,
        adminUserId: adminId,
        note: `${MARKER}_feed_operator_surface: scenario operator note for admin activity feed`,
        createdAt: recent(80_000),
      },
    });
  }

  await ensureManualDispatchDecisionForFeed(prisma, {
    bookingId: b.pendingDispatch,
    trigger: "manual_assign",
    idempotencyKey: `${MARKER}:activity_feed:manual_assign`,
    adminId,
    bookingStatusAtDecision: BookingStatus.pending_dispatch,
  });
  await ensureManualDispatchDecisionForFeed(prisma, {
    bookingId: b.exception,
    trigger: "redispatch_manual",
    idempotencyKey: `${MARKER}:activity_feed:redispatch_manual`,
    adminId,
    bookingStatusAtDecision: BookingStatus.pending_dispatch,
  });
  await ensureManualDispatchDecisionForFeed(prisma, {
    bookingId: b.active,
    trigger: "manual_exclusion",
    idempotencyKey: `${MARKER}:activity_feed:manual_exclusion`,
    adminId,
    bookingStatusAtDecision: BookingStatus.in_progress,
  });

  await ensureAdminDispatchDecisionForFeed(prisma, {
    bookingId: b.hold,
    action: AdminDispatchDecisionAction.hold,
    executionIdempotencyKey: `${MARKER}:activity_feed:admin_hold`,
    adminId,
    createdAt: recent(70_000),
  });
  await ensureAdminDispatchDecisionForFeed(prisma, {
    bookingId: b.review,
    action: AdminDispatchDecisionAction.request_review,
    executionIdempotencyKey: `${MARKER}:activity_feed:admin_request_review`,
    adminId,
    createdAt: recent(65_000),
  });

  await ensureAdminCommandCenterActivityForFeed(prisma, {
    bookingId: b.hold,
    type: "admin_booking_held",
    adminId,
    summary: `${MARKER}_activity_feed: Command center hold snapshot`,
    createdAt: recent(60_000),
  });
  await ensureAdminCommandCenterActivityForFeed(prisma, {
    bookingId: b.review,
    type: "admin_booking_marked_in_review",
    adminId,
    summary: `${MARKER}_activity_feed: Command center review snapshot`,
    createdAt: recent(55_000),
  });
  await ensureAdminCommandCenterActivityForFeed(prisma, {
    bookingId: b.ccApprove,
    type: "admin_booking_approved",
    adminId,
    summary: `${MARKER}_activity_feed: Command center approval snapshot`,
    createdAt: recent(50_000),
  });
  await ensureAdminCommandCenterActivityForFeed(prisma, {
    bookingId: b.ccReassign,
    type: "admin_booking_reassign_requested",
    adminId,
    summary: `${MARKER}_activity_feed: Command center reassign snapshot`,
    createdAt: recent(45_000),
  });

  const now = new Date();
  await prisma.opsAlertRollup.upsert({
    where: { fingerprint: ACTIVITY_FEED_ROLLUP_FP },
    create: {
      fingerprint: ACTIVITY_FEED_ROLLUP_FP,
      anomalyType: OpsAnomalyType.UNKNOWN,
      bookingId: b.exception,
      foId: fo1Id,
      bookingStatus: BookingStatus.pending_dispatch,
      status: OpsAlertStatus.open,
      severity: OpsAlertSeverity.warning,
      firstSeenAt: recent(40_000),
      lastSeenAt: now,
      occurrences: 1,
      payloadJson: JSON.stringify({
        marker: MARKER,
        source: "playwright_admin_activity_feed",
        bookingId: b.exception,
      }),
    },
    update: {
      bookingId: b.exception,
      lastSeenAt: now,
    },
  });

  await ensureOpsAlertAuditForFeed(prisma, {
    fingerprint: ACTIVITY_FEED_ROLLUP_FP,
    adminId,
    action: "ack",
    eventId: `${MARKER}:activity_feed:audit:ack`,
    fromStatus: OpsAlertStatus.open,
    toStatus: OpsAlertStatus.acked,
    createdAt: recent(35_000),
  });
  await ensureOpsAlertAuditForFeed(prisma, {
    fingerprint: ACTIVITY_FEED_ROLLUP_FP,
    adminId,
    action: "assign",
    eventId: `${MARKER}:activity_feed:audit:assign`,
    fromStatus: OpsAlertStatus.open,
    toStatus: OpsAlertStatus.open,
    toAssignedToAdminId: adminId,
    createdAt: recent(30_000),
  });
}

async function nextDispatchSequenceForBooking(
  prisma: PrismaService,
  bookingId: string,
): Promise<number> {
  const agg = await prisma.dispatchDecision.aggregate({
    where: { bookingId },
    _max: { dispatchSequence: true },
  });
  return (agg._max.dispatchSequence ?? 0) + 1;
}

async function ensureManualDispatchDecisionForFeed(
  prisma: PrismaService,
  args: {
    bookingId: string;
    trigger: "manual_assign" | "redispatch_manual" | "manual_exclusion";
    idempotencyKey: string;
    adminId: string;
    bookingStatusAtDecision: BookingStatus;
  },
) {
  const existing = await prisma.dispatchDecision.findFirst({
    where: { bookingId: args.bookingId, idempotencyKey: args.idempotencyKey },
  });
  if (existing) {
    return;
  }

  const dispatchSequence = await nextDispatchSequenceForBooking(prisma, args.bookingId);
  const latest = await prisma.dispatchDecision.findFirst({
    where: { bookingId: args.bookingId },
    orderBy: { dispatchSequence: "desc" },
  });
  const redispatchSequence = (latest?.redispatchSequence ?? 0) + (args.trigger === "redispatch_manual" ? 1 : 0);

  const decisionStatus =
    args.trigger === "manual_assign"
      ? DispatchDecisionStatus.manual_assigned
      : DispatchDecisionStatus.deferred;

  const snapshot: Prisma.InputJsonValue = {
    source: "playwright_admin_activity_feed",
    marker: MARKER,
    bookingId: args.bookingId,
  };

  await prisma.dispatchDecision.create({
    data: {
      bookingId: args.bookingId,
      trigger: args.trigger,
      triggerDetail: `${MARKER} admin activity feed seed`,
      dispatchSequence,
      redispatchSequence,
      decisionStatus,
      scoringVersion: "playwright_admin_activity_feed_v1",
      bookingSnapshot: snapshot,
      decisionMeta: { adminId: args.adminId } as Prisma.InputJsonValue,
      idempotencyKey: args.idempotencyKey,
      bookingStatusAtDecision: args.bookingStatusAtDecision,
      createdAt: new Date(Date.now() - 25_000),
    },
  });
}

async function ensureAdminDispatchDecisionForFeed(
  prisma: PrismaService,
  args: {
    bookingId: string;
    action: AdminDispatchDecisionAction;
    executionIdempotencyKey: string;
    adminId: string;
    createdAt: Date;
  },
) {
  const existing = await prisma.adminDispatchDecision.findFirst({
    where: { executionIdempotencyKey: args.executionIdempotencyKey },
  });
  if (existing) {
    return;
  }

  await prisma.adminDispatchDecision.create({
    data: {
      bookingId: args.bookingId,
      action: args.action,
      rationale: `${MARKER} admin activity feed seed (${args.action})`,
      submittedByUserId: args.adminId,
      submittedByRole: "admin",
      source: "playwright_scenario_seed",
      submittedAt: args.createdAt,
      status: "accepted",
      executionStatus: AdminDispatchDecisionExecutionStatus.applied,
      executedAt: args.createdAt,
      executionMessage: `${MARKER} applied`,
      executionIdempotencyKey: args.executionIdempotencyKey,
      createdAt: args.createdAt,
    },
  });
}

async function ensureAdminCommandCenterActivityForFeed(
  prisma: PrismaService,
  args: {
    bookingId: string;
    type: string;
    adminId: string;
    summary: string;
    createdAt: Date;
  },
) {
  const existing = await prisma.adminCommandCenterActivity.findFirst({
    where: {
      bookingId: args.bookingId,
      type: args.type,
      summary: { contains: `${MARKER}_activity_feed` },
    },
  });
  if (existing) {
    return;
  }

  await prisma.adminCommandCenterActivity.create({
    data: {
      bookingId: args.bookingId,
      actorUserId: args.adminId,
      actorRole: "admin",
      type: args.type,
      summary: args.summary,
      metadata: { source: "playwright_scenario_seed" } as Prisma.InputJsonValue,
      createdAt: args.createdAt,
    },
  });
}

async function ensureOpsAlertAuditForFeed(
  prisma: PrismaService,
  args: {
    fingerprint: string;
    adminId: string;
    action: string;
    eventId: string;
    fromStatus: OpsAlertStatus | null;
    toStatus: OpsAlertStatus | null;
    toAssignedToAdminId?: string | null;
    createdAt: Date;
  },
) {
  const existing = await prisma.opsAlertAudit.findFirst({
    where: { fingerprint: args.fingerprint, eventId: args.eventId },
  });
  if (existing) {
    return;
  }

  await prisma.opsAlertAudit.create({
    data: {
      fingerprint: args.fingerprint,
      action: args.action,
      eventId: args.eventId,
      actorAdminId: args.adminId,
      fromStatus: args.fromStatus,
      toStatus: args.toStatus,
      fromAssignedToAdminId: null,
      toAssignedToAdminId: args.toAssignedToAdminId ?? null,
      createdAt: args.createdAt,
    },
  });
}

type PlaywrightBookingEventTargets = {
  pendingDispatch: string;
  hold: string;
  review: string;
  active: string;
  exception: string;
  ccOperatorNote: string;
  ccHold: string;
  ccReview: string;
  ccApprove: string;
  ccReassign: string;
};

/**
 * Seeds `BookingEvent` rows for Playwright scenario bookings. The admin activity feed merges
 * several sources; booking detail and payment surfaces read `BookingEvent` via GET booking.
 * Idempotent via `(bookingId, idempotencyKey)` keys prefixed with the scenario marker.
 */
async function ensurePlaywrightBookingEvents(
  prisma: PrismaService,
  ctx: {
    adminId: string;
    fo1UserId: string;
    fo1Id: string;
    bookings: PlaywrightBookingEventTargets;
  },
) {
  const { adminId, fo1UserId, fo1Id, bookings: b } = ctx;
  let ts = Date.now() - 8 * 24 * 60 * 60 * 1000;
  const nextAt = () => {
    ts += 60_000;
    return new Date(ts);
  };

  const beKey = (bookingId: string, suffix: string) => `${MARKER}:be:${bookingId}:${suffix}`;

  const assignmentNote = JSON.stringify({
    kind: "booking_assigned" as const,
    assignmentSource: "playwright_scenario_seed",
    actorUserId: adminId,
    actorRole: "admin",
    selectedFoId: fo1Id,
    recommendationSummary: null,
  });

  // --- pending_dispatch (queue) ---
  await ensureScenarioBookingEvent(prisma, {
    bookingId: b.pendingDispatch,
    idempotencyKey: beKey(b.pendingDispatch, "ledger_created"),
    type: BookingEventType.CREATED,
    fromStatus: null,
    toStatus: BookingStatus.pending_payment,
    note: `${MARKER} booking created`,
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId: b.pendingDispatch,
    idempotencyKey: beKey(b.pendingDispatch, "payment_authorized"),
    type: BookingEventType.PAYMENT_STATUS_CHANGED,
    fromStatus: null,
    toStatus: null,
    actorRole: "system",
    payload: {
      previousPaymentStatus: BookingPaymentStatus.unpaid,
      nextStatus: BookingPaymentStatus.authorized,
      source: "playwright_scenario_seed",
    },
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId: b.pendingDispatch,
    idempotencyKey: beKey(b.pendingDispatch, "status_to_pending_dispatch"),
    type: BookingEventType.STATUS_CHANGED,
    fromStatus: BookingStatus.pending_payment,
    toStatus: BookingStatus.pending_dispatch,
    note: `${MARKER} scheduled / confirmed`,
    actorUserId: adminId,
    actorRole: "admin",
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId: b.pendingDispatch,
    idempotencyKey: beKey(b.pendingDispatch, "dispatch_started"),
    type: BookingEventType.DISPATCH_STARTED,
    fromStatus: null,
    toStatus: null,
    payload: { source: "playwright_scenario_seed", bookingId: b.pendingDispatch },
    createdAt: nextAt(),
  });

  // --- assigned + admin hold ---
  await seedAssignedBookingEventChain(prisma, {
    bookingId: b.hold,
    adminId,
    fo1UserId,
    fo1Id,
    finalStatus: BookingStatus.assigned,
    beKey,
    nextAt,
    assignmentNote,
    extra: async () => {
      await ensureScenarioBookingEvent(prisma, {
        bookingId: b.hold,
        idempotencyKey: beKey(b.hold, "booking_hold"),
        type: BookingEventType.BOOKING_HOLD,
        fromStatus: null,
        toStatus: null,
        note: `${MARKER} admin hold`,
        actorUserId: adminId,
        actorRole: "admin",
        payload: { source: "playwright_scenario_seed" },
        createdAt: nextAt(),
      });
    },
  });

  // --- assigned + review required ---
  await seedAssignedBookingEventChain(prisma, {
    bookingId: b.review,
    adminId,
    fo1UserId,
    fo1Id,
    finalStatus: BookingStatus.assigned,
    beKey,
    nextAt,
    assignmentNote,
    extra: async () => {
      await ensureScenarioBookingEvent(prisma, {
        bookingId: b.review,
        idempotencyKey: beKey(b.review, "review_note"),
        type: BookingEventType.NOTE,
        fromStatus: null,
        toStatus: null,
        note: `${MARKER} review required (scenario)`,
        actorUserId: adminId,
        actorRole: "admin",
        createdAt: nextAt(),
      });
    },
  });

  // --- in progress (active job) ---
  await seedAssignedBookingEventChain(prisma, {
    bookingId: b.active,
    adminId,
    fo1UserId,
    fo1Id,
    finalStatus: BookingStatus.in_progress,
    beKey,
    nextAt,
    assignmentNote,
  });

  // --- dispatch exception / multi-pass ---
  await ensureScenarioBookingEvent(prisma, {
    bookingId: b.exception,
    idempotencyKey: beKey(b.exception, "ledger_created"),
    type: BookingEventType.CREATED,
    fromStatus: null,
    toStatus: BookingStatus.pending_payment,
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId: b.exception,
    idempotencyKey: beKey(b.exception, "payment_authorized"),
    type: BookingEventType.PAYMENT_STATUS_CHANGED,
    fromStatus: null,
    toStatus: null,
    actorRole: "system",
    payload: {
      previousPaymentStatus: BookingPaymentStatus.unpaid,
      nextStatus: BookingPaymentStatus.authorized,
      source: "playwright_scenario_seed",
    },
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId: b.exception,
    idempotencyKey: beKey(b.exception, "status_to_pending_dispatch"),
    type: BookingEventType.STATUS_CHANGED,
    fromStatus: BookingStatus.pending_payment,
    toStatus: BookingStatus.pending_dispatch,
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId: b.exception,
    idempotencyKey: beKey(b.exception, "dispatch_started"),
    type: BookingEventType.DISPATCH_STARTED,
    fromStatus: null,
    toStatus: null,
    payload: { source: "playwright_scenario_seed" },
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId: b.exception,
    idempotencyKey: beKey(b.exception, "offer_created"),
    type: BookingEventType.OFFER_CREATED,
    fromStatus: null,
    toStatus: null,
    payload: { source: "playwright_scenario_seed", round: 1 },
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId: b.exception,
    idempotencyKey: beKey(b.exception, "dispatch_exhausted"),
    type: BookingEventType.DISPATCH_EXHAUSTED,
    fromStatus: null,
    toStatus: null,
    note: `${MARKER} synthetic multi-pass deferral`,
    payload: { source: "playwright_scenario_seed", passes: 3 },
    createdAt: nextAt(),
  });

  // --- command-center mutation targets (compact ledger) ---
  for (const id of [
    b.ccOperatorNote,
    b.ccHold,
    b.ccReview,
    b.ccApprove,
  ]) {
    await seedPendingStyleBookingEvents(prisma, {
      bookingId: id,
      adminId,
      beKey,
      nextAt,
    });
  }

  await seedAssignedBookingEventChain(prisma, {
    bookingId: b.ccReassign,
    adminId,
    fo1UserId,
    fo1Id,
    finalStatus: BookingStatus.assigned,
    beKey,
    nextAt,
    assignmentNote,
  });
}

async function seedPendingStyleBookingEvents(
  prisma: PrismaService,
  args: {
    bookingId: string;
    adminId: string;
    beKey: (bookingId: string, suffix: string) => string;
    nextAt: () => Date;
  },
) {
  const { bookingId, adminId, beKey, nextAt } = args;
  await ensureScenarioBookingEvent(prisma, {
    bookingId,
    idempotencyKey: beKey(bookingId, "ledger_created"),
    type: BookingEventType.CREATED,
    fromStatus: null,
    toStatus: BookingStatus.pending_payment,
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId,
    idempotencyKey: beKey(bookingId, "payment_authorized"),
    type: BookingEventType.PAYMENT_STATUS_CHANGED,
    fromStatus: null,
    toStatus: null,
    actorRole: "system",
    payload: {
      previousPaymentStatus: BookingPaymentStatus.unpaid,
      nextStatus: BookingPaymentStatus.authorized,
      source: "playwright_scenario_seed",
    },
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId,
    idempotencyKey: beKey(bookingId, "status_to_pending_dispatch"),
    type: BookingEventType.STATUS_CHANGED,
    fromStatus: BookingStatus.pending_payment,
    toStatus: BookingStatus.pending_dispatch,
    actorUserId: adminId,
    actorRole: "admin",
    createdAt: nextAt(),
  });
}

async function seedAssignedBookingEventChain(
  prisma: PrismaService,
  args: {
    bookingId: string;
    adminId: string;
    fo1UserId: string;
    fo1Id: string;
    finalStatus: BookingStatus;
    beKey: (bookingId: string, suffix: string) => string;
    nextAt: () => Date;
    assignmentNote: string;
    extra?: () => Promise<void>;
  },
) {
  const {
    bookingId,
    adminId,
    fo1UserId,
    fo1Id,
    finalStatus,
    beKey,
    nextAt,
    assignmentNote,
    extra,
  } = args;

  await ensureScenarioBookingEvent(prisma, {
    bookingId,
    idempotencyKey: beKey(bookingId, "ledger_created"),
    type: BookingEventType.CREATED,
    fromStatus: null,
    toStatus: BookingStatus.pending_payment,
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId,
    idempotencyKey: beKey(bookingId, "payment_authorized"),
    type: BookingEventType.PAYMENT_STATUS_CHANGED,
    fromStatus: null,
    toStatus: null,
    actorRole: "system",
    payload: {
      previousPaymentStatus: BookingPaymentStatus.unpaid,
      nextStatus: BookingPaymentStatus.authorized,
      source: "playwright_scenario_seed",
    },
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId,
    idempotencyKey: beKey(bookingId, "status_to_pending_dispatch"),
    type: BookingEventType.STATUS_CHANGED,
    fromStatus: BookingStatus.pending_payment,
    toStatus: BookingStatus.pending_dispatch,
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId,
    idempotencyKey: beKey(bookingId, "status_to_assigned"),
    type: BookingEventType.STATUS_CHANGED,
    fromStatus: BookingStatus.pending_dispatch,
    toStatus: BookingStatus.assigned,
    actorUserId: adminId,
    actorRole: "admin",
    createdAt: nextAt(),
  });
  await ensureScenarioBookingEvent(prisma, {
    bookingId,
    idempotencyKey: beKey(bookingId, "booking_assigned"),
    type: BookingEventType.BOOKING_ASSIGNED,
    fromStatus: null,
    toStatus: null,
    note: assignmentNote,
    actorUserId: adminId,
    actorRole: "admin",
    payload: {
      kind: "booking_assigned",
      assignmentSource: "playwright_scenario_seed",
      actorUserId: adminId,
      actorRole: "admin",
      selectedFoId: fo1Id,
    },
    createdAt: nextAt(),
  });

  if (finalStatus === BookingStatus.in_progress) {
    await ensureScenarioBookingEvent(prisma, {
      bookingId,
      idempotencyKey: beKey(bookingId, "status_to_in_progress"),
      type: BookingEventType.STATUS_CHANGED,
      fromStatus: BookingStatus.assigned,
      toStatus: BookingStatus.in_progress,
      note: `${MARKER} job started`,
      actorUserId: fo1UserId,
      actorRole: "fo",
      createdAt: nextAt(),
    });
  }

  if (extra) {
    await extra();
  }
}

async function ensureScenarioBookingEvent(
  prisma: PrismaService,
  args: {
    bookingId: string;
    idempotencyKey: string;
    type: BookingEventType;
    fromStatus: BookingStatus | null;
    toStatus: BookingStatus | null;
    note?: string | null;
    actorUserId?: string | null;
    actorRole?: string | null;
    payload?: Prisma.InputJsonValue;
    createdAt: Date;
  },
) {
  const existing = await prisma.bookingEvent.findFirst({
    where: { bookingId: args.bookingId, idempotencyKey: args.idempotencyKey },
  });
  if (existing) {
    return;
  }

  await prisma.bookingEvent.create({
    data: {
      bookingId: args.bookingId,
      idempotencyKey: args.idempotencyKey,
      type: args.type,
      fromStatus: args.fromStatus,
      toStatus: args.toStatus,
      note: args.note ?? null,
      actorUserId: args.actorUserId ?? null,
      actorRole: args.actorRole ?? null,
      payload: args.payload ?? undefined,
      createdAt: args.createdAt,
    },
  });
}

async function ensureBooking(
  prisma: PrismaService,
  args: {
    customerId: string;
    notes: string;
    status: BookingStatus;
    foId: string | null;
  },
) {
  const existing = await prisma.booking.findFirst({
    where: { customerId: args.customerId, notes: args.notes },
  });

  const row = existing
    ? await prisma.booking.update({
        where: { id: existing.id },
        data: {
          status: args.status,
          foId: args.foId,
        },
      })
    : await prisma.booking.create({
        data: (() => {
          const scheduledStart = new Date(Date.now() + 86400000);
          const window = setBookingWindowFromDuration({
            scheduledStart,
            estimatedHours: 2,
            estimateSnapshotOutputJson: null,
          });
          return {
            customerId: args.customerId,
            hourlyRateCents: 5000,
            estimatedHours: 2,
            currency: "usd",
            status: args.status,
            foId: args.foId,
            notes: args.notes,
            scheduledStart: window.scheduledStart,
            scheduledEnd: window.scheduledEnd,
          };
        })(),
      });

  await seedBookingPaymentAuthorized(prisma, row.id);

  return row;
}

async function ensureMultiPassDispatchDecisions(
  prisma: PrismaService,
  dispatchDecisionService: DispatchDecisionService,
  bookingId: string,
) {
  const count = await prisma.dispatchDecision.count({
    where: { bookingId },
  });
  const need = Math.max(0, 3 - count);
  const snapshot: Prisma.InputJsonValue = {
    source: MARKER,
    bookingId,
  };

  for (let i = 0; i < need; i++) {
    await dispatchDecisionService.recordDecision({
      bookingId,
      trigger: "initial_dispatch",
      triggerDetail: `${MARKER} synthetic pass ${i + 1}`,
      decisionStatus: DispatchDecisionStatus.deferred,
      scoringVersion: "playwright_scenario_v1",
      bookingSnapshot: snapshot,
      candidates: [],
    });
  }
}

async function ensureOpsAlert(prisma: PrismaService, bookingId: string) {
  const fingerprint = `${MARKER}_anomaly`;
  const existing = await prisma.opsAlert.findFirst({
    where: { fingerprint },
  });
  if (existing) {
    return;
  }

  await prisma.opsAlert.create({
    data: {
      fingerprint,
      bookingId,
      anomalyType: OpsAnomalyType.UNKNOWN,
      status: OpsAlertStatus.open,
      severity: OpsAlertSeverity.warning,
      payloadJson: JSON.stringify({ marker: MARKER, bookingId }),
    },
  });
}

async function ensureExceptionBookingOperatorNote(
  prisma: PrismaService,
  bookingId: string,
  adminUserId: string,
) {
  const noteText = `${MARKER}_exception_operator_note: deterministic command center seed`;

  const existing = await prisma.dispatchOperatorNote.findFirst({
    where: {
      bookingId,
      note: { contains: `${MARKER}_exception_operator_note` },
    },
  });
  if (!existing) {
    await prisma.dispatchOperatorNote.create({
      data: {
        bookingId,
        adminUserId,
        note: noteText,
      },
    });
  }

  await prisma.bookingDispatchControl.upsert({
    where: { bookingId },
    create: {
      bookingId,
      holdActive: false,
      reviewRequired: false,
      workflowState: "open",
      commandCenterOperatorNote: noteText,
    },
    update: {
      commandCenterOperatorNote: noteText,
    },
  });
}

async function ensureCommandCenterMutationBookings(
  prisma: PrismaService,
  args: {
    customerId: string;
    fo1Id: string;
    adminId: string;
  },
) {
  const seedNote = `${MARKER}_cc_mutation_seed_note`;

  const bOperatorNote = await ensureBooking(prisma, {
    customerId: args.customerId,
    notes: NOTE_CC_OPERATOR_NOTE,
    status: "pending_dispatch",
    foId: null,
  });
  await prisma.bookingDispatchControl.upsert({
    where: { bookingId: bOperatorNote.id },
    create: {
      bookingId: bOperatorNote.id,
      holdActive: false,
      reviewRequired: false,
      workflowState: "open",
      commandCenterOperatorNote: seedNote,
    },
    update: {
      holdActive: false,
      reviewRequired: false,
      reviewCompletedAt: null,
      workflowState: "open",
      commandCenterOperatorNote: seedNote,
    },
  });
  await ensureOpsAlertForBooking(prisma, bOperatorNote.id, `${MARKER}_cc_alert_operator_note`);

  const bHold = await ensureBooking(prisma, {
    customerId: args.customerId,
    notes: NOTE_CC_HOLD,
    status: "pending_dispatch",
    foId: null,
  });
  await resetCommandCenterOpen(prisma, bHold.id);
  await ensureOpsAlertForBooking(prisma, bHold.id, `${MARKER}_cc_alert_hold`);

  const bReview = await ensureBooking(prisma, {
    customerId: args.customerId,
    notes: NOTE_CC_REVIEW,
    status: "pending_dispatch",
    foId: null,
  });
  await resetCommandCenterOpen(prisma, bReview.id);
  await ensureOpsAlertForBooking(prisma, bReview.id, `${MARKER}_cc_alert_review`);

  const bApprove = await ensureBooking(prisma, {
    customerId: args.customerId,
    notes: NOTE_CC_APPROVE,
    status: "pending_dispatch",
    foId: null,
  });
  await prisma.bookingDispatchControl.upsert({
    where: { bookingId: bApprove.id },
    create: {
      bookingId: bApprove.id,
      holdActive: false,
      reviewRequired: true,
      reviewReason: `${MARKER} preseed approve target`,
      reviewSource: "playwright_scenario",
      reviewRequestedByAdminId: args.adminId,
      reviewRequestedAt: new Date(),
      reviewCompletedAt: null,
      workflowState: "in_review",
    },
    update: {
      holdActive: false,
      reviewRequired: true,
      reviewReason: `${MARKER} preseed approve target`,
      reviewSource: "playwright_scenario",
      reviewRequestedByAdminId: args.adminId,
      reviewRequestedAt: new Date(),
      reviewCompletedAt: null,
      workflowState: "in_review",
    },
  });
  await ensureOpsAlertForBooking(prisma, bApprove.id, `${MARKER}_cc_alert_approve`);
  await patchOpsAlertPayloadAdminReviewState(prisma, `${MARKER}_cc_alert_approve`, "in_review");

  const bReassign = await ensureBooking(prisma, {
    customerId: args.customerId,
    notes: NOTE_CC_REASSIGN,
    status: "assigned",
    foId: args.fo1Id,
  });
  await prisma.bookingDispatchControl.upsert({
    where: { bookingId: bReassign.id },
    create: {
      bookingId: bReassign.id,
      holdActive: false,
      reviewRequired: false,
      workflowState: "open",
    },
    update: {
      holdActive: false,
      reviewRequired: false,
      reviewCompletedAt: null,
      workflowState: "open",
    },
  });
  await ensureOpsAlertForBooking(prisma, bReassign.id, `${MARKER}_cc_alert_reassign`);

  return {
    operatorNote: bOperatorNote.id,
    hold: bHold.id,
    markReview: bReview.id,
    approve: bApprove.id,
    reassign: bReassign.id,
  };
}

async function resetCommandCenterOpen(prisma: PrismaService, bookingId: string) {
  await prisma.bookingDispatchControl.upsert({
    where: { bookingId },
    create: {
      bookingId,
      holdActive: false,
      reviewRequired: false,
      workflowState: "open",
    },
    update: {
      holdActive: false,
      reviewRequired: false,
      reviewCompletedAt: null,
      workflowState: "open",
    },
  });
}

async function patchOpsAlertPayloadAdminReviewState(
  prisma: PrismaService,
  fingerprint: string,
  state: string,
) {
  const row = await prisma.opsAlert.findFirst({ where: { fingerprint } });
  if (!row?.payloadJson) return;
  try {
    const obj = JSON.parse(String(row.payloadJson)) as Record<string, unknown>;
    obj.adminReviewState = state;
    await prisma.opsAlert.update({
      where: { id: row.id },
      data: { payloadJson: JSON.stringify(obj) },
    });
  } catch {
    // ignore malformed legacy payloads
  }
}

async function ensureOpsAlertForBooking(
  prisma: PrismaService,
  bookingId: string,
  fingerprint: string,
) {
  const existing = await prisma.opsAlert.findFirst({
    where: { fingerprint },
  });
  const payload = JSON.stringify({ marker: MARKER, bookingId });
  const now = new Date();
  if (existing) {
    await prisma.opsAlert.update({
      where: { id: existing.id },
      data: {
        bookingId,
        status: OpsAlertStatus.open,
        resolvedAt: null,
        resolvedByAdminId: null,
        resolveNote: null,
        payloadJson: payload,
        lastSeenAt: now,
      },
    });
    return;
  }

  await prisma.opsAlert.create({
    data: {
      fingerprint,
      bookingId,
      anomalyType: OpsAnomalyType.UNKNOWN,
      status: OpsAlertStatus.open,
      severity: OpsAlertSeverity.warning,
      payloadJson: payload,
      lastSeenAt: now,
      firstSeenAt: now,
    },
  });
}

async function ensureSeededCommandCenterActivityRow(
  prisma: PrismaService,
  bookingId: string,
  adminUserId: string,
) {
  const exists = await prisma.adminCommandCenterActivity.findFirst({
    where: {
      bookingId,
      type: ADMIN_CC_ACTIVITY.NOTE_SAVED,
      summary: { contains: `${MARKER}_activity_cc_seed` },
    },
  });
  if (exists) {
    return;
  }

  await prisma.adminCommandCenterActivity.create({
    data: {
      bookingId,
      actorUserId: adminUserId,
      actorRole: "admin",
      type: ADMIN_CC_ACTIVITY.NOTE_SAVED,
      summary: `${MARKER}_activity_cc_seed: deterministic admin activity feed row.`,
      metadata: { source: "playwright_scenario_seed" } as Prisma.InputJsonValue,
    },
  });
}

async function ensureActivityNote(prisma: PrismaService, bookingId: string, adminUserId: string) {
  const existing = await prisma.dispatchOperatorNote.findFirst({
    where: {
      bookingId,
      note: { contains: `${MARKER}_activity_note` },
    },
  });
  if (existing) {
    return;
  }

  await prisma.dispatchOperatorNote.create({
    data: {
      bookingId,
      adminUserId,
      note: `${MARKER}_activity_note: seeded for admin activity feed`,
    },
  });
}

async function ensurePlaywrightDraftConfig(
  prisma: PrismaService,
  dispatchConfigService: DispatchConfigService,
  adminUserId: string,
) {
  await dispatchConfigService.getActiveConfig();
  await dispatchConfigService.getDraftConfig();

  const existing = await prisma.dispatchConfig.findFirst({
    where: {
      status: "draft",
      label: { contains: MARKER },
    },
  });
  if (existing) {
    return;
  }

  const active = await prisma.dispatchConfig.findFirst({
    where: { status: "active" },
    orderBy: { version: "desc" },
  });
  if (!active) {
    return;
  }

  const maxVersion = await prisma.dispatchConfig.aggregate({
    _max: { version: true },
  });
  const version = (maxVersion._max.version ?? 0) + 1;

  await prisma.dispatchConfig.create({
    data: {
      version,
      status: "draft",
      label: `${MARKER} draft`,
      acceptancePenaltyWeight: active.acceptancePenaltyWeight,
      completionPenaltyWeight: active.completionPenaltyWeight,
      cancellationPenaltyWeight: active.cancellationPenaltyWeight,
      loadPenaltyWeight: active.loadPenaltyWeight,
      reliabilityBonusWeight: active.reliabilityBonusWeight,
      responseSpeedWeight: active.responseSpeedWeight,
      offerExpiryMinutes: active.offerExpiryMinutes,
      assignedStartGraceMinutes: active.assignedStartGraceMinutes,
      multiPassPenaltyStep: active.multiPassPenaltyStep,
      enableResponseSpeedWeighting: active.enableResponseSpeedWeighting,
      enableReliabilityWeighting: active.enableReliabilityWeighting,
      allowReofferAfterExpiry: active.allowReofferAfterExpiry,
      configJson: active.configJson as Prisma.InputJsonValue,
      createdByAdminUserId: adminUserId,
    },
  });
}
