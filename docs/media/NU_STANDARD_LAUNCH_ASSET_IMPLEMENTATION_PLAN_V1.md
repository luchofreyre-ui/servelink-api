# Nu Standard — Launch Asset Implementation Plan (V1)

**Purpose:** Translate Wave V1 curated assets (`NU_STANDARD_LAUNCH_CRITICAL_ASSET_SET_V1.md`) into **website placement**, **responsive behavior**, **loading**, **fallbacks**, and **implementation priority**—without altering runtime code in this documentation-only PR.

**Governance:** Honor `NU_STANDARD_MEDIA_IMPLEMENTATION_MAP_V1.md` (still-first, lazy surfaces, hero discipline) and `NU_STANDARD_MEDIA_PERFORMANCE_GOVERNANCE_V1.md` (LCP, CLS, bandwidth budgets).

---

## Approved launch assets (Wave V1 subset)

| Tier | Asset IDs | Role |
|------|-----------|------|
| P0 Hero | `NSM-HER-002` (primary), `NSM-HER-001` (secondary/poster), `NSM-HER-003` (accent optional) | Homepage emotional + trust layering |
| P0 Hero motion | `V-HERO-001` poster frame @ ~10s aligned `HER-002` | Deferred enhancement |
| P1 OO Trust | `NSM-OOP-001` … `NSM-OOP-004` | About / Trust / Team adjacent surfaces |
| P1 Booking | `NSM-BKG-002`, `NSM-BKG-003`, `NSM-BKG-004`, `NSM-PAY-002`, `NSM-PRC-002`, `NSM-PRC-003`, `NSM-TRU-003` | Booking funnel reassurance strips |
| P2 Environment | `NSM-ENV-001` … `NSM-ENV-004` | Section dividers, testimonials backdrop subtle |

Seasonal / deferred: `NSM-HER-004` only after palette lock + spare shoot capacity.

---

## Target website placements (conceptual routing)

| Surface | Asset hook | Notes |
|---------|------------|-------|
| Homepage hero | `HER-002` still primary; `HER-001` alt/carousel #2 | Maintain single dominant focal |
| Homepage secondary band | `ENV-001` or `ENV-003` low-contrast background | Parallax OFF mobile |
| About / Mission | `OOP-002` walkthrough | Pair with accountability copy |
| Trust / Standards | `OOP-004` inspection + `TRU-003` checklist blur | Single focal rule |
| Booking step: estimate | `BKG-002` | Adjacent to clarity bullets |
| Booking step: deposit | `PAY-002` + optional `BKG-004` terminal still | Never duplicate literal payment UI screenshot doctrine |
| Scheduling | `PRC-002`, `PRC-003` rotation | One per viewport height mobile |
| Recurring service messaging | `ENV-004` | Rhythm metaphor |

Exact route ↔ component mapping deferred to engineering PR referencing implementation map sections.

---

## Desktop / mobile behavior

| Behavior | Desktop | Mobile (<768px) |
|----------|---------|-------------------|
| Hero media | Still primary; optional muted autoplay loop IF lab LCP green | **Poster still default**; defer inline MP4 |
| Hero aspect | 16:9 / 3:2 slot locked dimensions | 9:16 or 4:5 crop variants pre-export |
| OO imagery | Two-column text + image | Image stack below fold headline |
| Booking reassurance | Inline beside forms | Single-column image ≤40vh |
| Motion | Respect `prefers-reduced-motion` → still only | Same + reduced prefetch |

---

## Loading strategy

| Priority | Technique |
|----------|-----------|
| LCP candidate | `HER-002` receives `fetchpriority=high`, explicit `width`/`height`, AVIF/WebP responsive `srcset` |
| Non-LCP stills | `loading=lazy`, `decoding=async` |
| Hero video | `preload=none`, poster mandatory, invisible until `canplay` gate |
| OO / Booking | IntersectionObserver-triggered decode optional future enhancement |

CDN discipline per Performance Governance (immutable hashed filenames post-export).

---

## Fallback strategy

| Layer | Action |
|-------|--------|
| Bitmap failure | Swap `HER-002` → `HER-001` if CDN miss variant registered |
| Secondary failure | Gradient token fallback `#FFF9F3 → #F7F1EA` |
| Motion denied | Strip `<video>` inject path server/client-side |
| Reduced bandwidth hint (`Save-Data`) | Serve smallest still tier only |

---

## Implementation priority order

1. **P0-A:** Export + optimize still masters `HER-002`, `HER-001`, `HER-003` + mobile crops per Launch Critical doc matrix.  
2. **P0-B:** Wire homepage hero slot (still-only MVP).  
3. **P0-C:** Performance verification (LCP element attribution).  
4. **P1-A:** Booking reassurance single-image inserts (`BKG-002`, `PAY-002`).  
5. **P1-B:** OO trust band (`OOP-001`, `OOP-004`).  
6. **P1-C:** Environmental subtle backgrounds (`ENV-001`, `ENV-003`).  
7. **P2:** Conform `V-HERO-001` ladder + poster parity QA.  
8. **P3:** Seasonal `HER-004` optional rotation.

---

## Completion checklist (engineering follow-up)

- [ ] Hero CLS = 0 regression verified  
- [ ] LCP ≤ governance threshold environment-specific  
- [ ] Alt text drafted per accessibility subsection implementation map  
- [ ] Asset filenames hashed + registry checksum fields updated  

---

**STOP** — documentation artifact only.
