import { describe, expect, it } from "vitest";

import { isAuthorityOwnedProblemHub } from "@/lib/authority/authorityOwnedProblemHubs";
import { preferEncyclopediaCanonicalHref } from "../encyclopediaCanonicalHref";
import {
  resolveCanonicalMetadataHref,
  resolveJsonLdBreadcrumbHrefs,
} from "../encyclopediaCanonicalMetadataHref";

describe("encyclopediaCanonicalMetadataHref", () => {
  it("maps exact migrated legacy paths to encyclopedia", () => {
    expect(resolveCanonicalMetadataHref("/methods/degreasing")).toBe(
      "/encyclopedia/methods/degreasing",
    );
  });

  it("does not rewrite authority-owned problem hub paths to encyclopedia (even if redirect map would)", () => {
    for (const slug of [
      "dust-buildup",
      "surface-haze",
      "product-residue-buildup",
      "grease-buildup",
      "limescale-buildup",
    ] as const) {
      const path = `/problems/${slug}`;
      expect(isAuthorityOwnedProblemHub(slug)).toBe(true);
      expect(preferEncyclopediaCanonicalHref(path)).toBe(path);
      expect(resolveCanonicalMetadataHref(path)).toBe(path);
    }
  });

  it("does not treat arbitrary problem slugs as authority-owned", () => {
    expect(isAuthorityOwnedProblemHub("some-other-problem")).toBe(false);
  });

  it("returns legacy path when not in migration map", () => {
    expect(resolveCanonicalMetadataHref("/methods/unknown-method-xyz")).toBe(
      "/methods/unknown-method-xyz",
    );
  });

  it("resolves breadcrumb hrefs for JSON-LD", () => {
    const out = resolveJsonLdBreadcrumbHrefs([
      { label: "Problems", href: "/problems" },
      { label: "Grease", href: "/problems/grease-buildup" },
    ]);
    expect(out[0].href).toBe("/problems");
    expect(out[1].href).toBe("/problems/grease-buildup");
  });
});
