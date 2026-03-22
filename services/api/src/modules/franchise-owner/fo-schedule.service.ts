import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FoScheduleService {
  constructor(private prisma: PrismaService) {}

  async setWeeklySchedule(foId: string, schedule: any[]) {
    await this.prisma.foSchedule.deleteMany({
      where: { franchiseOwnerId: foId },
    });

    return this.prisma.foSchedule.createMany({
      data: schedule.map((s) => ({
        franchiseOwnerId: foId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    });
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
