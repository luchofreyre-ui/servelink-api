# Nu Standard — Experience Consolidation + Trust Hardening Critical Path (v1)

**Document type:** Definitive **experiential + operational usability** launch-completion blueprint—derived from prior audits, not new invention.  
**Hard scope:** Launch-facing UX priorities, trust hardening, operator usability closure, sequencing—**no** speculative products, moodboards, or AI features.

**Upstream artifacts (mandatory inputs):**

| Artifact | Path |
|----------|------|
| Completion census | [`NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md`](./NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md) |
| Critical path execution | [`NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md`](./NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md) |
| Experience & portal readiness | [`NU_STANDARD_EXPERIENCE_PORTAL_READINESS_AUDIT_V1.md`](./NU_STANDARD_EXPERIENCE_PORTAL_READINESS_AUDIT_V1.md) |
| OA merge proof / governance alignment | [`OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md`](./OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md) |
| Primitive registry & Phase 0 | [`docs/governance/ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md`](../governance/ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md), [`docs/governance/PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md`](../governance/PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md) |

**Validation discipline:** Surfaces cited below match repo routes/components identified in the Experience audit; **no** fabricated portal capabilities; production runtime **not** asserted.

---

## Phase 0 — Audit reconciliation

### Proven backend / governance capability (merged truth)

- Large Nest API surface, migrations, PR CI (fresh DB + Playwright verify tracks), cron **env-gated** patterns, ledger primitives (`CronRunLedger`, post-merge **`OperationalAnalyticsRefreshRun`** per OA governance lane).
- Deploy governance: **merged ≠ deployed**; env **`ENABLE_*`** matrix is operational truth not visible from repo alone (Critical Path).

### Proven frontend depth (selected areas)

- Public marketing + booking funnel: substantial implementation (`BookingFlowClient.tsx`, five-step `bookingFlowData.ts`, confirmation route).
- Admin ops stack: command center, backlog, many destinations (`AdminOperationsCommandCenter`, `SystemAccessLayer`, `(app-shell)/layout.tsx` nav).

### Unproven or uneven **user-facing** quality

- **Mobile / accessibility:** not systematically validated in Experience audit (marked UNKNOWN).
- **Live production parity:** not asserted (Census / Critical Path).
- **Portal polish vs intake polish:** Experience audit concludes **backend/booking sophistication exceeds customer/FO portal polish**.

### Portal reality (customer)

Routes under `(customer)/`: **`/customer`**, **`/customer/auth`**, **`/customer/bookings/[id]`** only—no settings/recurring/reschedule routes evidenced.

### Branding / coherence fractures (experiential audit)

- **`Servelink`** in authenticated shell nav + confirmation page metadata vs **Nu Standard / precision-cleaning** narrative on public homepage—documented inconsistency.

### Scaffolded / thin surfaces

- Customer list/detail **utilitarian**; FO detail uses **`window.alert`** on errors; admin breadth **high cognitive load**.

---

## Phase 1 — Experience completion inventory

### 1. Public marketing / site trust

| Work item | Evidence | Gap type |
|-----------|----------|----------|
| Unify customer-facing product name across metadata, shell, emails (where applicable) | `book/confirmation/page.tsx` metadata title “Servelink”; homepage “Cleaning Solution System”; shell “Servelink” (`(app-shell)/layout.tsx`) | BRANDING / TRUST |
| Audit internal-language leakage on public surfaces | Deep booking copy modules—needs consistency pass vs marketing voice | CONTENT |
| Homepage / CTA clarity | Homepage CTAs exist—**maintain** | LOW debt |
| Loading / empty / error states | Booking `Suspense` fallbacks—encyclopedia empty/stub risk **UNKNOWN** without crawl | TRUST / CONTENT |
| Conversion friction | Long funnel (`BookingFlowClient`)—may be intentional luxury; needs **mobile + skeptic** session validation | UX / MOBILE |

### 2. Booking experience

