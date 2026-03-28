import {
  buildEncyclopediaHref,
  formatEncyclopediaCategoryLabel,
} from "./slug";
import type {
  EncyclopediaCategory,
  EncyclopediaIndexEntry,
  EncyclopediaLinkedEntry,
  EncyclopediaLinkedGroup,
} from "./types";

function toLinkedEntry(entry: EncyclopediaIndexEntry): EncyclopediaLinkedEntry {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    cluster: entry.cluster,
    slug: entry.slug,
    href: buildEncyclopediaHref(entry.category, entry.slug),
  };
}

function dedupeLinkedEntries(
  entries: EncyclopediaIndexEntry[],
): EncyclopediaLinkedEntry[] {
  const map = new Map<string, EncyclopediaLinkedEntry>();

  for (const entry of entries) {
    if (!map.has(entry.id)) {
      map.set(entry.id, toLinkedEntry(entry));
    }
  }

  return Array.from(map.values());
}

function sortEntries(
  entries: EncyclopediaIndexEntry[],
): EncyclopediaIndexEntry[] {
  return [...entries].sort((a, b) => a.title.localeCompare(b.title));
}

function buildSameClusterEntries(
  current: EncyclopediaIndexEntry,
  entries: EncyclopediaIndexEntry[],
): EncyclopediaIndexEntry[] {
  return sortEntries(
    entries.filter(
      (entry) =>
        entry.id !== current.id &&
        entry.category === current.category &&
        entry.cluster === current.cluster,
    ),
  ).slice(0, 6);
}

function buildSameCategoryEntries(
  current: EncyclopediaIndexEntry,
  entries: EncyclopediaIndexEntry[],
): EncyclopediaIndexEntry[] {
  return sortEntries(
    entries.filter(
      (entry) =>
        entry.id !== current.id &&
        entry.category === current.category &&
        entry.cluster !== current.cluster,
    ),
  ).slice(0, 6);
}

function buildCrossCategoryEntries(
  entries: EncyclopediaIndexEntry[],
  category: EncyclopediaCategory,
  preferredClusters: string[],
): EncyclopediaIndexEntry[] {
  const preferred = sortEntries(
    entries.filter(
      (entry) =>
        entry.category === category &&
        preferredClusters.includes(entry.cluster),
    ),
  );

  if (preferred.length > 0) {
    return preferred.slice(0, 6);
  }

  return sortEntries(entries.filter((entry) => entry.category === category)).slice(
    0,
    6,
  );
}

function getPreferredSurfaceClustersForProblem(cluster: string): string[] {
  switch (cluster) {
    case "grease-buildup":
      return ["stainless-steel", "tile", "finished-wood"];
    case "product-residue":
      return ["glass", "stainless-steel", "finished-wood", "tile"];
    case "surface-haze":
      return ["glass", "tile", "finished-wood", "stainless-steel"];
    case "streaking":
      return ["glass", "stainless-steel"];
    case "dust-buildup":
      return ["finished-wood", "glass"];
    case "general-soil":
      return ["tile", "grout", "finished-wood"];
    case "limescale":
      return ["shower-glass", "tile", "glass"];
    case "glass-etching":
      return ["glass", "shower-glass"];
    case "grout-soiling":
      return ["grout", "tile"];
    case "soap-scum":
      return ["shower-glass", "tile", "grout"];
    case "hard-water":
      return ["glass", "shower-glass", "tile", "stainless-steel"];
    default:
      return [];
  }
}

function getPreferredMethodClustersForProblem(cluster: string): string[] {
  switch (cluster) {
    case "grease-buildup":
      return ["degreasing", "neutral-cleaning"];
    case "product-residue":
      return ["neutral-cleaning", "glass-cleaning"];
    case "surface-haze":
      return ["neutral-cleaning", "glass-cleaning", "hard-water-removal"];
    case "streaking":
      return ["glass-cleaning", "neutral-cleaning"];
    case "dust-buildup":
      return ["dust-removal", "neutral-cleaning"];
    case "general-soil":
      return ["neutral-cleaning", "dust-removal"];
    case "limescale":
      return ["hard-water-removal", "glass-cleaning"];
    case "glass-etching":
      return ["glass-cleaning", "hard-water-removal"];
    case "grout-soiling":
      return ["neutral-cleaning"];
    case "soap-scum":
      return ["hard-water-removal", "neutral-cleaning"];
    case "hard-water":
      return ["hard-water-removal", "glass-cleaning"];
    default:
      return [];
  }
}

function getPreferredProblemClustersForSurface(cluster: string): string[] {
  switch (cluster) {
    case "glass":
      return ["surface-haze", "streaking", "glass-etching", "hard-water"];
    case "shower-glass":
      return ["soap-scum", "hard-water", "limescale", "glass-etching"];
    case "tile":
      return ["general-soil", "surface-haze", "limescale", "soap-scum"];
    case "grout":
      return ["grout-soiling", "general-soil", "soap-scum"];
    case "stainless-steel":
      return ["grease-buildup", "product-residue", "surface-haze", "streaking"];
    case "finished-wood":
      return ["dust-buildup", "general-soil", "surface-haze"];
    default:
      return [];
  }
}

