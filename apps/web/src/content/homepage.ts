export type HomepageFaqItem = { question: string; answer: string };

export const HOMEPAGE_CONTENT = {
  heroTitle: "Professional Cleaning Services in Tulsa and Surrounding Areas",
  heroSubtitle:
    "Book house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning with Nu Standard Cleaning.",
  primaryCtaLabel: "Book now",
  primaryCtaHref: "/book",
  serviceSectionTitle: "Cleaning services",
  locationSectionTitle: "Areas we serve",
  trustSectionTitle: "Why book with Nu Standard Cleaning",
  faqSectionTitle: "Frequently asked questions",
  intro:
    "Nu Standard Cleaning offers house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning in Tulsa and surrounding areas. Book online with clear scheduling and service options.",
  faq: [
    {
      question: "What cleaning services can I book?",
      answer:
        "You can book house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning. Each service has a dedicated page with details and booking.",
    },
    {
      question: "Do you serve areas outside Tulsa?",
      answer:
        "We serve Tulsa and surrounding areas including Broken Arrow, Bixby, and several Tulsa neighborhoods. Check the areas we serve for coverage.",
    },
    {
      question: "How do I book a cleaning?",
      answer:
        "Use the Book now button to go to the booking flow. Choose your service and area, then follow the steps to select date and complete your request.",
    },
    {
      question: "When do I see pricing and availability?",
      answer:
        "Pricing and availability are shown during the booking process after you enter your details and service preferences.",
    },
  ] as HomepageFaqItem[],
} as const;
