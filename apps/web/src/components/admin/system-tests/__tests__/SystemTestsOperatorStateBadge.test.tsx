import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SystemTestsOperatorStateBadge } from "../SystemTestsOperatorStateBadge";

describe("SystemTestsOperatorStateBadge", () => {
  it("renders Open for open state", () => {
    render(<SystemTestsOperatorStateBadge state="open" />);
    expect(screen.getByTestId("system-tests-operator-state-badge")).toHaveTextContent("Open");
  });

  it("renders Acknowledged and Dismissed labels", () => {
    const { rerender } = render(<SystemTestsOperatorStateBadge state="acknowledged" />);
    expect(screen.getByTestId("system-tests-operator-state-badge")).toHaveTextContent("Acknowledged");
    rerender(<SystemTestsOperatorStateBadge state="dismissed" />);
    expect(screen.getByTestId("system-tests-operator-state-badge")).toHaveTextContent("Dismissed");
  });
});
