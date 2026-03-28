import { cache } from "react";
import { buildAuthoritySearchIndex } from "./buildAuthoritySearchIndex";
import { buildEncyclopediaSearchIndex } from "./buildEncyclopediaSearchIndex";
import type { SiteSearchDocument } from "@/types/search";

export const buildUnifiedSearchIndex = cache(
  (): SiteSearchDocument[] => {
    const authorityDocuments = buildAuthoritySearchIndex();
    const encyclopediaDocuments = buildEncyclopediaSearchIndex();

    const deduped = new Map<string, SiteSearchDocument>();

    for (const document of [...authorityDocuments, ...encyclopediaDocuments]) {
      if (!deduped.has(document.id)) {
        deduped.set(document.id, document);
      }
    }

    return Array.from(deduped.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  },
);
