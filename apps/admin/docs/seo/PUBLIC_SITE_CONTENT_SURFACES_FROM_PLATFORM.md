# Public-site content surfaces from platform

Documentation of which Servelink/platform data can power SEO and public-site pages.

## Data surfaces (for SEO and content)

| Surface | Description | Use on public site |
|--------|----------------------|---------------------|
| **Next availability** | Next available booking window(s) by service/geo | “Next available: [date]” copy, limited schema |
| **Average service price** | Aggregated price by service type and optionally geography | “From $X” or price range; ensure accuracy and compliance |
| **Completed job counts** | Count of completed bookings (by service, city, neighborhood) | Trust signals (“X cleanings completed in [area]”) |
| **Ratings** | Aggregate rating and count by service/FO/area as applicable | AggregateRating schema, review blocks |
| **Review counts** | Number of reviews available | Display and schema |
| **Neighborhood coverage** | Which neighborhoods are served (and optionally service mix) | City/neighborhood page content and internal links |
| **Service frequency trends** | Popular services or cadence by area (if available) | Supporting copy or “Popular in [area]” |

## Implementation notes

- All data exposed to the public site must be non-PII and safe for caching where used.
- Pricing and availability should be kept in sync with booking flows to avoid misleading users.
- Review and rating data must match what is shown (no placeholder or fake schema).
- This document should be updated when new platform capabilities are added that can power SEO or public content.
