import { Injectable } from "@nestjs/common";
import {
  type BookingDeepCleanProgram,
  type BookingDeepCleanProgramCalibration,
  type BookingDeepCleanVisitCalibration,
  type BookingDeepCleanVisitExecution,
  DeepCleanVisitExecutionStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";

function visitNumbersFromProgram(program: BookingDeepCleanProgram): number[] {
  try {
    const parsed = JSON.parse(program.visitsJson) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const nums = parsed.map(
        (v: { visitIndex?: number }, i: number) => {
          if (
            typeof v?.visitIndex === "number" &&
            Number.isFinite(v.visitIndex)
          ) {
            return Math.max(1, Math.floor(v.visitIndex));
          }
          return i + 1;
        },
      );
      const unique = [...new Set(nums)].sort((a, b) => a - b);
      if (unique.length > 0) return unique;
    }
  } catch {
    /* fall through */
  }
  return Array.from({ length: program.visitCount }, (_, i) => i + 1);
}

function percentVarianceDecimal(
  actual: number,
  estimated: number,
): Prisma.Decimal | null {
  if (!Number.isFinite(actual) || !Number.isFinite(estimated)) return null;
  if (estimated <= 0) return null;
  const pct = ((actual - estimated) / estimated) * 100;
  const rounded = Math.round(pct * 100) / 100;
  return new Prisma.Decimal(rounded.toFixed(2));
}

type PersistedVisitJson = {
  visitIndex?: number;
  estimatedDurationMinutes?: number;
};

