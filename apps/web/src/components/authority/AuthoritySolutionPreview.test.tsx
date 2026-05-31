import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthoritySolutionPreview } from "./AuthoritySolutionPreview";

describe("AuthoritySolutionPreview", () => {
  it("renders workflow, tools, and products for soap scum on shower glass", () => {
    render(<AuthoritySolutionPreview surfaceSlug="shower-glass" problemSlug="soap-scum" />);

    expect(screen.getByLabelText("Recommended solution")).toBeInTheDocument();
    expect(screen.getByText(/Workflow:/)).toBeInTheDocument();
    expect(screen.getByText(/Inspect/)).toBeInTheDocument();
    expect(screen.getByText(/Test first/)).toBeInTheDocument();
    expect(screen.getByText(/Tools:/)).toBeInTheDocument();
    expect(screen.getByText(/Product summary:/)).toBeInTheDocument();
    expect(screen.getByText(/Best option:/)).toBeInTheDocument();
  });

  it("renders stop and assess for critical escalation paths", () => {
    render(<AuthoritySolutionPreview surfaceSlug="finished-wood" problemSlug="surface-haze" />);

    expect(screen.getByText("Stop and assess")).toBeInTheDocument();
  });

  it("still renders a solution when product mapping is missing", () => {
    render(<AuthoritySolutionPreview surfaceSlug="missing-surface" problemSlug="missing-problem" />);

    expect(screen.getByLabelText("Recommended solution")).toBeInTheDocument();
    expect(screen.getByText(/Confirm the surface and problem before choosing products/)).toBeInTheDocument();
    expect(screen.getByText(/No product match yet/)).toBeInTheDocument();
  });
});
