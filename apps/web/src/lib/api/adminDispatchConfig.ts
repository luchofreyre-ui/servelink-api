import { WEB_ENV } from "@/lib/env";

function readApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const m = (payload as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

async function adminGetJson<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${WEB_ENV.apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new Error(
      readApiErrorMessage(payload, `${path} failed (${response.status})`),
    );
  }
  return payload as T;
}

export type DispatchConfigReadBundle = {
  active: unknown;
  draft: unknown;
  compare: unknown;
};

export async function fetchDispatchConfigReadBundle(
  token: string,
): Promise<DispatchConfigReadBundle> {
  const [active, draft, compare] = await Promise.all([
    adminGetJson<unknown>(token, "/admin/dispatch-config/active"),
    adminGetJson<unknown>(token, "/admin/dispatch-config/draft"),
    adminGetJson<unknown>(token, "/admin/dispatch-config/compare"),
  ]);
  return { active, draft, compare };
}
