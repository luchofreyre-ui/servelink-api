# Nu Standard Cleaning — SEO Architecture

This document defines the SEO system plan for the Nu Standard Cleaning public site so that SEO is a mandatory part of the build process.

## 1. Core services (taxonomy)

- **House cleaning** — recurring and one-time residential cleaning
- **Deep cleaning** — intensive whole-home or room-specific deep cleans
- **Move-out cleaning** — pre/post move cleaning
- **Recurring cleaning** — scheduled ongoing service
- **Airbnb cleaning** — turnover cleaning for short-term rentals

## 2. URL architecture

### Programmatic SEO rules

- **Service pages (canonical):**  
  `/{service-slug}`  
  Examples: `/house-cleaning`, `/deep-cleaning`, `/move-out-cleaning`, `/recurring-cleaning`, `/airbnb-cleaning`

- **City pages:**  
  `/{service-slug}/{city-slug}`  
  Example: `/house-cleaning/tulsa`

- **Neighborhood / area pages:**  
  `/{service-slug}/{city-slug}/{neighborhood-slug}`  
  Example: `/house-cleaning/brookside-tulsa`

### City domination model

- Target one primary metro (e.g. Tulsa) with full neighborhood coverage.
- City pages and neighborhood pages share the same template and data model; neighborhood is a child of city.

### Neighborhood expansion model

- Add neighborhoods under a city as coverage and content are ready.
- Each neighborhood gets a dedicated URL and internal links from the city page and from the service page.

## 3. Structured data requirements

- **LocalBusiness** (or **CleaningService**) on service and city/neighborhood pages.
- **FAQPage** where FAQ blocks exist.
- **Review** / **AggregateRating** when review content is present.
- **BreadcrumbList** for service → city → neighborhood hierarchy.

## 4. Internal linking model

- Service pages link to all city pages for that service.
- City pages link to all neighborhood pages for that city and back to the service page.
- Neighborhood pages link to parent city and to the service page.
- Global nav and footer reinforce service → city → neighborhood paths.

## 5. Review content model

- Reviews can be surfaced as blocks on service, city, or neighborhood pages.
- Schema markup (Review / AggregateRating) must match the content shown (no fake or placeholder ratings).

## 6. Public page templates

- **Service template:** H1 = service name, intro, benefits, pricing/CTA, FAQ block, review block, city links.
- **City template:** H1 = “[Service] in [City]”, intro, coverage, neighborhoods list, FAQ, reviews, CTA.
- **Neighborhood template:** H1 = “[Service] in [Neighborhood], [City]”, intro, coverage, CTA, FAQ, reviews.

## 7. Booking / availability / pricing data surfaces for SEO

- Next availability (e.g. “Next available: [date]”) can power dynamic copy or schema.
- Average service price (by service + geo) can power “from $X” or price range schema where accurate.
- Completed job counts and ratings/review counts can power trust signals and AggregateRating.
- Neighborhood coverage and service frequency trends can power city/neighborhood page content.

All such data must be exposed via platform APIs or feeds that the public site (or static build) can consume without compromising security or PII.
