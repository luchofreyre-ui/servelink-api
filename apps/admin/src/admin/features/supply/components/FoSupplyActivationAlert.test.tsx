import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FoSupplyActivationAlert } from "./FoSupplyActivationAlert";

describe("FoSupplyActivationAlert", () => {
  it("renders FO_ACTIVATION_BLOCKED reason codes from ApiError", () => {
    render(
      <FoSupplyActivationAlert
        error={{
          status: 400,
          message: "Activation blocked",
          code: "FO_ACTIVATION_BLOCKED",
          reasons: ["FO_NO_SCHEDULING_SOURCE", "FO_MISSING_COORDINATES"],
        }}
      />,
    );
    expect(
      document.querySelector('[data-testid="fo-supply-activation-alert"]'),
    ).not.toBeNull();
    expect(screen.getByText("FO_NO_SCHEDULING_SOURCE")).toBeTruthy();
    expect(screen.getByText("FO_MISSING_COORDINATES")).toBeTruthy();
  });

  it("draft save generic error path when not activation-shaped", () => {
    render(
      <FoSupplyActivationAlert
        error={{ status: 500, message: "Server exploded" }}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Server exploded");
  });
});
