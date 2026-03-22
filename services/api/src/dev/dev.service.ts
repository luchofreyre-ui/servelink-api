import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import {
  BookingStatus,
  DispatchDecisionStatus,
  OpsAlertSeverity,
  OpsAlertStatus,
  OpsAnomalyType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma";
import { DispatchDecisionService } from "../modules/bookings/dispatch-decision.service";
import { DispatchConfigService } from "../modules/dispatch/dispatch-config.service";
import { ADMIN_CC_ACTIVITY } from "../modules/admin/bookings/admin-bookings.service";

const MARKER = "playwright_admin_scenario";
const ADMIN_EMAIL = `${MARKER}_admin@servelink.local`;
const CUSTOMER_EMAIL = `${MARKER}_customer@servelink.local`;
const FO1_EMAIL = `${MARKER}_fo1@servelink.local`;
const FO2_EMAIL = `${MARKER}_fo2@servelink.local`;
const ADMIN_PASSWORD = "Passw0rd!";

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

@Injectable()
export class DevService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchDecisionService: DispatchDecisionService,
    private readonly dispatchConfigService: DispatchConfigService,
  ) {}

  async createPlaywrightAdminScenario(): Promise<PlaywrightAdminScenarioPayload> {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await this.prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: { passwordHash, role: "admin" },
      create: {
        email: ADMIN_EMAIL,
        passwordHash,
        role: "admin",
      },
    });

    const customer = await this.prisma.user.upsert({
      where: { email: CUSTOMER_EMAIL },
      update: { passwordHash, role: "customer" },
      create: {
        email: CUSTOMER_EMAIL,
        passwordHash,
        role: "customer",
      },
    });

    const foUser1 = await this.prisma.user.upsert({
      where: { email: FO1_EMAIL },
      update: { passwordHash, role: "fo" },
      create: {
        email: FO1_EMAIL,
        passwordHash,
        role: "fo",
      },
    });

    const foUser2 = await this.prisma.user.upsert({
      where: { email: FO2_EMAIL },
      update: { passwordHash, role: "fo" },
      create: {
        email: FO2_EMAIL,
        passwordHash,
        role: "fo",
      },
    });

    const fo1 = await this.prisma.franchiseOwner.upsert({
      where: { userId: foUser1.id },
      update: { status: "active", displayName: `${MARKER} FO1` },
      create: {
        userId: foUser1.id,
        status: "active",
        displayName: `${MARKER} FO1`,
      },
    });

    const fo2 = await this.prisma.franchiseOwner.upsert({
      where: { userId: foUser2.id },
      update: { status: "active", displayName: `${MARKER} FO2` },
      create: {
        userId: foUser2.id,
        status: "active",
        displayName: `${MARKER} FO2`,
      },
    });

    const foIds = [fo1.id, fo2.id];

    const bookingPending = await this.ensureBooking({
      customerId: customer.id,
      notes: NOTE_PENDING,
      status: "pending_dispatch",
      foId: null,
    });

    const bookingHold = await this.ensureBooking({
      customerId: customer.id,
      notes: NOTE_HOLD,
      status: "assigned",
      foId: fo1.id,
    });

    await this.prisma.bookingDispatchControl.upsert({
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

    const bookingReview = await this.ensureBooking({
      customerId: customer.id,
      notes: NOTE_REVIEW,
      status: "assigned",
      foId: fo1.id,
    });

    await this.prisma.bookingDispatchControl.upsert({
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

    const bookingActive = await this.ensureBooking({
      customerId: customer.id,
      notes: NOTE_ACTIVE,
      status: "in_progress",
      foId: fo2.id,
    });

    const bookingException = await this.ensureBooking({
      customerId: customer.id,
      notes: NOTE_EXCEPTION,
      status: "pending_dispatch",
      foId: null,
    });

    await this.ensureMultiPassDispatchDecisions(bookingException.id);
    await this.ensureExceptionBookingOperatorNote(bookingException.id, admin.id);

    await this.ensureOpsAlert(bookingException.id);
    const commandCenterMutationBookingIds =
      await this.ensureCommandCenterMutationBookings({
        customerId: customer.id,
        fo1Id: fo1.id,
        adminId: admin.id,
      });

    await this.ensureActivityNote(bookingPending.id, admin.id);
    await this.ensureSeededCommandCenterActivityRow(bookingPending.id, admin.id);
    await this.ensurePlaywrightDraftConfig(admin.id);

    const activeConfig = await this.prisma.dispatchConfig.findFirst({
      where: { status: "active" },
      orderBy: { version: "desc" },
    });
    const draftConfig = await this.prisma.dispatchConfig.findFirst({
      where: {
        status: "draft",
        label: { contains: MARKER },
      },
      orderBy: { version: "desc" },
    });

    const anomaly = await this.prisma.opsAlert.findFirst({
      where: { fingerprint: `${MARKER}_anomaly` },
    });

    return {
      ok: true,
      scenario: {
        adminEmail: ADMIN_EMAIL,
        adminPassword: ADMIN_PASSWORD,
        customerEmail: CUSTOMER_EMAIL,
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

  private async ensureBooking(args: {
    customerId: string;
    notes: string;
    status: BookingStatus;
    foId: string | null;
  }) {
    const existing = await this.prisma.booking.findFirst({
      where: { customerId: args.customerId, notes: args.notes },
    });

    if (existing) {
      return this.prisma.booking.update({
        where: { id: existing.id },
        data: {
          status: args.status,
          foId: args.foId,
        },
      });
    }

    return this.prisma.booking.create({
      data: {
        customerId: args.customerId,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: args.status,
        foId: args.foId,
        notes: args.notes,
        scheduledStart: new Date(Date.now() + 86400000),
      },
    });
  }

  private async ensureMultiPassDispatchDecisions(bookingId: string) {
    const count = await this.prisma.dispatchDecision.count({
      where: { bookingId },
    });
    const need = Math.max(0, 3 - count);
    const snapshot: Prisma.InputJsonValue = {
      source: MARKER,
      bookingId,
    };

    for (let i = 0; i < need; i++) {
      await this.dispatchDecisionService.recordDecision({
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

  private async ensureOpsAlert(bookingId: string) {
    const fingerprint = `${MARKER}_anomaly`;
    const existing = await this.prisma.opsAlert.findFirst({
      where: { fingerprint },
    });
    if (existing) {
      return;
    }

    await this.prisma.opsAlert.create({
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

  private async ensureExceptionBookingOperatorNote(bookingId: string, adminUserId: string) {
    const noteText = `${MARKER}_exception_operator_note: deterministic command center seed`;

    const existing = await this.prisma.dispatchOperatorNote.findFirst({
      where: {
        bookingId,
        note: { contains: `${MARKER}_exception_operator_note` },
      },
    });
    if (!existing) {
      await this.prisma.dispatchOperatorNote.create({
        data: {
          bookingId,
          adminUserId,
          note: noteText,
        },
      });
    }

    await this.prisma.bookingDispatchControl.upsert({
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

  private async ensureCommandCenterMutationBookings(args: {
    customerId: string;
    fo1Id: string;
    adminId: string;
  }) {
    const seedNote = `${MARKER}_cc_mutation_seed_note`;

    const bOperatorNote = await this.ensureBooking({
      customerId: args.customerId,
      notes: NOTE_CC_OPERATOR_NOTE,
      status: "pending_dispatch",
      foId: null,
    });
    await this.prisma.bookingDispatchControl.upsert({
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
    await this.ensureOpsAlertForBooking(
      bOperatorNote.id,
      `${MARKER}_cc_alert_operator_note`,
    );

    const bHold = await this.ensureBooking({
      customerId: args.customerId,
      notes: NOTE_CC_HOLD,
      status: "pending_dispatch",
      foId: null,
    });
    await this.resetCommandCenterOpen(bHold.id);
    await this.ensureOpsAlertForBooking(bHold.id, `${MARKER}_cc_alert_hold`);

    const bReview = await this.ensureBooking({
      customerId: args.customerId,
      notes: NOTE_CC_REVIEW,
      status: "pending_dispatch",
      foId: null,
    });
    await this.resetCommandCenterOpen(bReview.id);
    await this.ensureOpsAlertForBooking(bReview.id, `${MARKER}_cc_alert_review`);

    const bApprove = await this.ensureBooking({
      customerId: args.customerId,
      notes: NOTE_CC_APPROVE,
      status: "pending_dispatch",
      foId: null,
    });
    await this.prisma.bookingDispatchControl.upsert({
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
    await this.ensureOpsAlertForBooking(bApprove.id, `${MARKER}_cc_alert_approve`);
    await this.patchOpsAlertPayloadAdminReviewState(
      `${MARKER}_cc_alert_approve`,
      "in_review",
    );

    const bReassign = await this.ensureBooking({
      customerId: args.customerId,
      notes: NOTE_CC_REASSIGN,
      status: "assigned",
      foId: args.fo1Id,
    });
    await this.prisma.bookingDispatchControl.upsert({
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
    await this.ensureOpsAlertForBooking(bReassign.id, `${MARKER}_cc_alert_reassign`);

    return {
      operatorNote: bOperatorNote.id,
      hold: bHold.id,
      markReview: bReview.id,
      approve: bApprove.id,
      reassign: bReassign.id,
    };
  }

  private async resetCommandCenterOpen(bookingId: string) {
    await this.prisma.bookingDispatchControl.upsert({
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

  private async patchOpsAlertPayloadAdminReviewState(fingerprint: string, state: string) {
    const row = await this.prisma.opsAlert.findFirst({ where: { fingerprint } });
    if (!row?.payloadJson) return;
    try {
      const obj = JSON.parse(String(row.payloadJson)) as Record<string, unknown>;
      obj.adminReviewState = state;
      await this.prisma.opsAlert.update({
        where: { id: row.id },
        data: { payloadJson: JSON.stringify(obj) },
      });
    } catch {
      // ignore malformed legacy payloads
    }
  }

  private async ensureOpsAlertForBooking(bookingId: string, fingerprint: string) {
    const existing = await this.prisma.opsAlert.findFirst({
      where: { fingerprint },
    });
    const payload = JSON.stringify({ marker: MARKER, bookingId });
    const now = new Date();
    if (existing) {
      await this.prisma.opsAlert.update({
        where: { id: existing.id },
        data: {
          bookingId,
          status: OpsAlertStatus.open,
          resolvedAt: null,
          resolvedByAdminId: null,
          resolveNote: null,
          payloadJson: payload,
          // Keep seeded alerts inside default inbox windows (sinceHours) for Playwright/UI.
          lastSeenAt: now,
        },
      });
      return;
    }

    await this.prisma.opsAlert.create({
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

  private async ensureSeededCommandCenterActivityRow(bookingId: string, adminUserId: string) {
    const exists = await this.prisma.adminCommandCenterActivity.findFirst({
      where: {
        bookingId,
        type: ADMIN_CC_ACTIVITY.NOTE_SAVED,
        summary: { contains: `${MARKER}_activity_cc_seed` },
      },
    });
    if (exists) {
      return;
    }

    await this.prisma.adminCommandCenterActivity.create({
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

  private async ensureActivityNote(bookingId: string, adminUserId: string) {
    const existing = await this.prisma.dispatchOperatorNote.findFirst({
      where: {
        bookingId,
        note: { contains: `${MARKER}_activity_note` },
      },
    });
    if (existing) {
      return;
    }

    await this.prisma.dispatchOperatorNote.create({
      data: {
        bookingId,
        adminUserId,
        note: `${MARKER}_activity_note: seeded for admin activity feed`,
      },
    });
  }

  private async ensurePlaywrightDraftConfig(adminUserId: string) {
    await this.dispatchConfigService.getActiveConfig();
    await this.dispatchConfigService.getDraftConfig();

    const existing = await this.prisma.dispatchConfig.findFirst({
      where: {
        status: "draft",
        label: { contains: MARKER },
      },
    });
    if (existing) {
      return;
    }

    const active = await this.prisma.dispatchConfig.findFirst({
      where: { status: "active" },
      orderBy: { version: "desc" },
    });
    if (!active) {
      return;
    }

    const maxVersion = await this.prisma.dispatchConfig.aggregate({
      _max: { version: true },
    });
    const version = (maxVersion._max.version ?? 0) + 1;

    await this.prisma.dispatchConfig.create({
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
}
