# SEO Route Inventory

This document matches the implemented public route system for Nu Standard Cleaning.

## Current public routes

| Pattern | Purpose |
|--------|---------|
| `/` | Homepage |
| `/book` | Booking entry (optional query: `service`, `location`) |
| `/:segment` | Single segment: area slug (e.g. `tulsa-cleaning-services`) → area page; valid location slug → location page; valid service slug → service page; else 404 |
| `/:serviceSlug/:locationSlug` | Service/location page (both must be valid; else 404) |

Resolved routes:

- **Homepage:** `/`
- **Booking:** `/book`, `/book?service=...`, `/book?service=...&location=...`
- **Service pages:** `/house-cleaning`, `/deep-cleaning`, `/move-out-cleaning`, `/recurring-cleaning`, `/airbnb-cleaning`
- **Area pages (keyword-rich):** `/tulsa-cleaning-services`, `/broken-arrow-cleaning-services`, `/bixby-cleaning-services` — city-level hubs linking to service/location pages.
- **Location pages:** `/tulsa`, `/broken-arrow`, `/bixby`, `/brookside-tulsa`, `/downtown-tulsa`, `/cherry-street-tulsa`
- **Service/location pages:** All combinations of the 5 services × 6 locations (e.g. `/house-cleaning/tulsa`)

Admin or non-SEO routes (e.g. `/admin`) are not part of this inventory.

## Seeded services

| Slug | Name |
|------|------|
| house-cleaning | House Cleaning |
| deep-cleaning | Deep Cleaning |
| move-out-cleaning | Move-Out Cleaning |
| recurring-cleaning | Recurring Cleaning |
| airbnb-cleaning | Airbnb Cleaning |

## Seeded cities

| Slug | Name |
|------|------|
| tulsa | Tulsa |
| broken-arrow | Broken Arrow |
| bixby | Bixby |

## Seeded neighborhoods

| Slug | Name |
|------|------|
| brookside-tulsa | Brookside |
| downtown-tulsa | Downtown Tulsa |
| cherry-street-tulsa | Cherry Street |

## Metadata coverage

- **Homepage:** `buildHomepageMetadata()` — title, description, canonical, og fields.
- **Service pages:** `buildServiceMetadata(service)` — title `${service.name} | Nu Standard Cleaning`, canonical service URL.
- **Location pages:** `buildLocationMetadata(location)` — title `${location.name} Cleaning Services | Nu Standard Cleaning`, canonical location URL.
- **Area pages:** `buildAreaPageMetadata(location)` — same title/description as location; canonical = area URL (e.g. `/tulsa-cleaning-services`).
- **Service/location pages:** `buildServiceLocationMetadata(service, location)` — title `${service.name} in ${location.name} | Nu Standard Cleaning`, canonical service/location URL.
- **Booking:** `buildBookingMetadata({ serviceSlug?, locationSlug? })` — base or service/location-specific title and canonical with query params when provided.

All canonicals use the production base URL (https://nustandardcleaning.com).

## Schema coverage

- **Homepage:** LocalBusiness, WebPage, FAQ (via `buildHomepageSchemaSet`).
- **Service pages:** LocalBusiness, Service, Breadcrumb, ItemList (service includes), FAQ (via `buildServicePageSchemaSet`).
- **Location pages:** LocalBusiness, Breadcrumb, FAQ (via `buildLocationPageSchemaSet`). No Service schema.
- **Service/location pages:** LocalBusiness, Service, Breadcrumb, ItemList (service includes), FAQ (via `buildServiceLocationPageSchemaSet`).
- **Area pages:** LocalBusiness, Breadcrumb, FAQ (via `buildAreaPageSchemaSet`).

Provider reference is centralized via `buildProviderReference()`. Breadcrumb labels: Home; service name; `${location.name} Cleaning Services`; `${service.name} in ${location.name}` as applicable.

## Sitemap coverage

Generated entries (deduplicated by URL):

- Homepage
- `/book`
- All 5 service pages
- All 6 pure location pages
- All 3 area pages (`/tulsa-cleaning-services`, `/broken-arrow-cleaning-services`, `/bixby-cleaning-services`)
- All 5 × 6 service/location pages

No admin or internal-only URLs. Sitemap is written to `dist/sitemap.xml` at build time.

## Booking entry coverage

- **Path:** `/book`
- **Query params:** `service` (optional), `location` (optional). Valid values are seeded service and location slugs only; invalid params are ignored (no 404).
- **Metadata:** `buildBookingMetadata(parseBookingSeoParams(searchParams))`.
- **Copy:** `getBookingPageHeading(service?.name, location?.name)`, `getBookingPageIntro()`.

## Index coverage guardrails

- **robots.txt:** `Allow: /`, `Disallow: /admin`, `Disallow: /login`. Sitemap URL included. Keeps crawl focus on public SEO pages.

## Rule for new pages

Every new page should answer: Does this help search engines understand **what service**, **in what location**, and **how to book**? If not, it shouldn’t exist.

## Image SEO (when adding images)

Use descriptive, location/service-specific alt text (e.g. `alt="House cleaning service in Tulsa"`, `alt="Move-out cleaning kitchen"`). Avoid generic alt text.
