"use client";

import { useEffect } from "react";

/**
 * Seeds client-side notification context from dashboard escalation — internal only.
 */
export function DashboardEscalationSeed({
  role: _role,
  escalationLevel: _escalationLevel,
  headline,
  detail,
}: {
  role: "admin" | "fo" | "customer";
  escalationLevel: "none" | "watch" | "warning" | "critical";
  headline: string;
  detail: string;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as { __SERVELINK_LAST_ESCALATION__?: unknown }).__SERVELINK_LAST_ESCALATION__ =
      { headline, detail, at: Date.now() };
  }, [headline, detail]);
  return null;
}
