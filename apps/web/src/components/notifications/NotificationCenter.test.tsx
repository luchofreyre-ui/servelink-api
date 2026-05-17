import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationCenter } from "./NotificationCenter";

describe("NotificationCenter", () => {
  it("uses polished placeholder copy", () => {
    render(<NotificationCenter />);

    expect(
      screen.getByText(
        "Service updates and operational notices will appear here when there is something to review.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/live API/i)).toBeNull();
  });
});
