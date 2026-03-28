import type { EncyclopediaCategory } from "./types";

export function buildEncyclopediaHref(
  category: EncyclopediaCategory,
  slug: string,
): string {
  return `/encyclopedia/${category}/${slug}`;
}

export function buildEncyclopediaCategoryHref(
  category: EncyclopediaCategory,
): string {
  return `/encyclopedia/${category}`;
}

export function buildEncyclopediaImageAssetPath(
  category: EncyclopediaCategory,
  cluster: string,
  slug: string,
): string {
  return `/images/encyclopedia/${category}/${cluster}/${slug}/primary.jpg`;
}

export function formatEncyclopediaCategoryLabel(
  category: EncyclopediaCategory,
): string {
  switch (category) {
    case "problems":
      return "Problems";
    case "surfaces":
      return "Surfaces";
    case "methods":
      return "Methods";
    case "chemicals":
      return "Chemicals";
    case "tools":
      return "Tools";
    case "rooms":
      return "Rooms";
    case "prevention":
      return "Prevention";
    case "edge-cases":
      return "Edge Cases";
    case "decisions":
      return "Decisions";
    default:
      return category;
  }
}
