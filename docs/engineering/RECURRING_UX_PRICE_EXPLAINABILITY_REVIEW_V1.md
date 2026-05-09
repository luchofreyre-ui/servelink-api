# Recurring UX / price explainability review (v1)

**Status:** analysis / design only — **no** estimator, schema, product UI implementation, or production behavior changes in this drop.

**Codebase snapshot:** branch baseline includes `eeed65e` (intake estimate-driver honesty + labor-effort labeling on review/summary for the **main** preview). Analysis below references `apps/web/.../precision-luxury/booking/*`, `BookingConfirmationClient.tsx`, and `services/api/.../recurring-plan.service.ts` + `intake-booking-bridge.service.ts`.

**Cross-reference:** recurring **economics** (cadence ratios, minute caps) live in `RecurringPlanService` — this doc focuses on **customer interpretation**, not formula rewrites.

---

## 1. Executive summary

Public booking presents **first-clean (reset / opening) economics** and **recurring maintenance economics** in **adjacent UI** with **shared vocabulary** (“price,” “duration,” “savings,” “confidence”). That proximity is correct operationally (recurring quotes are **derived from** first-clean minutes in the current API), but it is **psychologically dangerous** without an explicit **mental model**: customers anchor on the **large first number**, then interpret recurring as a **shallow discount** or **the same job cheaper**, rather than as **a different scope state** (preserved cleanliness + less recovery work).

The **highest-risk surface** is the **Review** step **“Recurring plan”** grid: **First visit price** beside **Recurring visit price** beside **Savings: $X / Y%** — the percent reads like a **promotional rebate** tied to the opening visit, not like **minutes-shaped maintenance labor**.

**Schedule** copy (“This sets your **full reset plan** and **recurring schedule** automatically”) **over-merges** onboarding and stabilization in the customer’s head at the moment they pick a **single** first slot.

**Confidence** is labeled **“How sure we are”** with a **percentage**, which many users will read as **“the price might be wrong”** rather than **“scope predictability given what you told us.”**

**Recommendation theme:** separate narratives **visually and linguistically** into **(A) Opening visit economics** and **(B) Ongoing maintenance economics**; rename **savings** to **reflect labor ratio / maintenance baseline** (copy-only in a future build); add **one** plain sentence that **recurring assumes the home returns to a maintained state between visits**; keep **labor effort** pre-team and add **crew / wall-clock** only post-team when product can truthfully bind duration to team size.

---

## 2. Current recurring UX inventory

### 2.1 Service selection & gating

| Location | Copy / behavior |
|----------|-----------------|
| `bookingPublicSurfaceCopy.ts` | **First-Time Cleaning With Recurring Service** — “Plan a **strong opening reset** and **recurring maintenance** visits in one booking path.” |
| Same | **Recurring Service** card — redirects narrative to first-time+recurring path. |
| Same | **Recurring gate** — “price the **opening reset** and **recurring cadence** before deposit.” |
| `publicBookingTaxonomy.ts` | Path titles: “First-Time Cleaning With Recurring Service,” “Recurring Service.” |

### 2.2 Review step — main estimate block

| Element | Copy / data |
|---------|-------------|
| Section title | “Estimated cleaning time & cost” |
| Price | `previewEstimate.priceCents` labeled **“Price:”** (generic — **first visit** in recurring path but not always explicit in label). |
| Time | **“Estimated labor effort:”** + `formatEstimateDurationMinutes` (post `eeed65e`). |
| Confidence | **“How sure we are:”** + `formatEstimateConfidence` → **N%** (server preview) or local fallback. |
| Footnote | Server: “Live preview uses the same intake fields…” |
| Deep/Clean program | Post-estimate **structure** choice; copy mentions reset spread vs one visit; **three-visit breakdown** uses **client-side** 45%/35%/remainder split of **total** preview price (illustrative). |

### 2.3 Review step — recurring plan block

