export interface StripePublicConfigResponse {
  publishableKey: string | null;
  currency: string;
  enabled: boolean;
}

export interface StripeIntentClientState {
  paymentIntentId: string;
  clientSecret: string | null;
  status: string;
  reused: boolean;
}
