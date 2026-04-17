function readHeaderValue(
  headers: Record<string, unknown>,
  key: string,
): string | null {
  const value = headers[key];

  if (typeof value === "string") {
    const first = value.split(",")[0]?.trim();
    return first || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) {
        const first = item.split(",")[0]?.trim();
        return first || null;
      }
    }
  }

  return null;
}

export function readRequestHost(requestLike: unknown): string | null {
  if (!requestLike || typeof requestLike !== "object") {
    return null;
  }

  const candidate = requestLike as {
    headers?: Record<string, unknown>;
    host?: unknown;
  };

  const headers =
    candidate.headers && typeof candidate.headers === "object"
      ? candidate.headers
      : undefined;

  if (headers) {
    const forwardedHost = readHeaderValue(headers, "x-forwarded-host");
    if (forwardedHost) return forwardedHost;

    const host = readHeaderValue(headers, "host");
    if (host) return host;
  }

  return typeof candidate.host === "string" && candidate.host.trim()
    ? candidate.host.trim()
    : null;
}
