"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/auth";
import { getBookingStatus } from "@/lib/api/payments";
import type { BookingStatusResponse } from "@/types/payments";

export function useBookingStatus(bookingId: string) {
  const [data, setData] = useState<BookingStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in to view booking payment status.");
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      const next = await getBookingStatus(bookingId, token);
      setData(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load booking status",
      );
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    reload: load,
  };
}
