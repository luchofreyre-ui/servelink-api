import { Injectable } from "@nestjs/common";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private client: Stripe;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      // We throw at runtime only when used; keep app boot workable in dev
      // by creating a dummy client; calls will fail with clearer error later.
      this.client = new Stripe("sk_test_missing", { apiVersion: "2025-01-27.acacia" as any });
      return;
    }
    this.client = new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
  }

  get stripe() {
    return this.client;
  }
}
