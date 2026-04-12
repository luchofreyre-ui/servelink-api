import { getClientToken } from "./auth.client";

export async function authFetch(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const token = getClientToken();

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
