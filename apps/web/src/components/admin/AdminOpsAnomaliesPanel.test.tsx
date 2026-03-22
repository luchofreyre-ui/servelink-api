import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminOpsAnomaliesPanel } from "./AdminOpsAnomaliesPanel";
import * as paymentsApi from "@/lib/api/payments";

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: () => "admin-token",
}));

vi.mock("@/lib/api/payments", () => ({
  getAdminOpenPrismaOpsAnomalies: vi.fn(),
  acknowledgeAdminPrismaOpsAnomaly: vi.fn(),
  resolveAdminPrismaOpsAnomaly: vi.fn(),
}));

describe("AdminOpsAnomaliesPanel", () => {
  beforeEach(() => {
    vi.mocked(paymentsApi.getAdminOpenPrismaOpsAnomalies).mockReset();
    vi.mocked(paymentsApi.acknowledgeAdminPrismaOpsAnomaly).mockReset();
    vi.mocked(paymentsApi.resolveAdminPrismaOpsAnomaly).mockReset();
  });

  it("renders anomaly title after load", async () => {
    vi.mocked(paymentsApi.getAdminOpenPrismaOpsAnomalies).mockResolvedValue([
      {
        id: "anom_1",
        type: "payment_missing",
        status: "open",
        title: "Payment failed or missing",
        detail: "Card declined",
        createdAt: new Date().toISOString(),
        booking: { id: "bk_1", status: "pending_payment", scheduledStart: null },
        fo: null,
      },
    ]);

    render(<AdminOpsAnomaliesPanel />);

    await waitFor(() => {
      expect(screen.getByText("Payment failed or missing")).toBeInTheDocument();
    });
  });

  it("ack button calls acknowledge API", async () => {
    const user = userEvent.setup();
    vi.mocked(paymentsApi.getAdminOpenPrismaOpsAnomalies)
      .mockResolvedValueOnce([
        {
          id: "anom_ack",
          type: "payment_missing",
          status: "open",
          title: "Needs ack",
          createdAt: new Date().toISOString(),
        },
      ])
      .mockResolvedValueOnce([]);

    vi.mocked(paymentsApi.acknowledgeAdminPrismaOpsAnomaly).mockResolvedValue({
      id: "anom_ack",
      status: "acknowledged",
    });

    render(<AdminOpsAnomaliesPanel />);

    await waitFor(() => {
      expect(screen.getByText("Needs ack")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^ack$/i }));

    await waitFor(() => {
      expect(paymentsApi.acknowledgeAdminPrismaOpsAnomaly).toHaveBeenCalledWith(
        "anom_ack",
        "admin-token",
      );
    });
  });

  it("resolve button calls resolve API", async () => {
    const user = userEvent.setup();
    vi.mocked(paymentsApi.getAdminOpenPrismaOpsAnomalies)
      .mockResolvedValueOnce([
        {
          id: "anom_res",
          type: "payment_mismatch",
          status: "open",
          title: "Mismatch",
          createdAt: new Date().toISOString(),
        },
      ])
      .mockResolvedValueOnce([]);

    vi.mocked(paymentsApi.resolveAdminPrismaOpsAnomaly).mockResolvedValue({
      id: "anom_res",
      status: "resolved",
    });

    render(<AdminOpsAnomaliesPanel />);

    await waitFor(() => {
      expect(screen.getByText("Mismatch")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^resolve$/i }));

    await waitFor(() => {
      expect(paymentsApi.resolveAdminPrismaOpsAnomaly).toHaveBeenCalledWith(
        "anom_res",
        "admin-token",
      );
    });
  });
});
