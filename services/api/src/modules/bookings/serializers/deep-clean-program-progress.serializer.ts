import { DeepCleanVisitExecutionStatus } from "@prisma/client";
import type { BookingScreenDeepCleanExecutionDto } from "../dto/booking-screen-response.dto";

export type DeepCleanProgramProgressSummary = {
  programStatus: "not_started" | "in_progress" | "completed";
  completedVisits: number;
  totalVisits: number;
  inProgressVisitNumbers: number[];
  completedVisitNumbers: number[];
};

function statusToApi(
  s: DeepCleanVisitExecutionStatus,
): "not_started" | "in_progress" | "completed" {
  return s === "completed"
    ? "completed"
    : s === "in_progress"
      ? "in_progress"
      : "not_started";
}

/**
 * Derives aggregate progress from persisted execution rows only.
 */
export function buildDeepCleanProgramProgress(input: {
  executions: Array<{
    visitNumber: number;
    status: DeepCleanVisitExecutionStatus;
  }>;
  totalVisits: number;
}): DeepCleanProgramProgressSummary {
  const totalVisits = Math.max(0, Math.floor(input.totalVisits));
  const byVisit = new Map<number, DeepCleanVisitExecutionStatus>();
  for (const row of input.executions) {
    byVisit.set(row.visitNumber, row.status);
  }

  const completedVisitNumbers: number[] = [];
  const inProgressVisitNumbers: number[] = [];
  for (let n = 1; n <= totalVisits; n++) {
    const st = byVisit.get(n) ?? "not_started";
    if (st === "completed") completedVisitNumbers.push(n);
    else if (st === "in_progress") inProgressVisitNumbers.push(n);
  }

  const completedVisits = completedVisitNumbers.length;
  let programStatus: DeepCleanProgramProgressSummary["programStatus"] =
    "not_started";
  if (totalVisits === 0) {
    programStatus = "not_started";
  } else if (completedVisits >= totalVisits) {
    programStatus = "completed";
  } else if (completedVisits > 0 || inProgressVisitNumbers.length > 0) {
    programStatus = "in_progress";
  } else {
    programStatus = "not_started";
  }

  return {
    programStatus,
    completedVisits,
    totalVisits,
    inProgressVisitNumbers,
    completedVisitNumbers,
  };
}

export function buildDeepCleanExecutionForScreen(input: {
  executions: Array<{
    visitNumber: number;
    status: DeepCleanVisitExecutionStatus;
    startedAt: Date | null;
    completedAt: Date | null;
    actualDurationMinutes: number | null;
    operatorNote: string | null;
  }>;
  totalVisits: number;
}): BookingScreenDeepCleanExecutionDto | null {
  const totalVisits = Math.max(0, Math.floor(input.totalVisits));
  if (totalVisits <= 0) return null;

  const sorted = [...input.executions].sort(
    (a, b) => a.visitNumber - b.visitNumber,
  );
  const byNumber = new Map(sorted.map((row) => [row.visitNumber, row]));

  const visits: BookingScreenDeepCleanExecutionDto["visits"] = [];
  const forProgress: Array<{
    visitNumber: number;
    status: DeepCleanVisitExecutionStatus;
  }> = [];

  for (let n = 1; n <= totalVisits; n++) {
    const row = byNumber.get(n);
    const status =
      row?.status ?? DeepCleanVisitExecutionStatus.not_started;
    forProgress.push({ visitNumber: n, status });
    visits.push({
      visitNumber: n,
      status: statusToApi(status),
      startedAt: row?.startedAt?.toISOString() ?? null,
      completedAt: row?.completedAt?.toISOString() ?? null,
      actualDurationMinutes: row?.actualDurationMinutes ?? null,
      operatorNote: row?.operatorNote ?? null,
    });
  }

  const progress = buildDeepCleanProgramProgress({
    executions: forProgress,
    totalVisits,
  });

  return {
    programStatus: progress.programStatus,
    completedVisits: progress.completedVisits,
    totalVisits: progress.totalVisits,
    visits,
  };
}
