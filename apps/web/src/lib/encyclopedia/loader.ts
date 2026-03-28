import fs from "node:fs";
import path from "node:path";
import { encyclopediaCache } from "./cacheCompat";
import {
  encyclopediaCategorySchema,
  encyclopediaFrontmatterSchema,
  encyclopediaIndexEntrySchema,
  encyclopediaIndexStatusSchema,
  encyclopediaRoleSchema,
} from "./schema";
import {
  buildEncyclopediaClusterRollup,
  listEncyclopediaClusterSlugs,
} from "./clusters";
import { buildLinkedGroupsForEntry } from "./linking";
import {
  buildEncyclopediaCategoryHref,
  buildEncyclopediaHref,
  buildEncyclopediaImageAssetPath,
  formatEncyclopediaCategoryLabel,
} from "./slug";
import type {
  EncyclopediaCategory,
  EncyclopediaCategorySummary,
  EncyclopediaClusterRollup,
  EncyclopediaDocument,
  EncyclopediaFrontmatter,
  EncyclopediaIndexEntry,
  EncyclopediaResolvedIndexEntry,
  EncyclopediaResolvedIndexEntryBeforeGraph,
  EncyclopediaSection,
} from "./types";

const CONTENT_ROOT = path.join(process.cwd(), "src", "content", "encyclopedia");
const INDEX_PATH = path.join(CONTENT_ROOT, "_index", "master-index.json");
const PUBLIC_ROOT = path.join(process.cwd(), "public");

const ALL_ENCYCLOPEDIA_CATEGORIES: EncyclopediaCategory[] = [
  "problems",
  "surfaces",
  "methods",
  "chemicals",
  "tools",
  "rooms",
  "prevention",
  "edge-cases",
  "decisions",
];

function walkMarkdownFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function parseYamlListBlock(
  lines: string[],
  startIndex: number,
): {
  values: string[];
  nextIndex: number;
} {
  const values: string[] = [];
  let index = startIndex + 1;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.startsWith("  - ")) {
      break;
    }

    values.push(line.slice(4).trim());
    index += 1;
  }

  return { values, nextIndex: index };
}

