import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingAuthorityReviewStatus, BookingStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma";
import {
  mergePayloadJson,
  toCommandCenterPayload,
  type CommandCenterRow,
} from "./admin-booking-command-center.mapper";
import type {
  AdminBookingAuthorityBlock,
  AdminBookingCommandCenterPayload,
} from "./admin-booking-command-center.types";
import { BookingAuthorityPersistenceService } from "../../authority/booking-authority-persistence.service";
import { BookingIntelligenceService } from "../../authority/booking-intelligence.service";
import { toBookingAuthorityListItem } from "../../authority/dto/booking-authority-admin.dto";

export const ADMIN_CC_ACTIVITY = {
  NOTE_SAVED: "admin_operator_note_saved",
  HELD: "admin_booking_held",
  IN_REVIEW: "admin_booking_marked_in_review",
  APPROVED: "admin_booking_approved",
  REASSIGN: "admin_booking_reassign_requested",
} as const;

const NON_REASSIGN_STATUSES: BookingStatus[] = [
  "pending_payment",
  "in_progress",
  "completed",
  "canceled",
];

@Injectable()
export class AdminBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingAuthorityPersistence: BookingAuthorityPersistenceService,
    private readonly bookingIntelligence: BookingIntelligenceService,
  ) {}

  async getCommandCenter(bookingId: string): Promise<AdminBookingCommandCenterPayload> {
    const row = await this.loadRow(bookingId);
    if (!row) {
      throw new NotFoundException("Booking not found");
    }
    const authority = await this.buildAdminBookingAuthorityBlock(
      bookingId,
      row.booking.notes ?? null,
    );
    return { ...toCommandCenterPayload(row), authority };
  }

  async updateOperatorNote(
    adminUserId: string,
    bookingId: string,
    note: string,
  ): Promise<AdminBookingCommandCenterPayload> {
    const trimmed = note.trim();
    if (!trimmed) {
      throw new BadRequestException("note must not be empty");
    }

    await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: { id: true },
      });
      if (!booking) {
        throw new NotFoundException("Booking not found");
      }

      const before = await tx.bookingDispatchControl.findUnique({
        where: { bookingId },
        select: { commandCenterOperatorNote: true },
      });

      await tx.bookingDispatchControl.upsert({
        where: { bookingId },
        create: {
          bookingId,
          holdActive: false,
          reviewRequired: false,
          commandCenterOperatorNote: trimmed,
        },
        update: {
          commandCenterOperatorNote: trimmed,
        },
      });

      await tx.adminCommandCenterActivity.create({
        data: {
          bookingId,
          actorUserId: adminUserId,
          actorRole: "admin",
          type: ADMIN_CC_ACTIVITY.NOTE_SAVED,
          summary: `Operator note updated for booking ${bookingId}.`,
          metadata: {
            priorLength: before?.commandCenterOperatorNote?.length ?? 0,
            newLength: trimmed.length,
          } as Prisma.InputJsonValue,
        },
      });
    });

    return this.getCommandCenter(bookingId);
  }

  async holdBooking(
    adminUserId: string,
    bookingId: string,
  ): Promise<AdminBookingCommandCenterPayload> {
    await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: { id: true },
      });
      if (!booking) {
        throw new NotFoundException("Booking not found");
      }

      const control = await tx.bookingDispatchControl.findUnique({
        where: { bookingId },
      });
      if (control?.holdActive) {
        throw new BadRequestException("Booking is already on hold.");
      }

      await tx.bookingDispatchControl.upsert({
        where: { bookingId },
        create: {
          bookingId,
          holdActive: true,
          holdReason: "Admin hold via command center",
          holdSource: "admin_command_center",
          holdSetByAdminId: adminUserId,
          holdSetAt: new Date(),
          holdReleasedAt: null,
          reviewRequired: false,
          workflowState: "held",
        },
        update: {
          holdActive: true,
          holdReason: "Admin hold via command center",
          holdSource: "admin_command_center",
          holdSetByAdminId: adminUserId,
          holdSetAt: new Date(),
          holdReleasedAt: null,
          workflowState: "held",
        },
      });

      await this.patchPrimaryAnomalyTx(tx, bookingId, {
        commandCenterHeld: true,
      });

      await tx.adminCommandCenterActivity.create({
        data: {
          bookingId,
          actorUserId: adminUserId,
          actorRole: "admin",
          type: ADMIN_CC_ACTIVITY.HELD,
          summary: `Booking ${bookingId} placed on admin hold.`,
          metadata: { source: "admin_command_center" } as Prisma.InputJsonValue,
        },
      });
    });

    return this.getCommandCenter(bookingId);
  }

  async markBookingInReview(
    adminUserId: string,
    bookingId: string,
  ): Promise<AdminBookingCommandCenterPayload> {
    await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: { id: true },
      });
      if (!booking) {
        throw new NotFoundException("Booking not found");
      }

      const control = await tx.bookingDispatchControl.findUnique({
        where: { bookingId },
      });
      if (control?.reviewRequired && !control.reviewCompletedAt) {
        throw new BadRequestException("Booking is already marked for review.");
      }

      await tx.bookingDispatchControl.upsert({
        where: { bookingId },
        create: {
          bookingId,
          holdActive: false,
          reviewRequired: true,
          reviewReason: "Admin marked in review via command center",
          reviewSource: "admin_command_center",
          reviewRequestedByAdminId: adminUserId,
          reviewRequestedAt: new Date(),
          reviewCompletedAt: null,
          workflowState: "in_review",
        },
        update: {
          reviewRequired: true,
          reviewReason: "Admin marked in review via command center",
          reviewSource: "admin_command_center",
          reviewRequestedByAdminId: adminUserId,
          reviewRequestedAt: new Date(),
          reviewCompletedAt: null,
          workflowState: "in_review",
        },
      });

      await this.patchPrimaryAnomalyTx(tx, bookingId, {
        adminReviewState: "in_review",
      });

      await tx.adminCommandCenterActivity.create({
        data: {
          bookingId,
          actorUserId: adminUserId,
          actorRole: "admin",
          type: ADMIN_CC_ACTIVITY.IN_REVIEW,
          summary: `Booking ${bookingId} marked in review.`,
          metadata: {
            source: "admin_command_center",
            commandCenterAction: "mark_in_review",
          } as Prisma.InputJsonValue,
        },
      });
    });

    return this.getCommandCenter(bookingId);
  }

  async approveBooking(
    adminUserId: string,
    bookingId: string,
  ): Promise<AdminBookingCommandCenterPayload> {
    await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: { id: true },
      });
      if (!booking) {
        throw new NotFoundException("Booking not found");
      }

      const control = await tx.bookingDispatchControl.findUnique({
        where: { bookingId },
      });
      if (control?.workflowState === "approved") {
        throw new BadRequestException("Booking is already approved.");
      }

      await tx.bookingDispatchControl.upsert({
        where: { bookingId },
        create: {
          bookingId,
          holdActive: false,
          holdReleasedAt: new Date(),
          reviewRequired: false,
          reviewCompletedAt: new Date(),
          workflowState: "approved",
        },
        update: {
          holdActive: false,
          holdReleasedAt: new Date(),
          reviewRequired: false,
          reviewCompletedAt: new Date(),
          workflowState: "approved",
        },
      });

      const anomaly = await this.findPrimaryAnomalyTx(tx, bookingId);
      if (anomaly) {
        await tx.opsAlert.update({
          where: { id: anomaly.id },
          data: {
            status: "acked",
            resolvedAt: new Date(),
            resolvedByAdminId: adminUserId,
            resolveNote: "Approved via admin command center",
            payloadJson: mergePayloadJson(anomaly.payloadJson, {
              adminReviewState: "approved",
            }),
          },
        });
      }

      await tx.adminCommandCenterActivity.create({
        data: {
          bookingId,
          actorUserId: adminUserId,
          actorRole: "admin",
          type: ADMIN_CC_ACTIVITY.APPROVED,
          summary: `Booking ${bookingId} approved in admin workflow.`,
          metadata: { source: "admin_command_center" } as Prisma.InputJsonValue,
        },
      });
    });

    return this.getCommandCenter(bookingId);
  }

  async reassignBooking(
    adminUserId: string,
    bookingId: string,
    dto: { targetFoId?: string },
  ): Promise<AdminBookingCommandCenterPayload> {
    if (dto.targetFoId) {
      throw new BadRequestException(
        "targetFoId is not supported in this drop; use dispatch decisions for targeted reassignment.",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) {
        throw new NotFoundException("Booking not found");
      }
      if (NON_REASSIGN_STATUSES.includes(booking.status)) {
        throw new BadRequestException(
          `Booking cannot be reassigned while status is ${booking.status}.`,
        );
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          foId: null,
          status: "pending_dispatch",
        },
      });

      await this.appendRedispatchDecisionTx(tx, bookingId, adminUserId, booking);

      await tx.bookingDispatchControl.upsert({
        where: { bookingId },
        create: {
          bookingId,
          holdActive: false,
          reviewRequired: false,
          workflowState: "reassign_requested",
        },
        update: {
          workflowState: "reassign_requested",
        },
      });

      await this.patchPrimaryAnomalyTx(tx, bookingId, {
        reassignmentRequested: true,
        adminReviewState: "reassign_requested",
      });

      await tx.adminCommandCenterActivity.create({
        data: {
          bookingId,
          actorUserId: adminUserId,
          actorRole: "admin",
          type: ADMIN_CC_ACTIVITY.REASSIGN,
          summary: `Booking ${bookingId} returned to dispatch queue (reassign).`,
          metadata: {
            source: "admin_command_center",
            priorStatus: booking.status,
            priorFoId: booking.foId,
          } as Prisma.InputJsonValue,
        },
      });
    });

    return this.getCommandCenter(bookingId);
  }

  private async buildAdminBookingAuthorityBlock(
    bookingId: string,
    notes: string | null,
  ): Promise<AdminBookingAuthorityBlock> {
    const persistedRow =
      await this.bookingAuthorityPersistence.findLatestByBookingId(bookingId);
    if (persistedRow) {
      const item = toBookingAuthorityListItem(persistedRow);
      const isOverridden = item.status === BookingAuthorityReviewStatus.overridden;
      return {
        persisted: {
          surfaces: item.surfaces,
          problems: item.problems,
          methods: item.methods,
          status: item.status,
          reviewedByUserId: item.reviewedByUserId,
          reviewedAt: item.reviewedAt,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
        derived: null,
        operatorHints: {
          hasPersistedRow: true,
          persistedStatus: item.status,
          recomputeSkipsOverwrite: isOverridden,
          recomputeMayRefreshPersistedRow: !isOverridden,
          recomputePreviewOnly: false,
        },
      };
    }
    const resolved = this.bookingIntelligence.resolveTags({
      notes: notes ?? "",
    });
    const hasDerived =
      resolved.surfaces.length > 0 ||
      resolved.problems.length > 0 ||
      resolved.methods.length > 0;
    return {
      persisted: null,
      derived: hasDerived
        ? {
            surfaces: resolved.surfaces,
            problems: resolved.problems,
            methods: resolved.methods,
          }
        : null,
      operatorHints: {
        hasPersistedRow: false,
        persistedStatus: null,
        recomputeSkipsOverwrite: false,
        recomputeMayRefreshPersistedRow: false,
        recomputePreviewOnly: true,
      },
    };
  }

  private async loadRow(bookingId: string): Promise<CommandCenterRow | null> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        foId: true,
        notes: true,
        publicDepositStatus: true,
        publicDepositAmountCents: true,
        remainingBalanceAfterDepositCents: true,
        remainingBalanceStatus: true,
        cancellationFeeAmountCents: true,
        depositRefundStatus: true,
      },
    });
    if (!booking) {
      return null;
    }
    const control = await this.prisma.bookingDispatchControl.findUnique({
      where: { bookingId },
    });
    const anomaly = await this.prisma.opsAlert.findFirst({
      where: { bookingId },
      orderBy: { updatedAt: "desc" },
    });
    const activities = await this.prisma.adminCommandCenterActivity.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    const activityPreview = activities.map((a) => ({
      id: a.id,
      type: a.type,
      summary: a.summary,
      actorUserId: a.actorUserId,
      actorRole: a.actorRole,
      createdAt: a.createdAt.toISOString(),
      metadata: (a.metadata as Record<string, unknown>) ?? {},
    }));
    return { booking, control, anomaly, activityPreview };
  }

  private async findPrimaryAnomalyTx(
    tx: Prisma.TransactionClient,
    bookingId: string,
  ) {
    return tx.opsAlert.findFirst({
      where: { bookingId },
      orderBy: { updatedAt: "desc" },
    });
  }

  private async patchPrimaryAnomalyTx(
    tx: Prisma.TransactionClient,
    bookingId: string,
    patch: Record<string, unknown>,
  ) {
    const anomaly = await this.findPrimaryAnomalyTx(tx, bookingId);
    if (!anomaly) {
      return;
    }
    await tx.opsAlert.update({
      where: { id: anomaly.id },
      data: {
        payloadJson: mergePayloadJson(anomaly.payloadJson, patch),
      },
    });
  }

  private async appendRedispatchDecisionTx(
    tx: Prisma.TransactionClient,
    bookingId: string,
    adminId: string,
    booking: {
      status: BookingStatus;
      scheduledStart: Date | null;
      estimatedHours: number | null;
      siteLat: number | null;
      siteLng: number | null;
      foId: string | null;
    },
  ) {
    const latest = await tx.dispatchDecision.findFirst({
      where: { bookingId },
      orderBy: { dispatchSequence: "desc" },
    });
    const dispatchSequence = latest ? latest.dispatchSequence + 1 : 1;
    const redispatchSequence = latest ? latest.redispatchSequence + 1 : 1;
    const bookingSnapshot: Prisma.InputJsonValue = {
      bookingId,
      status: booking.status,
      scheduledStart: booking.scheduledStart?.toISOString() ?? null,
      siteLat: booking.siteLat ?? null,
      siteLng: booking.siteLng ?? null,
      estimatedDurationMin:
        booking.estimatedHours != null
          ? Math.round(booking.estimatedHours * 60)
          : null,
      foId: booking.foId,
    };
    await tx.dispatchDecision.create({
      data: {
        bookingId,
        trigger: "redispatch_manual",
        triggerDetail: "admin_command_center_reassign",
        dispatchSequence,
        redispatchSequence,
        decisionStatus: "deferred",
        scoringVersion: "admin-command-center-v1",
        bookingSnapshot,
        bookingStatusAtDecision: booking.status,
        scheduledStart: booking.scheduledStart,
        estimatedDurationMin:
          booking.estimatedHours != null
            ? Math.round(booking.estimatedHours * 60)
            : null,
        decisionMeta: {
          adminId,
          source: "admin_command_center",
        } as Prisma.InputJsonValue,
      },
    });
  }

  async overrideAssign(bookingId: string, foId: string) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        foId: foId,
        status: BookingStatus.assigned,
      },
    });
  }

  async getBookingOperationalDetail(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
        },
        trustEvents: {
          orderBy: { createdAt: "desc" },
        },
        opsAnomalies: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!booking) {
      return null;
    }
    const authority = await this.buildAdminBookingAuthorityBlock(
      bookingId,
      booking.notes ?? null,
    );
    return { ...booking, authority };
  }
}
