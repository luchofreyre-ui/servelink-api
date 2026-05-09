import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpsCustomerTeamPrepSection } from "./OpsCustomerTeamPrepSection";

describe("OpsCustomerTeamPrepSection", () => {
  it("renders ops title, guidance copy, and quote disclaimer (light)", () => {
    render(
      <OpsCustomerTeamPrepSection
        variant="light"
        teamPrepDetails="Parking: curb — Access: side gate"
      />,
    );
    expect(screen.getByTestId("ops-customer-team-prep")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Customer team-prep details/i })).toBeInTheDocument();
    expect(
      screen.getByText(/customer's planning details/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Parking: curb — Access: side gate/)).toBeInTheDocument();
    expect(screen.getByText(/does not change the quoted total/i)).toBeInTheDocument();
  });

  it("renders dark variant without crashing", () => {
    render(
      <OpsCustomerTeamPrepSection variant="dark" teamPrepDetails="Dog friendly — fragile heirlooms in den" />,
    );
    expect(screen.getByText(/Dog friendly/)).toBeInTheDocument();
  });

  it("returns null when prep whitespace-only", () => {
    const wsOnly = `   ${String.fromCharCode(10)}  `;
    render(<OpsCustomerTeamPrepSection variant="light" teamPrepDetails={wsOnly} />);
    expect(screen.queryByTestId("ops-customer-team-prep")).not.toBeInTheDocument();
  });
});