| Element | Copy / data |
|---------|-------------|
| Title | **“Recurring plan”** |
| Lead | “Review and **lock** your recurring service cadence before choosing a team and paying the deposit.” |
| Grid | **First visit price:** `previewEstimate.priceCents` |
| | **Recurring visit price:** `recurringQuote.recurringPriceCents` |
| | **Estimated recurring labor effort:** `recurringQuote.estimatedMinutes` |
| | **Savings:** `${savingsCents} / ${discountPercent}%` |
| Cadence | Weekly, Every 10 days (helper: “Roughly 3 visits per month”), Biweekly, Monthly |
| Timing callout | Dynamic `recurringTimingText` — separates first visit vs recurring line and notes cadence **mainly affects recurring line** (post `eeed65e`). |

### 2.4 Quote clarity (“planning confidence”)

| Element | Purpose |
|---------|---------|
| Title | **“Quote clarity”** |
| Bands | High / customized / special-attention — **non-numeric** headlines + body + supporting (strings in `bookingPublicSurfaceCopy.ts`). |

*Note:* After intake honesty work, “customized” copy references **preview + crew planning**; still easy to conflate with **price uncertainty** if user skims.

### 2.5 Estimate drivers + planning notes (post `eeed65e`)

| Element | Recurring relevance |
|---------|---------------------|
| **“What shaped this estimate”** | Bullets tied to `estimateFactors`; recurring **cadence** is **not** spelled out as a driver here (correct — drivers are intake fields; recurring line comes from options array). |
| **“Helpful planning notes”** | Operational / unwired narrative; good trust boundary for non-pricing signals. |

### 2.6 Schedule step

| Element | Copy / risk |
|---------|-------------|
| Slot section title | **“Choose your first visit time”** |
| Subcopy (inline JSX) | **“This sets your full reset plan and recurring schedule automatically.”** |
| `schedulePreview` | Can show **“Recurring begins: …”** when preview present |
| Team cards | **“Recommended — strong fit…”** / **“Available…”** — **no** crew size, **no** parallel-labor explanation |
| Slot card | **“Arrival window for your selected team.”** |

### 2.7 Booking summary (sidebar)

| Element | Notes |
|---------|--------|
| Estimate row | Price + **“Est. labor effort”** (post `eeed65e`) + **“How sure we are”** |
| Visit type | **“One-time (public booking)”** even on recurring path — **possible framing mismatch** (operational slug vs customer mental model). |

### 2.8 Confirmation / post-booking

| Surface | From `BookingConfirmationClient.tsx` |
|---------|--------------------------------------|
| Recurring contract | “Your recurring service is set,” cadence label, **Recurring visit price**, optional `nextRunAt`, **Recurring begins:** |
| Three-visit reset | Visit1/2/3 timestamps + recurring begins — **good structural separation** when API provides schedule |

### 2.9 Upsells / intent

| Source | Notes |
|--------|--------|
| `bookingUpsells.ts` | **“Save with recurring service”** + trust note “No recurring plan is created until you approve it.” |
| `bookingIntentCopy.ts` | MAINTAIN intent: **“Save with recurring plans”** |

### 2.10 API truth (explainability anchor)

`RecurringPlanService.getRecurringOfferQuote` builds each option with:

- `recurringMinutes` from cadence-specific **baseline/hard-cap ratios** vs **first-clean estimated minutes**
- `recurringPriceCents = (recurringMinutes / estimatedMinutes) * firstCleanPriceCents`
- `savingsCents = firstCleanPriceCents - recurringPriceCents`
- `discountPercent = round(savings / firstClean * 100)`

So **“discount %”** is **exactly** the proportional reduction from **first-clean minutes → recurring minutes**, not an arbitrary coupon — **this is rarely obvious to customers**.

---

## 3. Highest-risk sticker-shock points

