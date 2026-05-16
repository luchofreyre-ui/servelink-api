# Booking True Layout Spec V1

Status: design spec only  
Surface: `/book`, `/book/confirmation`, review/deposit states

## Visual Objective

Make booking feel like a calm guided intake, not a generic form wizard. The user should understand what is happening, why information is requested, how estimates behave, and what comes next.

## Layout Zones

1. Guided booking shell
2. Active step panel
3. Persistent confidence rail
4. Estimate command center
5. Deposit confidence module
6. Completion artifact

## Desktop Structure

### Zone 1: Guided Booking Shell

- Use `1280px` max shell.
- Main grid:
  - Active step: 7 columns.
  - Confidence rail: 5 columns.
- Hero copy is compact and contained within the shell, not a separate full marketing band.
- The shell must show:
  - Headline: "Tell us about your home."
  - Real-time estimate/no-sales-call reassurance.
  - Owner-led accountability.

### Zone 2: Active Step Panel

- Each step uses a premium card with:
  - Step eyebrow
  - Step title
  - Why-we-ask note
  - Input groups
  - Continue/back controls
- Service step:
  - Service choices are guided cards.
  - Include "best when" and "what happens next" text.
- Home step:
  - Group fields by decision purpose, not internal model shape.
- Location step:
  - Keep address requirements clear.

### Zone 3: Persistent Confidence Rail

- Sticky only on desktop.
- Contains:
  - Visual stepper
  - Current estimate behavior note
  - Trust strip
  - "What happens after this step"
- On review, rail may become summary-heavy.
- Do not make it sticky around payment elements if it causes cramped layout.

### Zone 4: Estimate / Review Command Center

- Review page starts with a command center:
  - Left large total/estimate state.
  - Right readiness + next step.
- Below:
  - Breakdown module.
  - Home/location/contact summary.
  - Owner-led preparation note.
  - Optional recurring maintenance economics.
- Dominant hierarchy:
  1. Estimate status/total
  2. Cleaning effort
  3. Scope predictability
  4. Estimate factors
  5. Preparation notes

### Zone 5: Deposit Confidence Module

- Appears only when deposit state is relevant.
- Content order:
  - Why deposit is needed.
  - When it is applied.
  - What happens if details change.
  - Secure payment reassurance.
- Payment element remains functionally unchanged.

### Zone 6: Confirmation Completion Artifact

- Replace generic confirmation stack with a completion artifact:
  - Status badge
  - Main outcome title
  - Booking/reference details
  - Next steps
  - Support/calendar actions if supported
- Neutral re-entry uses a distinct "continue your booking" state.

## Tablet Structure

- Confidence rail moves above active step.
- Stepper becomes horizontal if it fits; otherwise two-row grid.
- Estimate command center stacks total first, readiness second.
- Deposit module remains inline after schedule/confirm context.

## Mobile Structure

- Header, compact booking promise, active step.
- Stepper becomes a compact vertical or segmented list.
- Confidence rail content becomes inline cards.
- Primary CTA appears after the current step content.
- Avoid sticky CTA during deposit/payment.

## Copy Hierarchy

- H1: booking promise.
- Step title: specific task.
- Why-we-ask copy: 1-2 lines.
- Estimate explanation: clear and honest.
- Trust language: owner-led, documented, transparent.
- Do not imply final price before confirmation.

## Media Placement

- Booking start may use no large image if it distracts from task completion.
- If media is used, place it in rail as a small service-context frame.
- Review and confirmation should prioritize information hierarchy over imagery.

## Interaction Notes

- Step cards use restrained active states.
- Inputs use teal focus ring and red/amber invalid state.
- Progress step active state should be visible without animation.
- Continue/back controls use premium button tokens.
- Estimate refresh state should be calm, not flashy.
- No custom route transitions.

## Implementation Notes

- Do not change:
  - Estimator math
  - Booking state machine
  - API payloads
  - Payment/deposit architecture
  - URL state semantics
- Refactor layout around existing `BookingFlowClient`, `BookingStepReview`, `BookingSummaryCard`, and `BookingConfirmationClient`.
- Maintain targeted booking test coverage.

## Anti-Patterns

- Rebuilding booking logic to achieve layout changes.
- Showing estimate factors as if every note changes price.
- Sticky UI over Stripe/payment fields.
- Duplicating trust ribbons in every step.
- Hiding critical errors inside decorative panels.
