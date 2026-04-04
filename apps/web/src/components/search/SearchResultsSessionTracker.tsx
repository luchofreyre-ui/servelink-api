"use client";

import { useEffect } from "react";

import { tickSearchSessionSeconds, touchSearchSessionClock } from "@/lib/search/searchOptimization";

/**
 * Keeps session-scoped dwell time for multi-dimensional search ranking heuristics.
 */
export default function SearchResultsSessionTracker() {
  useEffect(() => {
    touchSearchSessionClock();
    const id = setInterval(() => {
      tickSearchSessionSeconds(10);
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
