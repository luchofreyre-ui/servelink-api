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
    recurringPriceCents: 12000,
    savingsCents: 8000,
    discountPercent: 40,
    estimatedMinutes: 108,
  },
  {
    cadence: "biweekly",
    firstCleanPriceCents: 20000,
    recurringPriceCents: 14000,
    savingsCents: 6000,
    discountPercent: 30,
    estimatedMinutes: 126,
  },
  {
    cadence: "monthly",
    firstCleanPriceCents: 20000,
    recurringPriceCents: 16000,
    savingsCents: 4000,
    discountPercent: 20,
    estimatedMinutes: 144,
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
    expect(screen.getByText("108 minutes")).toBeInTheDocument();
    expect(screen.getByText("126 minutes")).toBeInTheDocument();
    expect(screen.getByText("144 minutes")).toBeInTheDocument();
  });

  it("selectedCadence weekly renders only weekly card", async () => {
    mockFetch(async () => Response.json([quoteResponse[0]]));

    render(
      <RecurringPlanConversionCard bookingId="bk_1" selectedCadence="weekly" />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Your weekly recurring plan",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.queryByText("Biweekly")).not.toBeInTheDocument();
    expect(screen.queryByText("Monthly")).not.toBeInTheDocument();
    expect(
      screen.getByText("Based on the cadence you selected earlier."),
    ).toBeInTheDocument();
  });

  it("selectedCadence biweekly renders only biweekly card", async () => {
    mockFetch(async () => Response.json([quoteResponse[1]]));

    render(
      <RecurringPlanConversionCard
        bookingId="bk_1"
        selectedCadence="biweekly"
      />,
    );

    expect(await screen.findByText("Biweekly")).toBeInTheDocument();
    expect(screen.queryByText("Weekly")).not.toBeInTheDocument();
    expect(screen.queryByText("Monthly")).not.toBeInTheDocument();
  });

  it("selectedCadence missing renders all three cards", async () => {
    mockFetch(async () => Response.json(quoteResponse));

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    expect(await screen.findByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Biweekly")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });

  it("fetches offer quote from configured API base", async () => {
    mockFetch(async () => Response.json(quoteResponse));

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    await screen.findByText("Weekly");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/recurring-plans/offer-quote?bookingId=bk_1",
    );
  });

  it("quote fetch includes cadence param when locked", async () => {
    mockFetch(async () => Response.json([quoteResponse[0]]));

    render(
      <RecurringPlanConversionCard bookingId="bk_1" selectedCadence="weekly" />,
    );

    await screen.findByText("Weekly");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/recurring-plans/offer-quote?bookingId=bk_1&cadence=weekly",
    );
  });

  it("quote fetch omits cadence when not locked", async () => {
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

    expect(await screen.findByText("$120")).toBeInTheDocument();
    expect(screen.getByText("$140")).toBeInTheDocument();
    expect(screen.getByText("$160")).toBeInTheDocument();
  });

  it("shows savings and discount", async () => {
    mockFetch(async () => Response.json(quoteResponse));

    render(<RecurringPlanConversionCard bookingId="bk_1" />);

    expect(await screen.findByText("$80 / 40%")).toBeInTheDocument();
    expect(screen.getByText("$60 / 30%")).toBeInTheDocument();
    expect(screen.getByText("$40 / 20%")).toBeInTheDocument();
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
