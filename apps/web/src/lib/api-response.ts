/** Parse `apiFetch` Response: JSON body + throw when !ok (for server components). */
export async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || "Invalid JSON response");
  }
  if (!response.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : text || `Request failed ${response.status}`;
    throw new Error(msg);
  }
  return data as T;
}
