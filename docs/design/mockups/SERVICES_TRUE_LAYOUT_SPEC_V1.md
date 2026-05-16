# Services True Layout Spec V1

Status: design spec only  
Surface: `/services` and service detail entry points

## Visual Objective

Turn services from a catalog into an editorial decision system. Visitors should understand which service fits their situation and feel the owner-led quality model before they click booking.

## Layout Zones

1. Large service philosophy panel
2. Choose-by-situation decision map
3. Staggered service catalog
4. Owner-led quality strip
5. Service comparison path
6. Booking CTA rhythm

## Desktop Structure

### Zone 1: Service Philosophy Panel

- Full-width warm surface inside `1280px` shell.
- 12-column grid:
  - Text columns 1-6.
  - Image columns 8-12.
  - Decision prompt card overlaps columns 5-8.
- Eyebrow: `Services`
- H1: "Cleaning services designed for real life."
- Body preserves "Detailed. Thorough. Thoughtful. Always owner-led."

### Zone 2: Choose By Situation

- Three compact pathways:
  - "My home needs a reset" -> Deep cleaning
  - "I want a steady rhythm" -> Recurring cleaning
  - "I am moving" -> Move-in / move-out
- Each pathway contains 2-3 decision cues.
- This module must appear before the full service card catalog.

### Zone 3: Staggered Service Catalog

- Deep cleaning feature card:
  - Spans 7 columns.
  - Includes image, best-fit cues, and CTA pair.
- Recurring and move cards:
  - Span 5 columns each in a stacked side rail.
  - Offset by 32px so the layout feels authored.
- Cards should not be equal height by force.

### Zone 4: Owner-Led Quality Strip

- Four claims maximum:
  - Background-checked professionals
  - Insured service with expectations spelled out
  - Documented standards
  - Owner-led quality
- Use compact metric/ledger styling rather than large cards.

### Zone 5: Service Comparison Path

- Comparison rows:
  - Best when...
  - What we prepare...
  - What you choose next...
- Keep copy practical and decision-oriented.

### Zone 6: Booking CTA Rhythm

- CTA after intro: `Start booking`
- CTA after catalog: `Book this clean` contextual to selected service
- CTA after comparison: `Plan the right visit`

## Tablet Structure

- Philosophy panel becomes two columns until `900px`.
- Decision prompt moves below headline and above image.
- Service catalog becomes one large feature card followed by two cards.
- Comparison table becomes stacked comparison cards.

## Mobile Structure

- Philosophy text first, image second, decision map third.
- Service cards stack in priority order.
- Comparison path uses accordion-style sections only if implementation can preserve accessibility.
- CTA remains inline, not fixed.

## Copy Hierarchy

- Primary headline: service philosophy.
- Secondary: decision prompt.
- Service card title.
- Best-fit cues.
- CTA.
- Fine-print reassurance.

## Media Placement

- Intro image: owner/operator or service context.
- Service cards use service-specific images:
  - Deep cleaning: deeper work/detail.
  - Recurring: maintained home rhythm.
  - Move: transition-ready space.
- Images are flush with the card top, no decorative overlays.

## Interaction Notes

- Service cards lift subtly and image scale `1.012`.
- Decision map items behave as links with text underline/arrow shift.
- Comparison rows should not animate open unless implemented as real disclosure controls.

## Implementation Notes

- Preserve `getServiceHubCards`.
- Preserve `/services/[slug]` links and `/book?service=` links.
- Do not change service taxonomy or booking query behavior.
- Implement hub first, then detail pages in a later PR.

## Anti-Patterns

- Equal service cards with identical CTA weight.
- Hero image unrelated to service choice.
- Repeating the same primary CTA three times with no context.
- Comparison content hidden behind non-accessible hover states.
