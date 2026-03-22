import { resolveLocationContext } from "./locationResolver";

import type { LocationContext } from "./locationTypes";

export function getLocationContextForPath(pathname: string): LocationContext {
  return resolveLocationContext(pathname);
}
