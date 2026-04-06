export interface RecordPaymentAnomalyInput {
  bookingId?: string | null;
  stripeEventId?: string | null;
  kind: string;
  severity?: "info" | "warning" | "critical";
  status?: "open" | "resolved";
  message: string;
  details?: Record<string, unknown> | null;
}

export interface RecordWebhookFailureInput {
  stripeEventId?: string | null;
  eventType?: string | null;
  endpointPath: string;
  failureKind: string;
  message: string;
  payload?: Record<string, unknown> | null;
}
