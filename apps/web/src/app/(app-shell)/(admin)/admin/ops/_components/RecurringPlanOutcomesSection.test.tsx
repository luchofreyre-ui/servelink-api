import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchRecurringPlanOutcomes,
  type AdminRecurringPlanOutcome,
} from "@/lib/api/adminOps";
import { RecurringPlanOutcomesSection } from "./RecurringPlanOutcomesSection";

vi.mock("@/lib/api/adminOps", () => ({
  fetchRecurringPlanOutcomes: vi.fn(),
}));

const convertedOutcome: AdminRecurringPlanOutcome = {
  id: "rpo_converted",
  bookingId: "bk_converted",
  converted: true,
  cadence: "weekly",
  recordedAt: "2030-01-01T00:00:00.000Z",
  createdAt: "2030-01-01T00:00:00.000Z",
  updatedAt: "2030-01-01T00:00:00.000Z",
  booking: {
    id: "bk_converted",
    status: "completed",
    createdAt: "2030-01-01T00:00:00.000Z",
    customer: {
      id: "cus_1",
      name: "Alex Rivera",
      email: "alex@example.test",
    },
  },
};

const notConvertedOutcome: AdminRecurringPlanOutcome = {
  ...convertedOutcome,
  id: "rpo_not_converted",
  bookingId: "bk_not_converted",
  converted: false,
  cadence: null,
  booking: {
    ...convertedOutcome.booking,
    id: "bk_not_converted",
    customer: {
      id: "cus_2",
      email: "no@example.test",
    },
  },
};

describe("RecurringPlanOutcomesSection", () => {
  beforeEach(() => {
    vi.mocked(fetchRecurringPlanOutcomes).mockReset();
  });

  it("renders outcomes", async () => {
    vi.mocked(fetchRecurringPlanOutcomes).mockResolvedValue([
      convertedOutcome,
      notConvertedOutcome,
    ]);

    render(<RecurringPlanOutcomesSection />);

    expect(await screen.findByText("Alex Rivera")).toBeInTheDocument();
    const convertedRow = screen.getByTestId(
      "recurring-plan-outcome-row-rpo_converted",
    );
    expect(within(convertedRow).getByRole("link", { name: "bk_converted" }))
      .toHaveAttribute("href", "/admin/bookings/bk_converted");
    expect(within(convertedRow).getByText("Yes")).toBeInTheDocument();
    expect(within(convertedRow).getByText("Weekly")).toBeInTheDocument();

    const notConvertedRow = screen.getByTestId(
      "recurring-plan-outcome-row-rpo_not_converted",
    );
    expect(within(notConvertedRow).getByRole("link", { name: "bk_not_converted" }))
      .toHaveAttribute("href", "/admin/bookings/bk_not_converted");
    expect(within(notConvertedRow).getByText("No")).toBeInTheDocument();
    expect(within(notConvertedRow).getAllByText("no@example.test")).toHaveLength(2);
  });

  it("filters converted vs not converted", async () => {
    vi.mocked(fetchRecurringPlanOutcomes).mockResolvedValue([convertedOutcome]);

    render(<RecurringPlanOutcomesSection />);
    await screen.findByText("Alex Rivera");

    await userEvent.selectOptions(screen.getByLabelText("Outcome"), "converted");
    await waitFor(() => {
      expect(fetchRecurringPlanOutcomes).toHaveBeenLastCalledWith({
        converted: true,
      });
    });

    await userEvent.selectOptions(
      screen.getByLabelText("Outcome"),
      "not_converted",
    );
    await waitFor(() => {
      expect(fetchRecurringPlanOutcomes).toHaveBeenLastCalledWith({
        converted: false,
      });
    });
  });

  it("renders empty state", async () => {
    vi.mocked(fetchRecurringPlanOutcomes).mockResolvedValue([]);

    render(<RecurringPlanOutcomesSection />);

    expect(
      await screen.findByText("No recurring plan outcomes found."),
    ).toBeInTheDocument();
  });
});
