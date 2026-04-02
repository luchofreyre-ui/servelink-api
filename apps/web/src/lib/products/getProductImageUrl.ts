type ProductWithImages = {
  primaryImageUrl?: string | null;
  imageUrls?: string[] | null;
};

function cleanUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getProductImageUrl(product: ProductWithImages): string | null {
  const primary = cleanUrl(product.primaryImageUrl);
  if (primary) return primary;

  const gallery = (product.imageUrls ?? [])
    .map((value) => cleanUrl(value))
    .filter((value): value is string => Boolean(value));

  if (gallery.length > 0) return gallery[0];

  return null;
}
