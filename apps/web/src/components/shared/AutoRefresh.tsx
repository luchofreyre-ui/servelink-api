"use client";

import { useEffect } from "react";

export function AutoRefresh({
  interval: _interval,
  tier: _tier,
}: {
  interval: number;
  tier: "idle" | "active" | "at_risk" | "critical";
}) {
  useEffect(() => {
    /* Router refresh can be wired when using next/navigation router.refresh() */
  }, []);
  return null;
}
