import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingUiTelemetryCard } from "./BookingUiTelemetryCard";

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
  const memory = new Map<string, string>();

  beforeEach(() => {
    telemetryState.enabled = true;
    memory.clear();
    const store: Storage = {
      get length() {
        return memory.size;
      },
      clear() {
        memory.clear();
      },
      getItem(key: string) {
        return memory.has(key) ? memory.get(key)! : null;
      },
      key(index: number) {
        return Array.from(memory.keys())[index] ?? null;
      },
      removeItem(key: string) {
        memory.delete(key);
      },
      setItem(key: string, value: string) {
        memory.set(key, value);
      },
    };
    vi.stubGlobal("localStorage", store);
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

  it("renders stored events from localStorage", () => {
    window.localStorage.setItem(
      "servelink_booking_ui_events",
      JSON.stringify([
        {
          event: "stripe_checkout_prepare_clicked",
          payload: { bookingId: "bk_1" },
          at: "2025-01-01T00:00:00.000Z",
        },
      ]),
    );

    render(<BookingUiTelemetryCard />);

    expect(screen.getByText("stripe_checkout_prepare_clicked")).toBeInTheDocument();
    expect(screen.getByText(/bk_1/)).toBeInTheDocument();
  });
});
