import { Injectable, Logger } from "@nestjs/common";
import {
  BookingEventType,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import type { PublicBookingFunnelMilestoneDto } from "./dto/public-booking-funnel-milestone.dto";
import { PUBLIC_BOOKING_FUNNEL_MILESTONE_KEYS } from "./public-booking-funnel-milestone.constants";

type MilestoneKey = (typeof PUBLIC_BOOKING_FUNNEL_MILESTONE_KEYS)[number];

const INTAKE_MILESTONE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const INTAKE_FUNNEL_LIST_CAP = 48;

const DISALLOWED_BOOKING_STATUS = new Set<BookingStatus>([
  BookingStatus.canceled,
  BookingStatus.cancelled,
  BookingStatus.completed,
]);

function isDuplicateBookingEventIdempotencyError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  if (!target) {
    return false;
  }
  if (Array.isArray(target)) {
    const normalizedTarget = target.map((part) => String(part)).join("_");
    return (
      normalizedTarget.includes("bookingId_idempotencyKey") ||
      (target.includes("bookingId") && target.includes("idempotencyKey"))
    );
  }
  if (typeof target === "string") {
    return (
      target.includes("bookingId_idempotencyKey") ||
      (target.includes("bookingId") && target.includes("idempotencyKey"))
    );
  }
  return false;
}

function clampStr(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  return s.slice(0, max);
}

function sanitizeMilestonePayload(
  payload: Record<string, unknown> | undefined,
): Prisma.InputJsonValue {
  const cadence = clampStr(payload?.cadence, 64);
  const surface = clampStr(payload?.surface, 64);
  const paymentSessionKey = clampStr(payload?.paymentSessionKey, 160);
  const teamId = clampStr(payload?.teamId, 128);
  const slotId = clampStr(payload?.slotId, 160);
  const holdId = clampStr(payload?.holdId, 160);
  const reasonCode = clampStr(payload?.reasonCode, 96);
  const phase = clampStr(payload?.phase, 96);
  const out: Record<string, string> = {};
  if (cadence) out.cadence = cadence;
  if (surface) out.surface = surface;
  if (paymentSessionKey) out.paymentSessionKey = paymentSessionKey;
  if (teamId) out.teamId = teamId;
  if (slotId) out.slotId = slotId;
  if (holdId) out.holdId = holdId;
  if (reasonCode) out.reasonCode = reasonCode;
  if (phase) out.phase = phase;
  return out as Prisma.InputJsonValue;
}

