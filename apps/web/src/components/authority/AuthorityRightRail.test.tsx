import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthorityRightRail } from "./AuthorityRightRail";

describe("AuthorityRightRail", () => {
  it("renders a children-based card stack", () => {
    render(
      <AuthorityRightRail label="Surface authority rail">
        <div>Authority read</div>
        <div>Stop if finish changes</div>
      </AuthorityRightRail>,
    );

    expect(screen.getByLabelText("Surface authority rail")).toBeInTheDocument();
    expect(screen.getByText("Authority read")).toBeInTheDocument();
    expect(screen.getByText("Stop if finish changes")).toBeInTheDocument();
  });
});
