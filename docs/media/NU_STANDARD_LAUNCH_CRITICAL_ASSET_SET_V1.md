# Nu Standard — Launch-Critical Asset Set (Wave V1)

**Document type:** Curated **first-wave** production specification—homepage hero, owner-operator trust, booking reassurance, and environmental atmosphere **only**.  
**Authority:** Follows `NU_STANDARD_IMAGE_PROMPT_LIBRARY_V1.md`, `NU_STANDARD_VIDEO_PRODUCTION_LIBRARY_V1.md`, `NU_STANDARD_MEDIA_IMPLEMENTATION_MAP_V1.md`, and `NU_STANDARD_MEDIA_PERFORMANCE_GOVERNANCE_V1.md`.

**Scope boundary:** This wave does **not** replace the full registry (42 IDs); it **prioritizes** a launch-critical subset and adds **generation sequencing**, **crop plans**, and **culling rationale**. No raster files are committed in-repo here—only production instructions.

---

## Wave inventory → registry mapping

| Launch lane | Registry IDs (primary) |
|-------------|-------------------------|
| Homepage hero | `NSM-HER-001` … `NSM-HER-004` |
| Owner-operator trust | `NSM-OOP-001` … `NSM-OOP-004` |
| Booking reassurance | `NSM-BKG-002`, `NSM-BKG-003`, `NSM-BKG-004`, `NSM-PAY-002`, `NSM-PRC-002`, `NSM-PRC-003`, `NSM-TRU-003`, `NSM-ENV-004` (recurring calm) |
| Environmental atmosphere | `NSM-ENV-001`, `NSM-ENV-002`, `NSM-ENV-003`, `NSM-ENV-004` |

---

## Generation sequencing (recommended)

| Phase | Deliver | Gate |
|-------|---------|------|
| G1 | Environmental stills (`ENV-*`) — fastest palette lock | Color grade LUT signed off |
| G2 | Hero stills (`HER-*`) — depends on LUT | Hero crops signed off |
| G3 | Owner-operator (`OOP-*`) — talent/legal | Release forms filed |
| G4 | Booking reassurance (`BKG-*`, `PAY-*`, `PRC-*`) | Prop continuity pack |
| G5 | Hero video poster pull + `V-HERO-001` conform | Performance budget |

---

## Responsive crop planning (launch subset)

| Asset ID | Desktop master | Mobile crop | Safe focal |
|----------|----------------|-------------|------------|
| NSM-HER-001 | 16:9 landscape | 9:16 vertical slice door/garden path center-weight | Lower third walkway |
| NSM-HER-002 | 3:2 or 16:9 interior | 4:5 window light + seating wedge | Window frame left vertical |
| NSM-HER-003 | 4:5 macro hands | 1:1 textile texture | Hands center lower |
| NSM-OOP-001 | 3:2 doorway | 9:16 faces upper third clearance | Faces inward to door trim |
| NSM-OOP-002 | 3:2 walkthrough | 4:5 clipboard + gesture plane | Gesture centroid |
| NSM-ENV-001 | 16:9 kitchen wide | 1:1 island center | Island ellipse |
| NSM-ENV-002 | 4:5 bath vertical | Same | Fixture triangle |
| NSM-BKG-002 | 3:2 portrait env | 4:5 shoulders + paper blur | Eyes upper third |
| NSM-PAY-002 | 1:1 still-life | Same | Lock offset rule-of-thirds |

---

## Fallback still hierarchy (homepage hero)

1. **Tier A:** Approved hero still (`NSM-HER-002` preferred primary paint—see § Hero conclusions).  
2. **Tier B:** Alternate hero still (`NSM-HER-001`) swapped seasonally or A/B without CLS change (same aspect slots).  
3. **Tier C:** CSS gradient token `#FFF9F3 → #F7F1EA` + 1px hairline `#C9B27C/14` (no bitmap).  
4. **Tier D:** Reduced-bandwidth / `prefers-reduced-motion`: Tier C only + optional `NSM-HER-003` micro thumbnail optionalFuture OFF default.

---

# Phase 3 — Homepage hero system

## Five hero still concepts (production prompts)

**Global negative append:** paste Image Prompt Library § *Negative instructions master list* verbatim.

