export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setClientToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

export function clearClientToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}
