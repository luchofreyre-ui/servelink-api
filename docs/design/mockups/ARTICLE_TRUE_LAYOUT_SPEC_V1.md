# Article True Layout Spec V1

Status: design spec only  
Surfaces: guide pages, encyclopedia detail pages, problem pages, surface pages, product pages, question/article pages

## Visual Objective

Create a premium editorial reading system that is calm, structured, and useful. The article layout should make key takeaways, related topics, and professional standards visible without making the page feel like a database dump.

## Layout Zones

1. Editorial article hero
2. Key takeaway
3. Reading body
4. Right rail
5. Related content sequence
6. Standards strip
7. Conversion support

## Desktop Structure

### Zone 1: Article Hero

- Shell max width: `1280px`.
- Hero grid:
  - Text spans columns 1-7.
  - Image spans columns 8-12.
- Breadcrumb above hero.
- Eyebrow describes article type:
  - Safety guide
  - Surface protection guide
  - Problem diagnosis
  - Product reference
  - Method guide
- Hero body should be the article lead, not a generic SEO description.

### Zone 2: Reading Layout

- Main article body max width: `720px`.
- Right rail width: `288px` to `340px`.
- Grid: `minmax(0, 1fr) 320px`, with `48px` gap.
- Body sections use open whitespace and occasional callouts, not every section boxed.

### Zone 3: Right Rail

Rail modules, in order:
1. Key takeaway
2. In this guide
3. Related topics or related guides
4. Standards strip
5. Optional CTA

Sticky behavior:
- Sticky from `top: 112px`.
- Disable sticky if rail height exceeds viewport.

### Zone 4: Key Takeaway

- Desktop: rail module.
- Mobile/tablet: inline after hero.
- Copy should be 1-3 sentences.
- Avoid repeating the full intro.

### Zone 5: Related Content Sequence

- Bottom related sequence uses cards, not only text links.
- Include:
  - Related guides
  - Related problem/surface/method/product topics
  - Service CTA only when relevant and not intrusive

### Zone 6: Standards Strip

- Surface-first
- Test first
- Gentle approach
- Know when to stop
- Appears near bottom on desktop and after first half of article on mobile.

## Tablet Structure

- Hero becomes two-column until `900px`.
- Right rail becomes inline modules after hero or after first section.
- Table of contents can be horizontal chips if short.
- Related content remains two-column until `768px`.

## Mobile Structure

- Breadcrumb can wrap.
- Hero image appears after headline and lead.
- Key takeaway appears immediately after hero.
- Body sections stack with 40-48px section spacing.
- Rail modules become inline cards:
  - Key takeaway
  - Contents
  - Related
  - Standards
- Avoid sticky rail/CTA.

## Copy Hierarchy

- H1: article title.
- Lead: action-oriented context.
- H2: section titles.
- Callout: the thing to remember.
- Rail: short, scannable copy only.
- Related cards: title plus one line.

## Media Placement

- Article hero image: `4:3` desktop, `16:10` mobile.
- Inline images only if they explain process or risk.
- Product pages keep product imagery primary, but should still adopt editorial rail and standards placement.
- Entity pages can use material/problem imagery or abstract service-context assets.

## Interaction Notes

- In-page rail links use smooth browser anchor behavior only if already supported; do not add custom route transitions.
- Related cards lift `-2px`.
- Image hover scale only for linked media/card images.
- FAQ disclosures use accessible open/close states.
- Product research collapsibles must remain keyboard accessible.

## Implementation Notes

- Standardize `MarketingArticleTemplate`, `AuthorityGuidePage`, encyclopedia detail templates, `ProblemPage`, `SurfacePage`, and product detail pages over time.
- Preserve JSON-LD and headings.
- Preserve all existing related links and product recommendation logic.
- Do not change product scoring, affiliate behavior, or recommendation contracts.
- Do not alter authority graph data.

## Anti-Patterns

- Boxing every paragraph section.
- Right rail filled with duplicated CTAs.
- Related links as raw slug chips.
- Product pages that look visually unrelated to guide/entity pages.
- Hiding important safety caveats below conversion CTAs.
