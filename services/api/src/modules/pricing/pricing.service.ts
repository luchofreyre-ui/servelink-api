import { Injectable } from "@nestjs/common";

@Injectable()
export class PricingService {
  calculateQuote(input: {
    basePrice: number;
    estimatedDurationMinutes: number;
    distanceMiles?: number;
    riskLevel?: "low" | "medium" | "high";
  }) {
    let price = input.basePrice;

    // Duration adjustment
    const durationFactor = input.estimatedDurationMinutes / 60;
    price += durationFactor * 10;

    // Distance adjustment
    if (input.distanceMiles) {
      price += input.distanceMiles * 2;
    }

    // Risk multiplier
    if (input.riskLevel === "medium") {
      price *= 1.1;
    }

    if (input.riskLevel === "high") {
      price *= 1.25;
    }

    const margin = price * 0.2;

    return {
      subtotal: price,
      margin,
      total: price + margin,
    };
  }
}
