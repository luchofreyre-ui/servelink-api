/**
 * Peer clusters for product comparisons and related-product ranking.
 * Pairs are auto-eligible for comparison pages when they share ≥1 compatible problem (see generator).
 */
export const PRODUCT_PEER_CLUSTERS: readonly (readonly string[])[] = [
  ["drano-max-gel-drain-clog-remover", "liquid-plumr-clog-destroyer-plus-pipeguard"],
  [
    "wet-and-forget-shower-cleaner",
    "method-daily-shower-spray",
    "tilex-daily-shower-cleaner",
    "scrubbing-bubbles-daily-shower-cleaner",
  ],
  [
    "murphy-oil-soap-wood-cleaner",
    "pledge-multisurface-cleaner",
    "pledge-everyday-clean-multisurface",
    "method-wood-for-good-daily-clean",
  ],
  [
    "cerama-bryte-cooktop-cleaner",
    "weiman-gas-range-cleaner-degreaser",
    "easy-off-kitchen-degreaser",
    "krud-kutter-kitchen-degreaser",
  ],
  ["oil-eater-cleaner-degreaser", "purple-power-industrial-strength-cleaner-degreaser"],
  ["concrobium-mold-control", "mold-armor-rapid-clean-remediation"],
  [
    "goo-gone-original-liquid",
    "goo-gone-spray-gel",
    "un-du-adhesive-remover",
    "3m-adhesive-remover",
    "goof-off-professional-strength-remover",
  ],
  ["easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner"],
  [
    "bona-hardwood-floor-cleaner",
    "bona-hard-surface-floor-cleaner",
    "zep-neutral-ph-floor-cleaner",
    "rejuvenate-luxury-vinyl-floor-cleaner",
  ],
  [
    "natures-miracle-stain-and-odor-remover",
    "rocco-roxie-stain-odor-eliminator",
    "biokleen-bac-out-stain-odor-remover",
  ],
  [
    "lysol-laundry-sanitizer",
    "clorox-laundry-sanitizer",
    "odoban-fabric-laundry-spray",
    "febreze-fabric-refresher-antimicrobial",
    "zero-odor-eliminator-spray",
    "fresh-wave-odor-removing-spray",
  ],
  ["weiman-stainless-steel-cleaner-polish", "therapy-stainless-steel-cleaner-polish", "sprayway-stainless-steel-cleaner"],
  [
    "lysol-disinfectant-spray",
    "microban-24-hour-disinfectant-sanitizing-spray",
    "odoban-disinfectant-odor-eliminator",
  ],
  ["clr-calcium-lime-rust", "lime-a-way-cleaner", "zep-calcium-lime-rust-remover"],
  /** Kitchen grease lane: dish surfactant vs alkaline cooktop/hood specialist (shared grease/food problems). */
  ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
  /** Glass clarity / light-finish lane (for controlled stainless ↔ glass bridges). */
  ["windex-original-glass-cleaner", "sprayway-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
] as const;

/** Other SKUs in the same peer cluster (for internal linking). */
export function peerProductSlugsForSlug(slug: string, limit = 2): string[] {
  const out: string[] = [];
  for (const c of PRODUCT_PEER_CLUSTERS) {
    if (!c.includes(slug)) continue;
    for (const o of c) {
      if (o !== slug) out.push(o);
    }
  }
  return [...new Set(out)].slice(0, limit);
}
