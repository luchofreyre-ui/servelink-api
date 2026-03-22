import { Link } from "react-router-dom";
import { useState } from "react";
import { SERVICE_DEFINITIONS } from "../../seo/seoConfig";
import { AREA_PAGE_CITY_SLUGS } from "../../seo/seoConfig";
import { getLocationBySlug } from "../../seo/seoValidation";
import { getAreaPagePath } from "../../seo/seoUrls";

export function SiteNav() {
  const [locationsOpen, setLocationsOpen] = useState(false);

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="font-semibold text-gray-900 no-underline hover:text-gray-700">
          Nu Standard Cleaning
        </Link>
        <ul className="flex flex-wrap items-center gap-6 text-sm">
          {SERVICE_DEFINITIONS.map((s) => (
            <li key={s.slug}>
              <Link to={`/${s.slug}`} className="text-gray-700 no-underline hover:text-gray-900">
                {s.name}
              </Link>
            </li>
          ))}
          <li className="relative">
            <button
              type="button"
              onClick={() => setLocationsOpen((o) => !o)}
              className="flex items-center gap-1 text-gray-700 hover:text-gray-900"
              aria-expanded={locationsOpen}
              aria-haspopup="true"
            >
              Locations
              <span className="text-xs">▼</span>
            </button>
            {locationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden="true"
                  onClick={() => setLocationsOpen(false)}
                />
                <ul className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded border bg-white py-2 shadow">
                  {AREA_PAGE_CITY_SLUGS.map((slug) => {
                    const loc = getLocationBySlug(slug);
                    if (!loc) return null;
                    return (
                      <li key={slug}>
                        <Link
                          to={getAreaPagePath(slug)}
                          className="block px-4 py-2 text-gray-700 no-underline hover:bg-gray-50"
                          onClick={() => setLocationsOpen(false)}
                        >
                          {loc.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </li>
          <li>
            <Link
              to="/book"
              className="rounded-lg bg-gray-900 px-3 py-2 text-white no-underline hover:bg-gray-800"
            >
              Book now
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
