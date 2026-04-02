type ProductWithImages = {
  primaryImageUrl?: string | null;
  imageUrls?: string[] | null;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getProductImageGallery(
  product: ProductWithImages,
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const candidates = [
    clean(product.primaryImageUrl),
    ...((product.imageUrls ?? []).map((value) => clean(value))),
  ];

  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    ordered.push(candidate);
  }

  return ordered;
}
