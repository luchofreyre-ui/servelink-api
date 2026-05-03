import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecurringPlanConversionCard } from "./RecurringPlanConversionCard";

vi.mock("@/lib/env", () => ({
  WEB_ENV: {
    apiBaseUrl: "https://api.example.test/api/v1",
  },
}));

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

  it("fetches offer quote from configured API base", async () => {
    mockFetch(async () => Response.json(quoteResponse));

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    await screen.findByText("Weekly");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/recurring-plans/offer-quote?bookingId=bk_1",
    );
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

  it("uses configured API base when creating plan", async () => {
    const user = userEvent.setup();

    mockFetch(async (input) => {
      const url = String(input);
      if (url.includes("/offer-quote")) {
        return Response.json(quoteResponse);
      }

      return Response.json({ id: "rp_1" });
    });

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    await user.click(
      await screen.findByRole("button", { name: /start weekly plan/i }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "https://api.example.test/api/v1/recurring-plans/create-from-booking",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ bookingId: "bk_1", cadence: "weekly" }),
        }),
      );
    });
  });

  it("still allows cadence click if quote fetch fails", async () => {
    const user = userEvent.setup();

    mockFetch(async (input) => {
      const url = String(input);
      if (url.includes("/offer-quote")) {
        return new Response(null, { status: 500 });
      }

      return Response.json({ id: "rp_1" });
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
        "https://api.example.test/api/v1/recurring-plans/create-from-booking",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ bookingId: "bk_1", cadence: "weekly" }),
        }),
      );
    });
  });

  it("failed create response does not show success", async () => {
    const user = userEvent.setup();

    mockFetch(async (input) => {
      const url = String(input);
      if (url.includes("/offer-quote")) {
        return Response.json(quoteResponse);
      }

      return new Response(null, { status: 500 });
    });

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    await user.click(
      await screen.findByRole("button", { name: /start weekly plan/i }),
    );

    expect(
      await screen.findByText("Unable to start recurring plan. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Your weekly recurring plan has been started."),
    ).not.toBeInTheDocument();
  });

  it("successful create response shows success", async () => {
    const user = userEvent.setup();

    mockFetch(async (input) => {
      const url = String(input);
      if (url.includes("/offer-quote")) {
        return Response.json(quoteResponse);
      }

      return Response.json({ id: "rp_1" });
    });

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    await user.click(
      await screen.findByRole("button", { name: /start weekly plan/i }),
    );

    expect(
      await screen.findByText("Your weekly recurring plan has been started."),
    ).toBeInTheDocument();
  });
});
