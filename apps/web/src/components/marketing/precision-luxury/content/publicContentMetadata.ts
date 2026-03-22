import type { Metadata } from "next";
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
};

export function buildPublicMetadata({
  title,
  description,
  pathname,
  type = "website",
  noIndex = false,
}: PublicMetadataInput): Metadata {
  const absoluteUrl = `${PUBLIC_SITE_URL}${pathname}`;

  return {
    title: `${title} | ${PUBLIC_SITE_NAME}`,
    description,
    alternates: {
      canonical: absoluteUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
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
    description:
      "Book a premium residential cleaning experience with a calm, guided flow built around trust, clarity, and high-end service presentation.",
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