| Work item | Evidence | Gap type |
|-----------|----------|----------|
| Confirmation + post-book trust copy aligned to Nu Standard | Metadata/branding drift | BRANDING / TRUST |
| Payment reassurance audit | Many deposit strings in booking surface—verify ordering vs cognitive load | UX / TRUST |
| Recurring path clarity | Recurring imports in `BookingFlowClient`—customer comprehension **unverified** | UX / CONTENT |
| Mobile hardening pass | Not exercised in Experience audit | MOBILE |

### 3. Customer portal completion

| Work item | Evidence | Backend hint |
|-----------|----------|--------------|
| Replace ID-first presentation with human summary (date, service label, address snippet) | `customer/page.tsx`, `CustomerBookingDetailPageClient.tsx` show `booking.id` prominently | Likely data on `BookingRecord`; **frontend-only** presentation |
| Expose reschedule/cancel **if** APIs exist | No customer routes found | **FUNCTIONALITY or UX** — requires Phase 0 API inspection before build |
| Profile/settings | No `/customer/settings` | Likely **missing surface**; backend scope UNKNOWN without audit |
| Recurring self-service UI | Not routed | Same |
| Communication visibility | Shell has `/notifications`—customer value **unclear** without review | UX |

### 4. Franchise / operator / admin usability

| Work item | Evidence | Gap type |
|-----------|----------|----------|
| Replace FO **`window.alert`** with inline error | `fo/bookings/[id]/page.tsx` | UX / OPERATIONAL |
| Admin IA pass: reduce simultaneous cognitive domains | Dense nav + system cards + ops backlog | WORKFLOW / OPERATIONAL |
| Align operational dashboards with “staleness ≠ broken” mental model | Census + warehouse governance + OA panels | GOVERNANCE / OPERATIONAL |
| Replay/audit panels usability | OA audit UI merged—operator training + labeling | OPERATIONAL |

### 5. Visual / system coherence

| Work item | Evidence |
|-----------|----------|
| Decision on **`DevRoleSwitcher`** in production shell | `(app-shell)/layout.tsx` always includes compact A/F/C links |
| Single source of truth for **browser title / OG / schema org** naming |
| Terminology pass: internal enums vs customer copy |

---

## Phase 2 — Experience criticality classification

**Severity:** CRITICAL | HIGH | MEDIUM | LOW  
**Type:** TRUST | UX | VISUAL | OPERATIONAL | WORKFLOW | MOBILE | BRANDING | CONTENT | FUNCTIONALITY | GOVERNANCE  
**Classification:** MUST_FIX_PRE_LAUNCH | SHOULD_FIX_PRE_LAUNCH | SAFE_POST_LAUNCH | GOVERNED_BUT_DISABLED | REMOVE_SIMPLIFY_INSTEAD

### Matrix

| ID | Issue | Sev | Type | Class | Evidence surfaces | User/operator struggle | Backend exists? | Frontend-only? | Risk |
|----|-------|-----|------|-------|---------------------|------------------------|-----------------|----------------|------|
| X1 | Mixed **Servelink / Nu Standard** branding | CRITICAL | BRANDING + TRUST | MUST_FIX_PRE_LAUNCH | Homepage vs `book/confirmation` metadata vs app shell `layout.tsx` | “Who am I paying?” | N/A | Mostly **yes** (copy/meta/chrome) | Credibility / chargeback confusion |
| X2 | Customer portal **ID-heavy** UI | HIGH | UX + TRUST | MUST_FIX_PRE_LAUNCH | `customer/page.tsx`, customer booking detail | Feels internal / scam-adjacent | Likely | **Yes** (presentation) | Abandonment / support calls |
| X3 | Missing **lifecycle self-service** (reschedule/cancel/account) | HIGH | FUNCTIONALITY + UX | SHOULD_FIX_PRE_LAUNCH *(confirm APIs)* | No routes under `(customer)/` beyond list/detail/auth | Ops dependency | **UNKNOWN** | Mixed | SLA / staffing |
| X4 | FO errors via **`alert()`** | MEDIUM–HIGH | UX + OPERATIONAL | SHOULD_FIX_PRE_LAUNCH | `fo/bookings/[id]/page.tsx` | Trust drop; slows FO | N/A | **Yes** | Execution latency |
| X5 | Admin **surface overload** | HIGH | WORKFLOW + OPERATIONAL | SHOULD_FIX_PRE_LAUNCH | Shell nav + `SystemAccessLayer` + ops pages | Training burden; mistakes | Yes | IA / progressive disclosure | Wrong dispatch / missed anomalies |
| X6 | Long booking funnel cognitive load | MEDIUM | UX | REMOVE_SIMPLIFY_INSTEAD *or* SAFE_POST_LAUNCH | `BookingFlowClient` size | Drop-off | Yes | UX testing guided | Conversion |
| X7 | Mobile parity unvalidated | HIGH | MOBILE | SHOULD_FIX_PRE_LAUNCH | — | Silent conversion loss | — | Test + fix | Revenue |
| X8 | Analytics staleness misread as live failure | MEDIUM | GOVERNANCE + OPERATIONAL | SHOULD_FIX_PRE_LAUNCH | Census + warehouse governance | Bad ops decisions | Docs exist | UX labeling on dashboards | Operational error |
| X9 | **`DevRoleSwitcher`** in shell | MEDIUM | GOVERNANCE + VISUAL | SHOULD_FIX_PRE_LAUNCH or REMOVE | `layout.tsx` | Unprofessional; wrong-role demos | — | Gate behind dev env | Trust |

