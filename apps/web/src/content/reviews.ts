/**
 * Service-expectation review-style content blocks. Not fake customer testimonials.
 */

export type ReviewExpectationItem = {
  id: string;
  title: string;
  body: string;
  contextLabel: string;
};

export const REVIEW_EXPECTATION_BLOCKS: ReviewExpectationItem[] = [
  {
    id: "booking-clarity",
    title: "Booking clarity",
    body: "Customers look for a clear path from choosing a service to confirming a booking. Transparent steps, service options, and scheduling choices help people know what to expect before they book.",
    contextLabel: "Service expectations",
  },
  {
    id: "service-scope",
    title: "Service scope",
    body: "People want to understand what is included in each cleaning service—what tasks are covered, what they need to prepare, and how the visit will work. Clear scope reduces uncertainty and supports informed decisions.",
    contextLabel: "Service expectations",
  },
  {
    id: "scheduling-visibility",
    title: "Scheduling visibility",
    body: "Visibility into when cleaning is available and how to pick a time matters to customers. When booking shows availability and next steps clearly, it supports planning and reduces back-and-forth.",
    contextLabel: "Service expectations",
  },
];
