import { describe, expect, it } from "vitest";

import { resolveEncyclopediaExampleImage } from "../exampleImageResolver";

describe("resolveEncyclopediaExampleImage", () => {
  it("prefers explicit encyclopedia assets when present", () => {
    expect(
      resolveEncyclopediaExampleImage({
        category: "surfaces",
        title: "Cleaning grout",
        primaryImageAlt: "Grout under inspection light",
        imageAssetPath: "/images/encyclopedia/surfaces/grout/cleaning-grout/primary.jpg",
      }),
    ).toMatchObject({
      src: "/images/encyclopedia/surfaces/grout/cleaning-grout/primary.jpg",
      alt: "Grout under inspection light",
      caption: "Example surface context for care and compatibility guidance.",
    });
  });

  it("uses surface fallback imagery when no explicit asset exists", () => {
    expect(
      resolveEncyclopediaExampleImage({
        category: "surfaces",
        title: "Grout",
        imageAssetPath: null,
      }),
    ).toMatchObject({
      src: "/media/trust/oop-quality-inspection.jpg",
      alt: "Grout example image",
      caption: "Example surface context for care and compatibility guidance.",
    });
  });

  it("uses problem fallback imagery when no explicit asset exists", () => {
    expect(
      resolveEncyclopediaExampleImage({
        category: "problems",
        title: "Dust buildup",
        primaryImageAlt: "",
        imageAssetPath: null,
      }),
    ).toMatchObject({
      src: "/media/services/deep-cleaning.jpg",
      alt: "Dust buildup example image",
      caption: "Example condition context for cleaning-method selection.",
    });
  });

  it("uses method fallback imagery when no explicit asset exists", () => {
    expect(
      resolveEncyclopediaExampleImage({
        category: "methods",
        title: "Degreasing",
        imageAssetPath: null,
      }),
    ).toMatchObject({
      src: "/media/trust/oop-walkthrough.jpg",
      alt: "Degreasing example image",
      caption: "Example method context for safe, practical cleaning decisions.",
    });
  });

  it("returns null for categories without image support", () => {
    expect(
      resolveEncyclopediaExampleImage({
        category: "tools",
        title: "Microfiber cloth",
      }),
    ).toBeNull();
  });
});
