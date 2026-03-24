import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeepCleanEstimatorGovernanceClient } from "./DeepCleanEstimatorGovernanceClient";

const mockHistory = vi.hoisted(() => vi.fn());
const mockActive = vi.hoisted(() => vi.fn());
const mockDetail = vi.hoisted(() => vi.fn());
const mockRestore = vi.hoisted(() => vi.fn());
const mockImpact = vi.hoisted(() => vi.fn());
const mockToken = vi.hoisted(() => vi.fn(() => "t"));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/bookings", () => ({
  fetchAdminDeepCleanEstimatorConfigHistory: mockHistory,
  fetchAdminDeepCleanEstimatorActiveConfig: mockActive,
  fetchAdminDeepCleanEstimatorConfigDetail: mockDetail,
  restoreAdminDeepCleanEstimatorConfigToDraft: mockRestore,
  fetchAdminDeepCleanEstimatorImpact: mockImpact,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: mockToken,
}));

const histRow = (id: string, version: number, status: "active" | "draft" | "archived", label: string) => ({
  id,
  version,
  status,
  label,
  publishedAt: "2020-01-01T00:00:00.000Z",
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-02T00:00:00.000Z",
  createdByUserId: null,
  publishedByUserId: null,
});

const emptyImpact = () =>
  mockImpact.mockResolvedValue({
    kind: "deep_clean_estimator_impact",
    rows: [],
    comparisons: [],
  });

describe("DeepCleanEstimatorGovernanceClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("t");
    emptyImpact();
  });

  it("shows sign-in when no token", async () => {
    mockToken.mockReturnValue(null);
    render(<DeepCleanEstimatorGovernanceClient />);
    await waitFor(() => {
      expect(screen.getByText(/sign in at \/admin\/auth/i)).toBeInTheDocument();
    });
    expect(mockHistory).not.toHaveBeenCalled();
  });

  it("renders safety copy and history table", async () => {
    mockHistory.mockResolvedValue({
      kind: "deep_clean_estimator_config_history",
      rows: [
        histRow("a1", 2, "active", "A"),
        histRow("d1", 3, "draft", "D"),
        histRow("z1", 1, "archived", "Z"),
      ],
    });
    mockActive.mockResolvedValue({
      kind: "deep_clean_estimator_config_active",
      row: {
        id: "a1",
        version: 2,
        status: "active",
        label: "A",
        config: {
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
        },
        publishedAt: null,
        createdByUserId: null,
        publishedByUserId: null,
        createdAt: "",
        updatedAt: "",
      },
    });

    render(<DeepCleanEstimatorGovernanceClient />);

    await waitFor(() => {
      expect(screen.getByTestId("deep-clean-estimator-governance-history-table")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("deep-clean-estimator-decision-summary")).toBeInTheDocument();
    });

    const safety = screen.getByTestId("deep-clean-estimator-governance-safety-block");
    expect(safety).toHaveTextContent("Restoring a version creates a new draft.");
    expect(safety).toHaveTextContent("Publishing affects future estimates only.");
    expect(safety).toHaveTextContent("Historical versions are never reactivated in place.");

    expect(screen.getByTestId("deep-clean-estimator-governance-link-estimator")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator",
    );
    expect(screen.getByTestId("deep-clean-estimator-governance-link-impact")).toHaveAttribute(
      "href",
      "/admin/deep-clean/estimator-impact",
    );
  });

  it("shows decision intelligence warning when impact fetch fails", async () => {
    mockImpact.mockRejectedValueOnce(new Error("network"));
    mockHistory.mockResolvedValue({
      kind: "deep_clean_estimator_config_history",
      rows: [
        histRow("a1", 2, "active", "A"),
        histRow("d1", 3, "draft", "D"),
        histRow("z1", 1, "archived", "Z"),
      ],
    });
    mockActive.mockResolvedValue({
      kind: "deep_clean_estimator_config_active",
      row: {
        id: "a1",
        version: 2,
        status: "active",
        label: "A",
        config: {
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
        },
        publishedAt: null,
        createdByUserId: null,
        publishedByUserId: null,
        createdAt: "",
        updatedAt: "",
      },
    });

    render(<DeepCleanEstimatorGovernanceClient />);

    await waitFor(() => {
      expect(screen.getByTestId("deep-clean-estimator-governance-history-table")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Decision intelligence is temporarily unavailable/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("deep-clean-estimator-decision-summary")).not.toBeInTheDocument();
  });

  it("restore modal confirms and calls API", async () => {
    const user = userEvent.setup();
    mockHistory.mockResolvedValue({
      kind: "deep_clean_estimator_config_history",
      rows: [histRow("a1", 2, "active", "A"), histRow("d1", 3, "draft", "D")],
    });
    mockActive.mockResolvedValue({
      kind: "deep_clean_estimator_config_active",
      row: {
        id: "a1",
        version: 2,
        status: "active",
        label: "A",
        config: {
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
        },
        publishedAt: null,
        createdByUserId: null,
        publishedByUserId: null,
        createdAt: "",
        updatedAt: "",
      },
    });
    const draftDetail = {
      id: "d1",
      version: 3,
      status: "draft" as const,
      label: "Restored from v2",
      config: {
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
      },
      publishedAt: null,
      createdByUserId: null,
      publishedByUserId: null,
      createdAt: "",
      updatedAt: "",
    };
    mockDetail.mockResolvedValue({
      kind: "deep_clean_estimator_config_detail",
      row: draftDetail,
    });
    mockRestore.mockResolvedValue({
      kind: "deep_clean_estimator_config_restored_to_draft",
      restoredFromVersion: 2,
      draft: draftDetail,
    });

    render(<DeepCleanEstimatorGovernanceClient />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /restore to draft/i })).toBeInTheDocument();
    });

    const restoreBtns = screen.getAllByRole("button", { name: /restore to draft/i });
    await user.click(restoreBtns[0]!);

    expect(screen.getByTestId("deep-clean-estimator-governance-restore-modal")).toBeInTheDocument();
    expect(screen.getByText(/current draft will be replaced/i)).toBeInTheDocument();

    const modal = screen.getByTestId("deep-clean-estimator-governance-restore-modal");
    await user.click(within(modal).getByRole("button", { name: /^restore to draft$/i }));

    await waitFor(() => {
      expect(mockRestore).toHaveBeenCalledWith("a1");
    });
  });
});
