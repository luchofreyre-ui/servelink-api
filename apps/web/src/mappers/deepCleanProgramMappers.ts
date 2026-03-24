import type {
  BookingScreenDeepCleanCalibrationApi,
  BookingScreenDeepCleanExecutionApi,
  BookingScreenDeepCleanProgramApi,
  DeepCleanCalibrationAdminDisplay,
  DeepCleanExecutionAdminDisplay,
  DeepCleanExecutionCustomerDisplay,
  DeepCleanExecutionDisplay,
  DeepCleanProgramDisplay,
  DeepCleanProgramVisitDisplay,
} from "@/types/deepCleanProgram";

export function mapBookingScreenExecutionToDisplay(
  api: BookingScreenDeepCleanExecutionApi | null | undefined,
  program: DeepCleanProgramDisplay | null,
): DeepCleanExecutionDisplay | null {
  if (!api || !program) return null;
  const visits = api.visits.map((ex) => {
    const pv =
      program.visits.find((v) => v.visitNumber === ex.visitNumber) ??
      program.visits[ex.visitNumber - 1];
    return {
      visitNumber: ex.visitNumber,
      programLabel: pv?.label ?? `Visit ${ex.visitNumber}`,
      programDescription: pv?.description ?? null,
      taskBundleLabel: pv?.taskBundleLabel ?? null,
      tasks: pv?.tasks ?? [],
      status: ex.status,
      startedAt: ex.startedAt,
      completedAt: ex.completedAt,
      actualDurationMinutes: ex.actualDurationMinutes,
      operatorNote: ex.operatorNote,
    };
  });
  return {
    programStatus: api.programStatus,
    completedVisits: api.completedVisits,
    totalVisits: api.totalVisits,
    visits,
  };
}

/** Full execution + program merge for admin read-only inspection. */
export function mapBookingScreenExecutionToAdminDisplay(
  api: BookingScreenDeepCleanExecutionApi | null | undefined,
  program: DeepCleanProgramDisplay | null,
): DeepCleanExecutionAdminDisplay | null {
  return mapBookingScreenExecutionToDisplay(api, program);
}

/**
 * Customer-facing: hide operator notes; show actual duration only when visit is completed.
 */
export function mapBookingScreenExecutionToCustomerDisplay(
  api: BookingScreenDeepCleanExecutionApi | null | undefined,
  program: DeepCleanProgramDisplay | null,
): DeepCleanExecutionCustomerDisplay | null {
  const full = mapBookingScreenExecutionToDisplay(api, program);
  if (!full) return null;
  return {
    programStatus: full.programStatus,
    completedVisits: full.completedVisits,
    totalVisits: full.totalVisits,
    visits: full.visits.map(
      ({ operatorNote: _note, actualDurationMinutes, status, ...rest }) => ({
        ...rest,
        status,
        actualDurationMinutes:
          status === "completed" ? actualDurationMinutes : null,
      }),
    ),
  };
}

/** Admin calibration: passthrough from screen API (no variance math in UI). */
export function mapBookingScreenCalibrationToAdminDisplay(
  api: BookingScreenDeepCleanCalibrationApi | null | undefined,
): DeepCleanCalibrationAdminDisplay | null {
  if (!api?.program || !Array.isArray(api.visits)) return null;
  const prog = api.program;
  return {
    program: {
      ...prog,
      reviewStatus: prog.reviewStatus === "reviewed" ? "reviewed" : "unreviewed",
      reviewedAt: prog.reviewedAt ?? null,
      reviewReasonTags: Array.isArray(prog.reviewReasonTags) ? prog.reviewReasonTags : [],
      reviewNote: prog.reviewNote ?? null,
    },
    visits: api.visits.map((v) => ({ ...v })),
  };
}

export function mapBookingScreenProgramToDisplay(
  api: BookingScreenDeepCleanProgramApi | null | undefined,
): DeepCleanProgramDisplay | null {
  if (!api || !api.programId) return null;
  return {
    programId: api.programId,
    programType: api.programType,
    title: api.label,
    description: api.description,
    totalPriceCents: api.totalPriceCents,
    visits: api.visits.map((v) => ({ ...v, tasks: v.tasks.map((t) => ({ ...t })) })),
  };
}

/** Pre-submit review: no per-visit prices from server; honest placeholder framing. */
export function mapReviewDeepCleanChoiceToDisplay(args: {
  deepCleanProgram: "single_visit" | "phased_3_visit";
}): DeepCleanProgramDisplay {
  if (args.deepCleanProgram === "phased_3_visit") {
    const visits: DeepCleanProgramVisitDisplay[] = [
      {
        visitNumber: 1,
        label: "Visit 1 — Foundation reset (heavy deep clean)",
        description:
          "Full reset and heavy foundation: surfaces, kitchen/bath sanitation, floor baseline, touchpoints.",
        priceCents: 0,
        taskBundleId: null,
        taskBundleLabel: null,
        tasks: [],
      },
      {
        visitNumber: 2,
        label: "Visit 2 — Maintenance + deep-clean bundle A",
        description:
          "Maintenance-style coverage plus high-impact detail: kitchen/bath depth and priority baseboards.",
        priceCents: 0,
        taskBundleId: null,
        taskBundleLabel: null,
        tasks: [],
      },
      {
        visitNumber: 3,
        label: "Visit 3 — Maintenance + deep-clean bundle B",
        description:
          "Whole-home maintenance pass, remaining detail, floor finish, polish and handoff to recurring-ready state.",
        priceCents: 0,
        taskBundleId: null,
        taskBundleLabel: null,
        tasks: [],
      },
    ];
    return {
      programId: "local-review",
      programType: "three_visit",
      title: "3-visit deep clean program",
      description:
        "Per-visit prices and durations are estimated when you confirm your booking.",
      totalPriceCents: 0,
      visits,
    };
  }

  return {
    programId: "local-review",
    programType: "single_visit",
    title: "One-visit deep clean",
    description:
      "Your estimate will reflect one full deep clean visit after you confirm.",
    totalPriceCents: 0,
    visits: [
      {
        visitNumber: 1,
        label: "Single visit — full deep clean",
        description:
          "One visit completes the full deep clean scope (foundation + detail) as estimated.",
        priceCents: 0,
        taskBundleId: null,
        taskBundleLabel: null,
        tasks: [],
      },
    ],
  };
}
