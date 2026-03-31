import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SystemTestsTopIssuesPanel } from "../SystemTestsTopIssuesPanel";
import type { SystemTestsTopProblemItem } from "@/types/systemTests";

describe("SystemTestsTopIssuesPanel family operator state", () => {
  it("shows operator badge and actions for family-backed items when handler provided", () => {
    const item: SystemTestsTopProblemItem = {
      title: "Family-backed pattern",
      type: "pattern",
      severity: "high",
      impactScore: 900,
      summary: "Summary",
      familyId: "fam-t",
      familyTitle: "Fam title",
      operatorState: {
        state: "open",
        updatedAt: null,
        updatedByUserId: null,
        note: null,
      },
      lifecycle: {
        firstSeenAt: null,
        lastSeenAt: null,
        seenInRunCount: 1,
        recentRunCountConsidered: 10,
        seenInLatestRun: true,
        seenInPreviousRun: false,
        consecutiveRunCount: 1,
        runsSinceLastSeen: 0,
        lifecycleState: "resurfaced",
      },
      resolutionPreview: null,
    };

    render(
      <SystemTestsTopIssuesPanel items={[item]} onFamilyBackedOperatorStateUpdated={vi.fn()} />,
    );
    expect(screen.getByTestId("system-tests-lifecycle-badge")).toHaveTextContent("Resurfaced");
    expect(screen.getByTestId("system-tests-operator-state-badge")).toHaveTextContent("Open");
    expect(screen.getByTestId("system-tests-operator-state-actions")).toBeInTheDocument();
    expect(screen.getByTestId("system-tests-top-issue-copy-quick-fix")).toBeInTheDocument();
  });
});
