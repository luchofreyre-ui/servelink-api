import type { MetadataRoute } from "next";
import { PUBLIC_SITE_URL } from "@/components/marketing/precision-luxury/content/publicContentRegistry";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/services", "/book", "/questions", "/guides"],
      disallow: ["/admin", "/customer", "/fo", "/notifications"],
    },
    sitemap: `${PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