### Concept H-A — `NSM-HER-001` — Dawn exterior establishing

**Prompt core:** Photoreal single-family transitional home exterior at civil dawn; dew on lawn credible; sky pastel controlled highlight roll-off; driveway understated; **no** “sold” sign; **no** drone gimmick; 35mm landscape; natural color science faithful siding texture.

**Emotional objective:** Legitimate residential context—calm belonging.

### Concept H-B — `NSM-HER-002` — Morning interior sanctuary (**PRIMARY STILL RECOMMENDATION**)

**Prompt core:** Lived-in premium living space morning north-window skylight bounce; single folded throw; bookshelves orderly not sterile; warm oat walls `#FFF9F3` family; selective depth; **avoid** catalogue symmetry stacks; 28mm corrected verticals.

**Why primary:** Maximizes **emotional reset** + **premium realism** without realtor glamour or cleaning-supply clichés; pairs best with Nu Standard copy tone (“calm,” “accountable standards”). Lower stock-photo risk than exterior hero alone.

### Concept H-C — `NSM-HER-003` — Hands textile discipline accent

**Prompt core:** Macro respectful hands smoothing linen edge; wedding-band ambiguous optional; fingernails groomed practical; thread texture credible; lighting soft box mimic natural largeness.

**Emotional objective:** Craft care—supports owner-operator narrative without demanding recognizable talent release on homepage day-one.

### Concept H-D — `NSM-HER-004` — Quiet vertical garden interior (seasonal alt)

**Prompt core:** Muted indoor planter wall—not influencer jungle overload; single chair silhouette background bokeh; humidity believable leaf specular discipline low.

**Emotional objective:** Differentiated calm biophilia—use **post-launch** seasonal rotation unless shoot efficiency bundles.

### Concept H-E — Composite lane (optional)

**Art direction:** Split panel **H-B left** + **H-C right** micro inset masked radius consistent homepage UI card geometry—**only** if CLS-safe responsive masks validated in implementation PR.

## Hero video — single sequence plan (`V-HERO-001` condensed)

| Beat | Duration | Frame intent | Motion allowance |
|------|----------|--------------|------------------|
| V1 | 0–6s | Exterior dawn locked wide (`H-A` matching angle) | Micro dolly-in ≤4% |
| V2 | 6–14s | Interior crossing doorway reveal continuity (`H-B`) | Static tripod |
| V3 | 14–22s | Owner silhouette shallow rack living vignette (`OOP` wardrobe discipline) | Focus rack slow |
| V4 | 22–28s | Hands textile beat (`H-C`) | Static macro |

**Poster frame:** Pull **frame @ 10s** interior (`H-B` alignment) — prevents flash mismatch vs first pixel exterior.

**Audio:** Optional ambient only; VO ≤14 words final 8s if approved—must not mention internal systems.

### Mobile hero video policy

- Default **still poster only** on `<768px` unless adaptive bitrate ladder proves LCP budget green in lab.  
- No autoplay if `prefers-reduced-motion`.

---

# Phase 4 — Owner-operator trust assets

## Approved scene prompts (launch)

### OOP-A — `NSM-OOP-001` Respectful entry greeting

**Prompt core:** Owner-operator adult neutral navy soft blazer OR charcoal polo; homeowner partially obscured OTS acceptable; doorway backlight controlled with reflector fill; handshake **avoid**—open palm orientation respectful spacing.

### OOP-B — `NSM-OOP-002` Collaborative walkthrough

**Prompt core:** Medium two-shot interior hallway; clipboard slim aluminum—not oversized comedy prop; gestures horizontal scope indication; expressions listening-serious not grin selling.

### OOP-C — `NSM-OOP-003` Calm vehicle coordination

**Prompt core:** Open SUV/trunk muted organizational bins coherent charcoal textiles; team members ≥2 distance conversational spacing; **no** chaotic pile dumping aesthetic.

### OOP-D — `NSM-OOP-004` Quality inspection finish pass

**Prompt core:** Profile owner inspecting reflective countertop streak discipline subtle polarizer realism plausible; face concentration not selfie-performance.

**Emotional synthesis:** “Standards + accountability” via **calm faces**, **prepared kit**, **inspection concentration**—never hustle memeography.

