import { PrismaClient } from "@prisma/client";

export const FO_SCHEDULE_TABLE = "fo_schedule";

export interface FoSchedule {
  id: string;
  franchiseOwnerId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // "08:00"
  endTime: string; // "17:00"
}

export interface FoBlockout {
  id: string;
  franchiseOwnerId: string;
  start: Date;
  end: Date;
  reason?: string;
}
