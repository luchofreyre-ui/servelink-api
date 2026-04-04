import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/funnel/funnelGapReport", () => ({
  buildFunnelGapReport: vi.fn(() => []),
}));

import { MonetizationGapTracker } from "./MonetizationGapTracker";

describe("MonetizationGapTracker", () => {
  it("shows OK when there are no gaps", () => {
    render(<MonetizationGapTracker />);
    expect(screen.getByText(/OK: no monetization funnel gaps detected/i)).toBeInTheDocument();
  });
});
