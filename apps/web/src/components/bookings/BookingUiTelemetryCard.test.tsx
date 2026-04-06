import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingUiTelemetryCard } from "./BookingUiTelemetryCard";
import {
  clearBookingUiTelemetryBufferForTests,
  trackBookingUiEvent,
} from "@/lib/telemetry/bookingEvents";

const telemetryState = vi.hoisted(() => ({
  enabled: true,
}));

vi.mock("@/lib/env", () => ({
  WEB_ENV: {
    apiBaseUrl: "http://localhost:3001",
    appEnv: "development",
    enableManualPaymentControls: false,
    get enableBookingUiTelemetry() {
      return telemetryState.enabled;
    },
  },
}));

describe("BookingUiTelemetryCard", () => {
  beforeEach(() => {
    telemetryState.enabled = true;
    clearBookingUiTelemetryBufferForTests();
  });

  it("returns null when telemetry disabled", () => {
    telemetryState.enabled = false;

    const { container } = render(<BookingUiTelemetryCard />);

    expect(container.firstChild).toBeNull();
  });

  it("renders no-events state", () => {
    render(<BookingUiTelemetryCard />);

    expect(screen.getByText(/no telemetry events captured yet/i)).toBeInTheDocument();
  });

  it("renders in-memory telemetry events", () => {
    trackBookingUiEvent("stripe_checkout_prepare_clicked", { bookingId: "bk_1" });

    render(<BookingUiTelemetryCard />);

    expect(screen.getByText("stripe_checkout_prepare_clicked")).toBeInTheDocument();
    expect(screen.getByText(/bk_1/)).toBeInTheDocument();
  });
});
