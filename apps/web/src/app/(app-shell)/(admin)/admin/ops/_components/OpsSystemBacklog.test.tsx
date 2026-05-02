import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  FoSupplyReadinessResponse,
  OpsItemsResponse,
  OpsSummaryResponse,
} from "@/lib/api/adminOps";
import OpsSystemBacklog from "./OpsSystemBacklog";

vi.mock("./DeferredDispatchTable", () => ({
  DeferredDispatchTable: () => <div data-testid="deferred-dispatch-table" />,
}));

vi.mock("./DispatchLockedTable", () => ({
  DispatchLockedTable: () => <div data-testid="dispatch-locked-table" />,
}));

vi.mock("./FoSupplyReadinessSection", () => ({
  FoSupplyReadinessSection: () => <div data-testid="fo-supply-readiness-section" />,
}));

vi.mock("./ReviewRequiredTable", () => ({
  ReviewRequiredTable: () => <div data-testid="review-required-table" />,
}));

const emptyItems: OpsItemsResponse = { ok: true, items: [] };
const emptyFoSupply: FoSupplyReadinessResponse = { ok: true, items: [] };

function renderBacklog(summary: OpsSummaryResponse) {
  return render(
    <OpsSystemBacklog
      summary={summary}
      invalid={emptyItems}
      locked={emptyItems}
      reviewRequired={emptyItems}
      deferred={emptyItems}
      manual={emptyItems}
      foSupply={emptyFoSupply}
    />,
  );
}

describe("OpsSystemBacklog ops summary surfaces", () => {
  it("renders payment health when payment exists", () => {
    renderBacklog({
      ok: true,
      summary: {
        payment: {
          bookingStates: {
            pendingPayment: 2,
            authorized: 5,
            depositSucceeded: 4,
            completedMissingPaymentAlignment: 0,
            depositStateMismatch: 0,
          },
          anomalies: {
            openPaymentAnomalies: 1,
            openOpsPaymentAnomalies: 2,
            recentPaymentAnomaliesLast24h: 1,
          },
          staleBuckets: {
            "0-30m": 1,
            "30m-2h": 0,
            "2h-24h": 0,
            "1-7d": 0,
            "7-30d": 0,
            ">30d": 0,
          },
          flags: {
            hasRecentPaymentFailures: false,
            hasStalePendingPayments: false,
            hasDepositStateMismatch: false,
          },
        },
      },
    });

    expect(screen.getByText("Payment Health")).toBeInTheDocument();
    expect(screen.getByText("Pending payment")).toBeInTheDocument();
    expect(screen.getByText("Deposit succeeded")).toBeInTheDocument();
    expect(screen.getByText("Total payment anomalies")).toBeInTheDocument();
  });

  it("renders cron ledger rows when cronLedger exists", () => {
    renderBacklog({
      ok: true,
      summary: {
        cronLedger: {
          available: true,
          jobs: {
            payment_lifecycle_reconciliation: {
              lastStatus: "succeeded",
              lastStartedAt: "2030-01-01T00:00:00.000Z",
              lastFinishedAt: "2030-01-01T00:00:01.000Z",
              lastDurationMs: 1000,
              recentRuns24h: 3,
              recentFailures24h: 0,
            },
          },
        },
      },
    });

    expect(screen.getByText("Cron Ledger Health")).toBeInTheDocument();
    expect(screen.getByText("payment_lifecycle_reconciliation")).toBeInTheDocument();
    expect(screen.getByText("succeeded")).toBeInTheDocument();
  });

  it("does not crash when optional ops fields are missing", () => {
    renderBacklog({ ok: true, summary: {} });

    expect(screen.getByText("System Status Summary")).toBeInTheDocument();
    expect(screen.getByText("Payment health is not available in ops summary.")).toBeInTheDocument();
    expect(screen.getByText("No cron ledger runs have been recorded yet.")).toBeInTheDocument();
  });

  it("shows warning state for deposit mismatch flag", () => {
    renderBacklog({
      ok: true,
      summary: {
        payment: {
          bookingStates: {
            depositStateMismatch: 1,
          },
          flags: {
            hasDepositStateMismatch: true,
          },
        },
      },
    });

    expect(screen.getAllByText("Attention Required").length).toBeGreaterThan(0);
    expect(screen.getByText("Deposit state mismatch: Attention Required")).toBeInTheDocument();
  });
});
