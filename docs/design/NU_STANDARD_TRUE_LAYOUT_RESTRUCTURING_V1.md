# Nu Standard True Layout Restructuring V1

Status: design architecture only  
Scope: public Nu Standard web surfaces  
Production impact: none in this drop

## Purpose

The current site has stronger premium copy, cleaner components, and a more consistent visual language than the earlier public experience. It still reads as structurally conventional: most surfaces are organized as a hero, a trust strip, a card grid, and a bottom CTA. That is serviceable, but it does not yet feel authored enough for the approved Nu Standard direction.

This document defines the next layout architecture before implementation. It is intentionally specific so a later Cursor pass can build from it without guessing, while preserving the working booking, knowledge, SEO, and route systems already in production.

## Current System Audit

### Homepage

Current structure:
- `PrecisionLuxuryHomepage` renders a split hero, trust strip, operational row, "How we work" block, three service cards, proof commitments, featured guides, and search CTA.
- It uses `PremiumPageShell`, `PremiumHeroTitle`, `TrustMetricStrip`, `HomepageHeroMedia`, `HomepageServiceMedia`, and `MarketingLinkButton`.

Why it still feels conventional:
- The page is a linear stack of recognizable marketing sections.
- Hero text and media occupy a balanced two-column grid, but the composition is not meaningfully editorial or asymmetric.
- Trust, process, services, proof, and guides are each isolated bands rather than an authored narrative.

What must structurally change:
- Move to an asymmetrical editorial hero where image, headline, service promise, and next action overlap as a single composition.
- Introduce a modular story spine: proof, services, and operating standards should interlock instead of sitting in separate rows.
- Use staggered service previews and anchored narrative blocks instead of equal cards in a conventional grid.

What must be preserved:
- Owner-led accountability positioning.
- Honest real-time estimate language.
- Existing media assets and safe fallback behavior.
- Search and guide access as secondary support, not primary conversion competition.

### Services

Current structure:
- `ServicesHubPage` uses a split intro, shared homepage image, three service cards, and a bottom trust strip.
- Service detail pages use `ServicePageTemplate`.

Why it still feels conventional:
- It behaves like a basic service catalog with equal cards and direct CTAs.
- The intro image does not deeply explain the service model.
- Comparison logic is implicit instead of helping visitors choose.

What must structurally change:
- Use a large editorial intro panel with a service decision map.
- Stagger service cards by intent and complexity rather than showing equal tiles.
- Add a comparison path that answers "which clean is right for me?" before the booking CTA.

What must be preserved:
- Three core public services and their existing hrefs.
- Service badge taxonomy.
- Booking entry points for each service.
- Owner-led quality strip.

### Booking Start

Current structure:
- `/book/page.tsx` wraps `BookingFlowClient` in `Suspense`.
- `BookingFlowClient` renders a premium hero, stepper, trust strip, service cards, summary rail, and active step content.
- Key route markers are client-rendered after hydration.

Why it still feels conventional:
- The start page is a hero plus form wizard.
- The reassurance copy is present, but the layout still frames the booking flow as a transaction rather than a guided concierge intake.
- The stepper is functional but not yet an authored command surface.

What must structurally change:
- Reframe booking start as a premium guided intake with a visible "what happens next" rail.
- Place anxiety-reducing proof and estimate behavior beside the active task, not only above it.
- Make the service cards feel like guided choices rather than product cards.

What must be preserved:
- Current booking state machine, URL state, estimator inputs, public API contracts, and deposit architecture.
- No-pressure quote positioning.
- Real-time estimate language.
- Accessibility and no horizontal overflow behavior.

### Booking Estimate / Review

Current structure:
- `BookingStepReview` renders a review card, readiness banner, trust ribbon, service details, estimate section, recurring plan logic, planning notes, contact fields, and schedule handoff.
- `BookingSummaryCard` sits as a secondary rail in the client layout.

Why it still feels conventional:
- Estimate, review, and preparation content are still stacked as form sections.
- The total does not dominate as a premium command center.
- Deposit explanation is present but not architecturally separated as a confidence module.

What must structurally change:
- Create an estimate command center with a dominant total card, breakdown module, owner-led preparation note, and secure deposit module.
- Make "what shaped this estimate" visibly subordinate to the total, not equal to every other section.
- Use a sticky progress/summary rail only when it improves comprehension.

What must be preserved:
- All estimator math and field wiring.
- Contact validation and schedule/deposit flow.
- Recurring opening-vs-maintenance framing.
- Payment and deposit authority boundaries.

### Confirmation