function getPreferredMethodClustersForSurface(cluster: string): string[] {
  switch (cluster) {
    case "glass":
      return ["glass-cleaning", "neutral-cleaning"];
    case "shower-glass":
      return ["hard-water-removal", "glass-cleaning"];
    case "tile":
      return ["neutral-cleaning", "hard-water-removal"];
    case "grout":
      return ["neutral-cleaning"];
    case "stainless-steel":
      return ["degreasing", "neutral-cleaning"];
    case "finished-wood":
      return ["dust-removal", "neutral-cleaning"];
    default:
      return [];
  }
}

function getPreferredProblemClustersForMethod(cluster: string): string[] {
  switch (cluster) {
    case "degreasing":
      return ["grease-buildup"];
    case "neutral-cleaning":
      return ["general-soil", "product-residue", "surface-haze"];
    case "hard-water-removal":
      return ["hard-water", "limescale", "soap-scum"];
    case "glass-cleaning":
      return ["streaking", "surface-haze", "glass-etching"];
    case "dust-removal":
      return ["dust-buildup"];
    case "touchpoint-sanitization":
      return ["general-soil", "product-residue"];
    default:
      return [];
  }
}

function getPreferredSurfaceClustersForMethod(cluster: string): string[] {
  switch (cluster) {
    case "degreasing":
      return ["stainless-steel", "tile", "finished-wood"];
    case "neutral-cleaning":
      return ["finished-wood", "stainless-steel", "tile", "glass"];
    case "hard-water-removal":
      return ["shower-glass", "glass", "tile"];
    case "glass-cleaning":
      return ["glass", "shower-glass"];
    case "dust-removal":
      return ["finished-wood", "glass"];
    case "touchpoint-sanitization":
      return ["stainless-steel", "glass"];
    default:
      return [];
  }
}

export function buildLinkedGroupsForEntry(
  current: EncyclopediaIndexEntry,
  allEntries: EncyclopediaIndexEntry[],
): EncyclopediaLinkedGroup[] {
  const groups: EncyclopediaLinkedGroup[] = [];

  const sameClusterEntries = buildSameClusterEntries(current, allEntries);
  if (sameClusterEntries.length > 0) {
    groups.push({
      title: `More in ${current.cluster.replace(/-/g, " ")}`,
      entries: dedupeLinkedEntries(sameClusterEntries),
    });
  }

  if (current.category === "problems") {
    const methodEntries = buildCrossCategoryEntries(
      allEntries,
      "methods",
      getPreferredMethodClustersForProblem(current.cluster),
    );
    if (methodEntries.length > 0) {
      groups.push({
        title: "Related methods",
        entries: dedupeLinkedEntries(methodEntries),
      });
    }

    const surfaceEntries = buildCrossCategoryEntries(
      allEntries,
      "surfaces",
      getPreferredSurfaceClustersForProblem(current.cluster),
    );
    if (surfaceEntries.length > 0) {
      groups.push({
        title: "Related surfaces",
        entries: dedupeLinkedEntries(surfaceEntries),
      });
    }
  }

  if (current.category === "surfaces") {
    const problemEntries = buildCrossCategoryEntries(
      allEntries,
      "problems",
      getPreferredProblemClustersForSurface(current.cluster),
    );
    if (problemEntries.length > 0) {
      groups.push({
        title: "Common problems on this surface",
        entries: dedupeLinkedEntries(problemEntries),
      });
    }

    const methodEntries = buildCrossCategoryEntries(
      allEntries,
      "methods",
      getPreferredMethodClustersForSurface(current.cluster),
    );
    if (methodEntries.length > 0) {
      groups.push({
        title: "Recommended methods",
        entries: dedupeLinkedEntries(methodEntries),
      });
    }
  }

  if (current.category === "methods") {
    const problemEntries = buildCrossCategoryEntries(
      allEntries,
      "problems",
      getPreferredProblemClustersForMethod(current.cluster),
    );
    if (problemEntries.length > 0) {
      groups.push({
        title: "Problems this method addresses",
        entries: dedupeLinkedEntries(problemEntries),
      });
    }

    const surfaceEntries = buildCrossCategoryEntries(
      allEntries,
      "surfaces",
      getPreferredSurfaceClustersForMethod(current.cluster),
    );
    if (surfaceEntries.length > 0) {
      groups.push({
        title: "Surfaces this method is used on",
        entries: dedupeLinkedEntries(surfaceEntries),
      });
    }
  }

  const sameCategoryEntries = buildSameCategoryEntries(current, allEntries);
  if (sameCategoryEntries.length > 0) {
    groups.push({
      title: `More ${formatEncyclopediaCategoryLabel(current.category).toLowerCase()}`,
      entries: dedupeLinkedEntries(sameCategoryEntries),
    });
  }

  return groups
    .map((group) => ({
      ...group,
      entries: group.entries.slice(0, 6),
    }))
    .filter((group) => group.entries.length > 0);
}
