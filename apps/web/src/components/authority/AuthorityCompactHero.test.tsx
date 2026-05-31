import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthorityCompactHero } from "./AuthorityCompactHero";

describe("AuthorityCompactHero", () => {
  it("renders title, summary, badges, and actions without requiring an image", () => {
    render(
      <AuthorityCompactHero
        eyebrow="Surface guide"
        title="Shower glass"
        summary="Read shower glass by residue, minerals, coating risk, and dry-down behavior."
        badges={["Test first", "Strong match"]}
        actions={[{ label: "Jump to issues", href: "#issues" }]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Shower glass", level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText("Read shower glass by residue, minerals, coating risk, and dry-down behavior."),
    ).toBeInTheDocument();
    expect(screen.getByText("Test first")).toBeInTheDocument();
    expect(screen.getByText("Strong match")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jump to issues" })).toHaveAttribute("href", "#issues");
    expect(screen.queryByRole("img")).toBeNull();
  });
});
