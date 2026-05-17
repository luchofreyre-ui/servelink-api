import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookingStatusBadge } from "./BookingStatusBadge";

describe("BookingStatusBadge", () => {
  it("renders customer-safe status labels", () => {
    render(<BookingStatusBadge status="pending_dispatch" />);

    expect(screen.getByText("Scheduling your team")).toBeInTheDocument();
    expect(screen.queryByText("pending_dispatch")).toBeNull();
  });
});
