import { render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminAuthorityAlertsClient } from "./AdminAuthorityAlertsClient";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const mockAlerts = vi.hoisted(() => vi.fn());
const mockToken = vi.hoisted(() => vi.fn(() => "test-token"));

vi.mock("@/lib/api/adminAuthorityAlerts", () => ({
  fetchAdminAuthorityAlerts: mockAlerts,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: mockToken,
}));

describe("AdminAuthorityAlertsClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("test-token");
  });

  it("shows empty state when no alerts", async () => {
    mockAlerts.mockResolvedValue({
      kind: "booking_authority_alerts",
      generatedAt: "2025-03-01T12:00:00.000Z",
      windowUsed: { fromIso: "2025-03-01T00:00:00.000Z", toIso: "2025-03-01T12:00:00.000Z" },
      thresholdsUsed: {
        minSampleSize: 10,
        overrideRateHighThreshold: 0.3,
        reviewRateLowThreshold: 0.02,
        mismatchTypeMinCount: 8,
        unstableTagScoreMin: 10,
      },
      alerts: [],
    });
    render(
      <Suspense fallback={null}>
        <AdminAuthorityAlertsClient />
      </Suspense>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-alerts-empty")).toBeInTheDocument();
    });
  });

  it("lists fired alerts", async () => {
    mockAlerts.mockResolvedValue({
      kind: "booking_authority_alerts",
      generatedAt: "2025-03-01T12:00:00.000Z",
      windowUsed: { fromIso: "2025-03-01T00:00:00.000Z", toIso: "2025-03-01T12:00:00.000Z" },
      thresholdsUsed: {
        minSampleSize: 10,
        overrideRateHighThreshold: 0.3,
        reviewRateLowThreshold: 0.02,
        mismatchTypeMinCount: 8,
        unstableTagScoreMin: 10,
      },
      alerts: [
        {
          alertType: "override_rate_high",
          severity: "high" as const,
          evidenceSummary: "Override rate high.",
          windowUsed: {
            fromIso: "2025-03-01T00:00:00.000Z",
            toIso: "2025-03-01T12:00:00.000Z",
          },
          details: {},
          actionHints: {
            affectedBookingIds: ["booking_alpha_1"],
            suggestedAdminPath: "/admin/authority/report",
            relevantStatus: "overridden",
          },
        },
      ],
    });
    render(
      <Suspense fallback={null}>
        <AdminAuthorityAlertsClient />
      </Suspense>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-alerts-list")).toBeInTheDocument();
    });
    expect(screen.getByText("Override rate high.")).toBeInTheDocument();
    expect(screen.getByTestId("admin-authority-alert-actions")).toBeInTheDocument();
    const pathHref = screen.getByTestId("admin-authority-alert-suggested-path").getAttribute("href");
    expect(pathHref).toContain("/admin/authority/report");
    expect(pathHref).toContain("authorityStatus=overridden");
    expect(pathHref).toContain("focusBookings=booking_alpha_1");
    expect(pathHref).toContain("updatedSince=");
    expect(pathHref).toMatch(/2025-03-01T00/);
    expect(screen.getByTestId("admin-authority-alert-booking-link")).toHaveAttribute(
      "href",
      "/admin/bookings/booking_alpha_1",
    );
  });

  it("shows no-actions line when actionHints are empty", async () => {
    mockAlerts.mockResolvedValue({
      kind: "booking_authority_alerts",
      generatedAt: "2025-03-01T12:00:00.000Z",
      windowUsed: { fromIso: "2025-03-01T00:00:00.000Z", toIso: "2025-03-01T12:00:00.000Z" },
      thresholdsUsed: {
        minSampleSize: 10,
        overrideRateHighThreshold: 0.3,
        reviewRateLowThreshold: 0.02,
        mismatchTypeMinCount: 8,
        unstableTagScoreMin: 10,
      },
      alerts: [
        {
          alertType: "custom_signal",
          severity: "low" as const,
          evidenceSummary: "Something happened.",
          windowUsed: {
            fromIso: "2025-03-01T00:00:00.000Z",
            toIso: "2025-03-01T12:00:00.000Z",
          },
          details: {},
          actionHints: {},
        },
      ],
    });
    render(
      <Suspense fallback={null}>
        <AdminAuthorityAlertsClient />
      </Suspense>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-alerts-list")).toBeInTheDocument();
    });
    expect(screen.getByTestId("admin-authority-alert-no-actions")).toBeInTheDocument();
  });
});
