import { cache as reactCache } from "react";

/**
 * React `cache` in RSC; Map-based memo for Node scripts (e.g. tsx) where `cache` is unavailable.
 */
export function encyclopediaCache<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  if (typeof reactCache === "function") {
    return reactCache(fn) as (...args: A) => R;
  }
  const memo = new Map<string, R>();
  return (...args: A) => {
    const key = JSON.stringify(args);
    if (memo.has(key)) return memo.get(key)!;
    const v = fn(...args);
    memo.set(key, v);
    return v;
  };
}
