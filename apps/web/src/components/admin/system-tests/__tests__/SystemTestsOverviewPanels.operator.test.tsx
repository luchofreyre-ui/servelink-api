import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: () => "test-token",
}));

vi.mock("@/lib/api/systemTestFamilyOperatorState", () => ({
  updateAdminSystemTestFamilyOperatorState: (...args: unknown[]) => updateMock(...args),
}));

import { SystemTestsOverviewPanels } from "../SystemTestsOverviewPanels";
import type { SystemTestFixOpportunity } from "@/types/systemTestResolution";

function sampleOpp(overrides: Partial<SystemTestFixOpportunity> = {}): SystemTestFixOpportunity {
  return {
    familyId: "fam-op-1",
    familyKey: "k",
    title: "Sample family opp",
    category: "timing_issue",
    confidence: 0.9,
    confidenceLabel: "High confidence",
    topRecommendationSummary: "Do the fix",
    failureCount: 2,
    affectedRunCount: 1,
    highestPriority: "high",
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
      lifecycleState: "new",
    },
    ...overrides,
  };
}

describe("SystemTestsOverviewPanels operator controls", () => {
  beforeEach(() => {
    updateMock.mockReset();
    updateMock.mockResolvedValue({
      state: "dismissed",
      updatedAt: "2026-01-02T00:00:00.000Z",
      updatedByUserId: "u1",
      note: null,
    });
  });

  it("shows operator state badge on fix opportunity cards", () => {
    render(
      <SystemTestsOverviewPanels
        fixOpportunities={[sampleOpp()]}
        topProblems={[]}
        latestFailures={{ runId: "r1", groups: [], loading: false }}
      />,
    );
    expect(screen.getByTestId("system-tests-fix-opportunity-card")).toBeInTheDocument();
    expect(screen.getByTestId("system-tests-operator-state-badge")).toHaveTextContent("Open");
  });

  it("renders show dismissed toggle when onShowDismissedChange is provided", () => {
    render(
      <SystemTestsOverviewPanels
        fixOpportunities={[sampleOpp()]}
        topProblems={[]}
        showDismissed={false}
        onShowDismissedChange={() => {}}
        latestFailures={{ runId: "r1", groups: [], loading: false }}
      />,
    );
    expect(screen.getByTestId("system-tests-show-dismissed-toggle")).toBeInTheDocument();
  });

  it("removes fix card after dismiss when parent mirrors dashboard filtering", async () => {
    function Harness() {
      const [opps, setOpps] = useState([sampleOpp()]);
      const [showDismissed, setShowDismissed] = useState(false);
      return (
        <SystemTestsOverviewPanels
          fixOpportunities={opps}
          topProblems={[]}
          showDismissed={showDismissed}
          onShowDismissedChange={setShowDismissed}
          onFixOpportunityOperatorStateUpdated={(u) => {
            if (!showDismissed && u.operatorState.state === "dismissed") {
              setOpps((p) => p.filter((o) => o.familyId !== u.familyId));
            } else {
              setOpps((p) => p.map((o) => (o.familyId === u.familyId ? u : o)));
            }
          }}
          latestFailures={{ runId: "r1", groups: [], loading: false }}
        />
      );
    }

    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /^dismiss$/i }));
    await waitFor(() => {
      expect(screen.queryByTestId("system-tests-fix-opportunity-card")).toBeNull();
    });
  });
});
