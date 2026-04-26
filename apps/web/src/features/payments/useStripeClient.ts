"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { getStripePublicConfig } from "@/lib/api/payments";
import { getStripeConstructorOptions } from "@/lib/stripe/stripeClient";

export function useStripeClient() {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [currency, setCurrency] = useState("usd");
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const config = await getStripePublicConfig();
        if (cancelled) return;
        setPublishableKey(config.publishableKey);
        setCurrency(config.currency);
        setEnabled(config.enabled);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load Stripe configuration",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    const stripeOptions = getStripeConstructorOptions();
    return stripeOptions
      ? loadStripe(publishableKey, stripeOptions)
      : loadStripe(publishableKey);
  }, [publishableKey]);

  return {
    stripePromise,
    publishableKey,
    currency,
    enabled,
    isLoading,
    error,
  };
}