Current structure:
- `BookingConfirmationClient` has neutral re-entry and success states with a success badge, headline, estimate/details cards, next steps, trust strip, and CTAs.

Why it still feels conventional:
- It reads as a standard confirmation stack.
- Booking details, next steps, and support actions are not composed as one completion system.

What must structurally change:
- Build a calm completion page with a large confirmation artifact, details card, next-steps strip, and action row.
- Separate "confirmed visit" from "request received" with distinct visual states.
- Add calendar/support actions only if supported by existing data and routes.

What must be preserved:
- Neutral re-entry behavior.
- Remote booking confirmation fetch.
- Existing booking detail links and session clearing behavior.
- Deposit-paid messaging.

### Guides Landing

Current structure:
- `GuidesLandingExperience` renders breadcrumb, split editorial hero, trust strip, search panel, featured guide cards, more references, and standards strip.

Why it still feels conventional:
- The improved editorial components still resolve into a grid of cards after a hero.
- Featured and secondary guides differ mostly by section title and grid density.

What must structurally change:
- Use one feature card as the primary editorial doorway.
- Treat topic chips as a navigation instrument integrated with the hero/search area.
- Create visually distinct card families for safety, surfaces, stains, methods, and maintenance.

What must be preserved:
- Current guide data source and filtering behavior.
- Feature order.
- Safety/professional standards language.
- Route and SEO schemas.

### Encyclopedia Hub

Current structure:
- `KnowledgeHubLandingPage` renders editorial hero, search panel, category cards, trust strip, and "how to use this encyclopedia."
- `/encyclopedia/page.tsx` also includes pipeline status/category summaries.

Why it still feels conventional:
- It is close to a database gateway.
- Category cards are equal weight and do not express taxonomy priority.
- Search is premium-styled, but not yet architecturally central.

What must structurally change:
- Rebuild as a category gateway where search is the first-class action.
- Use card taxonomy with primary categories, support categories, and utility pathways.
- Remove any production-facing feeling of internal pipeline status from the premium experience.

What must be preserved:
- Existing encyclopedia index, category links, JSON-LD, and topic clusters.
- Search function.
- Professional standards and practical guidance framing.

### Problems, Surfaces, Products

Current structure:
- Problems and surfaces use `ProblemsHubExperience` and `SurfacesHubExperience` with editorial hero, search/chips, card grid, trust strip, and optional bottom sections.
- Products uses a product-specific search/filter sidebar, top-rated products, and product cards.

Why they still feel conventional:
- Problems and surfaces are attractive index pages but still card grids.
- Products is closer to a catalog/filter tool and less aligned with the premium editorial system.
- Page-specific diagnosis, material risk, and product compatibility are not yet surfaced as narrative architecture.

What must structurally change:
- Treat each as a diagnostic category page with search, editorial hero, top pathways, and thumbnail-led card systems.
- Products should present chemistry/product choice as a guided compatibility experience, not a raw scoring catalog.
- Problems should emphasize symptom-to-cause-to-action.
- Surfaces should emphasize material risk and method compatibility.

What must be preserved:
- Current filters and searchable data.
- Product compatibility, label-respect language, and affiliate disclosure behavior.
- Existing problem/surface/product routes and detail pages.

### Article Pages

Current structure:
- `MarketingArticleTemplate` and `AuthorityGuidePage` already have editorial hero, right rail, key takeaway, related guides, FAQ, and CTA.
- Some entity pages such as `ProblemPage` and `SurfacePage` still use neutral utility layouts.

Why they still feel conventional:
- Article pages are readable, but content sections still feel like stacked cards.
- Rails exist, but they do not yet create a magazine-grade reading rhythm.
- Knowledge entity pages lag behind the premium article system.

What must structurally change:
- Standardize premium editorial reading layout across guide, problem, surface, product, and encyclopedia detail pages.
- Use a visible right rail with key takeaway, contents, related topics, and standards.
- Introduce a strong bottom standards strip and related guide sequence.

What must be preserved:
- Existing content schema and JSON-LD.
- Internal links, FAQ, related content, and product recommendations.
- Search/SEO-friendly headings and body copy.

## Visual North Star

Nu Standard should feel like a premium service brand with an editorial intelligence layer. The layout should feel authored, not assembled. Every page should answer:

- What is the most important decision on this page?
- What proof reduces anxiety at that moment?
- What should the user do next?
- What should stay visible while they decide?

The visual direction is quiet, confident, and material-aware:
- Cream editorial surfaces.
- Deep slate typography.
- Restrained gold accents.
- Teal used for action and operational clarity.
- Large image moments with real service context.
- Fewer equal grids; more hierarchy.
- Subtle motion that rewards attention without distracting.

