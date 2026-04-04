import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const saveGapResolutionFeedback = vi.fn();
const loadGapResolutionFeedback = vi.fn(() => null);
const dismissMonetizationGapInAdmin = vi.fn();

vi.mock("@/lib/funnel/funnelGapResolution", () => ({
  saveGapResolutionFeedback: (...args: unknown[]) => saveGapResolutionFeedback(...args),
  loadGapResolutionFeedback: (...args: unknown[]) => loadGapResolutionFeedback(...args),
  dismissMonetizationGapInAdmin: (...args: unknown[]) =>
    dismissMonetizationGapInAdmin(...args),
}));

import { MonetizationGapResolution } from "./MonetizationGapResolution";

describe("MonetizationGapResolution", () => {
  it("submits feedback and dismisses on resolve", async () => {
    const user = userEvent.setup();
    render(<MonetizationGapResolution problemSlug="dust-buildup" />);
    await user.click(screen.getByRole("button", { name: /^Resolve$/i }));
    expect(saveGapResolutionFeedback).toHaveBeenCalledWith("dust-buildup", "resolve", "", undefined);
    expect(dismissMonetizationGapInAdmin).toHaveBeenCalledWith("dust-buildup");
  });
});
