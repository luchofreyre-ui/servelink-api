import type { MetadataRoute } from "next";
import {
  PUBLIC_SITE_URL,
} from "@/components/marketing/precision-luxury/content/publicContentRegistry";
import {
  getAllGuideEntries,
  getAllQuestionEntries,
  getAllServiceEntries,
} from "@/components/marketing/precision-luxury/content/publicContentSelectors";
import { buildEncyclopediaSitemapAbsoluteUrls } from "@/lib/encyclopedia/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${PUBLIC_SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${PUBLIC_SITE_URL}/services`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${PUBLIC_SITE_URL}/book`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = getAllServiceEntries().map((entry) => ({
    url: `${PUBLIC_SITE_URL}/services/${entry.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const questionRoutes: MetadataRoute.Sitemap = getAllQuestionEntries().map((entry) => ({
    url: `${PUBLIC_SITE_URL}/questions/${entry.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const guideRoutes: MetadataRoute.Sitemap = getAllGuideEntries().map((entry) => ({
    url: `${PUBLIC_SITE_URL}/guides/${entry.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const enc = buildEncyclopediaSitemapAbsoluteUrls(PUBLIC_SITE_URL);
  const encyclopediaRoutes: MetadataRoute.Sitemap = [
    ...enc.encyclopediaRoot,
    ...enc.categoryListings,
    ...enc.clusterHubs,
    ...enc.articles,
  ];

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...questionRoutes,
    ...guideRoutes,
    ...encyclopediaRoutes,
  ];
}