@Injectable()
export class PublicBookingFunnelMilestoneService {
  private readonly log = new Logger(PublicBookingFunnelMilestoneService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Best-effort durable echo. Invalid booking/intake refs are ignored (204) to avoid enumeration noise.
   */
  async record(dto: PublicBookingFunnelMilestoneDto): Promise<void> {
    const bookingId = dto.bookingId?.trim() || "";
    const intakeId = dto.intakeId?.trim() || "";
    if (!bookingId && !intakeId) {
      return;
    }
    const milestone = dto.milestone as MilestoneKey;
    if (milestone === "DEPOSIT_SUCCEEDED") {
      return;
    }
    const payloadObj =
      dto.payload && typeof dto.payload === "object" && !Array.isArray(dto.payload)
        ? (dto.payload as Record<string, unknown>)
        : undefined;
    const safePayload = sanitizeMilestonePayload(payloadObj);

    let wroteBooking = false;
    if (bookingId) {
      wroteBooking = await this.tryWriteBookingMilestone({
        milestone,
        bookingId,
        payload: safePayload,
      });
    }

    if (intakeId && !wroteBooking) {
      await this.tryAppendIntakeMilestone(intakeId, milestone, safePayload);
    }
  }

  /** Called from deposit prepare when the card UI can be shown (server-side truth). */
  async recordDepositUiReached(args: {
    bookingId: string;
    paymentIntentId: string;
  }): Promise<void> {
    const bookingId = args.bookingId.trim();
    const paymentIntentId = args.paymentIntentId.trim();
    if (!bookingId || !paymentIntentId) return;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true },
    });
    if (!booking || DISALLOWED_BOOKING_STATUS.has(booking.status)) {
      return;
    }

    const idempotencyKey = `pb-funnel:deposit_ui:${bookingId}`;
    try {
      await this.prisma.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey,
          note: "Public booking deposit UI reached",
          payload: {
            funnelMilestone: "DEPOSIT_UI_REACHED",
            paymentIntentId,
          } as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      if (!isDuplicateBookingEventIdempotencyError(err)) {
        this.log.warn(
          `recordDepositUiReached failed booking=${bookingId} pi=${paymentIntentId}`,
        );
      }
    }
  }

  private async tryWriteBookingMilestone(args: {
    milestone: MilestoneKey;
    bookingId: string;
    payload: Prisma.InputJsonValue;
  }): Promise<boolean> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: args.bookingId },
      select: { id: true, status: true },
    });
    if (!booking || DISALLOWED_BOOKING_STATUS.has(booking.status)) {
      return false;
    }

    switch (args.milestone) {
      case "REVIEW_VIEWED":
        return this.createIdempotentNote({
          bookingId: args.bookingId,
          idempotencyKey: `pb-funnel:review_viewed:${args.bookingId}`,
          note: "Public booking review viewed",
          payload: {
            funnelMilestone: "REVIEW_VIEWED",
            ...(typeof args.payload === "object" &&
            args.payload !== null &&
            !Array.isArray(args.payload)
              ? (args.payload as object)
              : {}),
          } as Prisma.InputJsonValue,
        });
      case "REVIEW_SUBMITTED":
        return this.createIdempotentNote({
          bookingId: args.bookingId,
          idempotencyKey: `pb-funnel:review_submitted:${args.bookingId}`,
          note: "Public booking review submitted",
          payload: {
            funnelMilestone: "REVIEW_SUBMITTED",
            ...(typeof args.payload === "object" &&
            args.payload !== null &&
            !Array.isArray(args.payload)
              ? (args.payload as object)
              : {}),
          } as Prisma.InputJsonValue,
        });
      case "SCHEDULE_REACHED":
        return this.createIdempotentNote({
          bookingId: args.bookingId,
          idempotencyKey: `pb-funnel:schedule_reached:${args.bookingId}`,
          note: "Public booking schedule step reached",
          payload: {
            funnelMilestone: "SCHEDULE_REACHED",
            ...(typeof args.payload === "object" &&
            args.payload !== null &&
            !Array.isArray(args.payload)
              ? (args.payload as object)
              : {}),
          } as Prisma.InputJsonValue,
        });
      case "TEAM_SELECTED": {
        const obj = args.payload as Record<string, unknown>;
        const teamId =
          typeof obj?.teamId === "string" ? obj.teamId.trim().slice(0, 128) : "";
        if (!teamId) return false;
        return this.createIdempotentNote({
          bookingId: args.bookingId,
          idempotencyKey: `pb-funnel:team_selected:${args.bookingId}:${teamId}`,
          note: "Public booking team selected",
          payload: {
            funnelMilestone: "TEAM_SELECTED",
            teamId,
          } as Prisma.InputJsonValue,
        });
      }
      case "SLOT_SELECTED": {
        const obj = args.payload as Record<string, unknown>;
        const teamId =
          typeof obj?.teamId === "string" ? obj.teamId.trim().slice(0, 128) : "";
        const slotId =
          typeof obj?.slotId === "string" ? obj.slotId.trim().slice(0, 160) : "";
        if (!teamId && !slotId) return false;
        return this.createIdempotentNote({
          bookingId: args.bookingId,
          idempotencyKey: `pb-funnel:slot_selected:${args.bookingId}:${slotId || teamId}`,
          note: "Public booking slot selected",
          payload: {
            funnelMilestone: "SLOT_SELECTED",
            ...(teamId ? { teamId } : {}),
            ...(slotId ? { slotId } : {}),
          } as Prisma.InputJsonValue,
        });
      }
      case "HOLD_CREATED": {
        const obj = args.payload as Record<string, unknown>;
        const holdId =
          typeof obj?.holdId === "string" ? obj.holdId.trim().slice(0, 160) : "";
        if (!holdId) return false;
        return this.createIdempotentNote({
          bookingId: args.bookingId,
          idempotencyKey: `pb-funnel:hold_created:${args.bookingId}:${holdId}`,
          note: "Public booking slot hold created",
          payload: {
            funnelMilestone: "HOLD_CREATED",
            holdId,
          } as Prisma.InputJsonValue,
        });
      }
      case "HOLD_FAILED":
        await this.createEphemeralNote({
          bookingId: args.bookingId,
          note: "Public booking slot hold failed",
          payload: {
            funnelMilestone: "HOLD_FAILED",
            ...(typeof args.payload === "object" &&
            args.payload !== null &&
            !Array.isArray(args.payload)
              ? (args.payload as object)
              : {}),
          } as Prisma.InputJsonValue,
        });
        return true;
      case "CONFIRM_FAILED":
        await this.createEphemeralNote({
          bookingId: args.bookingId,
          note: "Public booking confirmation failed",
          payload: {
            funnelMilestone: "CONFIRM_FAILED",
            ...(typeof args.payload === "object" &&
            args.payload !== null &&
            !Array.isArray(args.payload)
              ? (args.payload as object)
              : {}),
          } as Prisma.InputJsonValue,
        });
        return true;
      case "BOOKING_CONFIRMED":
        return this.createIdempotentNote({
          bookingId: args.bookingId,
          idempotencyKey: `pb-funnel:booking_confirmed:${args.bookingId}`,
          note: "Public booking confirmed from funnel",
          payload: {
            funnelMilestone: "BOOKING_CONFIRMED",
            ...(typeof args.payload === "object" &&
            args.payload !== null &&
            !Array.isArray(args.payload)
              ? (args.payload as object)
              : {}),
          } as Prisma.InputJsonValue,
        });
      case "REVIEW_ABANDONED":
        await this.createEphemeralNote({
          bookingId: args.bookingId,
          note: "Public booking review abandon signal",
          payload: {
            funnelMilestone: "REVIEW_ABANDONED",
            ...(typeof args.payload === "object" &&
            args.payload !== null &&
            !Array.isArray(args.payload)
              ? (args.payload as object)
              : {}),
          } as Prisma.InputJsonValue,
        });
        return true;
      case "DEPOSIT_SUBMIT_INITIATED": {
        const obj = args.payload as Record<string, unknown>;
        const sessionKey =
          typeof obj?.paymentSessionKey === "string"
            ? obj.paymentSessionKey.trim().slice(0, 160)
            : "";
        if (!sessionKey) {
          return false;
        }
        return this.createIdempotentNote({
          bookingId: args.bookingId,
          idempotencyKey: `pb-funnel:deposit_submit:${args.bookingId}:${sessionKey}`,
          note: "Public booking deposit submission initiated",
          payload: {
            funnelMilestone: "DEPOSIT_SUBMIT_INITIATED",
            paymentSessionKey: sessionKey,
          } as Prisma.InputJsonValue,
        });
      }
      case "BOOKING_REENTRY":
        await this.createEphemeralNote({
          bookingId: args.bookingId,
          note: "Public booking funnel reentry",
          payload: {
            funnelMilestone: "BOOKING_REENTRY",
            ...(typeof args.payload === "object" &&
            args.payload !== null &&
            !Array.isArray(args.payload)
              ? (args.payload as object)
              : {}),
          } as Prisma.InputJsonValue,
        });
        return true;
      case "RECURRING_CADENCE_SELECTED": {
        const obj = args.payload as Record<string, unknown>;
        const cadence =
          typeof obj?.cadence === "string" ? obj.cadence.trim().slice(0, 64) : "";
        if (!cadence) {
          return false;
        }
        return this.createIdempotentNote({
          bookingId: args.bookingId,
          idempotencyKey: `pb-funnel:recurring_cadence:${args.bookingId}:${cadence}`,
          note: "Public booking recurring cadence selected",
          payload: {
            funnelMilestone: "RECURRING_CADENCE_SELECTED",
            cadence,
          } as Prisma.InputJsonValue,
        });
      }
      case "DEPOSIT_UI_REACHED":
        // Server-authoritative; ignore client echoes.
        return true;
      default:
        return false;
    }
  }

  private async createIdempotentNote(args: {
    bookingId: string;
    idempotencyKey: string;
    note: string;
    payload: Prisma.InputJsonValue;
  }): Promise<boolean> {
    try {
      await this.prisma.bookingEvent.create({
        data: {
          bookingId: args.bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey: args.idempotencyKey,
          note: args.note,
          payload: args.payload,
        },
      });
      return true;
    } catch (err) {
      if (isDuplicateBookingEventIdempotencyError(err)) {
        return true;
      }
      this.log.warn(
        `createIdempotentNote failed booking=${args.bookingId} key=${args.idempotencyKey}`,
      );
      return false;
    }
  }

  private async createEphemeralNote(args: {
    bookingId: string;
    note: string;
    payload: Prisma.InputJsonValue;
  }): Promise<void> {
    try {
      await this.prisma.bookingEvent.create({
        data: {
          bookingId: args.bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey: null,
          note: args.note,
          payload: args.payload,
        },
      });
    } catch (err) {
      this.log.warn(`createEphemeralNote failed booking=${args.bookingId}`);
    }
  }

  private async tryAppendIntakeMilestone(
    intakeId: string,
    milestone: MilestoneKey,
    payload: Prisma.InputJsonValue,
  ): Promise<void> {
    if (
      milestone === "DEPOSIT_UI_REACHED" ||
      milestone === "DEPOSIT_SUBMIT_INITIATED" ||
      milestone === "DEPOSIT_SUCCEEDED"
    ) {
      return;
    }

    if (milestone === "RECURRING_CADENCE_SELECTED") {
      const p = payload as Record<string, unknown>;
      const cadence = typeof p.cadence === "string" ? p.cadence.trim() : "";
      if (!cadence) {
        return;
      }
    }

    const intake = await this.prisma.bookingDirectionIntake.findUnique({
      where: { id: intakeId },
      select: { id: true, createdAt: true, funnelMilestones: true },
    });
    if (!intake) {
      return;
    }
    if (
      Date.now() - intake.createdAt.getTime() >
      INTAKE_MILESTONE_MAX_AGE_MS
    ) {
      return;
    }

    const row = {
      at: new Date().toISOString(),
      k: milestone,
      p: payload,
    };

    const prev = intake.funnelMilestones;
    const list: unknown[] = Array.isArray(prev) ? [...prev] : [];
    list.push(row);
    const capped = list.slice(-INTAKE_FUNNEL_LIST_CAP);

    try {
      await this.prisma.bookingDirectionIntake.update({
        where: { id: intakeId },
        data: { funnelMilestones: capped as Prisma.InputJsonValue },
      });
    } catch (err) {
      this.log.warn(`tryAppendIntakeMilestone failed intake=${intakeId}`);
    }
  }
}