## Page-By-Page Architecture

### Homepage Architecture

1. Asymmetrical editorial hero:
   - 12-column desktop grid.
   - Left text spans columns 1-6.
   - Hero media spans columns 7-12 and begins slightly above headline baseline.
   - Floating proof panel overlaps lower-left of image.
   - Primary CTA and secondary proof link sit under headline, not separated as a generic button row.

2. Modular trust/story blocks:
   - Three proof statements arranged as one horizontal narrative band on desktop.
   - On tablet, first proof remains paired with image; remaining two stack.
   - On mobile, proof becomes a compact "why it feels different" sequence.

3. Service preview:
   - One large featured service card, two smaller supporting cards.
   - Cards stagger vertically by 32px on desktop.
   - Service imagery is flush, with label and CTA in an attached editorial caption.

4. Proof/standards section:
   - Replace equal five-card grid with a ledger-like standards panel.
   - Left rail: "What we control."
   - Right rail: commitments grouped by scheduling, people, service, payment, support.

5. Guided next action:
   - Final section asks: "Ready to plan the visit or still deciding?"
   - Two paths: book online, compare service types.

### Services Architecture

1. Editorial service catalog intro:
   - Large intro panel with service philosophy, decision prompt, and image.
   - Include "Choose by situation" options: reset, routine, transition.

2. Staggered service cards:
   - Deep cleaning card is largest.
   - Recurring and move cards support it with offset layout.
   - Each card contains best-fit cues, not just title/body/CTA.

3. Owner-led quality strip:
   - A compact proof band immediately after service cards.
   - Use four claims maximum.

4. Service comparison path:
   - A comparison module that answers:
     - "When to choose deep cleaning."
     - "When to choose recurring."
     - "When to choose move-in/out."
   - Each comparison row links to service detail and booking.

5. Booking CTA rhythm:
   - CTA appears after intro, after cards, and after comparison.
   - CTA copy changes by context; avoid repeating identical buttons.

### Booking Start Architecture

1. Premium guided intake shell:
   - Desktop: left 7 columns active task, right 5 columns persistent guidance.
   - Right rail contains stepper, estimate reassurance, and "what happens next."
   - Hero is compact and part of the shell, not a full standalone marketing hero.

2. Visual stepper:
   - Stepper shows current phase, upcoming phase, and completed state.
   - Use numbered pills and small descriptive hints.
   - No oversized horizontal rail on mobile.

3. Honest estimate reassurance:
   - Place "estimate updates in real time" in a calm reassurance panel near the active form.
   - Avoid implying guaranteed final pricing.

4. Reduced anxiety layout:
   - Each step begins with "why we ask."
   - Form inputs grouped by intent, not database shape.
   - Primary continue button stays visually clear but not sticky unless the step is long.

### Estimate / Review Architecture

1. Estimate command center:
   - Top of review becomes a two-column command center.
   - Left: total/estimate readiness.
   - Right: scope predictability and next step.

2. Total card hierarchy:
   - Price or "preview unavailable" state is visually dominant.
   - Cleaning effort and scope predictability are secondary.
   - Recurring maintenance economics sit below the opening visit, never beside it as an equal quote.

3. Breakdown module:
   - "What shaped this estimate" becomes a collapsible or clearly grouped module.
   - Only show factors actually wired to preview.

4. Owner-led preparation note:
   - Separate from estimator factors.
   - Explains team preparation and notes that free-text prep does not change automated quote.

5. Secure deposit explanation:
   - Deposit module should appear only when relevant.
   - Separate "why", "when", and "what changes" unless copy density becomes too heavy.

### Confirmation Architecture

1. Calm completion page:
   - Large success artifact with status and booking/reference details.
   - Avoid generic "Thank you" as the main visual anchor.

2. Booking details card:
   - Confirmed visit: team, date/time, deposit, estimate.
   - Request received: what was saved and what happens next.

3. Next-steps strip:
   - Three steps maximum.
   - Email confirmation, timing follow-up, support path.

4. Owner-led reassurance:
   - Use a short trust strip near the bottom.
   - Avoid duplicating all booking trust claims.

5. Calendar/support actions:
   - Only include if supported by existing data and routes.

### Guides Landing Architecture

1. Editorial knowledge landing:
   - Feature one primary guide as the lead card.
   - Hero and feature card should read as one editorial composition.

2. Topic chips:
   - Chips live in a horizontal editorial control area below the feature.
   - Search and chips should share a module.

