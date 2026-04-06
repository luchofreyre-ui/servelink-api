import { getAuthToken } from "./authClient";

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const token =
    typeof window !== "undefined" ? getAuthToken() : null;

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
