import { API_BASE_URL } from "@/lib/api";
import type { EncyclopediaCategory } from "@/lib/encyclopedia/types";
import type { CanonicalPageSnapshot } from "@/lib/encyclopedia/encyclopediaPipelineTypes";
import type { ResolvedEncyclopediaPage } from "@/lib/encyclopedia/encyclopediaContentResolver";
import type { SiteSearchDocument } from "@/types/search";

export type ApiPublicEncyclopediaListItem = {
  slug: string;
  title: string;
  problem: string;
  surface: string;
  intent: string;
  riskLevel: "low" | "medium" | "high";
  promotedAt?: string;
};

type ApiListJson = { ok: boolean; items: ApiPublicEncyclopediaListItem[] };

type ApiDetailJson = {
  ok: boolean;
  item: {
    slug: string;
    title: string;
    canonicalSnapshot: CanonicalPageSnapshot;
    promotedAt?: string;
  } | null;
};

export async function fetchEncyclopediaPublicListForSearch(): Promise<
  ApiPublicEncyclopediaListItem[]
> {
  try {
    // Explicit `no-store` only — do not rely on Next fetch defaults.
    const res = await fetch(`${API_BASE_URL}/api/v1/encyclopedia/list`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return [];
    }
    const json = (await res.json()) as ApiListJson;
    return Array.isArray(json.items) ? json.items : [];
  } catch {
    return [];
  }
}

/** Explicit `no-store` only — do not rely on Next fetch defaults. */
export async function getEncyclopediaApiLiveDetail(
  slug: string,
): Promise<ApiDetailJson | null> {
  try {
    const url = `${API_BASE_URL}/api/v1/encyclopedia/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as ApiDetailJson;
  } catch {
    return null;
  }
}

export function apiLiveListItemsToSearchDocuments(
  items: Array<{
    slug: string;
    title: string;
    problem?: string | null;
    surface?: string | null;
    intent?: string | null;
    riskLevel?: string | null;
  }>,
): SiteSearchDocument[] {
  return items.map((item) => {
    const problem = item.problem ?? "";
    const surface = item.surface ?? "";
    const intent = item.intent ?? "";
    const riskLevel = item.riskLevel ?? "";

    const searchText = [
      item.title,
      problem,
      surface,
      intent,
      riskLevel,
      `${problem} ${surface}`,
      `${intent} ${problem}`,
      `${intent} ${surface}`,
      item.slug.replace(/-/g, " "),
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const tags = [problem, surface, intent, riskLevel].filter(Boolean);
    const keywords = Array.from(
      new Set(
        [
          ...tags.map((t) => t.toLowerCase()),
          item.slug.replace(/-/g, " ").toLowerCase(),
          "cleaning",
          "encyclopedia",
        ].filter(Boolean),
      ),
    );

    return {
      id: `encyclopedia:problems:${item.slug}`,
      source: "encyclopedia",
      type: "problem",
      title: item.title,
      description: searchText,
      href: `/encyclopedia/problems/${item.slug}`,
      keywords,
      body: searchText,
    };
  });
}

export async function resolveEncyclopediaPageFromApi(
  category: EncyclopediaCategory,
  slug: string,
): Promise<ResolvedEncyclopediaPage | null> {
  if (category !== "problems") {
    return null;
  }
  const json = await getEncyclopediaApiLiveDetail(slug);
  const item = json?.item;
  if (!item?.canonicalSnapshot) {
    return null;
  }
  return {
    slug: item.slug,
    title: item.title,
    content: item.canonicalSnapshot,
    source: "live",
  };
}
