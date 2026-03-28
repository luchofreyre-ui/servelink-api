import { cache } from "react";
import { buildUnifiedSearchIndex } from "./buildUnifiedSearchIndex";
import type { SiteSearchDocument } from "@/types/search";

export const buildSiteSearchIndex = cache(
  (): SiteSearchDocument[] => buildUnifiedSearchIndex(),
);
