import { getAllServiceEntries, getServiceBySlug } from "../content/publicContentSelectors";

export type BookingServiceCatalogItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  meta: string;
  summaryLabel: string;
  bookingTag: string;
};

export const bookingServiceCatalog: BookingServiceCatalogItem[] = getAllServiceEntries().map(
  (service) => ({
    id: service.slug,
    slug: service.slug,
    title: service.title.replace(/, positioned.*$/i, "").replace(/, presented.*$/i, ""),
    shortDescription: service.shortDescription,
    meta: service.bookingMeta,
    summaryLabel: service.title
      .replace(/, positioned.*$/i, "")
      .replace(/, presented.*$/i, ""),
    bookingTag: service.bookingTag,
  }),
);

export function getBookingServiceCatalogItem(serviceId: string) {
  return (
    bookingServiceCatalog.find((item) => item.id === serviceId) ??
    bookingServiceCatalog[0]
  );
}

export function getBookingServiceCatalogItemBySlug(slug: string) {
  return bookingServiceCatalog.find((item) => item.slug === slug);
}

export function getBookingDefaultServiceId() {
  return bookingServiceCatalog[0]?.id ?? "deep-cleaning";
}

export function isValidBookingServiceId(value: string | null): value is string {
  return !!value && Boolean(getServiceBySlug(value));
}
