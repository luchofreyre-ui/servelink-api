/**
 * Read `role` from JWT payload (client-side, no verification).
 * Used only for UX checks after login; API still enforces auth.
 */
export function readJwtRole(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1];
    if (!b64) return null;
    const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    if (typeof atob === "undefined") return null;
    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: string };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}
