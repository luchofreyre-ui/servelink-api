import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecurringPlanConversionCard } from "./RecurringPlanConversionCard";

const quoteResponse = [
  {
    cadence: "weekly",
    firstCleanPriceCents: 20000,
    recurringPriceCents: 17000,
    savingsCents: 3000,
    discountPercent: 15,
    estimatedMinutes: 180,
  },
  {
    cadence: "biweekly",
    firstCleanPriceCents: 20000,
    recurringPriceCents: 18000,
    savingsCents: 2000,
    discountPercent: 10,
    estimatedMinutes: 180,
  },
  {
    cadence: "monthly",
    firstCleanPriceCents: 20000,
    recurringPriceCents: 19000,
    savingsCents: 1000,
    discountPercent: 5,
    estimatedMinutes: 180,
  },
];

function mockFetch(handler: (input: RequestInfo | URL) => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(handler));
}

describe("RecurringPlanConversionCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders loading state", () => {
    mockFetch(() => new Promise<Response>(() => {}));

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    expect(screen.getByText("Loading recurring pricing…")).toBeInTheDocument();
  });

  it("renders quote data", async () => {
    mockFetch(async () => Response.json(quoteResponse));

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    expect(await screen.findByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Biweekly")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getAllByText("180 minutes")).toHaveLength(3);
  });

  it("shows first clean price", async () => {
    mockFetch(async () => Response.json(quoteResponse));

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    expect(await screen.findAllByText("$200")).toHaveLength(3);
  });

  it("shows recurring price", async () => {
    mockFetch(async () => Response.json(quoteResponse));

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    expect(await screen.findByText("$170")).toBeInTheDocument();
    expect(screen.getByText("$180")).toBeInTheDocument();
    expect(screen.getByText("$190")).toBeInTheDocument();
  });

  it("shows savings and discount", async () => {
    mockFetch(async () => Response.json(quoteResponse));

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    expect(await screen.findByText("$30 / 15%")).toBeInTheDocument();
    expect(screen.getByText("$20 / 10%")).toBeInTheDocument();
    expect(screen.getByText("$10 / 5%")).toBeInTheDocument();
  });

  it("still allows cadence click if quote fetch fails", async () => {
    const user = userEvent.setup();

    mockFetch(async (input) => {
      const url = String(input);
      if (url.includes("/offer-quote")) {
        return new Response(null, { status: 500 });
      }

      return new Promise<Response>(() => {});
    });

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    expect(
      await screen.findByText(
        "Unable to load recurring pricing. You can still choose a cadence.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start weekly plan/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/v1/recurring-plans/create-from-booking",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ bookingId: "bk_1", cadence: "weekly" }),
        }),
      );
    });
  });
});
