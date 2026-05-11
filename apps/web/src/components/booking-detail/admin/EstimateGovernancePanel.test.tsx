import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  EstimateGovernanceCompactBadges,
  EstimateGovernancePanel,
} from "@/components/booking-detail/admin/EstimateGovernancePanel";
import type {
  EstimateGovernancePanelModel,
  RecurringEconomicsGovernanceViewModel,
} from "@/lib/estimate/estimateGovernanceView";

function baseView(partial: Partial<EstimateGovernancePanelModel>): EstimateGovernancePanelModel {
  return {
    hasBreakdown: true,
    hasGovernance: true,
    overallConfidencePct: "85%",
    confidenceClassification: "high",
    escalationSummary: {
      escalationLevel: "none",
      severityScore: 20,
      recommendedActions: ["no_action"],
      blockingReasons: [],
      escalationReasons: [],
    },
    weakestDomains: [],
    topUncertaintyDrivers: [],
    intakeStabilityDriverHits: [],
    intakeStabilityLines: [],
    recurringTransitionReasoning: [],
    ...partial,
  };
}

describe("EstimateGovernancePanel", () => {
  it("renders legacy empty state without crashing", () => {
    render(
      <EstimateGovernancePanel
        view={baseView({
          hasBreakdown: false,
          hasGovernance: false,
          overallConfidencePct: null,
          confidenceClassification: null,
          escalationSummary: {
            escalationLevel: null,
            severityScore: null,
            recommendedActions: [],
            blockingReasons: [],
            escalationReasons: [],
          },
        })}
        snapshotExists
        recurringEconomics={null}
      />,
    );
    expect(screen.getByRole("region", { name: /estimate governance/i })).toBeTruthy();
    expect(screen.getByText(/historical bookings may omit/i)).toBeTruthy();
  });

  it("renders intervention guidance read-only", () => {
    render(
      <EstimateGovernancePanel
        view={baseView({
          confidenceClassification: "low",
          escalationSummary: {
            escalationLevel: "intervention_required",
            severityScore: 82,
            recommendedActions: ["admin_review_required", "block_auto_acceptance"],
            blockingReasons: ["governance_v1_auto_acceptance_not_recommended"],
            escalationReasons: ["overall_confidence_critical"],
          },
        })}
        snapshotExists
        recurringEconomics={null}
      />,
    );
    expect(screen.getByText(/operational visibility only/i)).toBeTruthy();
    expect(screen.getByText(/blocking guidance \(advisory only\)/i)).toBeTruthy();
    expect(screen.getByText(/admin review required/i)).toBeTruthy();
  });

  it("renders recurring economics governance when snapshot includes lane", () => {
    const recurring: RecurringEconomicsGovernanceViewModel = {
      economicRiskLevel: "medium",
      maintenanceViability: "watch",
      recurringDiscountRisk: "low",
      resetReviewRecommendation: "suggested",
      marginProtectionSignal: "monitor",
      riskScore: 42,
      recommendedActions: ["monitor_recurring_account"],
      topEconomicReasons: ["sparse_structured_intake"],
      topMaintenanceReasons: ["maintenance_lane_watch"],
    };
    render(
      <EstimateGovernancePanel
        view={baseView({})}
        snapshotExists
        recurringEconomics={recurring}
      />,
    );
    expect(screen.getByText(/recurring economics governance/i)).toBeTruthy();
    expect(screen.getByText(/monitor recurring account/i)).toBeTruthy();
  });

  it("compact badges render for high-confidence snapshots", () => {
    render(<EstimateGovernanceCompactBadges view={baseView({})} />);
    expect(screen.getByText(/confidence:\s*high/i)).toBeTruthy();
  });

  it("compact badges return null when no metadata", () => {
    const { container } = render(
      <EstimateGovernanceCompactBadges
        view={baseView({ hasBreakdown: false, hasGovernance: false })}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
