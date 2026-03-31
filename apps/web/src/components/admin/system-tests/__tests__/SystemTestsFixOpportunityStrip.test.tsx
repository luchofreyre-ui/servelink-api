import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SystemTestsFixOpportunityStrip } from "../SystemTestsFixOpportunityStrip";
import type { SystemTestFixOpportunity } from "@/types/systemTestResolution";
import { fixOpportunityToResolutionPreview } from "@/lib/system-tests/fixOpportunityPreview";
import { buildFixOpportunityQuickFixText } from "@/lib/system-tests/quickFixCopy";

function baseOpp(overrides: Partial<SystemTestFixOpportunity> = {}): SystemTestFixOpportunity {
  return {
    familyId: "fam-1",
    familyKey: "key-1",
    title: "Checkout timeout cluster",
    category: "timing_issue",
    confidence: 0.9,
    confidenceLabel: "High confidence",
    topRecommendationSummary: "Increase default timeout for checkout flow.",
    failureCount: 4,
    affectedRunCount: 2,
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
      seenInRunCount: 2,
      recentRunCountConsidered: 10,
      seenInLatestRun: true,
      seenInPreviousRun: true,
      consecutiveRunCount: 2,
      runsSinceLastSeen: 0,
      lifecycleState: "recurring",
    },
    ...overrides,
  };
}

describe("SystemTestsFixOpportunityStrip", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    const realNav = globalThis.navigator;
    vi.stubGlobal(
      "navigator",
      new Proxy(realNav, {
        get(target, prop, receiver) {
          if (prop === "clipboard") {
            return { writeText };
          }
          const value = Reflect.get(target, prop, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders nothing when empty", () => {
    const { container } = render(<SystemTestsFixOpportunityStrip items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders category, confidence, summary, counts, and family link", () => {
    render(<SystemTestsFixOpportunityStrip items={[baseOpp()]} />);

    expect(screen.getByTestId("system-tests-fix-opportunity-strip")).toBeInTheDocument();
    expect(screen.getByText("Checkout timeout cluster")).toBeInTheDocument();
    expect(screen.getByText("timing issue")).toBeInTheDocument();
    expect(screen.getByText("High confidence")).toBeInTheDocument();
    expect(screen.getByText("Increase default timeout for checkout flow.")).toBeInTheDocument();
    expect(screen.getByText(/4 failures/)).toBeInTheDocument();
    expect(screen.getByText(/2 runs/)).toBeInTheDocument();
    const link = screen.getByTestId("system-tests-fix-opportunity-link");
    expect(link).toHaveAttribute("href", "/admin/system-tests/families/fam-1");
    expect(link).toHaveTextContent("View fix");
    expect(screen.getByTestId("system-tests-copy-quick-fix-button")).toHaveTextContent("Copy quick fix");
  });

  it("renders multiple cards", () => {
    render(
      <SystemTestsFixOpportunityStrip
        items={[
          baseOpp({ familyId: "a", title: "Alpha" }),
          baseOpp({ familyId: "b", title: "Beta", topRecommendationSummary: "Fix B" }),
        ]}
      />,
    );
    expect(screen.getAllByTestId("system-tests-fix-opportunity-card")).toHaveLength(2);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("copies fix-opportunity quick fix text including preview-assisted diagnosis", async () => {
    const opp = baseOpp();
    const preview = fixOpportunityToResolutionPreview(opp);

    const user = userEvent.setup();
    render(<SystemTestsFixOpportunityStrip items={[opp]} />);

    await user.click(screen.getByTestId("system-tests-copy-quick-fix-button"));
    expect(writeText).toHaveBeenCalledWith(buildFixOpportunityQuickFixText(opp, preview));
  });
});
