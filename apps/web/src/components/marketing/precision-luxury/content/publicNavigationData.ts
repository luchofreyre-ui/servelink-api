export const publicPrimaryNavItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Questions", href: "/questions/how-often-should-a-house-be-cleaned" },
  { label: "Guides", href: "/guides/deep-cleaning-vs-recurring-cleaning" },
  { label: "Book", href: "/book" },
];

export const publicFooterColumns = [
  {
    title: "Services",
    links: [
      { label: "Deep Cleaning", href: "/services/deep-cleaning" },
      { label: "Recurring Home Cleaning", href: "/services/recurring-home-cleaning" },
      { label: "Move-In / Move-Out", href: "/services/move-in-move-out" },
      { label: "All Services", href: "/services" },
    ],
  },
  {
    title: "Learn",
    links: [
      {
        label: "How often should a house be cleaned?",
        href: "/questions/how-often-should-a-house-be-cleaned",
      },
      {
        label: "Deep cleaning vs recurring cleaning",
        href: "/guides/deep-cleaning-vs-recurring-cleaning",
      },
    ],
  },
  {
    title: "Booking",
    links: [
      { label: "Start Booking", href: "/book" },
      { label: "Book Deep Cleaning", href: "/book?service=deep-cleaning" },
      {
        label: "Book Recurring Cleaning",
        href: "/book?service=recurring-home-cleaning",
      },
    ],
  },
];
