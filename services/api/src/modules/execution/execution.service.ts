import { BadRequestException, Injectable } from "@nestjs/common";
import { OpsAnomalyStatus, OpsAnomalyType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { TrustService } from "../trust/trust.service";

@Injectable()
export class ExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trustService: TrustService,
  ) {}

  async startJob(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        foId: true,
        status: true,
        startedAt: true,
      },
    });

    if (!booking) {
      throw new BadRequestException("Booking not found");
    }

    if (booking.startedAt) {
      throw new BadRequestException("Job already started");
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "active",
        startedAt: new Date(),
      },
    });

    await this.trustService.recordEvent({
      bookingId,
      foId: booking.foId ?? null,
      type: "start",
      payload: { source: "execution_service" },
    });

    return updated;
  }

  async completeJob(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        foId: true,
        status: true,
        startedAt: true,
        completedAt: true,
      },
    });

    if (!booking) {
      throw new BadRequestException("Booking not found");
    }

    if (!booking.startedAt) {
      await this.prisma.opsAnomaly.create({
        data: {
          bookingId,
          foId: booking.foId ?? null,
          type: OpsAnomalyType.execution_missing_start,
          title: "Completion attempted before start",
          detail: "Job completion was attempted before a start event existed.",
          status: OpsAnomalyStatus.open,
        },
      });

      throw new BadRequestException("Cannot complete job before start");
    }

    if (booking.completedAt) {
      throw new BadRequestException("Job already completed");
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    await this.trustService.recordEvent({
      bookingId,
      foId: booking.foId ?? null,
      type: "complete",
      payload: { source: "execution_service" },
    });

    return updated;
  }

  async recordIncident(input: {
    bookingId: string;
    foId?: string | null;
    detail: string;
  }) {
    await this.trustService.recordEvent({
      bookingId: input.bookingId,
      foId: input.foId ?? null,
      type: "incident",
      payload: { detail: input.detail },
    });

    return this.prisma.opsAnomaly.create({
      data: {
        bookingId: input.bookingId,
        foId: input.foId ?? null,
        type: OpsAnomalyType.trust_incident_spike,
        title: "Execution incident recorded",
        detail: input.detail,
        status: OpsAnomalyStatus.open,
      },
    });
  }
}
