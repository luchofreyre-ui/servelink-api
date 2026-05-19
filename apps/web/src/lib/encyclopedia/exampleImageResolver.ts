import { formatEncyclopediaCategoryLabel } from "./slug";
import type { EncyclopediaCategory } from "./types";

type ExampleImageFallback = {
  src: string;
  caption: string;
};

export type EncyclopediaExampleImage = {
  src: string;
  alt: string;
  eyebrow: string;
  caption: string;
};

const CATEGORY_FALLBACKS: Partial<Record<EncyclopediaCategory, ExampleImageFallback>> = {
  surfaces: {
    src: "/media/trust/oop-quality-inspection.jpg",
    caption: "Example surface context for care and compatibility guidance.",
  },
  problems: {
    src: "/media/services/deep-cleaning.jpg",
    caption: "Example condition context for cleaning-method selection.",
  },
  methods: {
    src: "/media/trust/oop-walkthrough.jpg",
    caption: "Example method context for safe, practical cleaning decisions.",
  },
};

export function resolveEncyclopediaExampleImage({
  category,
  title,
  primaryImageAlt,
  imageAssetPath,
}: {
  category: EncyclopediaCategory;
  title: string;
  primaryImageAlt?: string | null;
  imageAssetPath?: string | null;
}): EncyclopediaExampleImage | null {
  const fallback = CATEGORY_FALLBACKS[category];
  const src = imageAssetPath ?? fallback?.src;

  if (!src) {
    return null;
  }

  return {
    src,
    alt: primaryImageAlt?.trim() || `${title} example image`,
    eyebrow: `${formatEncyclopediaCategoryLabel(category)} example`,
    caption: fallback?.caption ?? "Example context for safe, practical cleaning decisions.",
  };
}
