import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeepCleanEstimatorClient } from "./DeepCleanEstimatorClient";

const mockFetchActive = vi.hoisted(() => vi.fn());
const mockFetchDraft = vi.hoisted(() => vi.fn());
const mockUpdateDraft = vi.hoisted(() => vi.fn());
const mockPreview = vi.hoisted(() => vi.fn());
const mockPublish = vi.hoisted(() => vi.fn());
const mockToken = vi.hoisted(() => vi.fn(() => "t"));

vi.mock("@/lib/api/bookings", () => ({
  fetchAdminDeepCleanEstimatorActiveConfig: mockFetchActive,
  fetchAdminDeepCleanEstimatorDraftConfig: mockFetchDraft,
  updateAdminDeepCleanEstimatorDraftConfig: mockUpdateDraft,
  previewAdminDeepCleanEstimatorConfig: mockPreview,
  publishAdminDeepCleanEstimatorDraft: mockPublish,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: mockToken,
}));

const defaultConfig = {
  globalDurationMultiplier: 1,
  singleVisitDurationMultiplier: 1,
  threeVisitDurationMultiplier: 1,
  visitDurationMultipliers: { visit1: 1, visit2: 1, visit3: 1 },
  bedroomAdditiveMinutes: 0,
  bathroomAdditiveMinutes: 0,
  petAdditiveMinutes: 0,
  kitchenHeavySoilAdditiveMinutes: 0,
  minimumVisitDurationMinutes: 0,
  minimumProgramDurationMinutes: 0,
};

const row = (version: number, status: string, label: string, config = defaultConfig) => ({
  id: `id_${version}`,
  version,
  status,
  label,
  config,
  publishedAt: "2025-01-01T00:00:00.000Z",
  createdByUserId: null,
  publishedByUserId: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
});

describe("DeepCleanEstimatorClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("t");
  });

  it("shows safety copy about future estimates only", async () => {
    mockFetchActive.mockResolvedValue({ kind: "deep_clean_estimator_config_active", row: row(1, "active", "A") });
    mockFetchDraft.mockResolvedValue({ kind: "deep_clean_estimator_config_draft", row: row(2, "draft", "D") });

    render(<DeepCleanEstimatorClient />);

    await waitFor(() => {
      expect(screen.getByTestId("deep-clean-estimator-safety-copy")).toHaveTextContent(
        /Publishing affects future estimates only/i,
      );
    });
  });

  it("renders active and draft sections and links to insights/analytics", async () => {
    mockFetchActive.mockResolvedValue({ kind: "deep_clean_estimator_config_active", row: row(1, "active", "A") });
    mockFetchDraft.mockResolvedValue({ kind: "deep_clean_estimator_config_draft", row: row(2, "draft", "D") });

    render(<DeepCleanEstimatorClient />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /active config/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: /draft config/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /deep clean insights/i })).toHaveAttribute(
      "href",
      "/admin/deep-clean/insights",
    );
    expect(screen.getByRole("link", { name: /deep clean analytics/i })).toHaveAttribute(
      "href",
      "/admin/deep-clean/analytics",
    );
    const impactLinks = screen.getAllByRole("link", { name: /^estimator impact$/i });
    expect(impactLinks.length).toBeGreaterThanOrEqual(1);
    for (const el of impactLinks) {
      expect(el).toHaveAttribute("href", "/admin/deep-clean/estimator-impact");
    }
    expect(screen.getByTestId("deep-clean-estimator-link-governance")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator-governance",
    );
    expect(screen.getByTestId("deep-clean-estimator-link-monitoring")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator-monitoring",
    );
  });

  it("runs preview and shows delta", async () => {
    const user = userEvent.setup();
    mockFetchActive.mockResolvedValue({ kind: "deep_clean_estimator_config_active", row: row(1, "active", "A") });
    mockFetchDraft.mockResolvedValue({ kind: "deep_clean_estimator_config_draft", row: row(2, "draft", "D") });
    mockPreview.mockResolvedValue({
      kind: "deep_clean_estimator_preview",
      active: {
        id: "a",
        version: 1,
        label: "A",
        totalEstimatedDurationMinutes: 100,
        perVisitDurationMinutes: [100],
        estimatedPriceCents: 5000,
      },
      draft: {
        id: "b",
        version: 2,
        label: "D",
        totalEstimatedDurationMinutes: 110,
        perVisitDurationMinutes: [110],
        estimatedPriceCents: 5500,
      },
      deltaMinutes: 10,
      deltaPercent: 10,
    });

    render(<DeepCleanEstimatorClient />);

    await waitFor(() => expect(mockFetchActive).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /run preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/estimated duration delta/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Δ minutes/i)).toHaveTextContent("10");
  });

  it("publish flow shows confirm copy", async () => {
    const user = userEvent.setup();
    mockFetchActive.mockResolvedValue({ kind: "deep_clean_estimator_config_active", row: row(1, "active", "A") });
    mockFetchDraft.mockResolvedValue({ kind: "deep_clean_estimator_config_draft", row: row(2, "draft", "D") });

    render(<DeepCleanEstimatorClient />);

    await waitFor(() => expect(screen.getByRole("button", { name: /publish estimator config/i })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /publish estimator config/i }));

    expect(screen.getByTestId("deep-clean-estimator-publish-confirm-copy")).toHaveTextContent(
      /future estimates only/i,
    );
  });
});
