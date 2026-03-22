import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync } from "fs";
import { join } from "path";
import { generateSitemapEntries } from "./src/seo/sitemap";

function sitemapPlugin() {
  return {
    name: "sitemap",
    closeBundle() {
      const entries = generateSitemapEntries();
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url>\n    <loc>${e.url}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}${e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ""}${e.priority != null ? `\n    <priority>${e.priority}</priority>` : ""}\n  </url>`
  )
  .join("\n")}
</urlset>`;
      const out = join(process.cwd(), "dist", "sitemap.xml");
      writeFileSync(out, xml, "utf8");
      console.log("Wrote sitemap.xml to dist");
    },
  };
}

export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  server: { port: 3002 },
});
