/** Parse persisted `*Json` text columns into string arrays (invalid → []). */
export function parseAuthorityStringArrayJson(json: string): string[] {
  try {
    const v = JSON.parse(json) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}
