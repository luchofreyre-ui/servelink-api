/** Minimal v1 — map via known strong pairings; replace with authority graph later. */
export function deriveProblemContext(productSlug: string): string | null {
  const mapping: Record<string, string> = {
    "bona-hard-surface-floor-cleaner":
      "Removes dust buildup without leaving residue on sealed floors.",
    "invisible-glass-premium-glass-cleaner":
      "Cuts through haze and prevents streaking on glass surfaces.",
    "clr-calcium-lime-rust": "Breaks down mineral deposits and limescale quickly.",
    "dawn-platinum-dish-spray": "Cuts through residue and grease buildup effectively.",
  };

  return mapping[productSlug] ?? null;
}

export function deriveComparisonSlug(productSlug: string): string | null {
  const map: Record<string, string> = {
    "bona-hard-surface-floor-cleaner":
      "bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner",
    "invisible-glass-premium-glass-cleaner":
      "invisible-glass-premium-glass-cleaner-vs-windex-original-glass-cleaner",
    "clr-calcium-lime-rust": "clr-calcium-lime-rust-vs-zep-calcium-lime-rust-remover",
  };

  return map[productSlug] ?? null;
}
