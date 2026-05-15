# Nu Standard — Experience & Portal Operational Readiness Audit (v1)

**Document type:** Experiential / operational usability truth (human journey), complementary to backend-focused audits.  
**Inputs:** [`NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md`](./NU_STANDARD_SERVE_LINK_COMPLETION_CENSUS_RUNTIME_AUDIT_V1.md), [`NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md`](./NU_STANDARD_CRITICAL_PATH_EXECUTION_AUDIT_V1.md).  
**Method:** Route + component inspection (`apps/web`), shell/navigation review, booking funnel structure (`BookingFlowClient`, `bookingFlowData`), portal pages (customer / FO / admin). **Live browser exercise:** not completed in this session (local `http://127.0.0.1:3000` not confirmed healthy); items requiring pixels-on-screen are marked **UNKNOWN** unless inferable from code.

---

## Phase 0 — Environment & access audit

### Customer-facing surfaces (evidence: `apps/web/src/app`)

| Area | Routes / entry | Notes |
|------|----------------|-------|
| Public marketing | `(public)/page.tsx` → `PrecisionLuxuryHomepage` | Strong structured homepage + schema.org |
| Encyclopedia / guides | `(public)/encyclopedia/**`, `guides/**`, `surfaces/**`, etc. | Large content surface |
| Booking | `/book`, `/book/confirmation`, `/book/direction-received` | Primary conversion |
| Auth (public) | `admin/auth/page.tsx` | Admin login surface |
| SEO copy | `seo/bookingCopy`, marketing components | Extensive |

### Authenticated shells (`(app-shell)`)

| Role | Gate | Primary routes |
|------|------|----------------|
| Customer | `AuthRoleGate role="customer"` | `/customer`, `/customer/auth`, `/customer/bookings/[id]` |
| FO | `AuthRoleGate role="fo"` | `/fo`, `/fo/auth`, `/fo/bookings/[id]` |
| Admin | `AuthRoleGate role="admin"` | `/admin/**` (many subroutes); `/admin` redirects to `/admin/ops` |

Shell chrome: `(app-shell)/layout.tsx` — global nav links (Servelink, FO, Customer, Admin, Ops, Anomalies, Activity, Exceptions, System tests, Notifications), search, sign-out, notification bell, **`DevRoleSwitcher`** (always renders compact A/F/C links — see `DevRoleSwitcher.tsx`).

### What can be tested today (repo truth)

| Mode | Feasibility |
|------|-------------|
| **CI / Playwright** | `package.json` defines `verify:local-*`, regression suites — **strong automated coverage** when stack + seeds running |
| **Manual local** | Requires API + web + DB per `PR CI` parity — **not verified running** in this audit pass |
| **Production / staging** | **Out of scope** — no URLs exercised |

### Blocked / inaccessible without credentials

- Customer / FO / admin portals require JWT + role (`AuthRoleGate`).
- Meaningful booking funnel requires API (`NEXT_PUBLIC_API_BASE_URL`) + Stripe configuration.

---

## Phase 1 — Public experience audit

| Area | Classification | Evidence | User risk |
|------|----------------|----------|-----------|
| Homepage coherence | **READY** (code-level) | `PrecisionLuxuryHomepage.tsx`: hero, trust points, services CTA, encyclopedia search, `/book` + `/services` buttons | Low |
| Brand / naming coherence | **PARTIAL / CONFUSING** | Public site: “Nu Standard” / precision-cleaning narrative; booking confirmation metadata title **“Servelink”** (`book/confirmation/page.tsx`); app shell nav brand **“Servelink”** (`layout.tsx`) | **Trust / credibility** — customer sees mixed naming |
| Booking CTA clarity | **READY** | Homepage primary CTA → `/book` | Low |
| Mobile / visual | **UNKNOWN** | Responsive classes present (`sm:`, `md:`); no device matrix run | Conversion risk if breakpoints weak |
| Loading / empty states | **READY / PARTIAL** | Booking route `Suspense` fallback (`book/page.tsx`); encyclopedia breadth — stub risk on thin categories **UNKNOWN** without crawl | — |
| SEO / structured data | **READY** | JSON-LD blocks on homepage | Low |
| Dead-end risk | **PARTIAL** | Deep content graph; mis-linked hub pages **UNKNOWN** without crawl (`validate:encyclopedia-index`, audit scripts exist in `package.json`) | MEDIUM if broken links in prod |

### First-time / skeptical / repeat flows (inferred)

| Flow | Assessment |
|------|------------|
| First-time visitor | Homepage explains system + search + book — **strong** |
| Skeptical customer | Trust ribbon + deposit copy modules in `BookingFlowClient` imports suggest **investment in reassurance**; **cannot verify tone balance** without UI pass |
| Repeat customer | No obvious “welcome back” personalization in public shell — **UNKNOWN** |

---

## Phase 2 — Booking flow & customer journey

**Structural funnel:** five steps (`bookingFlowData.ts`): Service → Home Details → Service location → Review → **Choose a time** (schedule last).

