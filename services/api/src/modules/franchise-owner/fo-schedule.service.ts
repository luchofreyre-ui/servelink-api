import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { foActivationGuardAls } from "../fo/fo-activation-context";
import {
  activationEvaluationFromFranchiseOwnerRow,
  isFranchiseOwnerInActiveBookingPool,
  throwIfFoActivationBlocked,
} from "../fo/fo-activation-guard";

@Injectable()
export class FoScheduleService {
  constructor(private prisma: PrismaService) {}

  async setWeeklySchedule(foId: string, schedule: any[]) {
    const before = await this.prisma.franchiseOwner.findUnique({
      where: { id: foId },
      include: { _count: { select: { foSchedules: true } } },
    });
    if (!before) {
      throw new BadRequestException("FO_NOT_FOUND");
    }

    if (
      isFranchiseOwnerInActiveBookingPool(before) &&
      (!Array.isArray(schedule) || schedule.length === 0)
    ) {
      throw new BadRequestException({
        code: "FO_ACTIVATION_BLOCKED",
        reasons: ["FO_NO_SCHEDULING_SOURCE"],
        message:
          "Cannot clear weekly schedule while the franchise owner is active. Pause the FO first or provide at least one schedule row.",
      });
    }

    await foActivationGuardAls.run({ bypassScheduleCoherence: true }, async () => {
      await this.prisma.$transaction(async (tx) => {
        await tx.foSchedule.deleteMany({
          where: { franchiseOwnerId: foId },
        });
        await tx.foSchedule.createMany({
          data: schedule.map((s) => ({
            franchiseOwnerId: foId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      });
    });

    const after = await this.prisma.franchiseOwner.findUnique({
      where: { id: foId },
      include: {
        _count: { select: { foSchedules: true } },
        provider: { select: { userId: true } },
      },
    });
    if (after) {
      throwIfFoActivationBlocked(
        activationEvaluationFromFranchiseOwnerRow(after),
      );
    }
  }

  async addBlockout(foId: string, start: Date, end: Date, reason?: string) {
    return this.prisma.foBlockout.create({
      data: {
        franchiseOwnerId: foId,
        start,
        end,
        reason,
      },
    });
  }

  async isAvailable(foId: string, date: Date) {
    const block = await this.prisma.foBlockout.findFirst({
      where: {
        franchiseOwnerId: foId,
        start: { lte: date },
        end: { gte: date },
      },
    });

    if (block) return false;

    const day = date.getDay();

    const schedule = await this.prisma.foSchedule.findFirst({
      where: {
        franchiseOwnerId: foId,
        dayOfWeek: day,
      },
    });

    if (!schedule) return false;

    const hour = date.getHours();

    const startHour = parseInt(schedule.startTime.split(":")[0]);
    const endHour = parseInt(schedule.endTime.split(":")[0]);

    return hour >= startHour && hour < endHour;
  }
}
