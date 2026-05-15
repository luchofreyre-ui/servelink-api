# Nu Standard — Media Implementation Map (V1)

**Purpose:** Map major website surfaces to planned media assets (`NU_STANDARD_MEDIA_ASSET_REGISTRY_V1.md`), responsive behavior, loading strategy, and motion policy.

**Legend — Loading:** `eager` | `lazy` | `idle`  
**Legend — Motion preference:** `still` | `video-loop` | `video-once` | `none`

---

## Homepage

| Surface region | Asset IDs | Desktop behavior | Mobile behavior | Fallback | Crop rules | Loading | Motion |
|----------------|-----------|------------------|-----------------|----------|------------|---------|--------|
| Hero primary | NSM-HER-001, NSM-HER-002 | Full-bleed background + optional right collage | Stack hero text over single focal still Y* | Warm solid `#FFF9F3` | Maintain doorway focal left-third mobile | eager hero bg still only initially | still first paint |
| Hero secondary panel | NSM-HER-003, NSM-OOP-001 | Split grid maintain ratio | Collapse below headline order image→copy | Hide accent strip image | 4:5 crop variant | lazy below fold | still |
| Standards band | NSM-ENV-001 | Horizontal rhythm cards optional bg wash | Stack cards single column | Pure typography strip | N | lazy | still |
| Steps section | NSM-OOP-002, NSM-PRC-001 | Inline thumbnails max-height 220px | Same scaled width 100% | Text-only | Y thumbnails | lazy | still |
| Featured services cards | optional NSM-ENV-004 | Decorative corner radius mask | Reduce saturation if CLS risk | solid fills | object-cover center | lazy | still |
| Footer zone | NSM-OOP-005 subtle | CSS opacity ≤ 8% bg texture optional | omit texture under reduced bandwidth flag future | none | N | idle | still |

**Video policy homepage hero:** Optional `V-HERO-001` **only** if performance governance thresholds met; poster = NSM-HER-001 approved frame; autoplay muted **must** honor `prefers-reduced-motion`.

---

## Booking corridor (`/book`)

| Step / region | Asset IDs | Behavior | Mobile | Fallback | Loading | Motion |
|---------------|-----------|----------|--------|----------|---------|--------|
| Flow hero header | Visual calm texture optional NSM-TRU-001 ultra-low contrast | CSS background-size cover upper band ≤ 180px tall | Remove texture band increase whitespace | none | idle | still |
| Accountability inset copy zone | none dedicated image required—maintain typographic emphasis | N/A | N/A | N/A | N/A | none |
| Service selection cards | NSM-PRC-001 iconographic companion optional corner | hidden < md optional | always text-primary | none | lazy | still |
| Review / estimate aside | NSM-BKG-002 mood panel BookingSummaryCard aesthetic zone optional future | Collapse below primary form review layout existing | summary text only | center subject eyes upper third | lazy | still |
| Deposit reassurance | NSM-PAY-002 adjacent subtle thumbnail ≤ 96px height | stack above form | textual reassurance persists | lock-linen crop square | lazy | still |
| Schedule step aside | NSM-PRC-003 | show only desktop xl optional | omit entirely mobile reduce scroll | text schedule note | lazy | still |

---

## Portal (`/customer` / auth chrome adjacent)

| Region | Asset IDs | Behavior | Mobile | Fallback | Loading | Motion |
|--------|-----------|----------|--------|----------|---------|--------|
| Dashboard header ambience | NSM-POR-001 opacity ≤ 10% behind title safe | none on narrow if contrast fails WCAG | solid header | focal desk plant center | lazy | still |
| Empty state illustration realism | NSM-POR-002 | card inset rounded | full width stack | text CTA only | lazy | still |
| Knowledge card | no bespoke asset required initially—optional NSM-EDU-002 micro thumb | inline left | top aligned | iconography unicode fallback | lazy | still |

---

## Dashboard (customer booking list semantics)

| Region | Asset IDs | Motion | Loading |
|--------|-----------|--------|---------|
| Timeline empty | NSM-DSH-002 ghost low contrast | still | lazy |
| Row accents | avoid per-row imagery CLS — **do not** attach images per booking row v1 | none | N/A |

---

## Confirmation pages (`/book/confirmation`, direction-received)

| Page | Asset IDs | Behavior | Mobile | Fallback | Motion |
|------|-----------|----------|--------|----------|--------|
| Confirmation hero optional | NSM-CNF-001 | max-height 220px decorative | hide optional | gradient calm | still |
| Secondary relief | NSM-CNF-002 | aside quote optional | stack | omit | still |
| Direction received panel | NSM-OOP-001 reduced crop faces egress safe | stack image below headline | text-only | owner-operator crop vertical | still |

**Autoplay:** **Not appropriate** on confirmation surfaces.

---

## Trust sections (cross-cutting)

| Placement | Asset IDs | Implementation |
|-----------|-----------|----------------|
| Booking trust ribbon textual future enhancement | NSM-TRU-003 blurred checklist extremely subtle icon swap future | maintain text-first per live UI |
| Homepage mosaic texture | NSM-TRU-001 CSS multiply ≤ 6% | omit if reduced-motion |

---

## Educational sections (encyclopedia / guides junction)

| Placement | Asset IDs | Behavior |
|-----------|-----------|----------|
| Encyclopedia hero optional | NSM-EDU-001 split honesty | lazy |
| Inline micro proof | VM-EDU-* loops gated behind click-to-play | reduced-motion shows poster still |

---

## Support surfaces

| Placement | Asset IDs | Motion |
|-----------|-----------|--------|
| Help header | NSM-SUP-001 still | still optional loop prohibited v1 |

---

## Responsive summary matrix

| Breakpoint | Strategy |
|------------|----------|
| `<640px` | Single-column; drop ambient textures first; maintain text contrast AAA large headings where feasible |
| `640–1024px` | Still imagery split stacked |
| `≥1280px` | Allow secondary imagery columns |

---

## Implementation sequencing recommendation

1. Approve **P0 stills** → integrate placeholders grayscale boxes identical geometry prevent CLS.  
2. Swap approved finals behind feature flag `NEXT_PUBLIC_MEDIA_V1` optional future.  
3. Introduce video **only** after still baseline Lighthouse thresholds documented.

---

## STOP — mapping document only

Does not modify Next.js routes or components.
