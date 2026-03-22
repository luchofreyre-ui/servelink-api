import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminLaunchReadinessCard } from "./AdminLaunchReadinessCard";

describe("AdminLaunchReadinessCard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(null, { status: 500 });
      }) as unknown as typeof fetch,
    );
  });

  it("renders loading state", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>(() => {
            /* never resolves */
          }),
      ) as unknown as typeof fetch,
    );

    render(<AdminLaunchReadinessCard />);

    expect(screen.getByText(/loading launch readiness/i)).toBeInTheDocument();
  });

  it("renders readiness values after fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            ok: true,
            database: "reachable",
            stripeConfigured: true,
            webBaseUrl: "http://localhost:3000",
            timestamp: "2025-01-01T00:00:00.000Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as unknown as typeof fetch,
    );

    render(<AdminLaunchReadinessCard />);

    await waitFor(() => {
      expect(screen.getByText("reachable")).toBeInTheDocument();
      expect(screen.getByText("Configured")).toBeInTheDocument();
      expect(screen.getByText("http://localhost:3000")).toBeInTheDocument();
    });
  });

  it("renders error state on failed fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 503 })) as unknown as typeof fetch,
    );

    render(<AdminLaunchReadinessCard />);

    await waitFor(() => {
      expect(screen.getByText(/readiness failed: 503/i)).toBeInTheDocument();
    });
  });
});