| # | Surface | What happens | Psych risk | Likely interpretation | Operational truth |
|---|---------|--------------|-------------|------------------------|-------------------|
| 1 | Review **Price** row (main block) | Large dollar figure for **opening** work | **High** | “This is what I’ll pay every time” | Main preview is **first clean** / program total for deep paths — recurring is **separate row** |
| 2 | **Savings: $ / %** | Percent next to first visit | **High** | “They’re knocking X% off” / coupon framing | Percent is **minute-ratio delta** vs same rate structure, not a promo |
| 3 | **First visit vs recurring** side-by-side | Two prices without a strong visual “two contracts” frame | **High–Med** | “Why is the second so much lower — what’s missing?” | Lower recurring = **less recovery labor** under maintained state + cadence ratio |
| 4 | Deep clean **three-visit breakdown** | Client-proportioned visit prices | **Med** | Precise **false precision** | Illustrative split — not labeled as estimator-official |
| 5 | Schedule: **full reset + recurring schedule automatically** | Single time pick | **Med–High** | “One click locks my whole life” | First **slot** is concrete; **recurring** is a **plan** with different economics |
| 6 | **How sure we are: N%** | Numeric | **Med** | Model error / haggling cue | Server confidence is **estimate confidence**, not “chance price changes” (unless copy says so) |
| 7 | Local preview **~42%** confidence | `bookingFunnelLocalEstimate.ts` | **High** when preview fails | “They don’t know my house” | Coarse **fallback** — should be framed as **offline band**, not comparable to server |

---

## 4. Reset vs maintenance confusion analysis

**Observed presentation**

- Marketing copy **does** say “opening reset” + “recurring maintenance” in multiple places.
- **Numerical** UI still **defaults to a single “Price:”** label in the main block, then **repeats** first visit price as **“First visit price”** in recurring grid — **redundant** and easy to scan as **one story**.
- **Savings** row encodes **maintenance minutes / first-clean minutes** but **labels** it as **consumer savings** — primes **discount thinking**, not **state transition** (recovery → maintained).

**System architecture (mental model gap)**

- **Recovery economics:** first visit (or phased reset) establishes baseline cleanliness.
- **Maintenance economics:** recurring visits **preserve** state; labor is **not** “same deep clean cheaper forever” but **shorter visits** at same **billing metaphors** (price per visit).

**Hidden assumptions**

- Customer assumes **lower price = less thorough** → trust hit unless **thoroughness is scoped to “maintained home.”**
- Customer assumes **cadence changes first visit** → partially mitigated by `recurringTimingText` after `eeed65e`, but **main price row** still dominates attention.

**Duplicated narratives**

- “Reset” appears in marketing, deep program, schedule, and confirmation — **good**, but **price** section doesn’t consistently say **which** price is reset vs maintenance.

---

## 5. Cadence messaging review

**Current**

- Four cadences; only **Every 10 days** has extra helper text.
- `recurringTimingText` explains **first visit vs recurring line** and **cadence effect** (post `eeed65e`) — strong **trust** improvement.

**Gaps**

- **No** explicit “**more frequent = smaller drift** / **less catch-up**” story — cadence is a **button grid**, not a **preservation gradient**.
- **Weekly vs monthly** not explained as **trade-off** between **visit cost** and **how long messes accumulate** (wording must stay non-judgmental).
- **Savings %** changes with cadence — risk that customer reads **weekly** as “best discount” rather than “**shortest interval**.”

**Believability**

- Mathematically consistent with API; **emotionally** can feel **too good** if user thinks recurring = **identical service**.

**Maintenance-state vs discounted deep clean**

- Current **“Savings”** language **pulls toward discounted deep clean**. Prefer future copy: **“Maintenance visit (typical effort vs opening)”** or **“Recurring visit reflects shorter maintenance labor.”**

---

## 6. Duration / crew explainability review

**Before team selection (current)**

- **“Estimated labor effort”** + minute/hour formatting — **good** direction; still **no** definition of **labor** (person-hours vs wall-clock).
- **Recurring labor effort** row uses same formatter — **good**, but **no** statement that it assumes **stabilized** maintenance.

