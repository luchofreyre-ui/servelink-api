import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AdminAuthorityRecomputeControl } from "./AdminAuthorityRecomputeControl";

describe("AdminAuthorityRecomputeControl", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("shows skipped-overridden feedback from API", async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        kind: "booking_authority_recompute_result",
        outcome: "skipped_overridden",
        uiOutcome: "skipped_overridden",
        uiSummary: "Skipped — overridden",
        uiDetail: "Persisted tags were left unchanged.",
        bookingId: "b1",
      }),
    });

    const onComplete = vi.fn();

    render(
      <AdminAuthorityRecomputeControl
        apiBase="https://api.test"
        token="tok"
        bookingId="b1"
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getByTestId("admin-authority-recompute-button"));

    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-recompute-result")).toHaveTextContent(
        "Skipped — overridden",
      );
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows error when POST fails", async () => {
    const user = userEvent.setup();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "Not allowed" }),
    });

    render(
      <AdminAuthorityRecomputeControl apiBase="https://api.test" token="tok" bookingId="b1" />,
    );

    await user.click(screen.getByTestId("admin-authority-recompute-button"));

    await waitFor(() => {
      expect(screen.getByTestId("admin-authority-recompute-error")).toHaveTextContent(
        "Not allowed",
      );
    });
  });
});
