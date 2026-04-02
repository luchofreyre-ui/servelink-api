"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getProductImageGallery } from "@/lib/products/getProductImageGallery";

type ProductImageGalleryProps = {
  product: {
    name: string;
    primaryImageUrl?: string | null;
    imageUrls?: string[] | null;
  };
  priority?: boolean;
  sizes?: string;
  rounded?: "lg" | "xl" | "2xl";
  aspect?: "square" | "landscape";
  thumbnailAspect?: "square";
  className?: string;
};

function getRoundedClass(rounded: ProductImageGalleryProps["rounded"]): string {
  switch (rounded) {
    case "lg":
      return "rounded-lg";
    case "xl":
      return "rounded-xl";
    case "2xl":
      return "rounded-2xl";
    default:
      return "rounded-xl";
  }
}

function getAspectClass(aspect: ProductImageGalleryProps["aspect"]): string {
  switch (aspect) {
    case "landscape":
      return "aspect-[4/3]";
    case "square":
    default:
      return "aspect-square";
  }
}

export function ProductImageGallery({
  product,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 40vw",
  rounded = "2xl",
  aspect = "square",
  className = "",
}: ProductImageGalleryProps) {
  const images = useMemo(() => getProductImageGallery(product), [product]);
  const [activeIndex, setActiveIndex] = useState(0);

  const roundedClass = getRoundedClass(rounded);
  const aspectClass = getAspectClass(aspect);
  const activeImage = images[activeIndex] ?? null;

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, images.length]);

  if (!activeImage) {
    return (
      <div className={["space-y-3", className].join(" ")}>
        <div
          className={[
            "relative overflow-hidden border border-zinc-200 bg-zinc-50",
            aspectClass,
            roundedClass,
          ].join(" ")}
          aria-hidden="true"
        >
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-zinc-400">
            No product image available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={["space-y-3", className].join(" ")}>
      <div
        className={[
          "relative overflow-hidden border border-zinc-200 bg-white",
          aspectClass,
          roundedClass,
        ].join(" ")}
      >
        <Image
          src={activeImage}
          alt={product.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-4"
        />
      </div>

      {images.length > 1 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            More views
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {images.map((imageUrl, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={[
                    "relative aspect-square overflow-hidden rounded-xl border bg-white transition",
                    isActive
                      ? "border-zinc-900 ring-1 ring-zinc-900"
                      : "border-zinc-200 hover:border-zinc-400",
                  ].join(" ")}
                  aria-label={`Show image ${index + 1} for ${product.name}`}
                  aria-pressed={isActive}
                >
                  <Image
                    src={imageUrl}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    sizes="96px"
                    className="object-contain p-2"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
