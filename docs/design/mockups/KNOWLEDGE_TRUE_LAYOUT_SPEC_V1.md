# Knowledge True Layout Spec V1

Status: design spec only  
Surfaces: `/guides`, `/encyclopedia`, `/problems`, `/surfaces`, `/products`

## Visual Objective

Make Nu Standard knowledge pages feel like a premium editorial system, not a searchable database with styled cards. Search and filters should remain useful, but the page architecture should guide the user through diagnosis, material risk, product compatibility, and professional standards.

## Layout Zones

1. Editorial hero or diagnostic hero
2. Search/control panel
3. Featured pathway
4. Taxonomy/card system
5. Standards strip
6. Related browse path

## Desktop Structure

### Guides Landing

- Hero and feature card should read as one composition.
- Layout:
  - Hero text columns 1-5.
  - Feature guide card columns 6-12.
  - Search/chips span full width below.
- Feature card:
  - Large media.
  - Category eyebrow.
  - Strong summary.
  - `Read guide` CTA.
- Secondary guide cards:
  - Compact text-led cards grouped by topic.

### Encyclopedia Hub

- Search-first gateway:
  - Search module spans columns 1-8.
  - "How to use" module spans columns 9-12.
- Primary cards:
  - Problems
  - Surfaces
  - Products
  - Guides
- Secondary cards:
  - Methods
  - Glossary
  - Topic clusters
- Remove any public-facing pipeline/status feel from premium layout.

### Problems

- Diagnostic hero:
  - "What are you seeing?"
  - Symptom categories in chips.
- Search panel directly supports symptom search.
- Cards include:
  - Problem name
  - Cause hint
  - Surface risk note where available
  - Thumbnail/action image

### Surfaces

- Material-risk hero:
  - "Know the finish before the cleaner."
- Search panel supports material/finish names.
- Cards include:
  - Material family
  - Sensitivity cue
  - Safe method preview
  - Texture/service thumbnail

### Products

- Compatibility-first hero:
  - "Label first. Surface second. Convenience third."
- Search and filters:
  - Search is primary.
  - Filters become a guided compatibility drawer/panel.
- Product cards include:
  - Product image
  - Category
  - Compatible surfaces/problems
  - Label-respect note
  - Disclosure remains visible where relevant

## Tablet Structure

- Heroes become two-column until `900px`.
- Search/control panel spans full width.
- Feature card moves below hero on guides.
- Category cards become two-column.
- Product filters move above results if sidebar becomes too narrow.

## Mobile Structure

- Hero text first.
- Search second.
- Chips horizontally scroll only if accessible and visible.
- Cards stack.
- Filter sidebars become disclosure panels.
- Standards strip appears after first result group, not before all content.

## Copy Hierarchy

- Page H1 states user job:
  - Guides: learn safely.
  - Encyclopedia: search/browse knowledge.
  - Problems: identify and solve.
  - Surfaces: protect material.
  - Products: choose responsibly.
- Search helper copy should set expectations.
- Card copy should be action-oriented, not metadata-heavy.

## Media Placement

- Guides: editorial service stills.
- Encyclopedia: one calm operational image.
- Problems: cleaning action or symptom context.
- Surfaces: material/finish imagery.
- Products: product image or product-in-context.
- Avoid repeating the same hero image across too many adjacent knowledge pages.

## Interaction Notes

- Search input focus ring uses teal.
- Filter chips use filled active state and subtle border hover.
- Cards use restrained lift and image scale.
- Product filter drawers must be keyboard accessible.
- Empty results include reset action.

## Implementation Notes

- Preserve:
  - Existing data loaders
  - Existing routes
  - JSON-LD
  - Search behavior
  - Product affiliate/disclosure behavior
- Build shared knowledge layout primitives before rewriting each hub.
- Convert products last because its filtering model differs from editorial hubs.

## Anti-Patterns

- Raw database counts as primary premium content.
- Equal cards for every category regardless of user value.
- Hiding search below many editorial blocks.
- Product scores presented as popularity or fake ratings.
- Removing label-respect or compatibility caveats.
