import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  DeepCleanExecutionAdminDisplay,
  DeepCleanExecutionCustomerDisplay,
} from "@/types/deepCleanProgram";
import { DeepCleanExecutionReadOnlyPanel } from "./DeepCleanExecutionReadOnlyPanel";

const baseVisit = {
  visitNumber: 1,
  programLabel: "Visit label",
  programDescription: null as string | null,
  taskBundleLabel: "Bundle A",
  tasks: [{ taskId: "t1", label: "Wipe", description: null, category: null, effortClass: null, tags: [] }],
  status: "completed" as const,
  startedAt: "2026-01-01T10:00:00.000Z",
  completedAt: "2026-01-01T12:00:00.000Z",
  actualDurationMinutes: 88,
};

const customerExecution: DeepCleanExecutionCustomerDisplay = {
  programStatus: "completed",
  completedVisits: 1,
  totalVisits: 1,
  visits: [
    {
      ...baseVisit,
      actualDurationMinutes: 88,
    },
  ],
};

const adminExecution: DeepCleanExecutionAdminDisplay = {
  programStatus: "completed",
  completedVisits: 1,
  totalVisits: 1,
  visits: [
    {
      ...baseVisit,
      operatorNote: "Internal ops note",
    },
  ],
};

describe("DeepCleanExecutionReadOnlyPanel", () => {
  it("renders progress summary and statuses", () => {
    render(
      <DeepCleanExecutionReadOnlyPanel
        execution={customerExecution}
        showOperatorNotes={false}
        tone="light"
      />,
    );
    expect(screen.getByTestId("deep-clean-execution-readonly")).toBeTruthy();
    expect(screen.getByText(/1 \/ 1 visits completed/i)).toBeTruthy();
    expect(screen.getByText(/Status: Completed/i)).toBeTruthy();
    expect(screen.getByText(/Time on site \(actual, minutes\):/i)).toBeTruthy();
    expect(screen.getByText("88")).toBeTruthy();
  });

  it("customer mode does not show operator note", () => {
    render(
      <DeepCleanExecutionReadOnlyPanel
        execution={adminExecution}
        showOperatorNotes={false}
        tone="light"
      />,
    );
    expect(screen.queryByText(/Internal ops note/i)).toBeNull();
  });

  it("admin mode shows operator note", () => {
    render(
      <DeepCleanExecutionReadOnlyPanel
        execution={adminExecution}
        showOperatorNotes
        tone="dark"
      />,
    );
    expect(screen.getByText(/Internal ops note/i)).toBeTruthy();
  });

  it("does not render start/complete action buttons", () => {
    render(
      <DeepCleanExecutionReadOnlyPanel
        execution={customerExecution}
        showOperatorNotes={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Start visit/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Complete visit/i }),
    ).toBeNull();
  });
});
