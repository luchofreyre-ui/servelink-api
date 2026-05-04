import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecurringPlanConversionCard } from "./RecurringPlanConversionCard";

const reload = vi.fn();

vi.mock("@/lib/env", () => ({
  WEB_ENV: {
    apiBaseUrl: "http://localhost:3001/api/v1",
  },
}));

describe("RecurringPlanConversionCard", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: vi.fn() }),
    );
    Object.defineProperty(window, "location", {
      value: { reload },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders recurring-selected bookings as read-only status", () => {
    render(
      <RecurringPlanConversionCard
        bookingId="bk_1"
        selectedCadence="weekly"
        recurringPlan={{
          id: "rp_1",
          cadence: "weekly",
          status: "active",
          pricePerVisitCents: 30000,
          nextRunAt: "2030-01-08T10:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("Your recurring service is set")).toBeTruthy();
    expect(screen.getByText(/Cadence:/)).toBeTruthy();
    expect(screen.getByText("Weekly")).toBeTruthy();
    expect(screen.getByText("$300")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders every_10_days label in locked status", () => {
    render(
      <RecurringPlanConversionCard
        bookingId="bk_1"
        selectedCadence="every_10_days"
        recurringPlan={{
          id: "rp_1",
          cadence: "every_10_days",
          status: "active",
          pricePerVisitCents: 33056,
          nextRunAt: "2030-01-11T10:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("Every 10 days")).toBeTruthy();
  });

  it("renders three_visit_reset schedule details only when provided", () => {
    render(
      <RecurringPlanConversionCard
        bookingId="bk_1"
        selectedCadence="weekly"
        visitStructure="three_visit_reset"
        resetSchedule={{
          visit1At: "2030-01-01T10:00:00.000Z",
          visit2At: "2030-01-15T10:00:00.000Z",
          visit3At: "2030-01-29T10:00:00.000Z",
          recurringBeginsAt: "2030-02-05T10:00:00.000Z",
        }}
        recurringBeginsAt="2030-02-05T10:00:00.000Z"
      />,
    );

    expect(screen.getByText("Three-visit reset schedule")).toBeTruthy();
    expect(screen.getByText(/Visit 1:/)).toBeTruthy();
    expect(screen.getByText(/Visit 2:/)).toBeTruthy();
    expect(screen.getByText(/Visit 3:/)).toBeTruthy();
    expect(screen.getAllByText(/Recurring begins:/).length).toBeGreaterThan(0);
  });

  it("keeps fallback request UI isolated to bookings without a selected cadence", async () => {
    render(<RecurringPlanConversionCard bookingId="bk_one_time" />);

    fireEvent.click(screen.getByRole("button", { name: "Request Every 10 days" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/recurring-plans/create-from-booking",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            bookingId: "bk_one_time",
            cadence: "every_10_days",
          }),
        }),
      );
    });
    expect(reload).not.toHaveBeenCalled();
  });
});