| Dimension | Classification | Evidence | Friction / trust notes |
|-----------|----------------|----------|------------------------|
| Estimate / intake depth | **READY** (feature-rich) | `BookingFlowClient.tsx` (~3k+ LOC), estimate hooks, deep-clean paths, recurring taxonomy imports | **HIGH cognitive load** — appropriate for luxury positioning but **drop-off risk** for impatient users |
| Slot / hold | **PARTIAL** (code) | `postPublicBookingHold`, stale slot error set `PUBLIC_BOOKING_STALE_SLOT_CODES` | Recovery copy modules exist — **trust-positive** if surfaced well |
| Deposit / Stripe | **PARTIAL → READY** | `DepositPaymentElement`, deposit phases (`ReviewPaymentPhase`), extensive copy constants | Strong handling surface; **live card UX UNKNOWN** |
| Confirmation | **READY** | Dedicated `/book/confirmation` + `BookingConfirmationClient` | Metadata branding mismatch (see Phase 1) |
| Recovery | **READY** (intent) | Recovery hints in copy imports (`BOOKING_REVIEW_SUBMIT_RECOVERY_*`) | Good faith engineering |
| Recurring | **PARTIAL** | `recurring_auth_gate`, `buildRecurringInterestPayloadForDirectionIntake`, service paths | Sophisticated backend coupling; **customer clarity UNKNOWN** without UI review |
| Errors / validation | **PARTIAL** | API errors typed (`PublicBookingApiError`, etc.) | Mis-handled edge cases **UNKNOWN** |

### Where a real customer might hesitate / abandon / need human support

| Moment | Issue type | Severity |
|--------|------------|----------|
| Long multi-step intake before price certainty | **Conversion / cognitive** | HIGH |
| Schedule-after-review ordering | May feel unusual vs consumer norms | MEDIUM |
| Deposit finalization timeout states | **Trust** if messaging unclear | MEDIUM–HIGH |
| Any tech failure showing raw IDs / errors | **Trust** | HIGH |

---

## Phase 3 — Customer portal audit

**Routes:** `/customer`, `/customer/auth`, `/customer/bookings/[id]` only (no `/customer/settings`, `/customer/recurring`, etc.).

| Capability | Status | Evidence |
|------------|--------|----------|
| See booking list | **operationally usable** (minimal) | `customer/page.tsx` lists bookings via `listBookings` |
| Booking detail + payment continue | **partial** | `CustomerBookingDetailPageClient.tsx`: payment status, Stripe checkout link, failure copy |
| Profile / password / preferences | **missing / hidden** | No routes found under `(customer)/` |
| Recurring self-service | **missing** (UI) | Not exposed as customer routes |
| Cancellation / reschedule | **not evident** in customer UI files reviewed | Likely **admin/ops** dependency |
| Notifications | Bell in shell — customer-specific inbox **UNKNOWN** | `/notifications` exists in shell |
| Visual polish | **scaffolded / utilitarian** | Plain typography, “Customer-safe view” subtitle — reads **internal** vs marketing site polish |
| Empty state | **minimal** | “No bookings yet.” |
| Trust | **LOW_TRUST risk | Displays **`booking.id`** as primary label (`customer/page.tsx`, detail page) — consumers expect dates/service labels, not opaque IDs |

**Portal verdict:** **partial / scaffolded** — sufficient for **authenticated smoke tests** and payment continuation, **not** a full self-service lifecycle portal.

---

## Phase 4 — Franchise / operator / admin experience

### FO portal

| Aspect | Classification | Evidence |
|--------|----------------|----------|
| Work queue | **partial** | `fo/page.tsx`: list length + links |
| Booking detail + transitions | **partial** | `fo/bookings/[id]/page.tsx`: Start / Complete buttons, `transitionBooking`, **`window.alert`** on failure |
| Ops notes | Partial sections (`OpsCustomerTeamPrepSection`) | — |
| UX polish | **utilitarian** | Same ID-heavy pattern |
| Mobile viability | **UNKNOWN** | Simple stacks — likely OK |

**Operator friction:** `window.alert` for errors is **LOW_TRUST / high friction** vs inline error UI.

### Admin

| Aspect | Classification | Evidence |
|--------|----------------|----------|
| Entry | **READY** | `/admin` → `/admin/ops` |
| Ops command center | **complex** | `AdminOperationsCommandCenter`, `OpsSystemBacklog`, server-loaded `loadAdminOpsPageData` |
| Discoverability | **partial** | `SystemAccessLayer.tsx` cards (System Tests, Authority, Dispatch, Knowledge) + dense top nav |
| Cognitive load | **HIGH** | Many parallel systems exposed (analytics, authority, dispatch, tests) |
| Non-engineer viability | **PARTIAL / OPERATIONAL risk** | Powerful surfaces assume **domain literacy**; aligns with census/critical-path **admin independence gaps** (cron visibility, etc.) |
| Mobile / tablet | **UNKNOWN** | Tables-heavy admin UIs historically poor — **not validated** |

### Shell-level issues

| Issue | Type |
|-------|------|
| **Servelink** nav + dev role shortcuts visible | **Trust / polish / governance** (role shortcuts inappropriate for external demos) |
| No role-specific IA separation beyond gates | **Navigation friction** |

