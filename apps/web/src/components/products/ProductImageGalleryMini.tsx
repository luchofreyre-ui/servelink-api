import { getProductImageGallery } from "@/lib/products/getProductImageGallery";
import { ProductImage } from "@/components/products/ProductImage";

type ProductImageGalleryMiniProps = {
  product: {
    name: string;
    primaryImageUrl?: string | null;
    imageUrls?: string[] | null;
  };
  maxThumbnails?: number;
};

export function ProductImageGalleryMini({
  product,
  maxThumbnails = 3,
}: ProductImageGalleryMiniProps) {
  const images = getProductImageGallery(product);

  if (images.length <= 1) {
    return (
      <ProductImage
        product={product}
        aspect="square"
        rounded="xl"
        sizes="120px"
      />
    );
  }

  return (
    <div className="space-y-2">
      <ProductImage
        product={product}
        aspect="square"
        rounded="xl"
        sizes="120px"
      />
      <div className="grid grid-cols-3 gap-2">
        {images.slice(0, maxThumbnails).map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${product.name} thumbnail ${index + 1}`}
              className="aspect-square h-auto w-full object-contain p-2"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
