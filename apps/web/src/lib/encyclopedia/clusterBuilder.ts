// clusterBuilder.ts

import type { GeneratedPage } from "./pageTypes";

export type TopicCluster = {
  key: string;
  pages: GeneratedPage[];
};

export function buildClusters(pages: GeneratedPage[]): TopicCluster[] {
  const map = new Map<string, GeneratedPage[]>();

  for (const page of pages) {
    const key = page.meta.problem;

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(page);
  }

  return Array.from(map.entries()).map(([key, pages]) => ({
    key,
    pages,
  }));
}

export function buildClusterIndex(pages: GeneratedPage[]) {
  return buildClusters(pages);
}
