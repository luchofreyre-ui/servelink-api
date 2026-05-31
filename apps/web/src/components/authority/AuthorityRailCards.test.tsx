import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AuthorityMostCommonIssuesCard,
  AuthorityPageAnchorNav,
  AuthorityReadCard,
  AuthorityRiskCard,
  AuthorityStopConditionsCard,
  AuthorityVisualSlot,
} from "./AuthorityRailCards";

describe("AuthorityRailCards", () => {
  it("renders authority read, risk, and stop-condition cards", () => {
    render(
      <>
        <AuthorityReadCard points={["Confirm the soil before choosing chemistry."]} />
        <AuthorityRiskCard risks={["Unknown coatings need a test area."]} />
        <AuthorityStopConditionsCard conditions={["Stop if gloss drops."]} />
      </>,
    );

    expect(screen.getByRole("heading", { name: "Authority read" })).toBeInTheDocument();
    expect(screen.getByText("Confirm the soil before choosing chemistry.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Key risks" })).toBeInTheDocument();
    expect(screen.getByText("Unknown coatings need a test area.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stop if" })).toBeInTheDocument();
    expect(screen.getByText("Stop if gloss drops.")).toBeInTheDocument();
  });

  it("renders common issue links and anchor navigation", () => {
    render(
      <>
        <AuthorityMostCommonIssuesCard
          links={[{ label: "Soap scum", href: "/surfaces/shower-glass/soap-scum" }]}
        />
        <AuthorityPageAnchorNav
          links={[
            { label: "Common issues", href: "#common-issues" },
            { label: "Visual cues", href: "#visual-cues" },
          ]}
        />
      </>,
    );

    expect(screen.getByRole("link", { name: "Soap scum" })).toHaveAttribute(
      "href",
      "/surfaces/shower-glass/soap-scum",
    );

    const nav = screen.getByRole("navigation", { name: "In this page" });
    expect(within(nav).getByRole("link", { name: "Common issues" })).toHaveAttribute(
      "href",
      "#common-issues",
    );
    expect(within(nav).getByRole("link", { name: "Visual cues" })).toHaveAttribute(
      "href",
      "#visual-cues",
    );
  });

  it("renders visual slot placeholder state only", () => {
    render(<AuthorityVisualSlot />);

    expect(screen.getByRole("heading", { name: "Visual diagnostics" })).toBeInTheDocument();
    expect(
      screen.getByText("Diagnostic visuals will appear here when approved assets are available."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
