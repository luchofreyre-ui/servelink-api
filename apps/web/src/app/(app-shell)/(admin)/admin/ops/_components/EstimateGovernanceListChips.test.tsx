import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EstimateGovernanceListChips } from "./EstimateGovernanceListChips";

describe("EstimateGovernanceListChips", () => {
  it("renders nothing when both summaries are absent", () => {
    const { container } = render(
      <EstimateGovernanceListChips bookingId="bk_1" governanceSummary={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders recurring-only chips when compact recurring summary exists", () => {
    render(
      <EstimateGovernanceListChips
        bookingId="bk_rec"
        governanceSummary={null}
        recurringEconomicsSummary={{
          economicRiskLevel: "high",
          maintenanceViability: "unstable",
          resetReviewRecommendation: "required",
          marginProtectionSignal: "protect",
          riskScore: 88,
          recommendedActionCount: 3,
          hasDiscountRisk: true,
          hasResetRisk: true,
          hasMarginProtection: true,
          bookingDetailAnchor: "#estimate-governance",
        }}
      />,
    );
    const link = screen.getByText(/recurring risk/i);
    expect(link.getAttribute("href")).toContain(
      "/admin/bookings/bk_rec#estimate-governance",
    );
    expect(screen.getByText(/reset review/i)).toBeTruthy();
  });

  it("renders review and severity chips with governance anchor", () => {
    render(
      <EstimateGovernanceListChips
        bookingId="bk_test"
        governanceSummary={{
          escalationLevel: "review",
          severityScore: 72,
          confidenceClassification: "low",
          weakestDomainCount: 2,
          criticalDomainCount: 1,
          lowDomainCount: 1,
          hasRecurringInstability: false,
          hasPriceCollapseSignal: false,
          hasSparseIntakeSignal: false,
          recommendedActionCount: 1,
          bookingDetailAnchor: "#estimate-governance",
        }}
      />,
    );
    const reviewLink = screen.getByText("Review required");
    expect(reviewLink.getAttribute("href")).toBe(
      "/admin/bookings/bk_test#estimate-governance",
    );
    expect(screen.getByText(/Sev 72/)).toBeTruthy();
  });

  it("shows intervention and instability indicators", () => {
    render(
      <EstimateGovernanceListChips
        bookingId="bk_x"
        governanceSummary={{
          escalationLevel: "intervention_required",
          severityScore: 80,
          confidenceClassification: "critical",
          weakestDomainCount: 3,
          criticalDomainCount: 2,
          lowDomainCount: 1,
          hasRecurringInstability: true,
          hasPriceCollapseSignal: false,
          hasSparseIntakeSignal: true,
          recommendedActionCount: 2,
          bookingDetailAnchor: "#estimate-governance",
        }}
      />,
    );
    expect(screen.getByText(/Intervention \(advisory\)/)).toBeTruthy();
    expect(screen.getByText(/Recurring instability/)).toBeTruthy();
    expect(screen.getByText(/Sparse intake/)).toBeTruthy();
  });

  it("labels hard_block as advisory", () => {
    render(
      <EstimateGovernanceListChips
        bookingId="bk_hb"
        governanceSummary={{
          escalationLevel: "hard_block",
          severityScore: 95,
          confidenceClassification: "critical",
          weakestDomainCount: 2,
          criticalDomainCount: 2,
          lowDomainCount: 0,
          hasRecurringInstability: false,
          hasPriceCollapseSignal: false,
          hasSparseIntakeSignal: false,
          recommendedActionCount: 2,
          bookingDetailAnchor: "#estimate-governance",
        }}
      />,
    );
    expect(screen.getByText(/Hard block \(advisory\)/)).toBeTruthy();
  });
});
