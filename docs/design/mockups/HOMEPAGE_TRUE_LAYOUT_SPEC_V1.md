# Homepage True Layout Spec V1

Status: design spec only  
Surface: `/`

## Visual Objective

Make the homepage feel authored and image-led, not like a conventional service landing page. The visitor should immediately understand that Nu Standard is premium, owner-led, operationally clear, and easy to book without pressure.

## Layout Zones

1. Asymmetrical editorial hero
2. Overlapping proof panel
3. Operating story spine
4. Staggered service preview
5. Standards ledger
6. Guided next action
7. Practical guidance/search support

## Desktop Structure

### Zone 1: Asymmetrical Editorial Hero

- Use a 12-column grid inside a `1280px` max-width shell.
- Text occupies columns 1-6.
- Media occupies columns 7-12.
- Media begins 24px higher than the text block and extends below the CTA row.
- Hero headline remains: "Premium home care—with owner-led accountability."
- Hero body preserves owner-led anchor and honest estimate copy.
- CTAs sit under body copy:
  - Primary: `Book your cleaning`
  - Secondary: `Compare service types`
- Floating proof panel overlaps image bottom-left:
  - `Owner-led teams`
  - `Honest real-time estimate`
  - `Documented standards`

### Zone 2: Operating Story Spine

- Replace isolated trust strip and process cards with a vertical story spine.
- Left rail: compact narrative labels:
  - Plan
  - Prepare
  - Deliver
- Right rail: short proof copy tied to each phase.
- Include one horizontal image or detail crop between phases 2 and 3.

### Zone 3: Staggered Service Preview

- Desktop layout:
  - Deep cleaning card spans columns 1-6.
  - Recurring card spans columns 7-12 and starts 40px lower.
  - Move card spans columns 4-10 below both.
- Each card includes:
  - Image
  - Service badge
  - Best for
  - What it solves
  - Primary service link
  - Contextual booking link

### Zone 4: Standards Ledger

- Replace equal proof cards with a ledger panel.
- Left side: "What we control."
- Right side rows:
  - People: owner-led teams, background-checked professionals
  - Process: transparent scheduling, documented standards
  - Payment: secure rails, clear expectations
  - Support: reachable resolution path

### Zone 5: Guided Next Action

- Two-column decision module:
  - "Ready to plan the visit?" -> Book online
  - "Still deciding?" -> Compare service types / browse guides

## Tablet Structure

- Hero remains two-column until content becomes cramped below `900px`.
- Proof panel moves below image but remains visually attached.
- Story spine becomes two-column: phase label left, content right.
- Service cards become one large card followed by two equal cards.
- Standards ledger becomes stacked rows.

## Mobile Structure

- Hero order:
  1. Eyebrow
  2. Headline
  3. Body
  4. Primary CTA
  5. Hero image
  6. Proof panel
- Service cards stack: deep, recurring, move.
- Standards ledger rows stack with generous spacing.
- No sticky CTA on homepage mobile in V1.

## Copy Hierarchy

- H1: owner-led accountability.
- Lead body: founder/operator accountability.
- Support line: honest estimates, no-pressure booking.
- Proof panel copy must be terse, no testimonials or fake ratings.
- Service copy should answer "when should I choose this?"

## Media Placement

- Hero image: service/person/home context, `4:3` or `5:4`.
- Service images: flush top of card, `5:3`.
- Story spine image: detail/inspection/walkthrough moment, `16:9`.
- Avoid generic decorative imagery.

## Interaction Notes

- Hero image has no hover if not clickable.
- Service cards lift `-3px` on hover, image scale `1.012`.
- CTA transition uses `cubic-bezier(0.22, 1, 0.36, 1)`.
- Secondary links use underline or subtle arrow shift.

## Implementation Notes

- Build new layout primitives before replacing homepage structure.
- Preserve `PrecisionLuxuryHomepage` data selectors.
- Preserve JSON-LD scripts.
- Reuse `HomepageHeroMedia`, `HomepageServiceMedia`, and media assets where possible.
- Do not alter booking route behavior.

## Anti-Patterns

- Equal three-card service grid as the main homepage service architecture.
- Trust strip directly under hero as a standalone band.
- Multiple identical CTA rows.
- Gold borders around every card.
- Any rating/review/testimonial claim not backed by real source data.
