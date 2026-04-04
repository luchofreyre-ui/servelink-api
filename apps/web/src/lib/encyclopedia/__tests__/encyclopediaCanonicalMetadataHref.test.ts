import { describe, expect, it } from "vitest";

import {
  resolveCanonicalMetadataHref,
  resolveJsonLdBreadcrumbHrefs,
} from "../encyclopediaCanonicalMetadataHref";

describe("encyclopediaCanonicalMetadataHref", () => {
  it("maps exact migrated legacy paths to encyclopedia", () => {
    expect(resolveCanonicalMetadataHref("/methods/degreasing")).toBe(
      "/encyclopedia/methods/degreasing",
    );
    expect(resolveCanonicalMetadataHref("/problems/grease-buildup")).toBe("/problems/grease-buildup");
    expect(resolveCanonicalMetadataHref("/problems/dust-buildup")).toBe(
      "/encyclopedia/problems/dust-buildup",
    );
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
