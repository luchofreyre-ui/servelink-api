import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SystemTestFamilyListItemApi } from "@/lib/api/systemTestFamilies";
import { buildFamilyQuickFixText } from "@/lib/system-tests/quickFixCopy";
import { SystemTestsFamiliesTable } from "../SystemTestsFamiliesTable";

const familyRow = (overrides: Partial<SystemTestFamilyListItemApi> = {}): SystemTestFamilyListItemApi => ({
  id: "fam_test_1",
  familyKey: "fk-1",
  displayTitle: "Test family",
  status: "active",
  trendKind: "stable",
  lastSeenRunId: "r1",
  firstSeenRunId: "r1",
  affectedRunCount: 2,
  affectedFileCount: 1,
  totalOccurrencesAcrossRuns: 5,
  recurrenceLine: null,
  primaryAssertionType: null,
  primaryLocator: null,
  primaryRouteUrl: null,
  updatedAt: new Date().toISOString(),
  resolutionPreview: null,
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
});

describe("SystemTestsFamiliesTable", () => {
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

  it("shows Fix opportunity column header", () => {
    render(<SystemTestsFamiliesTable items={[familyRow()]} />);
    expect(screen.getByRole("columnheader", { name: /fix opportunity/i })).toBeInTheDocument();
  });

  it("shows operator state column and badge", () => {
    render(<SystemTestsFamiliesTable items={[familyRow()]} />);
    expect(screen.getByRole("columnheader", { name: /operator state/i })).toBeInTheDocument();
    expect(screen.getByTestId("system-tests-operator-state-badge")).toHaveTextContent("Open");
  });

  it("shows lifecycle column and badge", () => {
    render(<SystemTestsFamiliesTable items={[familyRow()]} />);
    expect(screen.getByRole("columnheader", { name: /lifecycle/i })).toBeInTheDocument();
    expect(screen.getByTestId("system-tests-lifecycle-badge")).toHaveTextContent("New");
  });

  it("shows preview content when resolution preview exists", () => {
    render(
      <SystemTestsFamiliesTable
        items={[
          familyRow({
            resolutionPreview: {
              hasResolution: true,
              category: "unknown",
              confidence: 0.5,
              confidenceLabel: "Medium confidence",
              topRecommendationSummary: "Check the locator chain.",
              recommendationCount: 1,
              diagnosisSummary: "Weak signal.",
              highestPriority: null,
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText("unknown")).toBeInTheDocument();
    expect(screen.getByText("Check the locator chain.")).toBeInTheDocument();
  });

  it("shows empty preview label when no preview", () => {
    render(<SystemTestsFamiliesTable items={[familyRow({ resolutionPreview: null })]} />);
    expect(screen.getAllByText("No fix preview").length).toBeGreaterThanOrEqual(1);
  });

  it("renders Copy quick fix and copies structured family handoff", async () => {
    const row = familyRow({
      resolutionPreview: {
        hasResolution: true,
        category: "unknown",
        confidence: 0.5,
        confidenceLabel: "Medium confidence",
        topRecommendationSummary: "Check the locator chain.",
        recommendationCount: 1,
        diagnosisSummary: "Weak signal.",
        highestPriority: null,
      },
    });

    const user = userEvent.setup();
    render(<SystemTestsFamiliesTable items={[row]} />);

    expect(screen.getByTestId("system-tests-copy-quick-fix-button")).toHaveTextContent("Copy quick fix");
    await user.click(screen.getByTestId("system-tests-copy-quick-fix-button"));
    expect(writeText).toHaveBeenCalledWith(buildFamilyQuickFixText(row));
  });
});