**GOVERNED_BUT_DISABLED (experience angle):** Cron automation remains off—**correct** for launch narrative if operators understand **manual refresh / manual dispatch cadence** (Critical Path); UX must **say what’s manual vs automatic**.

---

## Phase 3 — Experience consolidation plan (sequencing)

**Rules:** Trust > sophistication; clarity > density; operator usability > engineering elegance; simplify before adding.

### 1. Implementation order (experience-facing)

| Seq | Track | Action |
|-----|-------|--------|
| E-I1 | Branding cleanup | Single customer-facing brand string table for metadata, shell customer-visible chrome, confirmation titles |
| E-I2 | Customer portal presentation | Human-readable booking cards/detail headers; hide or secondary-place raw IDs |
| E-I3 | FO error UX | Inline errors + retry pattern; remove `alert()` |
| E-I4 | Lifecycle gaps | Phase 0 API inventory: if reschedule/cancel endpoints exist, wire minimal UI; if not, document **support path** in-portal |
| E-I5 | Admin IA | Role-based default landing; collapse rare links; onboarding checklist |

### 2. Simplification order

| Seq | Action |
|-----|--------|
| S1 | Reduce simultaneous nav targets for **FO** (single primary queue + detail) |
| S2 | Progressive disclosure for admin “systems” cards—don’t show everything on day one |
| S3 | Evaluate funnel steps only after mobile baseline passes—avoid reordering without data |

### 3. Trust-hardening order

| Seq | Action |
|-----|--------|
| T1 | Brand/metadata coherence (X1) |
| T2 | Portal humanization (X2) |
| T3 | Payment/deposit copy consistency check at confirmation boundary |
| T4 | Explicit “what happens next” strings on confirmation + customer detail |

### 4. Portal-completion order

| Seq | Action |
|-----|--------|
| P1 | Presentation fixes (E-I2) |
| P2 | Notifications/help link if full settings absent |
| P3 | Lifecycle features pending API truth (X3) |

### 5. Operator-UX order

| Seq | Action |
|-----|--------|
| O1 | FO alert removal (X4) |
| O2 | Stale vs live labeling on ops/analytics surfaces (X8) |
| O3 | Admin IA (E-I5) |

### 6. Branding-cleanup order

| Seq | Action |
|-----|--------|
| B1 | Page titles + OG tags audit (`book/confirmation`, customer pages, shell) |
| B2 | Remove/gate dev chrome (X9) |

### 7. Mobile-hardening order

| Seq | Action |
|-----|--------|
| M1 | Device matrix on `/`, `/book`, `/book/confirmation`, `/customer/*`, FO detail |
| M2 | Touch targets on FO primary actions |
| M3 | Booking funnel step regression via Playwright mobile project if available |

