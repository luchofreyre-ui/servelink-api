export const WEB_ENV = {
  apiBaseUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"}/api/v1`,
  appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  enableManualPaymentControls:
    process.env.NEXT_PUBLIC_ENABLE_MANUAL_PAYMENT_CONTROLS === "true",
  /** Opt-in only — default off for launch safety when env is unset. */
  enableBookingUiTelemetry:
    process.env.NEXT_PUBLIC_ENABLE_BOOKING_UI_TELEMETRY === "true",
} as const;
