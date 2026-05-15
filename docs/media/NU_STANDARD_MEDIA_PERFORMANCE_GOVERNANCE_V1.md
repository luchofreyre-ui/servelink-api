# Nu Standard — Media Performance Governance (V1)

**Purpose:** Prevent media-heavy regressions. Keep the site **fast**, **premium**, and **calm**—not cinematic bloat.

---

## Budget thresholds (initial targets — revise post baseline Lighthouse)

| Surface | Max hero video payload (encoded H.264 + WebM VP9 dual deliverable each) | Notes |
|---------|--------------------------------------------------------------------------|-------|
| Homepage hero | ≤ **6 MB** combined alternate renditions delivered adaptive—not simultaneous download | Use `<video><source>` adaptive selection |
| Booking corridor | **No autoplay video v1** | Still + CSS only |
| Educational loop embed | ≤ **4 MB** each file | Click-to-play |

**Hard stop escalation:** If cumulative hero transfer > **8 MB** on broadband emulation profile → block merge media PR.

---

## Autoplay rules

| Context | Autoplay allowed |
|---------|------------------|
| Homepage hero background video | **Only if** muted, no audio track, `playsInline`, and **prefers-reduced-motion: no-preference** |
| Confirmation / Portal | **Never** |
| Educational micro | Only after explicit user gesture |

---

## Lazy loading rules

| Asset class | Strategy |
|-------------|----------|
| Below-the-fold stills | `loading="lazy"` + dimensions explicit width/height attributes |
| Decorative backgrounds CSS | `background-image` deferred via `<link rel="preload">` only P0 critical path exceptions |
| Video | `preload="none"` default; `metadata` only hero exception |

---

## Mobile bandwidth considerations

| Rule | Detail |
|------|--------|
| Variant ladder | Provide **720p max** mobile bitrate capped targeted ≤ 2.5 Mbps VBR peak |
| Connection hints future | Respect `navigator.connection.saveData` when implemented |
| Texture stripping | Omit ambient textures entirely Save-Data |

---

## Image optimization rules

| Rule | Detail |
|------|--------|
| Format priority | AVIF primary → WebP fallback → JPEG last resort editorial photography |
| Responsive sets | `srcset` + `sizes` attribute mandatory production |
| Max decode dimension | Long edge ≤ **2560px** master archive; serve ≤ **1920px** web hero typical |
| Compression | Lossy photographic quality target DSSIM guided perceptual—not arbitrary % |

---

## Accessibility rules

| Rule | Detail |
|------|--------|
| Decorative | `role="presentation"` or alt empty with visibility hidden context adjacent text |
| Informative | Meaningful `alt` ≤ 140 chars plain language |
| Video | Closed captions file WebVTT synchronized mandatory if VO track exists |
| Motion | `@media (prefers-reduced-motion: reduce)` replaces video with poster still |

---

## Fallback image rules

| Scenario | Fallback |
|----------|----------|
| CDN failure | Warm gradient CSS token `#FFF9F3 → #F7F1EA` |
| Hero poster missing | Solid `#FFF9F3` + subtle border `#C9B27C/14` |
| Broken portrait integrity detection QA | Remove asset revert gradient |

---

## Reduced-motion support

| Requirement | Implementation |
|-------------|----------------|
| CSS transitions site-wide | Respect global token reduce durations ≤ 120ms or none |
| Video | Immediate pause + hide `<video>` display none swap `<img poster>` |

---

## Poster-frame strategy

| Context | Rule |
|---------|------|
| Hero video | Poster must be **pixel-identical first-frame lighting** to prevent flash |
| Educational | Poster descriptive literal frame mid-action clarity |

---

## CDN / delivery expectations

| Expectation | Detail |
|-------------|--------|
| Cache TTL | `immutable` fingerprinted filenames |
| HTTP/2 prioritization | Critical hero image fetchpriority high sparingly |
| Security | Signed URLs if private staging only |

---

## Review gates (merge checklist)

- [ ] CLS contribution measured ≤ **0.05** hero swap simulation  
- [ ] LCP regression budget ≤ **+100ms** median lab  
- [ ] Total byte regression homepage ≤ **+450 KB** still imagery aggregate first visit  

---

## STOP — governance only

Does not configure CDN infrastructure in this repository.
