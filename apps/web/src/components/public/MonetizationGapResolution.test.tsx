import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const resolveGap = vi.fn();
const dismissMonetizationGapInAdmin = vi.fn();

vi.mock("@/lib/funnel/funnelGapResolution", () => ({
  resolveGap: (...args: unknown[]) => resolveGap(...args),
  dismissMonetizationGapInAdmin: (...args: unknown[]) => dismissMonetizationGapInAdmin(...args),
}));

import { MonetizationGapResolution } from "./MonetizationGapResolution";

describe("MonetizationGapResolution", () => {
  it("invokes resolveGap and local dismiss on resolve", async () => {
    const user = userEvent.setup();
    render(<MonetizationGapResolution problemSlug="dust-buildup" />);
    await user.click(screen.getByRole("button", { name: /^Resolve$/i }));
    expect(resolveGap).toHaveBeenCalledWith("dust-buildup", "resolve");
    expect(dismissMonetizationGapInAdmin).toHaveBeenCalledWith("dust-buildup");
  });
});