---

# Phase 5 — Booking reassurance assets

## Approved prompts

| ID | Scene | Anxiety reduced |
|----|-------|-----------------|
| NSM-BKG-002 | Homeowner reviews printed estimate blur typography | Decision clarity |
| NSM-BKG-003 | Organized arrival kit flat lay | Preparedness |
| NSM-BKG-004 | Minimal terminal still-life angled glare-controlled | Deposit legitimacy calm |
| NSM-PAY-002 | Open brass padlock resting beside oatmeal linen | Authorization without fear |
| NSM-PRC-002 | Calendar + notebook single pen aligned | Scheduling predictability |
| NSM-PRC-003 | Daylight door arrival window suggestion | Time reliability |
| NSM-TRU-003 | Checklist artifact shallow DOF blurred text | Standards existence implication |
| NSM-ENV-004 | Bedroom sheets east light recurring rhythm | Recurring consistency metaphor |

**Cognitive load rule:** Use **one** imagery accent per booking step surface maximum—never stack BKG+PAY+PRC simultaneously adjacent dense viewport mobile.

---

# Phase 6 — Environmental atmosphere assets

## Approved prompts

| ID | Environment | Objective |
|----|---------------|-----------|
| NSM-ENV-001 | Kitchen island quartz matte fruit bowl ≤3 items stool matte | Fresh clarity |
| NSM-ENV-002 | Bathroom towel precision chrome softened highlight specular discipline | Sanitary premium sans clinic horror |
| NSM-ENV-003 | Oak floor grain gentle directional window rake | Material authenticity grounding |
| NSM-ENV-004 | Bedroom linens rumpled realistic neat—not hotel starch caricature | Rest / recurring cadence calm |

**Forbidden:** marble omnibus mansion foyer cliché; CGI cleanliness sparkle overlays.

---

# Phase 7 — Critical review & culling

## Approved concepts summary

| Code | Description | Reason kept |
|------|-------------|-------------|
| ✓ H-B | Interior morning sanctuary | Best emotional-reset / premium-realism balance |
| ✓ H-A | Exterior dawn | Trust anchoring; secondary/poster/video beat |
| ✓ H-C | Hands textile macro | Face-release-light accent |
| ✓ OOP-A–D | Entry / walkthrough / vehicle / inspection | Accountability ladder coherent |
| ✓ BKG-002/003/004 + PAY-002 + PRC-2/3 | Booking ladder | Anxiety reduction w/out gimmick |
| ✓ ENV-001–004 | Core rooms atmosphere | Order + relief without fantasy |

## Rejected concepts (representative)

| Code | Description | Why rejected |
|------|-------------|--------------|
| ✗ X-SPARKLE | CGI gleam streaks post-pass “magic clean” | Reads janitorial infomercial |
| ✗ X-CELEBRITY | Influencer-style testimonial freeze grin | Violates calm discipline doctrine |
| ✗ X-MANSION | Dual staircase foyer chandelier centerpiece | Over-luxury fantasy drift |
| ✗ X-CHEM-WALL | Wall of rainbow bottle branding | Stock cleaning aisle cliché |
| ✗ X-DEVICE | Crisp readable booking UI screenshot literal | Software-demo perception risk |
| ✗ X-MONTAGE | Rapid-cut handshake wrench toolbox slapstick | Emotional noise + pacing forbidden |
| ✗ X-FRENZY | Team sprint blur chaotic hallway | “Hustle” anti-pattern |
| ✗ X-UNDERDOG | Hand-painted “support local” sandwich board irony | Small-business desperation vibe |

---

## Hero-system conclusions

- **Primary still recommendation:** **`NSM-HER-002`** — strongest alignment with **emotional calm + premium lived realism + conversion confidence** without listing glamour.  
- **Secondary / establishing:** **`NSM-HER-001`** supports legitimacy & neighborhood trust—ideal poster/video beat #1 or seasonal desktop variant.  
- **Accent / low-friction talent:** **`NSM-HER-003`** adds tactile discipline without requiring recognizable roster day-one.

---

## STOP — documentation wave only

Raster generation occurs outside repo using these prompts; track approvals in registry status fields.
