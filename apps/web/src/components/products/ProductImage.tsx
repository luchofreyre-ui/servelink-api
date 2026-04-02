import Image from "next/image";
import { getProductImageUrl } from "@/lib/products/getProductImageUrl";

type ProductImageProps = {
  product: {
    name: string;
    primaryImageUrl?: string | null;
    imageUrls?: string[] | null;
  };
  className?: string;
  sizes?: string;
  priority?: boolean;
  aspect?: "square" | "landscape";
  rounded?: "lg" | "xl" | "2xl";
};

function getRoundedClass(rounded: ProductImageProps["rounded"]): string {
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

function getAspectClass(aspect: ProductImageProps["aspect"]): string {
  switch (aspect) {
    case "landscape":
      return "aspect-[4/3]";
    case "square":
    default:
      return "aspect-square";
  }
}

export function ProductImage({
  product,
  className = "",
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  aspect = "square",
  rounded = "xl",
}: ProductImageProps) {
  const imageUrl = getProductImageUrl(product);
  const roundedClass = getRoundedClass(rounded);
  const aspectClass = getAspectClass(aspect);

  if (!imageUrl) {
    return (
      <div
        className={[
          "relative overflow-hidden border border-zinc-200 bg-zinc-50",
          aspectClass,
          roundedClass,
          className,
        ].join(" ")}
        aria-hidden="true"
      >
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-zinc-400">
          No product image available
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "relative overflow-hidden border border-zinc-200 bg-white",
        aspectClass,
        roundedClass,
        className,
      ].join(" ")}
    >
      <Image
        src={imageUrl}
        alt={product.name}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain p-3"
      />
    </div>
  );
}