function parseFrontmatter(raw: string): {
  frontmatter: EncyclopediaFrontmatter;
  body: string;
} {
  if (!raw.startsWith("---\n")) {
    throw new Error("Markdown file is missing opening frontmatter fence.");
  }

  const closingIndex = raw.indexOf("\n---\n", 4);

  if (closingIndex === -1) {
    throw new Error("Markdown file is missing closing frontmatter fence.");
  }

  const frontmatterRaw = raw.slice(4, closingIndex);
  const body = raw.slice(closingIndex + 5).trim();

  const lines = frontmatterRaw.split("\n");
  const record: Record<string, string | string[]> = {};

  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      throw new Error(`Invalid frontmatter line: ${line}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (value.length > 0) {
      record[key] = value;
      index += 1;
      continue;
    }

    const { values, nextIndex } = parseYamlListBlock(lines, index);
    record[key] = values;
    index = nextIndex;
  }

  const frontmatter = encyclopediaFrontmatterSchema.parse({
    id: String(record.id ?? ""),
    title: String(record.title ?? ""),
    category: encyclopediaCategorySchema.parse(String(record.category ?? "")),
    cluster: String(record.cluster ?? ""),
    role: encyclopediaRoleSchema.parse(String(record.role ?? "")),
    slug: String(record.slug ?? ""),
    summary: String(record.summary ?? ""),
    status: encyclopediaIndexStatusSchema.parse(String(record.status ?? "")),
    primaryImageAlt: String(record.primaryImageAlt ?? ""),
    imageQueries: Array.isArray(record.imageQueries) ? record.imageQueries : [],
    relatedTopics: Array.isArray(record.relatedTopics) ? record.relatedTopics : [],
  });

  return { frontmatter, body };
}

function parseSections(body: string): EncyclopediaSection[] {
  const normalized = body.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const matches = Array.from(normalized.matchAll(/^##\s+(.+)$/gm));

  if (matches.length === 0) {
    return [];
  }

  const sections: EncyclopediaSection[] = [];

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const next = matches[i + 1];
    const heading = current[1].trim();
    const contentStart = current.index! + current[0].length;
    const contentEnd = next ? next.index! : normalized.length;
    const bodyText = normalized.slice(contentStart, contentEnd).trim();

    sections.push({
      heading,
      body: bodyText,
    });
  }

  return sections;
}

function buildMarkdownPathForEntry(entry: EncyclopediaIndexEntry): string {
  return path.join(
    CONTENT_ROOT,
    entry.category,
    entry.cluster,
    `${entry.slug}.md`,
  );
}

function hasMarkdownFileForEntry(entry: EncyclopediaIndexEntry): boolean {
  return fs.existsSync(buildMarkdownPathForEntry(entry));
}

function computeIncomingLinkCounts(
  published: EncyclopediaIndexEntry[],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const source of published) {
    const groups = buildLinkedGroupsForEntry(source, published);
    for (const group of groups) {
      for (const linked of group.entries) {
        counts.set(linked.id, (counts.get(linked.id) ?? 0) + 1);
      }
    }
  }

  return counts;
}

function attachSearchGraphSignals(
  entries: EncyclopediaResolvedIndexEntryBeforeGraph[],
): EncyclopediaResolvedIndexEntry[] {
  const published = getPublishedEncyclopediaIndex();
  const incomingLinkCounts = computeIncomingLinkCounts(published);

  const clusterRollups: EncyclopediaClusterRollup[] = [];
  for (const slug of listEncyclopediaClusterSlugs(entries)) {
    const rollup = buildEncyclopediaClusterRollup(slug, entries);
    if (rollup) clusterRollups.push(rollup);
  }

  const featuredIds = new Set(
    clusterRollups.flatMap((rollup) =>
      rollup.featuredEntries.map((linked) => linked.id),
    ),
  );
  const clusterSlugsWithRollup = new Set(
    clusterRollups.map((rollup) => rollup.cluster),
  );

  return entries.map((entry) => {
    const isGraphEligible =
      entry.status === "published" && entry.fileExists === true;

    if (!isGraphEligible) {
      return {
        ...entry,
        isGraphEligible: false,
        isFeaturedInCluster: false,
        isInCluster: false,
        incomingLinks: 0,
      };
    }

    return {
      ...entry,
      isGraphEligible: true,
      isFeaturedInCluster: featuredIds.has(entry.id),
      isInCluster: Boolean(
        entry.cluster && clusterSlugsWithRollup.has(entry.cluster),
      ),
      incomingLinks: incomingLinkCounts.get(entry.id) ?? 0,
    };
  });
}

function getImageAssetPathForEntry(
  entry: EncyclopediaIndexEntry,
): string | null {
  const publicAssetPath = buildEncyclopediaImageAssetPath(
    entry.category,
    entry.cluster,
    entry.slug,
  );
  const relativeAssetPath = publicAssetPath.replace(/^\/+/, "");
  const absoluteAssetPath = path.join(PUBLIC_ROOT, relativeAssetPath);

  return fs.existsSync(absoluteAssetPath) ? publicAssetPath : null;
}

export const getAllEncyclopediaCategories = encyclopediaCache(
  (): EncyclopediaCategory[] => [...ALL_ENCYCLOPEDIA_CATEGORIES],
);

export const getEncyclopediaIndex = encyclopediaCache((): EncyclopediaIndexEntry[] => {
  const raw = fs.readFileSync(INDEX_PATH, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("master-index.json must be an array.");
  }

  return parsed.map((entry) => encyclopediaIndexEntrySchema.parse(entry));
});

export const getPublishedEncyclopediaIndex = encyclopediaCache(
  (): EncyclopediaIndexEntry[] =>
    getEncyclopediaIndex().filter((entry) => entry.status === "published"),
);

export const getResolvedEncyclopediaIndex = encyclopediaCache(
  (): EncyclopediaResolvedIndexEntry[] => {
    const base: EncyclopediaResolvedIndexEntryBeforeGraph[] = getEncyclopediaIndex().map(
      (entry) => ({
        ...entry,
        href: buildEncyclopediaHref(entry.category, entry.slug),
        fileExists: hasMarkdownFileForEntry(entry),
        imageAssetPath: getImageAssetPathForEntry(entry),
      }),
    );
    return attachSearchGraphSignals(base);
  },
);

export const getPublishedEncyclopediaFilePaths = encyclopediaCache((): string[] => {
  const allFiles = walkMarkdownFiles(CONTENT_ROOT);

  return allFiles.filter(
    (filePath) => !filePath.includes(`${path.sep}_index${path.sep}`),
  );
});

export const getPublishedEncyclopediaParams = encyclopediaCache(
  (): Array<{ category: EncyclopediaCategory; slug: string }> => {
    return getPublishedEncyclopediaIndex()
      .filter((entry) => hasMarkdownFileForEntry(entry))
      .map((entry) => ({
        category: entry.category,
        slug: entry.slug,
      }));
  },
);

export const getPublishedEncyclopediaSlugsByCategory = encyclopediaCache(
  (category: EncyclopediaCategory): string[] => {
    return getPublishedEncyclopediaParams()
      .filter((entry) => entry.category === category)
      .map((entry) => entry.slug)
      .sort();
  },
);

export const getEncyclopediaDocumentByCategoryAndSlug = encyclopediaCache(
  (
    category: EncyclopediaCategory,
    slug: string,
  ): EncyclopediaDocument | null => {
    const indexEntries = getEncyclopediaIndex();
    const publishedEntries = getPublishedEncyclopediaIndex();
    const indexById = new Map(indexEntries.map((entry) => [entry.id, entry]));
    const matchingEntry = publishedEntries.find(
      (entry) => entry.category === category && entry.slug === slug,
    );

    if (!matchingEntry) {
      return null;
    }

    const filePath = buildMarkdownPathForEntry(matchingEntry);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const { frontmatter, body } = parseFrontmatter(raw);

    if (frontmatter.status !== "published") {
      return null;
    }

    const relatedEntries = frontmatter.relatedTopics
      .map((id) => indexById.get(id))
      .filter((entry): entry is EncyclopediaIndexEntry => Boolean(entry));

    return {
      frontmatter,
      sections: parseSections(body),
      relatedEntries,
      sourcePath: filePath,
      linkedGroups: buildLinkedGroupsForEntry(matchingEntry, publishedEntries),
    };
  },
);

export const getEncyclopediaCategorySummaries = encyclopediaCache(
  (): EncyclopediaCategorySummary[] => {
    const entries = getResolvedEncyclopediaIndex();
    const grouped = new Map<
      EncyclopediaCategory,
      EncyclopediaResolvedIndexEntry[]
    >();

    for (const category of ALL_ENCYCLOPEDIA_CATEGORIES) {
      grouped.set(category, []);
    }

    for (const entry of entries) {
      const current = grouped.get(entry.category) ?? [];
      current.push(entry);
      grouped.set(entry.category, current);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, categoryEntries]) => {
        const sortedEntries = [...categoryEntries].sort((a, b) =>
          a.title.localeCompare(b.title),
        );

        return {
          category,
          label: formatEncyclopediaCategoryLabel(category),
          totalCount: sortedEntries.length,
          publishedCount: sortedEntries.filter(
            (entry) => entry.status === "published",
          ).length,
          draftCount: sortedEntries.filter((entry) => entry.status === "draft")
            .length,
          plannedCount: sortedEntries.filter(
            (entry) => entry.status === "planned",
          ).length,
          archivedCount: sortedEntries.filter(
            (entry) => entry.status === "archived",
          ).length,
          entries: sortedEntries,
        };
      });
  },
);

export const getEncyclopediaCategorySummary = encyclopediaCache(
  (category: EncyclopediaCategory): EncyclopediaCategorySummary | null => {
    return (
      getEncyclopediaCategorySummaries().find(
        (summary) => summary.category === category,
      ) ?? null
    );
  },
);

export const getPublishedEncyclopediaEntriesByCategory = encyclopediaCache(
  (category: EncyclopediaCategory): EncyclopediaResolvedIndexEntry[] => {
    return (
      getEncyclopediaCategorySummary(category)?.entries.filter(
        (entry) => entry.status === "published" && entry.fileExists,
      ) ?? []
    );
  },
);

export const getEncyclopediaHomeStats = encyclopediaCache(() => {
  const entries = getResolvedEncyclopediaIndex();

  return {
    totalCount: entries.length,
    publishedCount: entries.filter((entry) => entry.status === "published")
      .length,
    draftCount: entries.filter((entry) => entry.status === "draft").length,
    plannedCount: entries.filter((entry) => entry.status === "planned").length,
    archivedCount: entries.filter((entry) => entry.status === "archived")
      .length,
    fileBackedCount: entries.filter((entry) => entry.fileExists).length,
    imageReadyCount: entries.filter((entry) => entry.imageAssetPath !== null)
      .length,
  };
});

export function getEncyclopediaCategoryHref(
  category: EncyclopediaCategory,
): string {
  return buildEncyclopediaCategoryHref(category);
}

export const getEncyclopediaClusterSlugs = encyclopediaCache((): string[] => {
  return listEncyclopediaClusterSlugs(getResolvedEncyclopediaIndex());
});

export const getEncyclopediaClusterRollup = encyclopediaCache(
  (clusterSlug: string): EncyclopediaClusterRollup | null => {
    return buildEncyclopediaClusterRollup(
      clusterSlug,
      getResolvedEncyclopediaIndex(),
    );
  },
);

export const getEncyclopediaClusterIndexRollups = encyclopediaCache(
  (): EncyclopediaClusterRollup[] => {
    return getEncyclopediaClusterSlugs()
      .map((slug) => getEncyclopediaClusterRollup(slug))
      .filter((r): r is EncyclopediaClusterRollup => r !== null);
  },
);
