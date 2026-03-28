export type EncyclopediaCategory =
  | "problems"
  | "surfaces"
  | "methods"
  | "chemicals"
  | "tools"
  | "rooms"
  | "prevention"
  | "edge-cases"
  | "decisions";

export type EncyclopediaRole =
  | "core"
  | "surface-variant"
  | "severity-variant"
  | "intent-variant"
  | "supporting";

export type EncyclopediaIndexStatus =
  | "planned"
  | "draft"
  | "published"
  | "archived";

export interface EncyclopediaIndexEntry {
  id: string;
  title: string;
  category: EncyclopediaCategory;
  cluster: string;
  role: EncyclopediaRole;
  slug: string;
  status: EncyclopediaIndexStatus;
}

export interface EncyclopediaBatchPage {
  id: string;
  title: string;
  category: EncyclopediaCategory;
  cluster: string;
  slug: string;
  summary: string;
  image: {
    primaryAlt: string;
    queries: string[];
  };
  sections: {
    what_this_is: string;
    why_it_happens: string;
    what_people_do_wrong: string;
    professional_method: string;
    data_and_benchmarks: string;
    professional_insights: string;
    when_to_call_a_professional: string;
    related_topics: string[];
  };
}

export interface EncyclopediaBatchFile {
  pages: EncyclopediaBatchPage[];
}

export interface EncyclopediaFrontmatter {
  id: string;
  title: string;
  category: EncyclopediaCategory;
  cluster: string;
  role: EncyclopediaRole;
  slug: string;
  summary: string;
  status: EncyclopediaIndexStatus;
  primaryImageAlt: string;
  imageQueries: string[];
  relatedTopics: string[];
}

export interface EncyclopediaSection {
  heading: string;
  body: string;
}

export interface EncyclopediaLinkedEntry {
  id: string;
  title: string;
  category: EncyclopediaCategory;
  cluster: string;
  slug: string;
  href: string;
}

export interface EncyclopediaLinkedGroup {
  title: string;
  entries: EncyclopediaLinkedEntry[];
}

export interface EncyclopediaDocument {
  frontmatter: EncyclopediaFrontmatter;
  sections: EncyclopediaSection[];
  relatedEntries: EncyclopediaIndexEntry[];
  sourcePath: string;
  linkedGroups: EncyclopediaLinkedGroup[];
}

/** Path and asset resolution only; graph signals added in `attachSearchGraphSignals`. */
export type EncyclopediaResolvedIndexEntryBeforeGraph = EncyclopediaIndexEntry & {
  href: string;
  fileExists: boolean;
  imageAssetPath: string | null;
};

export interface EncyclopediaResolvedIndexEntry extends EncyclopediaIndexEntry {
  href: string;
  fileExists: boolean;
  imageAssetPath: string | null;
  /**
   * Published + markdown file present: participates in graph signal fields (may still be weak).
   * Otherwise false with graph booleans/zeros below.
   */
  isGraphEligible: boolean;
  /** True when this id appears in a cluster hub featured list. */
  isFeaturedInCluster: boolean;
  /** True when the entry's cluster string matches a cluster that has a rollup hub. */
  isInCluster: boolean;
  /** Inbound references from other entries' linked groups (published index). */
  incomingLinks: number;
}

export interface EncyclopediaCategorySummary {
  category: EncyclopediaCategory;
  label: string;
  totalCount: number;
  publishedCount: number;
  draftCount: number;
  plannedCount: number;
  archivedCount: number;
  entries: EncyclopediaResolvedIndexEntry[];
}

/** Hub sections: pipeline categories plus `mixed` for secondary exploration lists. */
export type EncyclopediaClusterSectionKind =
  | "problems"
  | "methods"
  | "surfaces"
  | "mixed";

export interface EncyclopediaClusterSection {
  title: string;
  category: EncyclopediaClusterSectionKind;
  entries: EncyclopediaLinkedEntry[];
}

export interface EncyclopediaClusterRollup {
  cluster: string;
  title: string;
  intro: string;
  totalPublishedPages: number;
  problemCount: number;
  methodCount: number;
  surfaceCount: number;
  featuredEntries: EncyclopediaLinkedEntry[];
  sections: EncyclopediaClusterSection[];
}
