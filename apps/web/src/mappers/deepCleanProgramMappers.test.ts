import { describe, expect, it } from "vitest";
import {
  buildAdminDeepCleanCalibrationExportRows,
} from "@/components/booking-detail/admin/adminDeepCleanCalibrationSelectors";
import {
  mapBookingScreenCalibrationToAdminDisplay,
  mapBookingScreenExecutionToCustomerDisplay,
  mapBookingScreenExecutionToDisplay,
  mapBookingScreenProgramToDisplay,
  mapReviewDeepCleanChoiceToDisplay,
} from "./deepCleanProgramMappers";

describe("deepCleanProgramMappers", () => {
  it("maps API program to display", () => {
    const api = {
      programId: "prog_1",
      programType: "three_visit" as const,
      label: "3-visit deep clean program",
      description: null,
      totalPriceCents: 30000,
      visits: [
        {
          visitNumber: 1,
          label: "V1",
          description: "D1",
          priceCents: 10000,
          taskBundleId: "b1",
          taskBundleLabel: "Bundle",
          tasks: [
            {
              taskId: "t1",
              label: "Task",
              description: null,
              category: "c",
              effortClass: "standard",
              tags: ["whole_home"],
            },
          ],
        },
      ],
    };
    const d = mapBookingScreenProgramToDisplay(api);
    expect(d?.title).toBe("3-visit deep clean program");
    expect(d?.visits[0].tasks[0].taskId).toBe("t1");
  });

  it("returns null for empty API input", () => {
    expect(mapBookingScreenProgramToDisplay(null)).toBeNull();
    expect(mapBookingScreenProgramToDisplay(undefined)).toBeNull();
  });

  it("merges execution with program visits", () => {
    const program = mapBookingScreenProgramToDisplay({
      programId: "p",
      programType: "single_visit",
      label: "One",
      description: null,
      totalPriceCents: 1,
      visits: [
        {
          visitNumber: 1,
          label: "Full",
          description: "Desc",
          priceCents: 1,
          taskBundleId: null,
          taskBundleLabel: "Bundle",
          tasks: [],
        },
      ],
    });
    const ex = mapBookingScreenExecutionToDisplay(
      {
        programStatus: "not_started",
        completedVisits: 0,
        totalVisits: 1,
        visits: [
          {
            visitNumber: 1,
            status: "not_started",
            startedAt: null,
            completedAt: null,
            actualDurationMinutes: null,
            operatorNote: null,
          },
        ],
      },
      program,
    );
    expect(ex?.visits[0].programLabel).toBe("Full");
    expect(ex?.visits[0].taskBundleLabel).toBe("Bundle");
  });

  it("customer execution mapping omits operator note and hides duration until completed", () => {
    const program = mapBookingScreenProgramToDisplay({
      programId: "p",
      programType: "single_visit",
      label: "One",
      description: null,
      totalPriceCents: 1,
      visits: [
        {
          visitNumber: 1,
          label: "Full",
          description: null,
          priceCents: 1,
          taskBundleId: null,
          taskBundleLabel: null,
          tasks: [],
        },
      ],
    });
    const cust = mapBookingScreenExecutionToCustomerDisplay(
      {
        programStatus: "in_progress",
        completedVisits: 0,
        totalVisits: 1,
        visits: [
          {
            visitNumber: 1,
            status: "in_progress",
            startedAt: "2026-01-01T00:00:00.000Z",
            completedAt: null,
            actualDurationMinutes: 45,
            operatorNote: "Secret",
          },
        ],
      },
      program,
    );
    expect(cust?.visits[0].actualDurationMinutes).toBeNull();
    expect("operatorNote" in cust!.visits[0]).toBe(false);

    const custDone = mapBookingScreenExecutionToCustomerDisplay(
      {
        programStatus: "completed",
        completedVisits: 1,
        totalVisits: 1,
        visits: [
          {
            visitNumber: 1,
            status: "completed",
            startedAt: "2026-01-01T00:00:00.000Z",
            completedAt: "2026-01-01T02:00:00.000Z",
            actualDurationMinutes: 120,
            operatorNote: "Secret",
          },
        ],
      },
      program,
    );
    expect(custDone?.visits[0].actualDurationMinutes).toBe(120);
    expect("operatorNote" in custDone!.visits[0]).toBe(false);
  });

  it("review mapper returns three visits for phased", () => {
    const d = mapReviewDeepCleanChoiceToDisplay({
      deepCleanProgram: "phased_3_visit",
    });
    expect(d.programType).toBe("three_visit");
    expect(d.visits).toHaveLength(3);
    expect(d.totalPriceCents).toBe(0);
  });

  it("review mapper returns single visit", () => {
    const d = mapReviewDeepCleanChoiceToDisplay({
      deepCleanProgram: "single_visit",
    });
    expect(d.programType).toBe("single_visit");
    expect(d.visits).toHaveLength(1);
  });

  it("calibration mapper returns null for bad input", () => {
    expect(mapBookingScreenCalibrationToAdminDisplay(null)).toBeNull();
    expect(mapBookingScreenCalibrationToAdminDisplay(undefined)).toBeNull();
    expect(
      mapBookingScreenCalibrationToAdminDisplay({} as never),
    ).toBeNull();
  });

  it("calibration mapper preserves variance and note flags", () => {
    const d = mapBookingScreenCalibrationToAdminDisplay({
      program: {
        programType: "phased_deep_clean_program",
        estimatedTotalDurationMinutes: 300,
        actualTotalDurationMinutes: 280,
        durationVarianceMinutes: -20,
        durationVariancePercent: -6.67,
        totalVisits: 3,
        completedVisits: 3,
        isFullyCompleted: true,
        hasAnyOperatorNotes: false,
        usableForCalibrationAnalysis: true,
      },
      visits: [
        {
          visitNumber: 1,
          estimatedDurationMinutes: 100,
          actualDurationMinutes: null,
          durationVarianceMinutes: null,
          durationVariancePercent: null,
          executionStatus: "not_started",
          hasOperatorNote: false,
          completedAt: null,
        },
      ],
    });
    expect(d?.program.durationVariancePercent).toBe(-6.67);
    expect(d?.visits[0].durationVariancePercent).toBeNull();
    expect(d?.program.hasAnyOperatorNotes).toBe(false);
  });

  it("buildAdminDeepCleanCalibrationExportRows flattens program and visits", () => {
    const cal = mapBookingScreenCalibrationToAdminDisplay({
      program: {
        programType: "single_visit_deep_clean",
        estimatedTotalDurationMinutes: 90,
        actualTotalDurationMinutes: 100,
        durationVarianceMinutes: 10,
        durationVariancePercent: 11.11,
        totalVisits: 1,
        completedVisits: 1,
        isFullyCompleted: true,
        hasAnyOperatorNotes: true,
        usableForCalibrationAnalysis: true,
      },
      visits: [
        {
          visitNumber: 1,
          estimatedDurationMinutes: 90,
          actualDurationMinutes: 100,
          durationVarianceMinutes: 10,
          durationVariancePercent: 11.11,
          executionStatus: "completed",
          hasOperatorNote: true,
          completedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(cal).toBeTruthy();
    const rows = buildAdminDeepCleanCalibrationExportRows({
      bookingId: "b1",
      calibration: cal!,
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].scope).toBe("program");
    expect(rows[1].scope).toBe("visit");
    expect(rows[1].visitNumber).toBe(1);
    expect(rows[1].operatorNotePresent).toBe(true);
  });
});
