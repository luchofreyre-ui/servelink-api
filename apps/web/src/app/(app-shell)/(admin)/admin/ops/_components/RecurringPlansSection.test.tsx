import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAdminRecurringPlans,
  type AdminRecurringPlan,
} from "@/lib/api/adminOps";
import { RecurringPlansSection } from "./RecurringPlansSection";

vi.mock("@/lib/api/adminOps", () => ({
  fetchAdminRecurringPlans: vi.fn(),
}));

const plan: AdminRecurringPlan = {
  id: "rp_1",
  bookingId: "bk_1",
  customerId: "cus_1",
  franchiseOwnerId: null,
  cadence: "weekly",
  status: "active",
  pricePerVisitCents: 0,
  estimatedMinutes: 180,
  discountPercent: 15,
  startAt: "2030-01-01T00:00:00.000Z",
  nextRunAt: "2030-01-08T00:00:00.000Z",
  createdAt: "2030-01-01T00:00:00.000Z",
  updatedAt: "2030-01-01T00:00:00.000Z",
  booking: {
    id: "bk_1",
    status: "completed",
    createdAt: "2030-01-01T00:00:00.000Z",
    customer: {
      id: "cus_1",
      name: "Alex Rivera",
      email: "alex@example.test",
      phone: "555-0101",
    },
  },
};

describe("RecurringPlansSection", () => {
  beforeEach(() => {
    vi.mocked(fetchAdminRecurringPlans).mockReset();
  });

  it("renders loading state", () => {
    vi.mocked(fetchAdminRecurringPlans).mockReturnValue(new Promise(() => {}));

    render(<RecurringPlansSection />);

    expect(screen.getByText("Loading recurring plans…")).toBeInTheDocument();
  });

  it("renders recurring plans", async () => {
    vi.mocked(fetchAdminRecurringPlans).mockResolvedValue([plan]);

    render(<RecurringPlansSection />);

    expect(await screen.findByText("Alex Rivera")).toBeInTheDocument();
    const row = screen.getByTestId("recurring-plan-row-rp_1");
    expect(within(row).getByText("alex@example.test")).toBeInTheDocument();
    expect(within(row).getByText("Weekly")).toBeInTheDocument();
    expect(within(row).getByText("Active")).toBeInTheDocument();
    expect(within(row).getByText("$0.00")).toBeInTheDocument();
    expect(within(row).getByText("15%")).toBeInTheDocument();
    expect(within(row).getByText("180")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "bk_1" })).toHaveAttribute(
      "href",
      "/admin/bookings/bk_1",
    );
  });

  it("filters status and cadence", async () => {
    vi.mocked(fetchAdminRecurringPlans).mockResolvedValue([plan]);

    render(<RecurringPlansSection />);
    await screen.findByText("Alex Rivera");

    await userEvent.selectOptions(screen.getByLabelText("Status"), "active");
    await waitFor(() => {
      expect(fetchAdminRecurringPlans).toHaveBeenLastCalledWith({
        status: "active",
      });
    });

    await userEvent.selectOptions(screen.getByLabelText("Cadence"), "weekly");
    await waitFor(() => {
      expect(fetchAdminRecurringPlans).toHaveBeenLastCalledWith({
        status: "active",
        cadence: "weekly",
      });
    });
  });

  it("renders empty state", async () => {
    vi.mocked(fetchAdminRecurringPlans).mockResolvedValue([]);

    render(<RecurringPlansSection />);

    expect(await screen.findByText("No recurring plans found.")).toBeInTheDocument();
  });
});
