import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminDeepCleanBookingSection } from "./AdminDeepCleanBookingSection";

const programThree = {
  programId: "p1",
  programType: "three_visit" as const,
  label: "3-visit deep clean program",
  description: null,
  totalPriceCents: 300,
  visits: [
    {
      visitNumber: 1,
      label: "V1",
      description: "D1",
      priceCents: 100,
      taskBundleId: null,
      taskBundleLabel: "B1",
      tasks: [],
    },
  ],
};

describe("AdminDeepCleanBookingSection", () => {
  it("returns null for non-deep-clean", () => {
    const { container } = render(
      <AdminDeepCleanBookingSection
        screen={{
          estimateSnapshot: { serviceType: "maintenance" },
          deepCleanProgram: programThree,
        }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows program and execution read-only for deep clean", () => {
    render(
      <AdminDeepCleanBookingSection
        screen={{
          estimateSnapshot: { serviceType: "deep_clean" },
          deepCleanProgram: programThree,
          deepCleanExecution: {
            programStatus: "in_progress",
            completedVisits: 0,
            totalVisits: 1,
            visits: [
              {
                visitNumber: 1,
                status: "in_progress",
                startedAt: "2026-01-01T00:00:00.000Z",
                completedAt: null,
                actualDurationMinutes: null,
                operatorNote: "Ops only",
              },
            ],
          },
          deepCleanCalibration: {
            program: {
              programType: "single_visit_deep_clean",
              estimatedTotalDurationMinutes: 180,
              actualTotalDurationMinutes: null,
              durationVarianceMinutes: null,
              durationVariancePercent: null,
              totalVisits: 1,
              completedVisits: 0,
              isFullyCompleted: false,
              hasAnyOperatorNotes: true,
              usableForCalibrationAnalysis: false,
              reviewStatus: "unreviewed",
              reviewedAt: null,
              reviewReasonTags: [],
              reviewNote: null,
            },
            visits: [
              {
                visitNumber: 1,
                estimatedDurationMinutes: 180,
                actualDurationMinutes: null,
                durationVarianceMinutes: null,
                durationVariancePercent: null,
                executionStatus: "in_progress",
                hasOperatorNote: true,
                completedAt: null,
              },
            ],
          },
        }}
      />,
    );
    expect(screen.getByText("Deep clean program")).toBeTruthy();
    expect(screen.getByTestId("deep-clean-execution-readonly")).toBeTruthy();
    expect(screen.getByText(/Ops only/i)).toBeTruthy();
    expect(screen.getByTestId("admin-deep-clean-calibration")).toBeTruthy();
    expect(screen.getByTestId("admin-deep-clean-calibration-review")).toBeTruthy();
    expect(screen.getByText("Calibration")).toBeTruthy();
    const cal = screen.getByTestId("admin-deep-clean-calibration");
    expect(cal.textContent).not.toMatch(/Ops only/);
    expect(
      screen.queryByRole("button", { name: /Start visit/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Complete visit/i }),
    ).toBeNull();
  });

  it("calibration shows actual duration, variance, and note present without note text", () => {
    render(
      <AdminDeepCleanBookingSection
        screen={{
          estimateSnapshot: { serviceType: "deep_clean" },
          deepCleanProgram: programThree,
          deepCleanExecution: {
            programStatus: "completed",
            completedVisits: 1,
            totalVisits: 1,
            visits: [
              {
                visitNumber: 1,
                status: "completed",
                startedAt: "2026-01-01T00:00:00.000Z",
                completedAt: "2026-01-01T02:00:00.000Z",
                actualDurationMinutes: 200,
                operatorNote: "secret internal",
              },
            ],
          },
          deepCleanCalibration: {
            program: {
              programType: "single_visit_deep_clean",
              estimatedTotalDurationMinutes: 150,
              actualTotalDurationMinutes: 200,
              durationVarianceMinutes: 50,
              durationVariancePercent: 33.33,
              totalVisits: 1,
              completedVisits: 1,
              isFullyCompleted: true,
              hasAnyOperatorNotes: true,
              usableForCalibrationAnalysis: true,
              reviewStatus: "reviewed",
              reviewedAt: "2026-01-02T00:00:00.000Z",
              reviewReasonTags: ["underestimation"],
              reviewNote: "Checked variance",
            },
            visits: [
              {
                visitNumber: 1,
                estimatedDurationMinutes: 150,
                actualDurationMinutes: 200,
                durationVarianceMinutes: 50,
                durationVariancePercent: 33.33,
                executionStatus: "completed",
                hasOperatorNote: true,
                completedAt: "2026-01-01T02:00:00.000Z",
              },
            ],
          },
        }}
      />,
    );
    const cal = screen.getByTestId("admin-deep-clean-calibration");
    expect(cal.textContent).toContain("200");
    expect(cal.textContent).toContain("50");
    expect(cal.textContent).toContain("33.33%");
    expect(cal.textContent).toContain("Operator note present");
    expect(cal.textContent).not.toContain("secret internal");
    const rev = screen.getByTestId("admin-deep-clean-calibration-review");
    expect(rev.textContent).toContain("Reviewed");
    expect(rev.textContent).toContain("Underestimation");
    expect(rev.textContent).toContain("Checked variance");
  });

  it("warns when execution payload exists but program is missing", () => {
    render(
      <AdminDeepCleanBookingSection
        screen={{
          estimateSnapshot: { serviceType: "deep_clean" },
          deepCleanProgram: null,
          deepCleanExecution: {
            programStatus: "not_started",
            completedVisits: 0,
            totalVisits: 2,
            visits: [
              {
                visitNumber: 1,
                status: "not_started",
                startedAt: null,
                completedAt: null,
                actualDurationMinutes: null,
                operatorNote: null,
              },
              {
                visitNumber: 2,
                status: "not_started",
                startedAt: null,
                completedAt: null,
                actualDurationMinutes: null,
                operatorNote: null,
              },
            ],
          },
        }}
      />,
    );
    expect(
      screen.getByTestId("admin-deep-clean-warning-program-missing"),
    ).toBeTruthy();
  });

  it("warns when program exists but execution cannot be mapped", () => {
    render(
      <AdminDeepCleanBookingSection
        screen={{
          estimateSnapshot: { serviceType: "deep_clean" },
          deepCleanProgram: programThree,
          deepCleanExecution: null,
        }}
      />,
    );
    expect(
      screen.getByTestId("admin-deep-clean-warning-execution-missing"),
    ).toBeTruthy();
  });

  it("shows screen load error", () => {
    render(
      <AdminDeepCleanBookingSection
        screen={null}
        screenError="Forbidden"
      />,
    );
    expect(screen.getByText(/Forbidden/i)).toBeTruthy();
  });
});
