import type { Metadata } from "next";
import { BOOKING_PAGE_DESCRIPTION } from "../booking/bookingSeo";
import {
  PUBLIC_SITE_NAME,
  PUBLIC_SITE_URL,
  type PublicContentEntry,
} from "./publicContentRegistry";

type PublicMetadataInput = {
  title: string;
  description: string;
  pathname: string;
  type?: "website" | "article";
  noIndex?: boolean;
  /**
   * Explicit search indexing for authority SEO. When true: index, follow. When false: noindex, follow.
   * Omit to keep default (no robots field unless noIndex).
   */
  allowSearchIndexing?: boolean;
};

export function buildPublicMetadata({
  title,
  description,
  pathname,
  type = "website",
  noIndex = false,
  allowSearchIndexing,
}: PublicMetadataInput): Metadata {
  const absoluteUrl = `${PUBLIC_SITE_URL}${pathname}`;

  let robots: Metadata["robots"];
  if (noIndex) {
    robots = { index: false, follow: false };
  } else if (allowSearchIndexing === true) {
    robots = { index: true, follow: true };
  } else if (allowSearchIndexing === false) {
    robots = { index: false, follow: true };
  } else {
    robots = undefined;
  }

  return {
    title: `${title} | ${PUBLIC_SITE_NAME}`,
    description,
    alternates: {
      canonical: absoluteUrl,
    },
    robots,
    openGraph: {
      title: `${title} | ${PUBLIC_SITE_NAME}`,
      description,
      url: absoluteUrl,
      siteName: PUBLIC_SITE_NAME,
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${PUBLIC_SITE_NAME}`,
      description,
    },
  };
}

export function buildHomepageMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Premium Home Cleaning",
    description:
      "A premium home cleaning experience built on calm, trust, and precision.",
    pathname: "/",
    type: "website",
  });
}

export function buildServicesHubMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Cleaning Services",
    description:
      "Explore premium residential cleaning services clearly organized around the result you want.",
    pathname: "/services",
    type: "website",
  });
}

export function buildBookingPageMetadata(): Metadata {
  return buildPublicMetadata({
    title: "Book Premium Home Cleaning",
    description: BOOKING_PAGE_DESCRIPTION,
    pathname: "/book",
    type: "website",
  });
}

export function buildPublicEntryMetadata(entry: PublicContentEntry): Metadata {
  const pathname =
    entry.kind === "service"
      ? `/services/${entry.slug}`
      : entry.kind === "question"
        ? `/questions/${entry.slug}`
        : `/guides/${entry.slug}`;

  return buildPublicMetadata({
    title: entry.title,
    description: entry.description,
    pathname,
    type: entry.kind === "service" ? "website" : "article",
  });
}

export function buildPublicNotFoundMetadata(
  title: string,
  description: string,
): Metadata {
  return buildPublicMetadata({
    title,
    description,
    pathname: "/404",
    noIndex: true,
  });
}
