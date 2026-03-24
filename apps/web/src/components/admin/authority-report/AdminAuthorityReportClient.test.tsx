import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminAuthorityReportClient } from "./AdminAuthorityReportClient";
import type { BookingAuthorityReportPayload } from "@/lib/api/adminAuthorityReport";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const mockFetch = vi.hoisted(() => vi.fn());
const mockList = vi.hoisted(() => vi.fn());
const mockToken = vi.hoisted(() => vi.fn(() => "test-token"));

vi.mock("@/lib/api/adminAuthorityReport", () => ({
  fetchAdminAuthorityReport: mockFetch,
  fetchAdminAuthorityResultsList: mockList,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: mockToken,
}));

const sampleReport: BookingAuthorityReportPayload = {
  kind: "booking_authority_report",
  generatedAt: "2025-03-01T12:00:00.000Z",
  totalRecords: 10,
  countsByStatus: {
    auto: 7,
    reviewed: 2,
    overridden: 1,
  },
  topSurfaces: [
    { tag: "tile", bookingCount: 5 },
    { tag: "shower-glass", bookingCount: 3 },
  ],
  topProblems: [{ tag: "grease-buildup", bookingCount: 4 }],
  topMethods: [{ tag: "degreasing", bookingCount: 4 }],
};

const emptyList = {
  kind: "booking_authority_results" as const,
  total: 0,
  offset: 0,
  limit: 50,
  items: [] as [],
};

describe("AdminAuthorityReportClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("test-token");
  });

  it("shows sign-in message when no token", async () => {
    mockToken.mockReturnValue(null);

    render(
      <Suspense fallback={null}>
        <AdminAuthorityReportClient />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByText(/sign in at \/admin\/auth/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("renders status counts and top tag tables", async () => {
    mockFetch.mockResolvedValue(sampleReport);
    mockList.mockResolvedValue(emptyList);

    render(
      <Suspense fallback={null}>
        <AdminAuthorityReportClient />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-report-summary")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      "test-token",
      expect.objectContaining({
        topLimit: 25,
        recentLimit: 0,
        windowHours: 168,
      }),
    );

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(
        expect.any(String),
        "test-token",
        expect.objectContaining({ limit: 50, offset: 0 }),
      );
    });
    expect(mockList.mock.calls[0][2]).not.toHaveProperty("status");

    expect(screen.getByTestId("admin-authority-report-total-records")).toHaveTextContent(
      "10",
    );
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    expect(screen.getByTestId("admin-authority-report-top-surfaces")).toHaveTextContent(
      "tile",
    );
    expect(screen.getByTestId("admin-authority-report-top-surfaces")).toHaveTextContent(
      "shower-glass",
    );
    expect(screen.getByTestId("admin-authority-report-top-problems")).toHaveTextContent(
      "grease-buildup",
    );
    expect(screen.getByTestId("admin-authority-report-top-methods")).toHaveTextContent(
      "degreasing",
    );

    expect(screen.getByTestId("admin-authority-report-row-list")).toBeInTheDocument();
    expect(screen.getByTestId("admin-authority-report-status-filter")).toBeInTheDocument();
  });

  it("refetches persisted rows when status filter changes", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(sampleReport);
    mockList.mockResolvedValue(emptyList);

    render(
      <Suspense fallback={null}>
        <AdminAuthorityReportClient />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-report-summary")).toBeInTheDocument();
    });

    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));

    await user.selectOptions(
      screen.getByRole("combobox", { name: /filter persisted rows by review status/i }),
      "reviewed",
    );

    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
    expect(mockList).toHaveBeenLastCalledWith(expect.any(String), "test-token", {
      limit: 50,
      offset: 0,
      status: "reviewed",
    });
  });
});
