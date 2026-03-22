import type { ArticleEntityMapEntry } from "./articleEntityTypes";

/**
 * IMPORTANT:
 * This file is intentionally explicit and editorially controlled.
 * Do not auto-generate this from content until you deliberately design that system.
 *
 * Every live article that should strengthen the authority graph should be listed here.
 * Additive only. Article slugs and entity slugs must match knowledgeArticles and entities.
 */
export const ARTICLE_ENTITY_MAP: ArticleEntityMapEntry[] = [
  {
    articleSlug: "how-to-clean-grout",
    entities: [
      { kind: "problem", slug: "grout-soiling" },
      { kind: "surface", slug: "grout" },
      { kind: "surface", slug: "ceramic-tile" },
      { kind: "surface", slug: "porcelain-tile" },
      { kind: "method", slug: "mechanical-agitation" },
      { kind: "method", slug: "oxidizing-cleaners" },
      { kind: "tool", slug: "grout-brush" },
      { kind: "tool", slug: "microfiber-towel" },
    ],
  },
  {
    articleSlug: "how-to-clean-shower",
    entities: [
      { kind: "problem", slug: "soap-scum" },
      { kind: "problem", slug: "mildew" },
      { kind: "surface", slug: "glass" },
      { kind: "surface", slug: "grout" },
      { kind: "surface", slug: "ceramic-tile" },
      { kind: "method", slug: "oxidizing-cleaners" },
      { kind: "method", slug: "moisture-reduction" },
      { kind: "tool", slug: "non-scratch-scrub-pad" },
      { kind: "tool", slug: "squeegee" },
    ],
  },
  {
    articleSlug: "how-to-remove-hard-water-stains",
    entities: [
      { kind: "problem", slug: "hard-water-stains" },
      { kind: "surface", slug: "glass" },
      { kind: "surface", slug: "chrome" },
      { kind: "method", slug: "acid-cleaners" },
      { kind: "method", slug: "microfiber-cleaning" },
      { kind: "tool", slug: "microfiber-towel" },
      { kind: "tool", slug: "non-scratch-scrub-pad" },
    ],
  },
  {
    articleSlug: "how-to-remove-soap-scum",
    entities: [
      { kind: "problem", slug: "soap-scum" },
      { kind: "surface", slug: "glass" },
      { kind: "surface", slug: "ceramic-tile" },
      { kind: "surface", slug: "grout" },
      { kind: "method", slug: "acid-cleaners" },
      { kind: "method", slug: "mechanical-agitation" },
      { kind: "tool", slug: "non-scratch-scrub-pad" },
      { kind: "tool", slug: "detail-brush" },
    ],
  },
  {
    articleSlug: "how-to-remove-bathroom-mildew",
    entities: [
      { kind: "problem", slug: "mildew" },
      { kind: "surface", slug: "grout" },
      { kind: "surface", slug: "ceramic-tile" },
      { kind: "method", slug: "oxidizing-cleaners" },
      { kind: "method", slug: "moisture-reduction" },
      { kind: "tool", slug: "detail-brush" },
      { kind: "tool", slug: "microfiber-towel" },
    ],
  },
  {
    articleSlug: "how-to-clean-tile",
    entities: [
      { kind: "surface", slug: "ceramic-tile" },
      { kind: "surface", slug: "porcelain-tile" },
      { kind: "surface", slug: "grout" },
      { kind: "problem", slug: "grout-soiling" },
      { kind: "method", slug: "microfiber-cleaning" },
      { kind: "method", slug: "mechanical-agitation" },
      { kind: "tool", slug: "mop-pad" },
      { kind: "tool", slug: "microfiber-towel" },
    ],
  },
  {
    articleSlug: "how-to-clean-windows",
    entities: [
      { kind: "surface", slug: "glass" },
      { kind: "problem", slug: "hard-water-stains" },
      { kind: "problem", slug: "soap-scum" },
      { kind: "method", slug: "microfiber-cleaning" },
      { kind: "method", slug: "moisture-reduction" },
      { kind: "tool", slug: "squeegee" },
      { kind: "tool", slug: "microfiber-towel" },
    ],
  },
  {
    articleSlug: "how-to-clean-laminate-floors",
    entities: [
      { kind: "surface", slug: "laminate" },
      { kind: "problem", slug: "grout-soiling" },
      { kind: "method", slug: "microfiber-cleaning" },
      { kind: "method", slug: "neutral-cleaners" },
      { kind: "tool", slug: "mop-pad" },
      { kind: "tool", slug: "microfiber-towel" },
    ],
  },
];
