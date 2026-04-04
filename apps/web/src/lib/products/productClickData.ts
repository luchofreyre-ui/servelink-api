type ProductClickData = {
  problemSlug: string;
  productSlug: string;
  clicks: number;
};

const clickData: ProductClickData[] = [];

/** Clears in-memory aggregates (Vitest only). */
export function resetProductClickDataForTests(): void {
  clickData.length = 0;
}

export function recordProductClick(problemSlug: string, productSlug: string): void {
  const data = clickData.find(
    (entry) => entry.problemSlug === problemSlug && entry.productSlug === productSlug,
  );
  if (data) {
    data.clicks += 1;
  } else {
    clickData.push({ problemSlug, productSlug, clicks: 1 });
  }
}

export function getProductClickRank(problemSlug: string): string[] {
  return clickData
    .filter((entry) => entry.problemSlug === problemSlug)
    .sort((a, b) => b.clicks - a.clicks)
    .map((entry) => entry.productSlug);
}

/** Rank problem hub slugs by how often users navigated to them from this product page. */
export function getProblemChipRankForProduct(productSlug: string): string[] {
  return clickData
    .filter((entry) => entry.productSlug === productSlug)
    .sort((a, b) => b.clicks - a.clicks)
    .map((entry) => entry.problemSlug);
}

export function sortProductsByClickRank<T extends { slug: string }>(
  products: readonly T[],
  problemSlug: string,
): T[] {
  const rank = getProductClickRank(problemSlug);
  if (rank.length === 0) return [...products];
  return [...products].sort((a, b) => {
    const ia = rank.indexOf(a.slug);
    const ib = rank.indexOf(b.slug);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function sortProblemChipsByProductClickRank<
  T extends { slug: string; title: string; href: string },
>(chips: readonly T[], productSlug: string): T[] {
  const rank = getProblemChipRankForProduct(productSlug);
  if (rank.length === 0) return [...chips];
  return [...chips].sort((a, b) => {
    const ia = rank.indexOf(a.slug);
    const ib = rank.indexOf(b.slug);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}
