import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CustomerBookingDetail } from "./CustomerBookingDetail";

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
      taskBundleId: "b1",
      taskBundleLabel: "B1",
      tasks: [
        {
          taskId: "t1",
          label: "T1",
          description: null,
          category: null,
          effortClass: null,
          tags: [] as string[],
        },
      ],
    },
    {
      visitNumber: 2,
      label: "V2",
      description: null,
      priceCents: 100,
      taskBundleId: null,
      taskBundleLabel: null,
      tasks: [],
    },
    {
      visitNumber: 3,
      label: "V3",
      description: null,
      priceCents: 100,
      taskBundleId: null,
      taskBundleLabel: null,
      tasks: [],
    },
  ],
};

const executionWithNote = {
  programStatus: "in_progress" as const,
  completedVisits: 1,
  totalVisits: 3,
  visits: [
    {
      visitNumber: 1,
      status: "completed" as const,
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T02:00:00.000Z",
      actualDurationMinutes: 60,
      operatorNote: "Do not show to customer",
    },
    ...[2, 3].map((n) => ({
      visitNumber: n,
      status: "not_started" as const,
      startedAt: null,
      completedAt: null,
      actualDurationMinutes: null,
      operatorNote: null,
    })),
  ],
};

describe("CustomerBookingDetail", () => {
  it("renders education block when authorityEducationalContext is present", () => {
    render(
      <CustomerBookingDetail
        screen={{
          booking: { id: "b1", status: "confirmed" },
          estimateSnapshot: { serviceType: "maintenance" },
          authorityEducationalContext: {
            mayFocusOn: [{ tag: "tile", label: "Tile" }],
            relatedIssues: [],
            careMethods: [],
            authorityTagSource: "derived",
            educationNote: "Informational only.",
          },
        }}
      />,
    );
    expect(screen.getByTestId("customer-booking-education")).toBeInTheDocument();
    expect(screen.getByText(/What to expect/i)).toBeInTheDocument();
    expect(screen.getByText("Tile")).toBeInTheDocument();
  });

  it("does not render education block when context is absent", () => {
    render(
      <CustomerBookingDetail
        screen={{
          booking: { id: "b1", status: "confirmed" },
          estimateSnapshot: { serviceType: "maintenance" },
        }}
      />,
    );
    expect(screen.queryByTestId("customer-booking-education")).toBeNull();
  });

  it("does not render education block when all topic lists are empty", () => {
    render(
      <CustomerBookingDetail
        screen={{
          booking: { id: "b1", status: "confirmed" },
          estimateSnapshot: { serviceType: "maintenance" },
          authorityEducationalContext: {
            mayFocusOn: [],
            relatedIssues: [],
            careMethods: [],
            authorityTagSource: "derived",
            educationNote: "Should not show alone.",
          },
        }}
      />,
    );
    expect(screen.queryByTestId("customer-booking-education")).toBeNull();
  });

  it("hides deep clean sections for non-deep-clean", () => {
    render(
      <CustomerBookingDetail
        screen={{
          booking: { id: "b1", status: "confirmed" },
          estimateSnapshot: { serviceType: "maintenance" },
          deepCleanProgram: null,
          deepCleanExecution: null,
        }}
      />,
    );
    expect(screen.queryByText("Your deep clean program")).toBeNull();
    expect(screen.queryByTestId("deep-clean-execution-readonly")).toBeNull();
  });

  it("deep clean shows program and read-only execution", () => {
    render(
      <CustomerBookingDetail
        screen={{
          booking: { id: "b1", status: "confirmed" },
          estimateSnapshot: { serviceType: "deep_clean" },
          deepCleanProgram: programThree,
          deepCleanExecution: {
            programStatus: "not_started",
            completedVisits: 0,
            totalVisits: 3,
            visits: [1, 2, 3].map((n) => ({
              visitNumber: n,
              status: "not_started" as const,
              startedAt: null,
              completedAt: null,
              actualDurationMinutes: null,
              operatorNote: null,
            })),
          },
        }}
      />,
    );
    expect(screen.getByText("Your deep clean program")).toBeTruthy();
    expect(screen.getByTestId("deep-clean-execution-readonly")).toBeTruthy();
    expect(screen.getAllByText(/Status: Not started/i).length).toBeGreaterThan(0);
  });

  it("customer does not see operator note on completed visit", () => {
    render(
      <CustomerBookingDetail
        screen={{
          booking: { id: "b1", status: "confirmed" },
          estimateSnapshot: { serviceType: "deep_clean" },
          deepCleanProgram: programThree,
          deepCleanExecution: executionWithNote,
        }}
      />,
    );
    expect(screen.queryByText(/Do not show to customer/i)).toBeNull();
    expect(screen.getByText("60")).toBeTruthy();
  });

  it("soft placeholder when program exists but execution missing", () => {
    render(
      <CustomerBookingDetail
        screen={{
          booking: { id: "b1", status: "confirmed" },
          estimateSnapshot: { serviceType: "deep_clean" },
          deepCleanProgram: programThree,
          deepCleanExecution: null,
        }}
      />,
    );
    expect(screen.getByText(/Progress information is not available yet/i)).toBeTruthy();
    expect(screen.queryByTestId("deep-clean-execution-readonly")).toBeNull();
  });

  it("soft message when deep clean but no program", () => {
    render(
      <CustomerBookingDetail
        screen={{
          booking: { id: "b1", status: "confirmed" },
          estimateSnapshot: { serviceType: "deep_clean" },
          deepCleanProgram: null,
          deepCleanExecution: null,
        }}
      />,
    );
    expect(
      screen.getByText(/visit breakdown right now/i),
    ).toBeTruthy();
  });
});