3. Guide cards:
   - Featured guide cards use image-led format.
   - Secondary references use compact text-led cards.
   - Long tail should avoid creating an endless equal grid.

4. Standards strip:
   - Keep safety/professional standards.
   - Place after user has seen guide options, not immediately under hero.

### Encyclopedia Hub Architecture

1. Category gateway:
   - Search-first opening module.
   - Primary categories are larger: Problems, Surfaces, Products, Guides.
   - Secondary categories are compact: Methods, Glossary, Clusters.

2. Card taxonomy:
   - Each card includes what users can answer there.
   - Use distinct visual labels for diagnostic, material, product, method, and guide.

3. Premium database behavior:
   - Do not expose pipeline status in the premium hub unless explicitly in an ops/admin surface.
   - Keep topic clusters as an advanced browse path.

### Problems / Surfaces / Products Architecture

1. Diagnostic hero:
   - Problems: symptom-first.
   - Surfaces: material-risk-first.
   - Products: compatibility-first.

2. Search/filter hierarchy:
   - Search first.
   - Chips or filter drawers second.
   - Results count should be supportive, not dominant.

3. Thumbnail card systems:
   - Problems: symptom image or abstract cleaning scene.
   - Surfaces: material texture image.
   - Products: product image with compatibility badges.

4. Page-specific editorial modules:
   - Problems: "Start by identifying the cause."
   - Surfaces: "Know the finish before the cleaner."
   - Products: "Label first, compatibility second, convenience third."

### Article Pages Architecture

1. Premium reading layout:
   - Desktop: 8-column article body, 4-column rail.
   - Body max width around 720px.
   - Rail sticky only after hero.

2. Right rail:
   - Key takeaway.
   - In this guide.
   - Related guides/topics.
   - Standards strip.

3. Key takeaway:
   - Appears once near top on mobile.
   - Appears in rail on desktop.

4. Related guides:
   - Use a bottom related sequence, not only rail links.

5. Bottom standards strip:
   - Same vocabulary as knowledge hubs.
   - Surface-first, test first, gentle approach, know when to stop.

## Grid System

### Desktop

- Max content width: `1280px` for most public surfaces.
- Reading body max width: `720px`.
- Rail width: `288px` to `340px`.
- Outer padding: `32px` from `md` upward.
- Primary grid: 12 columns with `24px` gutters.
- Asymmetrical hero ratios:
  - 6/6 for balanced pages.
  - 7/5 for conversion pages.
  - 5/7 for image-led pages.
- Card widths:
  - Large feature card: 6 columns.
  - Standard editorial card: 4 columns.
  - Compact card: 3 columns.
- Hero media should generally be `4:3`, `5:4`, or tall `4:5` depending on context.

### Tablet

- Collapse at `1024px` when rail content can no longer stay readable.
- Keep paired text/image hero until `768px` if image remains meaningful.
- Stepper and guidance rails move above active booking form.
- Two-column cards become single column if card copy exceeds 3 lines.
- Search panels remain full width.

### Mobile

- Headline scale: 34px maximum for page H1, 28px for dense booking/article contexts.
- Images appear after the headline unless the page is image-led and the image explains the decision.
- CTA order: primary first, secondary below.
- Cards stack one per row.
- Search input is full width.
- Avoid sticky CTAs unless the step exceeds 1.5 screens and there is no payment element.
- Right rails become inline modules after hero or after first content section.

## Spacing, Surface, and Accent System

Section spacing:
- Hero top/bottom: `56px` desktop, `40px` tablet, `32px` mobile.
- Major section gap: `80px` desktop, `64px` tablet, `48px` mobile.
- Card grid gap: `28px` desktop, `24px` tablet, `20px` mobile.
- Internal card padding: `28px` desktop, `24px` tablet, `20px` mobile.

Radius:
- Hero image frame: `28px`.
- Large editorial cards: `28px`.
- Standard cards: `22px`.
- Chips and buttons: full pill.
- Small info panels: `18px`.

Image aspect ratios:
- Homepage hero: `4:3` or `5:4`.
- Service cards: `5:3`.
- Knowledge cards: `16:10`.
- Product images: square for product detail, `4:3` for catalog context.
- Article hero: `4:3` desktop, `16:10` mobile.

Border system:
- Default border: warm neutral at 12-18% opacity.
- Active border: teal at 30-40% opacity.
- Warning/caution panels: amber only when semantically required.

Shadow system:
- Use soft shadows only on elevated cards and image frames.
- Avoid stacking shadowed cards inside shadowed panels.
- Preferred shadow character: broad, low opacity, warm/slate.

