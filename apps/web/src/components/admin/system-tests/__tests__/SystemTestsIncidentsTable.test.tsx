import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SystemTestIncidentListItemApi } from "@/lib/api/systemTestIncidents";
import { buildIncidentQuickFixText } from "@/lib/system-tests/quickFixCopy";
import { SystemTestsIncidentsTable } from "../SystemTestsIncidentsTable";

const incidentRow = (
  overrides: Partial<SystemTestIncidentListItemApi> = {},
): SystemTestIncidentListItemApi => ({
  runId: "run_1",
  incidentKey: "inc_key_1",
  incidentVersion: "v1",
  displayTitle: "Test incident",
  rootCauseCategory: "network",
  summary: "Summary text",
  severity: "high",
  status: "active",
  trendKind: "stable",
  leadFamilyId: null,
  affectedFamilyCount: 1,
  affectedFileCount: 1,
  currentRunFailureCount: 2,
  lastSeenRunId: null,
  firstSeenRunId: null,
  updatedAt: new Date().toISOString(),
  resolutionPreview: null,
  familyOperatorState: null,
  familyLifecycle: null,
  leadFamilyTitle: null,
  ...overrides,
});

describe("SystemTestsIncidentsTable", () => {
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

  it("shows Likely fix column header", () => {
    render(<SystemTestsIncidentsTable items={[incidentRow()]} />);
    expect(screen.getByRole("columnheader", { name: /likely fix/i })).toBeInTheDocument();
  });

  it("shows em dash in operator state when no lead family", () => {
    render(<SystemTestsIncidentsTable items={[incidentRow({ leadFamilyId: null })]} />);
    expect(screen.getByRole("columnheader", { name: /operator state/i })).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows operator badge when lead family and familyOperatorState exist", () => {
    render(
      <SystemTestsIncidentsTable
        items={[
          incidentRow({
            leadFamilyId: "fam-99",
            leadFamilyTitle: "Lead fam",
            familyOperatorState: {
              state: "acknowledged",
              updatedAt: null,
              updatedByUserId: null,
              note: null,
            },
            familyLifecycle: {
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
          }),
        ]}
      />,
    );
    expect(screen.getByTestId("system-tests-operator-state-badge")).toHaveTextContent("Acknowledged");
    expect(screen.getByTestId("system-tests-lifecycle-badge")).toHaveTextContent("New");
  });

  it("shows preview content when resolution preview exists", () => {
    render(
      <SystemTestsIncidentsTable
        items={[
          incidentRow({
            resolutionPreview: {
              hasResolution: true,
              category: "environment_unavailable",
              confidence: 0.9,
              confidenceLabel: "High confidence",
              topRecommendationSummary: "Restore local app availability.",
              recommendationCount: 2,
              diagnosisSummary: null,
              highestPriority: "high",
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText(/environment unavailable/i)).toBeInTheDocument();
    expect(screen.getByText("Restore local app availability.")).toBeInTheDocument();
    expect(screen.getByText("+1 more")).toBeInTheDocument();
  });

  it("links View fix to family detail when leadFamilyId exists", () => {
    render(
      <SystemTestsIncidentsTable
        items={[
          incidentRow({
            leadFamilyId: "family_lead_99",
            resolutionPreview: {
              hasResolution: true,
              category: "unknown",
              confidence: null,
              confidenceLabel: null,
              topRecommendationSummary: "Do the thing",
              recommendationCount: 1,
              diagnosisSummary: null,
              highestPriority: null,
            },
          }),
        ]}
      />,
    );
    const link = screen.getByTestId("system-tests-resolution-preview-link");
    expect(link).toHaveAttribute("href", "/admin/system-tests/families/family_lead_99");
  });

  it("renders Copy quick fix and copies structured incident handoff", async () => {
    const row = incidentRow({
      resolutionPreview: {
        hasResolution: true,
        category: "environment_unavailable",
        confidence: 0.9,
        confidenceLabel: "High confidence",
        topRecommendationSummary: "Restore local app availability.",
        recommendationCount: 2,
        diagnosisSummary: "App not reachable on port.",
        highestPriority: "high",
      },
    });

    const user = userEvent.setup();
    render(<SystemTestsIncidentsTable items={[row]} />);

    expect(screen.getByTestId("system-tests-copy-quick-fix-button")).toHaveTextContent("Copy quick fix");
    await user.click(screen.getByTestId("system-tests-copy-quick-fix-button"));
    expect(writeText).toHaveBeenCalledWith(
      buildIncidentQuickFixText({ ...row, familyTitle: null }),
    );
  });
});
