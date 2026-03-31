import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SystemTestsLifecycleBadge } from "../SystemTestsLifecycleBadge";

describe("SystemTestsLifecycleBadge", () => {
  it("renders label for dormant", () => {
    render(<SystemTestsLifecycleBadge state="dormant" />);
    expect(screen.getByTestId("system-tests-lifecycle-badge")).toHaveTextContent("Dormant");
  });
});