Gold accent usage:
- Gold is for eyebrows, small rules, active texture, and standards.
- Never use gold for every border.
- A section should usually have one gold accent, not five.

## Typography Hierarchy

- H1 marketing: Poppins, 44-54px desktop, -0.04em tracking.
- H1 editorial/booking: Poppins, 40-50px desktop, -0.04em tracking.
- H2: Poppins, 26-32px desktop, -0.03em tracking.
- H3/card title: Poppins, 18-24px.
- Body lead: Manrope, 17-20px, 1.6 line height.
- Body standard: Manrope, 15-16px, 1.65 line height.
- Microcopy: Manrope, 12-13px, relaxed line height.
- Eyebrow: Poppins, 10-12px, uppercase, 0.22-0.28em tracking.

## Image Strategy

- Use images to explain service presence, not decorate.
- Pair each major page with one decisive image above the fold.
- Prefer real home/service moments over generic texture.
- When image is unavailable, use a quiet material fallback, not a loud gradient.
- Thumbnails should be semantically connected to card type:
  - Service: team/work context.
  - Problem: symptom or cleaning action.
  - Surface: material close-up.
  - Product: product image or compatibility context.
  - Article: service/editorial still.

## Interaction System

Global motion tokens:

```text
--nu-ease-premium: cubic-bezier(0.22, 1, 0.36, 1)
--nu-ease-enter: cubic-bezier(0.16, 1, 0.3, 1)
--nu-duration-fast: 180ms
--nu-duration-standard: 300ms
--nu-duration-slow: 500ms
```

Behavior:
- Primary buttons: 2px lift max, subtle shadow increase, active scale `0.99`.
- Secondary buttons: border warms, background becomes white, no large movement.
- Article cards: lift `-2px`, image scale `1.015`, border warms.
- Service cards: lift `-3px`, image scale `1.012`, CTA arrow shifts `2px`.
- Booking step cards: active state uses border, ring, and background, not animation-heavy movement.
- Filter chips: active state changes fill/border; hover warms border.
- Search input: focus ring only, no bounce.
- Form inputs: focus background white, teal ring, invalid state amber/red with restrained copy.
- Image frames: hover scale only where the image is linked or paired with a card.
- Page transitions: do not add custom route transitions in V1.

Forbidden:
- Loud animation.
- Linear transitions.
- Large transforms.
- Repeated pulsing.
- Motion on critical payment/deposit states beyond ordinary focus/active feedback.

## Responsive Collapse Logic

- Desktop rails collapse at `lg` unless content is essential to current action.
- Booking guidance rail moves above the active form on tablet.
- Article rail becomes inline after hero on mobile.
- Service comparison rows become stacked decision cards on mobile.
- Product filters move to collapsible drawer or grouped controls below search on mobile.
- Search stays near top for knowledge pages.
- Avoid fixed/sticky controls over payment fields or long legal/trust copy.

## Implementation Sequencing

1. Tokenize layout primitives:
   - Add layout-only primitives for asymmetrical grids, feature cards, rails, and editorial bands.
   - Do not change page behavior.

2. Homepage restructuring:
   - Implement true hero composition.
   - Rework service preview and standards ledger.
   - Validate desktop/tablet/mobile visual QA.

3. Services restructuring:
   - Build service decision map and staggered catalog.
   - Preserve existing routes and CTA targets.

4. Booking shell restructuring:
   - Update layout shell around existing booking state machine.
   - Do not change estimator, payment, or API behavior.
   - Validate complete booking corridor tests.

5. Review/confirmation restructuring:
   - Recompose existing data into command center and completion artifact.
   - Preserve deposit/payment state logic.

6. Knowledge landing/hub restructuring:
   - Guides, encyclopedia, problems, surfaces, products hubs.
   - Preserve search/filter behavior and schemas.

7. Article/entity page restructuring:
   - Standardize reading layout across guide, problem, surface, product, and encyclopedia detail pages.
   - Preserve JSON-LD, related links, and SEO headings.

8. Regression and production parity:
   - `npm run typecheck:web`
   - `npm run build --prefix apps/web`
   - Targeted booking tests
   - Browser QA across homepage, booking, services, guides, encyclopedia, problems, surfaces, products, and one article page.

## Safety Boundaries For Implementation

- No backend/API/runtime changes.
- No estimator math changes.
- No payment architecture changes.
- No cron or env changes.
- No fake ratings, testimonials, reviews, or expert-reviewed claims.
- No route deletions.
- No broad refactor during visual implementation.
- Keep PRs small by surface.
