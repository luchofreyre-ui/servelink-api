# Cleaning Knowledge Library Inventory

## Purpose

The Cleaning Knowledge Library is a scaffolded content architecture for residential cleaning guides, checklists, techniques, and related topics. All knowledge article pages default to **noindex** until content is filled and `isLive` is set to `true`. The hub and category pages are indexable.

## Knowledge hub route

- **URL:** `/cleaning-guides`
- **Resolved via:** `/:segment` when `segment === "cleaning-guides"`.
- **Content:** Hero, intro, category card grid, related links (house-cleaning, deep-cleaning, move-out-cleaning, tulsa-cleaning-services, book).

## Knowledge category routes

- **URL pattern:** `/${categorySlug}` (e.g. `/cleaning-techniques`, `/room-cleaning-guides`).
- **Resolved via:** `/:segment` when `segment` matches a knowledge category slug.
- **Categories (exact slugs):**
  - `cleaning-techniques`
  - `room-cleaning-guides`
  - `stain-removal`
  - `cleaning-schedules`
  - `professional-cleaning`
  - `cleaning-tools`
  - `move-out-cleaning-guides`
  - `cleaning-problems`
  - `cleaning-method`
- **Content:** Breadcrumbs, hero, intro, article card grid, related links (cleaning-guides, house-cleaning, deep-cleaning, move-out-cleaning).

## Knowledge article count by category

| Category slug               | Article count |
|----------------------------|---------------|
| cleaning-techniques        | 20            |
| room-cleaning-guides       | 10            |
| stain-removal              | 12            |
| cleaning-schedules         | 9             |
| professional-cleaning      | 11            |
| cleaning-tools             | 10            |
| move-out-cleaning-guides   | 8             |
| cleaning-problems          | 10            |
| cleaning-method            | 7             |
| **Total**                  | **97**        |

All article URLs are single-segment root-level (e.g. `/how-to-clean-kitchen`). No nested article URLs.

## Draft indexing rule

- **Knowledge hub:** indexable.
- **Knowledge category pages:** indexable.
- **Knowledge article pages:** default `noindex, nofollow` while `isLive === false`. Robots value is set via `getKnowledgeArticleRobotsValue(slug)` and applied in metadata/head.

## Article route resolution order

Inside `ServiceOrLocationPage` (for `/:segment`), resolution order is exactly:

1. Area page slug (e.g. `tulsa-cleaning-services`) → `AreaPage`
2. Knowledge hub slug (`cleaning-guides`) → `KnowledgeHubPage`
3. Knowledge category slug → `KnowledgeCategoryPage`
4. Knowledge article slug → `KnowledgeArticlePage`
5. Location slug → `LocationPage`
6. Service slug → `ServicePage`
7. Else → 404

No other order is used.

## Sitemap inclusion rule

- **Included:** Homepage, /book, service pages, location pages, area pages, service/location pages, **knowledge hub**, **all knowledge category pages**, and **only knowledge articles where `isLive === true`**.
- **Excluded:** Draft knowledge article pages (`isLive === false`), admin, login.

## Publishing workflow

1. **Fill article content** — Add full body content, refine excerpt, and adjust outline if needed.
2. **Set `isLive = true`** — In `src/knowledge/knowledgeArticles.ts`, set `isLive: true` for the article definition.
3. **Remove noindex for that article** — `getKnowledgeArticleRobotsValue(slug)` returns `index, follow` when `isLive` is true, so no code change needed beyond flipping `isLive`.
4. **Allow sitemap inclusion** — Sitemap already includes articles where `article.isLive` is true; no sitemap code change needed.
5. **Verify internal links** — Confirm related services, locations, and related articles links are correct and that the article appears in category and hub navigation where expected.