**Cross-cutting with Critical Path (non-UX):** Deploy parity + env matrix + cron policy remain **launch operational truth**—experience work **does not substitute** for them (Critical Path CP-1/CP-2).

---

## Phase 4 — “Feels unfinished” analysis (honest)

| Signal | Why it reads “internal / prototype” |
|--------|-------------------------------------|
| Raw **booking IDs** in customer UI | B2B tooling convention, not consumer polish |
| **Servelink** in chrome while marketing sells Nu Standard | Brand schizophrenia |
| **`window.alert`** on FO errors | 2005-era web pattern |
| **`DevRoleSwitcher`** links | Engineering convenience leaked into shell |
| Customer portal **thin** vs booking funnel **thick** | “We nailed acquisition, under-built retention/self-service” |
| Admin **dense** nav | Power tool for insiders—intimidating for new ops lead |
| Missing explicit **support escalation** path in customer portal | User dead-end risk |
| Potential **mobile** issues unvalidated | Silent quality collapse |

---

## Phase 5 — True launch experience definition

**Nu Standard is experientially launch-ready when:**

| Threshold | Definition |
|-----------|------------|
| **Customer trust** | Single coherent brand in-browser; no internal naming leakage on customer paths; payment states explained in plain language |
| **Booking confidence** | Skeptical-user test passes on happy path + payment failure path + recovery messaging (live or staging) |
| **Operator usability** | FO completes primary transitions **without** blocking alerts; statuses understandable without engineer glossary |
| **Admin independence** | Novice ops can find **dispatch backlog + anomalies + booking detail** within minutes (IA), acknowledging Census gaps for cron visibility |
| **Mobile quality** | Core funnel + portals usable on small viewport without broken layouts—**evidence required** |
| **Branding consistency** | Metadata + shell + confirmation aligned |
| **Support / escalation** | Documented path from customer portal (link, chat policy, or phone)—even if minimal |
| **Portal completeness** | **Minimum:** human booking summary + payment continuation + clear “contact us”—**Stretch:** reschedule/cancel/settings per API reality |

---

## Phase 6 — Final execution truth

1. **Highest-leverage UX fixes:** Brand/metadata coherence (**X1**); portal humanization (**X2**); FO **`alert` removal** (**X4**).  
2. **Launch-blocking experience gaps:** **X1** (trust/credibility); **X2** (consumer credibility); **X7** until proven OK or fixed (mobile).  
3. **Post-launch-safe:** Encyclopedia crawl polish; advanced admin personalization; funnel simplification experiments (**X6**) once baseline metrics exist.  
4. **Biggest trust risks:** Naming drift; internal IDs; payment edge confusion.  
5. **Biggest conversion risks:** Mobile breakage; funnel length without reassurance checkpoints.  
6. **Biggest operator-usability risks:** Admin overload; stale-dashboard misread.  
7. **Biggest branding/coherence risks:** Servelink leakage; inconsistent titles.  
8. **Most overbuilt vs launch need:** Optional: encyclopedia breadth vs thin portal—**avoid adding** customer features before portal baseline.  
9. **Most underbuilt vs customer expectation:** Self-service lifecycle (**X3**), account/settings.  
10. **Fastest path to “feels complete and trustworthy”:** **T1→T2→T4** (trust hardening) + **O1** (FO) + **device pass M1**—parallel **Critical Path** operational gates (deploy/env) in program management, not UX substitution.

---

## Appendix — Portal capability map (current, evidenced)

| Capability | Customer UI | Notes |
|------------|-------------|-------|
| Auth | `/customer/auth` | Exists |
| Booking list | `/customer` | Exists |
| Booking detail + payment link | `/customer/bookings/[id]` | Exists |
| Profile/settings | — | **Not found** |
| Recurring manage | — | **Not found** |
| Reschedule/cancel | — | **Not found** |

---

## Validation checklist

- [x] Routes aligned with Experience audit file inventory.  
- [x] No invented APIs—**X3** flagged as requiring API confirmation.  
- [x] Runtime/production claims avoided.  
- [x] Governance/critical-path cross-links preserved.

**STOP** — blueprint document only; no implementation, merge, deploy, or cron changes performed.