**After team selection (current)**

- Slot cards show **arrival window**, not **job duration**.
- **No** explicit “crew of N” or “parallel cleaning” in team cards.

**Parallel labor / wall-clock**

- **Not explained.** Customer may think **4 hr labor** = **one cleaner for four hours** on the clock — **false** when multiple pros compress wall-clock.

**Larger homes**

- No copy explaining **complexity** (layout, pets, surfaces) can dominate **sqft scaling** — leads to **“algorithm doesn’t understand my house.”**

**Dangerous pseudo-precision**

- Any **single** minute figure before crew assignment can feel **definitive** — mitigated partially by **labor effort** wording; still benefits from **“planning-range”** language in high-uncertainty bands.

---

## 7. Confidence-language review

**Labels**

- **Section:** “Quote clarity” — **good** frame.
- **Row:** “How sure we are: **N%**” — **conflicts** with “clarity” framing; **percentage** invites **probabilistic price** reading.

**Bands**

- **Special attention:** “may require a more customized final plan” — **good** (planning), but adjacent **%** can still feel like **model doubt**.

**Local fallback**

- Fixed **low** confidence in local funnel — without loud **“offline estimate”** framing, reads as **weak belief**.

**Recommendations**

- Prefer **ordinal** over **percent** for customer-facing: e.g. **“Planning clarity: High / Moderate / Needs tailoring”** or keep **%** only in **advanced** disclosure.
- If **%** stays, pair with **definition**: **“Reflects how predictable the scope is from your answers — not a guarantee the final price won’t adjust after walkthrough.”** (Tune legally/ops-approved.)

---

## 8. Most dangerous customer interpretations

1. **“The recurring price is the real price and the first visit is a rip-off.”** (Anchor inversion)
2. **“Recurring is the same deep clean with a coupon.”** (Discount framing from **Savings %**)
3. **“If I go monthly I save the most money.”** (Optimizes **%** not **home drift**)
4. **“The app promises this will take exactly X hours.”** (**Labor effort** still looks like a promise)
5. **“Confidence 60% means they’ll change the price 40% of the time.”** (**Percent** misuse)
6. **“Picking one time locked my whole recurring life.”** (Schedule subcopy)
7. **“Visit 1/2/3 prices are exact.”** (Client-side split presentation)

---

## 9. Recommended sequencing changes (design — future build)

1. **Lead with economics type:** show **“Opening visit (first clean)”** **before** any **maintenance** numbers on recurring path.
2. **Split cards:** **Card A — First visit**; **Card B — Recurring maintenance** (even if data loads together).
3. **Move “Savings”** to **after** a **one-sentence maintenance definition**, or rename to **non-promotional** language.
4. **Schedule:** replace “full reset plan **and** recurring schedule automatically” with **first-visit scheduling** + **recurring plan starts after stabilization** (exact wording TBD with ops).
5. **Three-visit breakdown:** label as **“Illustrative split”** if not API-authoritative.
6. **Summary card “Visit type”:** align language with **first-time + recurring** when on that path.
7. **Progressive disclosure:** **Cadence** helper text expandable — **“What cadence changes”** vs **“What it doesn’t change.”**

---

## 10. Recommended wording changes (design — future build)

- **“Savings”** → e.g. **“Maintenance vs opening (same rate model)”** or **“Less labor than opening visit”** + optional **tooltip** with **non-jargon** explanation.
- **“Discount %”** → **“Recurring labor as a share of opening labor”** or drop **percent** for mass-market.
- **“Price:”** → **“First visit (opening):”** on recurring path in main block.
- **“How sure we are”** → **“Scope predictability”** / **“Planning clarity (model)”** + shorten or drop **%**.
- **Schedule** subhead → separate **first arrival** from **recurring cadence start**; avoid “automatically” without **what** is automatic.
- **Team cards** (optional later): **“Crew size affects how long we’re in your home, not just total labor.”**

