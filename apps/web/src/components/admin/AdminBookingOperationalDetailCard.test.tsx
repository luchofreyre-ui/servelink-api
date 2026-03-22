import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminBookingOperationalDetailCard } from "./AdminBookingOperationalDetailCard";
import * as paymentsApi from "@/lib/api/payments";

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: () => "admin-token",
}));

vi.mock("@/lib/api/payments", () => ({
  getAdminBookingOperationalDetail: vi.fn(),
}));

describe("AdminBookingOperationalDetailCard", () => {
  beforeEach(() => {
    vi.mocked(paymentsApi.getAdminBookingOperationalDetail).mockReset();
  });

  it("renders payment status and quoted total", async () => {
    vi.mocked(paymentsApi.getAdminBookingOperationalDetail).mockResolvedValue({
      id: "bk_1",
      status: "pending_payment",
      scheduledStart: null,
      startedAt: null,
      completedAt: null,
      quotedSubtotal: 100,
      quotedMargin: 20,
      quotedTotal: 120,
      paymentStatus: "requires_payment",
      paymentIntentId: "pi_abc",
      payments: [],
      trustEvents: [],
      opsAnomalies: [],
    });

    render(<AdminBookingOperationalDetailCard bookingId="bk_1" />);

    await waitFor(() => {
      expect(screen.getByText("requires_payment")).toBeInTheDocument();
      expect(screen.getByText(/\$120/)).toBeInTheDocument();
    });
  });

  it("renders payments list", async () => {
    vi.mocked(paymentsApi.getAdminBookingOperationalDetail).mockResolvedValue({
      id: "bk_1",
      status: "completed",
      scheduledStart: null,
      startedAt: null,
      completedAt: null,
      quotedSubtotal: null,
      quotedMargin: null,
      quotedTotal: 50,
      paymentStatus: "paid",
      paymentIntentId: "pi_x",
      payments: [
        {
          id: "pay_1",
          amount: 50,
          status: "completed",
          createdAt: new Date().toISOString(),
          externalRef: "pi_x",
        },
      ],
      trustEvents: [],
      opsAnomalies: [],
    });

    render(<AdminBookingOperationalDetailCard bookingId="bk_1" />);

    await waitFor(() => {
      expect(screen.getAllByText(/\$50\.00/).length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("completed").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("pi_x").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("renders anomaly list", async () => {
    vi.mocked(paymentsApi.getAdminBookingOperationalDetail).mockResolvedValue({
      id: "bk_1",
      status: "pending_payment",
      scheduledStart: null,
      startedAt: null,
      completedAt: null,
      quotedSubtotal: null,
      quotedMargin: null,
      quotedTotal: null,
      paymentStatus: "failed",
      paymentIntentId: null,
      payments: [],
      trustEvents: [],
      opsAnomalies: [
        {
          id: "a1",
          type: "payment_missing",
          status: "open",
          title: "Payment failed",
          detail: "Declined",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    render(<AdminBookingOperationalDetailCard bookingId="bk_1" />);

    await waitFor(() => {
      expect(screen.getByText("Payment failed")).toBeInTheDocument();
      expect(screen.getByText("payment_missing")).toBeInTheDocument();
      expect(screen.getByText("Declined")).toBeInTheDocument();
    });
  });
});
