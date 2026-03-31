import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SystemTestsOverviewPanels } from "../SystemTestsOverviewPanels";
import type { SystemTestFailureGroup } from "@/types/systemTests";
import type { SystemTestFixOpportunity, SystemTestResolutionPreview } from "@/types/systemTestResolution";
import { fixOpportunityToResolutionPreview } from "@/lib/system-tests/fixOpportunityPreview";

const minimalGroup = (overrides: Partial<SystemTestFailureGroup> = {}): SystemTestFailureGroup => ({
  key: "k1",
  fingerprint: "fp",
  file: "a.spec.ts",
  projectName: "web",
  title: "Failing test",
  shortMessage: "expected true",
  fullMessage: null,
  finalStatus: "failed",
  occurrences: 1,
  testTitles: ["Failing test"],
  evidenceLines: [],
  evidenceSummary: {
    messageLine: null,
    assertionLine: null,
    locationLine: null,
    diagnosticLines: [],
  },
  diagnosticPreview: null,
  ...overrides,
});

describe("SystemTestsOverviewPanels (dashboard)", () => {
  it("omits fix opportunity section when fixOpportunities is empty", () => {
    render(
      <SystemTestsOverviewPanels
        fixOpportunities={[]}
        topProblems={[]}
        latestFailures={{
          runId: "run-1",
          groups: [],
          loading: false,
        }}
      />,
    );
    expect(screen.queryByTestId("system-tests-fix-opportunities-section")).toBeNull();
    expect(screen.queryByTestId("system-tests-fix-opportunity-strip")).toBeNull();
  });

  it("renders fix opportunity section when fixOpportunities exist", () => {
    const opps: SystemTestFixOpportunity[] = [
      {
        familyId: "fam-x",
        familyKey: "fk",
        title: "Auth flake family",
        category: "auth_state",
        confidence: 0.88,
        confidenceLabel: "High confidence",
        topRecommendationSummary: "Stabilize session fixture.",
        failureCount: 3,
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
          seenInRunCount: 1,
          recentRunCountConsidered: 10,
          seenInLatestRun: true,
          seenInPreviousRun: true,
          consecutiveRunCount: 2,
          runsSinceLastSeen: 0,
          lifecycleState: "recurring",
        },
      },
    ];
    render(
      <SystemTestsOverviewPanels
        fixOpportunities={opps}
        topProblems={[]}
        latestFailures={{
          runId: "run-1",
          groups: [],
          loading: false,
        }}
      />,
    );
    expect(screen.getByTestId("system-tests-fix-opportunities-section")).toBeInTheDocument();
    expect(screen.getByText("Highest-confidence fix opportunities")).toBeInTheDocument();
    expect(screen.getByText("Auth flake family")).toBeInTheDocument();
  });

  it("renders top issue resolution preview snippet when item has resolutionPreview", () => {
    const preview: SystemTestResolutionPreview = {
      hasResolution: true,
      category: "ui_regression",
      confidence: 0.7,
      confidenceLabel: "Medium confidence",
      topRecommendationSummary: "Update selector.",
      recommendationCount: 1,
      diagnosisSummary: "Broken layout.",
      highestPriority: "medium",
    };
    render(
      <SystemTestsOverviewPanels
        fixOpportunities={[]}
        topProblems={[
          {
            title: "Pattern hit",
            type: "pattern",
            severity: "high",
            impactScore: 100,
            summary: "Cluster summary text.",
            resolutionPreview: preview,
          },
        ]}
        latestFailures={{
          runId: "run-1",
          groups: [],
          loading: false,
        }}
      />,
    );
    expect(screen.getByTestId("system-tests-top-issue-preview")).toBeInTheDocument();
    expect(screen.getByText("Update selector.")).toBeInTheDocument();
  });

  it("renders latest failure preview when family matches summary map", () => {
    const opp: SystemTestFixOpportunity = {
      familyId: "fam-linked",
      familyKey: "k",
      title: "Linked family",
      category: "navigation_issue",
      confidence: 0.8,
      confidenceLabel: "High confidence",
      topRecommendationSummary: "Fix nav guard.",
      failureCount: 1,
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
    };
    const byId = { [opp.familyId]: fixOpportunityToResolutionPreview(opp) };

    render(
      <SystemTestsOverviewPanels
        fixOpportunities={[]}
        topProblems={[]}
        latestFailures={{
          runId: "run-1",
          groups: [
            minimalGroup({
              family: {
                familyId: "fam-linked",
                displayTitle: "Linked family",
                rootCauseSummary: "x",
                matchBasis: "y",
                status: "open",
                trendKind: "flat",
                seenInWindowLabel: "3",
                recurrenceLine: "r",
              },
            }),
          ],
          loading: false,
          familyResolutionPreviewByFamilyId: byId,
          familyLifecycleByFamilyId: { [opp.familyId]: opp.lifecycle },
        }}
      />,
    );
    expect(screen.getByTestId("system-tests-latest-failure-preview")).toBeInTheDocument();
    expect(screen.getByText("Fix nav guard.")).toBeInTheDocument();
  });
});