---

## 11. Ideal customer mental model (target)

After the funnel, a customer should **mostly** hold:

1. **First clean ≠ recurring** — different **amount of work**, not a sleight-of-hand discount.
2. **Maintenance reduces future labor** because the home **doesn’t fully re-dirty** between visits at the same **rate** as a long gap.
3. **Cadence** is about **how much drift** you tolerate — **more visits = less catch-up**, not “more coupons.”
4. **Team size** affects **how long we’re on-site**, not necessarily **total professional labor**.
5. **Labor effort ≠ one person’s stopwatch time.**
6. **Layout/pets/details** can matter **more than raw size.**
7. **Predictability improves** after the **first cycle** — stabilization is **real**.

**Explicit vs implicit**

- **Explicit:** (1)(2)(3) in **plain language** near prices.
- **Implicit:** minute ratio math, cadence coefficient tables.
- **Too technical for primary UI:** hard caps, load JSON, estimator reconciliation — **keep for internal / support**.

---

## 12. Trust-boundary recommendations

- **Never** imply recurring rows are **independent market prices** if they are **minute-proportional** to first clean — either **explain proportionally** or **silence discount language**.
- **Never** show **client-fabricated** three-visit **dollars** without **“illustrative”** if API doesn’t return per-visit prices.
- **Always** separate **“preview”** from **“promise”** where deposit / scheduling differ.
- **Align** sidebar **visit type** with path to avoid **“one-time”** cognitive dissonance on recurring.
- **Gate** numeric **confidence** behind **definition** or replace with **ordinal clarity**.

---

## 13. Explicit warning against over-explaining operations

Do **not** dump **ratio tables**, **cap logic**, or **reconciliation** into the booking funnel. The goal is a **coherent story**: **recovery → maintenance → preservation**.

Too much operational detail **increases** anxiety (“Are they cutting corners?”) and **invites** shopping the algorithm.

Use **one** strong analogy max: e.g. **“First visit pulls the home forward; recurring visits keep it there.”** Then **stop**.

---

## Phase 9 — Report (summary)

| # | Answer |
|---|--------|
| 1 | **Branch:** `feat/recurring-ux-price-explainability-review-v1` (baseline `eeed65e`); **commit:** *(pending — doc commit follows)* |
| 2 | **File:** `docs/engineering/RECURRING_UX_PRICE_EXPLAINABILITY_REVIEW_V1.md` |
| 3 | **Biggest sticker-shock source:** **Large “Price” / first-visit figure** adjacent to **much lower recurring** + **“Savings %”** (reads as promo, not minute-shaped maintenance). |
| 4 | **Biggest recurring misunderstanding:** **“Same clean, discounted”** instead of **“less recovery labor when the home stays maintained.”** |
| 5 | **Most dangerous wording:** **“Savings: … / …%”** paired with **first visit price** (discount framing of a **ratio**). Runner-up: schedule **“full reset plan and recurring schedule automatically.”** |
| 6 | **Most important sequencing correction:** Present **opening economics** as **Card/section A** and **maintenance/recurring** as **B** before showing **comparative** numbers; soften **single “Price:”** dominance. |
| 7 | **Confidence % visible?** **Prefer not** as primary; if retained, **must** be defined as **scope predictability**, not **price accuracy**. |
| 8 | **Labor effort pre-team sufficient?** **Improved but incomplete** — add **short** gloss: **labor ≠ wall-clock** and **crew affects on-site time** (post-team). |
| 9 | **Most important mental-model correction:** **Recurring is maintenance-state preservation, not couponed deep cleaning.** |
| 10 | **Recommended next move:** **BUILD DROP — RECURRING UX COPY REFACTOR V1** (copy/layout sequencing only, no estimator rewrites) **or** **ANALYSIS DROP — ESTIMATOR TRUST / CUSTOMER PSYCHOLOGY REVIEW** if you want qualitative research before touching copy. |

---

*End of review.*
