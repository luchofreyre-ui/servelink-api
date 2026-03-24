import { AuthoritySitemapSection, AuthoritySitemapUrlEntry } from "../types/authoritySitemapTypes";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildUrlSetXml(urls: AuthoritySitemapUrlEntry[]): string {
  const body = urls
    .map(
      (item) => `<url><loc>${escapeXml(item.url)}</loc><lastmod>${escapeXml(
        item.lastModified
      )}</lastmod></url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function buildSitemapIndexXml(sections: AuthoritySitemapSection[]): string {
  const body = sections
    .map(
      (section) =>
        `<sitemap><loc>${escapeXml(
          `https://www.nustandardcleaning.com/sitemaps/${section.slug}.xml`
        )}</loc></sitemap>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}