function buildEstimatedMinutesByVisitNumber(args: {
  program: BookingDeepCleanProgram;
  estimateOutputJson: string | null | undefined;
  bookingEstimatedHours: number | null | undefined;
}): Map<number, number> {
  const map = new Map<number, number>();
  const visitCount = Math.max(1, args.program.visitCount);

  try {
    const parsed = JSON.parse(args.program.visitsJson) as unknown;
    if (Array.isArray(parsed)) {
      const visits = parsed as PersistedVisitJson[];
      for (let i = 0; i < visits.length; i++) {
        const v = visits[i];
        const vn =
          typeof v?.visitIndex === "number" && Number.isFinite(v.visitIndex)
            ? Math.max(1, Math.floor(v.visitIndex))
            : i + 1;
        const dm = v?.estimatedDurationMinutes;
        if (typeof dm === "number" && Number.isFinite(dm) && dm >= 0) {
          map.set(vn, Math.floor(dm));
        }
      }
    }
  } catch {
    /* ignore */
  }

  if (args.estimateOutputJson) {
    try {
      const out = JSON.parse(args.estimateOutputJson) as Record<
        string,
        unknown
      >;
      const dcp = out.deepCleanProgram as
        | { visits?: PersistedVisitJson[] }
        | undefined;
      if (dcp?.visits && Array.isArray(dcp.visits)) {
        for (let i = 0; i < dcp.visits.length; i++) {
          const v = dcp.visits[i];
          const vn =
            typeof v?.visitIndex === "number" && Number.isFinite(v.visitIndex)
              ? Math.max(1, Math.floor(v.visitIndex))
              : i + 1;
          if (!map.has(vn)) {
            const dm = v?.estimatedDurationMinutes;
            if (typeof dm === "number" && Number.isFinite(dm) && dm >= 0) {
              map.set(vn, Math.floor(dm));
            }
          }
        }
      }
      const totalEst = out.estimatedDurationMinutes;
      if (
        typeof totalEst === "number" &&
        Number.isFinite(totalEst) &&
        totalEst > 0 &&
        map.size < visitCount
      ) {
        const per = Math.max(1, Math.floor(totalEst / visitCount));
        for (let vn = 1; vn <= visitCount; vn++) {
          if (!map.has(vn)) map.set(vn, per);
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (map.size < visitCount) {
    const hours = args.bookingEstimatedHours;
    if (hours != null && Number.isFinite(Number(hours)) && visitCount > 0) {
      const totalMin = Math.max(0, Math.round(Number(hours) * 60));
      const per = Math.max(1, Math.floor(totalMin / visitCount));
      for (let vn = 1; vn <= visitCount; vn++) {
        if (!map.has(vn)) map.set(vn, per);
      }
    }
  }

  for (let vn = 1; vn <= visitCount; vn++) {
    if (!map.has(vn)) {
      map.set(vn, 1);
    }
  }

  return map;
}

export type VisitCalibrationComputed = {
  bookingId: string;
  programId: string;
  visitNumber: number;
  estimatedDurationMinutes: number;
  actualDurationMinutes: number | null;
  durationVarianceMinutes: number | null;
  durationVariancePercent: Prisma.Decimal | null;
  executionStatus: DeepCleanVisitExecutionStatus;
  hasOperatorNote: boolean;
  completedAt: Date | null;
};

@Injectable()
export class DeepCleanCalibrationService {
  constructor(private readonly prisma: PrismaService) {}

  async syncCalibrationForBooking(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        deepCleanProgram: true,
        estimateSnapshot: true,
      },
    });

    if (!booking?.deepCleanProgram) {
      await this.prisma.bookingDeepCleanVisitCalibration.deleteMany({
        where: { bookingId },
      });
      await this.prisma.bookingDeepCleanProgramCalibration.deleteMany({
        where: { bookingId },
      });
      return;
    }

    const program = booking.deepCleanProgram;
    const visitNumbers = visitNumbersFromProgram(program);
    const estByVn = buildEstimatedMinutesByVisitNumber({
      program,
      estimateOutputJson: booking.estimateSnapshot?.outputJson,
      bookingEstimatedHours: booking.estimatedHours,
    });

    const executions = await this.prisma.bookingDeepCleanVisitExecution.findMany(
      {
        where: { bookingId },
      },
    );
    const exByVn = new Map<number, BookingDeepCleanVisitExecution>();
    for (const e of executions) {
      exByVn.set(e.visitNumber, e);
    }

    const visitPayloads: VisitCalibrationComputed[] = [];

    for (const visitNumber of visitNumbers) {
      const estimatedDurationMinutes = estByVn.get(visitNumber) ?? 1;

      const ex = exByVn.get(visitNumber);
      const executionStatus =
        ex?.status ?? DeepCleanVisitExecutionStatus.not_started;
      const actualDurationMinutes =
        ex?.actualDurationMinutes != null &&
        Number.isFinite(ex.actualDurationMinutes)
          ? Math.max(0, Math.floor(ex.actualDurationMinutes))
          : null;
      const hasOperatorNote = Boolean(ex?.operatorNote?.trim());
      const completedAt = ex?.completedAt ?? null;

      let durationVarianceMinutes: number | null = null;
      let durationVariancePercent: Prisma.Decimal | null = null;
      if (actualDurationMinutes != null) {
        durationVarianceMinutes =
          actualDurationMinutes - estimatedDurationMinutes;
        durationVariancePercent = percentVarianceDecimal(
          actualDurationMinutes,
          estimatedDurationMinutes,
        );
      }

      visitPayloads.push({
        bookingId,
        programId: program.id,
        visitNumber,
        estimatedDurationMinutes,
        actualDurationMinutes,
        durationVarianceMinutes,
        durationVariancePercent,
        executionStatus,
        hasOperatorNote,
        completedAt,
      });
    }

    let estimatedTotalDurationMinutes = 0;
    for (const v of visitPayloads) {
      estimatedTotalDurationMinutes += v.estimatedDurationMinutes;
    }

    let completedVisits = 0;
    let actualSum = 0;
    let hasAnyCompletedActual = false;
    let allCompletedHaveActual = true;
    let hasAnyOperatorNotes = false;

    for (const v of visitPayloads) {
      if (v.hasOperatorNote) hasAnyOperatorNotes = true;
      if (v.executionStatus === DeepCleanVisitExecutionStatus.completed) {
        completedVisits += 1;
        if (v.actualDurationMinutes != null) {
          actualSum += v.actualDurationMinutes;
          hasAnyCompletedActual = true;
        } else {
          allCompletedHaveActual = false;
        }
      }
    }

    const actualTotalDurationMinutes = hasAnyCompletedActual
      ? actualSum
      : null;

    const totalVisits = visitPayloads.length;
    const isFullyCompleted =
      totalVisits > 0 && completedVisits === totalVisits;

    let durationVarianceMinutes: number | null = null;
    let durationVariancePercent: Prisma.Decimal | null = null;
    if (actualTotalDurationMinutes != null) {
      durationVarianceMinutes =
        actualTotalDurationMinutes - estimatedTotalDurationMinutes;
      durationVariancePercent = percentVarianceDecimal(
        actualTotalDurationMinutes,
        estimatedTotalDurationMinutes,
      );
    }

    const usableForCalibrationAnalysis =
      isFullyCompleted &&
      allCompletedHaveActual &&
      estimatedTotalDurationMinutes > 0 &&
      actualTotalDurationMinutes != null;

    const snap = booking.estimateSnapshot;
    const deepCleanEstimatorConfigId = snap?.deepCleanEstimatorConfigId ?? null;
    const deepCleanEstimatorConfigVersion = snap?.deepCleanEstimatorConfigVersion ?? null;
    const deepCleanEstimatorConfigLabel = snap?.deepCleanEstimatorConfigLabel ?? null;

    await this.prisma.$transaction(async (tx) => {
      for (const row of visitPayloads) {
        await tx.bookingDeepCleanVisitCalibration.upsert({
          where: {
            bookingId_visitNumber: {
              bookingId: row.bookingId,
              visitNumber: row.visitNumber,
            },
          },
          create: {
            bookingId: row.bookingId,
            programId: row.programId,
            visitNumber: row.visitNumber,
            estimatedDurationMinutes: row.estimatedDurationMinutes,
            actualDurationMinutes: row.actualDurationMinutes,
            durationVarianceMinutes: row.durationVarianceMinutes,
            durationVariancePercent: row.durationVariancePercent,
            executionStatus: row.executionStatus,
            hasOperatorNote: row.hasOperatorNote,
            completedAt: row.completedAt,
          },
          update: {
            programId: row.programId,
            estimatedDurationMinutes: row.estimatedDurationMinutes,
            actualDurationMinutes: row.actualDurationMinutes,
            durationVarianceMinutes: row.durationVarianceMinutes,
            durationVariancePercent: row.durationVariancePercent,
            executionStatus: row.executionStatus,
            hasOperatorNote: row.hasOperatorNote,
            completedAt: row.completedAt,
          },
        });
      }

      await tx.bookingDeepCleanProgramCalibration.upsert({
        where: { bookingId },
        create: {
          bookingId,
          programId: program.id,
          programType: program.programType,
          estimatedTotalDurationMinutes,
          actualTotalDurationMinutes,
          durationVarianceMinutes,
          durationVariancePercent,
          totalVisits,
          completedVisits,
          isFullyCompleted,
          hasAnyOperatorNotes,
          usableForCalibrationAnalysis,
          deepCleanEstimatorConfigId,
          deepCleanEstimatorConfigVersion,
          deepCleanEstimatorConfigLabel,
        },
        update: {
          programId: program.id,
          programType: program.programType,
          estimatedTotalDurationMinutes,
          actualTotalDurationMinutes,
          durationVarianceMinutes,
          durationVariancePercent,
          totalVisits,
          completedVisits,
          isFullyCompleted,
          hasAnyOperatorNotes,
          usableForCalibrationAnalysis,
          deepCleanEstimatorConfigId,
          deepCleanEstimatorConfigVersion,
          deepCleanEstimatorConfigLabel,
        },
      });
    });
  }

  async buildVisitCalibrationRows(
    bookingId: string,
  ): Promise<BookingDeepCleanVisitCalibration[]> {
    await this.syncCalibrationForBooking(bookingId);
    return this.getVisitCalibrationForBooking(bookingId);
  }

  async buildProgramCalibrationRow(
    bookingId: string,
  ): Promise<BookingDeepCleanProgramCalibration | null> {
    await this.syncCalibrationForBooking(bookingId);
    return this.getProgramCalibrationForBooking(bookingId);
  }

  async getProgramCalibrationForBooking(
    bookingId: string,
  ): Promise<BookingDeepCleanProgramCalibration | null> {
    return this.prisma.bookingDeepCleanProgramCalibration.findUnique({
      where: { bookingId },
    });
  }

  async getVisitCalibrationForBooking(
    bookingId: string,
  ): Promise<BookingDeepCleanVisitCalibration[]> {
    return this.prisma.bookingDeepCleanVisitCalibration.findMany({
      where: { bookingId },
      orderBy: { visitNumber: "asc" },
    });
  }
}
