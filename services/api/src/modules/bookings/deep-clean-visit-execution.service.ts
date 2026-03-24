import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  type BookingDeepCleanProgram,
  DeepCleanVisitExecutionStatus,
  type BookingDeepCleanVisitExecution,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { DeepCleanCalibrationService } from "./deep-clean-calibration.service";
import type { DeepCleanVisitExecutionResponseDto } from "./dto/deep-clean-visit-execution.dto";

function visitNumbersFromProgram(program: BookingDeepCleanProgram): number[] {
  try {
    const parsed = JSON.parse(program.visitsJson) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const nums = parsed.map((v: { visitIndex?: number }, i: number) => {
        if (typeof v?.visitIndex === "number" && Number.isFinite(v.visitIndex)) {
          return Math.max(1, Math.floor(v.visitIndex));
        }
        return i + 1;
      });
      const unique = [...new Set(nums)].sort((a, b) => a - b);
      if (unique.length > 0) return unique;
    }
  } catch {
    /* fall through */
  }
  return Array.from({ length: program.visitCount }, (_, i) => i + 1);
}

function toResponseDto(
  row: BookingDeepCleanVisitExecution,
): DeepCleanVisitExecutionResponseDto {
  const status =
    row.status === DeepCleanVisitExecutionStatus.completed
      ? "completed"
      : row.status === DeepCleanVisitExecutionStatus.in_progress
        ? "in_progress"
        : "not_started";
  return {
    visitNumber: row.visitNumber,
    status,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    actualDurationMinutes: row.actualDurationMinutes,
    operatorNote: row.operatorNote,
  };
}

@Injectable()
export class DeepCleanVisitExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calibration: DeepCleanCalibrationService,
  ) {}

  /**
   * Creates missing execution rows for each visit in the persisted program. Idempotent.
   */
  async ensureExecutionRowsForBooking(bookingId: string): Promise<void> {
    const program = await this.prisma.bookingDeepCleanProgram.findUnique({
      where: { bookingId },
    });
    if (!program) return;

    const visitNumbers = visitNumbersFromProgram(program);
    for (const visitNumber of visitNumbers) {
      const existing =
        await this.prisma.bookingDeepCleanVisitExecution.findUnique({
          where: {
            bookingId_visitNumber: { bookingId, visitNumber },
          },
        });
      if (existing) continue;
      await this.prisma.bookingDeepCleanVisitExecution.create({
        data: {
          bookingId,
          programId: program.id,
          visitNumber,
          status: DeepCleanVisitExecutionStatus.not_started,
        },
      });
    }
  }

  async getExecutionRowsForBooking(bookingId: string) {
    return this.prisma.bookingDeepCleanVisitExecution.findMany({
      where: { bookingId },
      orderBy: { visitNumber: "asc" },
    });
  }

  async startVisit(input: {
    bookingId: string;
    visitNumber: number;
    actorUserId: string | null;
  }): Promise<DeepCleanVisitExecutionResponseDto> {
    void input.actorUserId;
    const program = await this.requireDeepCleanProgram(input.bookingId);
    const valid = visitNumbersFromProgram(program);
    if (!valid.includes(input.visitNumber)) {
      throw new BadRequestException("DEEP_CLEAN_VISIT_NOT_IN_PROGRAM");
    }

    await this.ensureExecutionRowsForBooking(input.bookingId);

    const row = await this.prisma.bookingDeepCleanVisitExecution.findUnique({
      where: {
        bookingId_visitNumber: {
          bookingId: input.bookingId,
          visitNumber: input.visitNumber,
        },
      },
    });
    if (!row) {
      throw new NotFoundException("DEEP_CLEAN_VISIT_EXECUTION_NOT_FOUND");
    }

    if (row.status === DeepCleanVisitExecutionStatus.completed) {
      throw new BadRequestException("DEEP_CLEAN_VISIT_ALREADY_COMPLETED");
    }

    if (row.status === DeepCleanVisitExecutionStatus.in_progress) {
      await this.calibration.syncCalibrationForBooking(input.bookingId);
      return toResponseDto(row);
    }

    const now = new Date();
    const updated = await this.prisma.bookingDeepCleanVisitExecution.update({
      where: { id: row.id },
      data: {
        status: DeepCleanVisitExecutionStatus.in_progress,
        startedAt: row.startedAt ?? now,
      },
    });
    await this.calibration.syncCalibrationForBooking(input.bookingId);
    return toResponseDto(updated);
  }

  async completeVisit(input: {
    bookingId: string;
    visitNumber: number;
    actualDurationMinutes: number | null;
    operatorNote: string | null;
    actorUserId: string | null;
  }): Promise<DeepCleanVisitExecutionResponseDto> {
    void input.actorUserId;
    const program = await this.requireDeepCleanProgram(input.bookingId);
    const valid = visitNumbersFromProgram(program);
    if (!valid.includes(input.visitNumber)) {
      throw new BadRequestException("DEEP_CLEAN_VISIT_NOT_IN_PROGRAM");
    }

    await this.ensureExecutionRowsForBooking(input.bookingId);

    const row = await this.prisma.bookingDeepCleanVisitExecution.findUnique({
      where: {
        bookingId_visitNumber: {
          bookingId: input.bookingId,
          visitNumber: input.visitNumber,
        },
      },
    });
    if (!row) {
      throw new NotFoundException("DEEP_CLEAN_VISIT_EXECUTION_NOT_FOUND");
    }

    if (row.status === DeepCleanVisitExecutionStatus.completed) {
      await this.calibration.syncCalibrationForBooking(input.bookingId);
      return toResponseDto(row);
    }

    if (row.status !== DeepCleanVisitExecutionStatus.in_progress) {
      throw new BadRequestException("DEEP_CLEAN_VISIT_NOT_IN_PROGRESS");
    }

    const now = new Date();
    const note =
      input.operatorNote != null && String(input.operatorNote).trim()
        ? String(input.operatorNote).trim()
        : null;

    const duration =
      typeof input.actualDurationMinutes === "number" &&
      Number.isFinite(input.actualDurationMinutes)
        ? Math.max(0, Math.floor(input.actualDurationMinutes))
        : null;

    const updated = await this.prisma.bookingDeepCleanVisitExecution.update({
      where: { id: row.id },
      data: {
        status: DeepCleanVisitExecutionStatus.completed,
        completedAt: now,
        actualDurationMinutes: duration,
        operatorNote: note,
      },
    });
    await this.calibration.syncCalibrationForBooking(input.bookingId);
    return toResponseDto(updated);
  }

  private async requireDeepCleanProgram(
    bookingId: string,
  ): Promise<BookingDeepCleanProgram> {
    const program = await this.prisma.bookingDeepCleanProgram.findUnique({
      where: { bookingId },
    });
    if (!program) {
      throw new BadRequestException("BOOKING_HAS_NO_DEEP_CLEAN_PROGRAM");
    }
    return program;
  }
}