---

## Phase 5 — Experience completion gap map

Only gaps tied to usability, trust, conversion, or operational dependency.

| ID | Subsystem | Evidence | User / operator problem | Impact | Severity | Backend exists? | Issue tags |
|----|-----------|----------|-------------------------|--------|----------|-----------------|------------|
| E1 | Branding coherence | Homepage vs confirmation metadata vs shell (`Servelink` vs Nu Standard narrative) | Customer doubts legitimacy | Trust | **HIGH** | N/A | TRUST, CONTENT |
| E2 | Customer portal depth | Only list + detail routes | No self-service reschedule/cancel/recurring/account | Ops load | **HIGH** | Partial (API likely richer) | MISSING_FUNCTIONALITY, OPERATIONAL |
| E3 | Customer portal presentation | Raw booking IDs prominent | Feels “internal tool” not consumer product | Trust / conversion | **HIGH** | UX_ONLY | UX_ONLY, TRUST |
| E4 | FO error UX | `window.alert` on transition failure | Operators perceive instability | Operational friction | **MEDIUM** | — | UX_ONLY, OPERATIONAL |
| E5 | Admin complexity | Many nav destinations + intelligence surfaces | Overwhelm; training burden | Ops dependency | **HIGH** | Backend mature per audits | WORKFLOW, OPERATIONAL |
| E6 | Dev role switcher in shell | `DevRoleSwitcher` always on | Unprofessional in prod-facing demos; accidental role hopping | Trust / governance | **MEDIUM** | — | GOVERNANCE, VISUAL |
| E7 | Mobile parity | Not exercised | Booking/marketing may regress on small screens | Conversion | **UNKNOWN→MEDIUM** | — | MOBILE |
| E8 | Stale analytics interpretation | Census: warehouse can lag | Ops misread dashboards as live truth | Operational error | **MEDIUM** | Governance docs exist | OPERATIONAL, GOVERNANCE |

---

## Phase 6 — Experience completion truth

1. **Public website commercially credible (code + content architecture)?** **Largely yes** for a premium positioning — structured homepage, CTAs, encyclopedia — **marred by cross-surface naming inconsistency** (E1).  
2. **Booking flow trustworthy?** **Engineering investment is deep** (states, recovery copy, payments) — **needs live UX verification**; **metadata/branding drift** hurts trust.  
3. **Customer portal operationally real or scaffolded?** **Scaffolded / partial** — list + detail + payment continuation; **not** full lifecycle self-service.  
4. **FO experience realistically usable?** **Minimal viable** for queue + status transitions — **error UX weak** (E4).  
5. **Biggest conversion risks:** Intake length before commitment; **any** broken mobile layout (**unverified**); brand inconsistency at confirmation.  
6. **Biggest trust risks:** Internal-looking portal IDs; **Servelink vs Nu Standard** mixing; alert()-based errors for FO.  
7. **Biggest operational UX risks:** Admin surface area vs operator training; customer portal pushes work to admins.  
8. **Most dangerous hidden usability failures:** Operators interpreting **stale analytics** as live ops (governance doc warns — experience design must reinforce).  
9. **Highest-leverage UX fixes (no implementation here):** Unify customer-facing naming/metadata; replace internal IDs with human summaries in portals; remove/gate dev chrome for production builds; inline FO errors; customer-facing reschedule/cancel entry points **where backend allows**.  
10. **Experience-critical launch blockers:** **E1 (branding coherence)** + **E3/E2 (portal credibility & self-service gap)** if Nu Standard promises consumer-grade account management.  
11. **Post-launch:** Encyclopedia crawl hardening; advanced admin polish; optional mobile audit backlog.  
12. **Backend maturity vs frontend maturity?** **Yes — backend + booking funnel sophistication materially exceeds customer/FO portal polish**, consistent with census **INTERNAL_ONLY / PARTIAL** classifications for several operator surfaces.

---

## Appendix A — Journey summary (text)

```
Visitor → Marketing (/ , content) → /book (5-step funnel, deposit) → /book/confirmation
                     ↘ encyclopedia / search

Customer (auth) → /customer (list) → /customer/bookings/:id (detail, payment link)

FO (auth) → /fo (queue) → /fo/bookings/:id (start/complete)

Admin (auth) → /admin/ops (+ deep subsystem graph)
```

---

## Appendix B — Classification legend

| Label | Meaning |
|-------|---------|
| READY | Coherent for intended audience based on code inspection |
| PARTIAL | Works but incomplete or uneven |
| CONFUSING | Likely user misunderstanding |
| LOW_TRUST | Undermines credibility |
| BROKEN | Likely non-functional path (**not claimed without runtime**) |
| STUBBED | Placeholder / minimal |
| UNKNOWN | Requires running UI or prod access |

---

## Validation statement

- Routes and representative components **verified to exist** at paths cited.  
- **No live screenshots** captured (environment not confirmed).  
- Playwright/Vitest suites in repo are the **best automated experiential guardrails** — recommend treating CI green on PR as **necessary but not sufficient** for launch UX sign-off.

**STOP** — experiential audit artifact complete; no product code changes performed.
