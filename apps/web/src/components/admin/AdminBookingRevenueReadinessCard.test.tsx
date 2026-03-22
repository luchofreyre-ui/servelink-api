import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminBookingRevenueReadinessCard } from "./AdminBookingRevenueReadinessCard";
import * as paymentsApi from "@/lib/api/payments";

vi.mock("@/lib/api/payments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/payments")>();
  return {
    ...actual,
    getAdminOpenOpsAnomalies: vi.fn(),
  };
});

const tokenMock = vi.fn(() => "admin-token");

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: () => tokenMock(),
}));

describe("AdminBookingRevenueReadinessCard", () => {
  beforeEach(() => {
    tokenMock.mockReturnValue("admin-token");
    vi.mocked(paymentsApi.getAdminOpenOpsAnomalies).mockReset();
  });

  it("renders counts from anomalies", async () => {
    vi.mocked(paymentsApi.getAdminOpenOpsAnomalies).mockResolvedValue([
      {
        id: "a1",
        type: "other",
        status: "open",
        title: "T",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "a2",
        type: "payment_missing",
        status: "open",
        title: "P",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ]);

    render(<AdminBookingRevenueReadinessCard />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("counts payment anomalies correctly", async () => {
    vi.mocked(paymentsApi.getAdminOpenOpsAnomalies).mockResolvedValue([
      {
        id: "a1",
        type: "payment_missing",
        status: "open",
        title: "M",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "a2",
        type: "payment_mismatch",
        status: "open",
        title: "X",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "a3",
        type: "other",
        status: "open",
        title: "O",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ]);

    render(<AdminBookingRevenueReadinessCard />);

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    expect(screen.getByText("Payment-related")).toBeInTheDocument();
    expect(screen.getByText("Open anomalies")).toBeInTheDocument();
  });

  it("shows sign-in message without token", async () => {
    tokenMock.mockReturnValue(null);

    render(<AdminBookingRevenueReadinessCard />);

    await waitFor(() => {
      expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
    });
  });
});
