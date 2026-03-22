export type PublicContentKind = "service" | "question" | "guide";

type BasePublicContentEntry = {
  slug: string;
  kind: PublicContentKind;
  title: string;
  eyebrow: string;
  description: string;
  heroBody: string;
  relatedSlugs: string[];
};

export type PublicServiceEntry = BasePublicContentEntry & {
  kind: "service";
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  includedTitle: string;
  includedItems: string[];
  notIncludedTitle: string;
  notIncludedItems: string[];
  processTitle: string;
  processBody: string;
  processSteps: Array<{
    step: string;
    title: string;
    body: string;
  }>;
  positioningTitle: string;
  positioningBody: string;
  positioningCallout: string;
  faqTitle: string;
  faqs: Array<{
    q: string;
    a: string;
  }>;
  bookingTag: string;
  bookingMeta: string;
  shortDescription: string;
  serviceBadge: string;
};

export type PublicArticleEntry = BasePublicContentEntry & {
  kind: "question" | "guide";
  sectionOne: {
    eyebrow: string;
    title: string;
    body: string;
    callout: string;
  };
  sectionTwo: {
    eyebrow: string;
    title: string;
    body: string;
    points: string[];
  };
  faqTitle: string;
  faqs: Array<{
    q: string;
    a: string;
  }>;
  ctaTitle: string;
  ctaBody: string;
};

export type PublicContentEntry = PublicServiceEntry | PublicArticleEntry;

export const PUBLIC_SITE_NAME = "Nu Standard Cleaning";
export const PUBLIC_SITE_URL = "https://nustandardcleaning.com";

export const publicContentRegistry: PublicContentEntry[] = [
  {
    slug: "deep-cleaning",
    kind: "service",
    eyebrow: "Service detail",
    title: "Deep cleaning, presented as a premium residential reset.",
    description:
      "Premium deep cleaning service designed for first visits, seasonal resets, and homes that need more than standard upkeep.",
    heroBody:
      "This page is the template direction for service-detail pages that need to feel useful, premium, clear, and directly connected to booking intent.",
    relatedSlugs: [
      "recurring-home-cleaning",
      "move-in-move-out",
      "deep-cleaning-vs-recurring-cleaning",
      "how-often-should-a-house-be-cleaned",
    ],
    primaryCtaLabel: "Book Deep Cleaning",
    secondaryCtaLabel: "Get Pricing",
    includedTitle: "Built for a higher level of visible detail.",
    includedItems: [
      "High-touch surface cleaning throughout key living spaces",
      "Detailed kitchen wipe-down with visible buildup reduction",
      "Bathroom reset focused on fixtures, tile, mirrors, and moisture-prone zones",
      "Targeted attention on trim, reachable corners, and overlooked detail areas",
    ],
    notIncludedTitle: "Clear boundaries protect the premium feel.",
    notIncludedItems: [
      "Hazard cleanup or biohazard remediation",
      "Exterior pressure washing or outdoor maintenance",
      "Permanent stain restoration on damaged materials",
      "Specialty restoration requiring trade-specific repair work",
    ],
    processTitle: "Service pages should feel useful, not salesy.",
    processBody:
      "This section gives clients enough context to understand when they need the service, why it matters, and how it fits into a longer-term care plan.",
    processSteps: [
      {
        step: "01",
        title: "Assess the home",
        body: "We frame the visit around layout, buildup level, moisture zones, and the areas most likely to affect the overall result.",
      },
      {
        step: "02",
        title: "Apply the right level of detail",
        body: "The service is delivered with a deeper standard than maintenance cleaning, prioritizing visible reset, edge work, and higher-attention areas.",
      },
      {
        step: "03",
        title: "Leave the space feeling reset",
        body: "The result should feel lighter, calmer, and visibly more complete — the kind of clean clients immediately notice when they walk in.",
      },
    ],
    positioningTitle:
      "This is how Nu Standard avoids looking like a commodity cleaning company.",
    positioningBody:
      "A page like this sells through clarity, restraint, and confidence. It does not need loud discounts, exaggerated promises, or overloaded visuals.",
    positioningCallout:
      "This is the direction that turns a service-detail page into part of the brand moat.",
    faqTitle:
      "The page should answer the questions premium clients ask before they book.",
    faqs: [
      {
        q: "Who is deep cleaning best for?",
        a: "It is ideal for first-time clients, seasonal resets, homes preparing for guests, and spaces that need more than standard upkeep.",
      },
      {
        q: "How is this different from recurring cleaning?",
        a: "Recurring cleaning is designed for ongoing maintenance. Deep cleaning applies a higher level of effort to buildup, neglected areas, and the details that need a stronger reset.",
      },
      {
        q: "Should this be my first appointment?",
        a: "In many cases, yes. It creates the right baseline for future recurring service and sets expectations around the quality of the home’s overall condition.",
      },
    ],
    bookingTag: "Reset",
    bookingMeta: "Best starting point",
    shortDescription:
      "For first visits, seasonal resets, or homes that need more than light maintenance.",
    serviceBadge: "Best for first visits",
  },
  {
    slug: "recurring-home-cleaning",
    kind: "service",
    eyebrow: "Service detail",
    title: "Recurring home cleaning, positioned as an ongoing standard of calm and control.",
    description:
      "Premium recurring home cleaning built for consistency, presentation, and a calmer weekly household standard.",
    heroBody:
      "This page demonstrates how recurring service should be framed: less as a chore solution and more as a dependable system for preserving presentation and reducing household-management stress.",
    relatedSlugs: [
      "deep-cleaning",
      "how-often-should-a-house-be-cleaned",
      "deep-cleaning-vs-recurring-cleaning",
    ],
    primaryCtaLabel: "Book Recurring Cleaning",
    secondaryCtaLabel: "Get Pricing",
    includedTitle: "Designed to preserve the standard before it slips.",
    includedItems: [
      "Consistent upkeep across the rooms that define the day-to-day feel of the home",
      "Presentation-focused cleaning for kitchens, bathrooms, and lived-in surfaces",
      "Repeatable service rhythm that reduces reactive catch-up cleaning",
      "A calmer baseline that supports premium residential presentation",
    ],
    notIncludedTitle: "Recurring service is maintenance, not restoration.",
    notIncludedItems: [
      "Heavy first-visit recovery best suited for deep cleaning",
      "Specialty remediation or restoration work",
      "Exterior or trade-specific services",
      "Project-style one-time scope outside normal upkeep rhythm",
    ],
    processTitle: "Clients should understand why recurring care changes the experience.",
    processBody:
      "This template should make it clear that recurring cleaning is not just about frequency. It is about maintaining a standard before disorder becomes visible.",
    processSteps: [
      {
        step: "01",
        title: "Establish the baseline",
        body: "Start from a condition that supports maintenance rather than constant recovery.",
      },
      {
        step: "02",
        title: "Protect the presentation",
        body: "Use recurring visits to preserve the feeling of order across the spaces that matter most.",
      },
      {
        step: "03",
        title: "Reduce household-management stress",
        body: "The service should create consistency, predictability, and less cleaning pressure between visits.",
      },
    ],
    positioningTitle:
      "Recurring service should feel like a premium operating rhythm for the home.",
    positioningBody:
      "That framing gives the offer more value and more clarity than generic weekly-cleaning language.",
    positioningCallout:
      "Recurring care is how premium presentation becomes easier to maintain, not harder to recover.",
    faqTitle:
      "The page should answer the questions clients ask before committing to a schedule.",
    faqs: [
      {
        q: "Is recurring cleaning only for large homes?",
        a: "No. It is for any household that values consistency, presentation, and reduced cleaning stress between visits.",
      },
      {
        q: "Should I start with recurring cleaning or deep cleaning?",
        a: "If the home needs a stronger reset first, deep cleaning usually creates the right baseline before recurring service begins.",
      },
      {
        q: "Why does recurring service feel more premium in this system?",
        a: "Because it is positioned as a standard-preserving service, not just a commodity task repeated on a schedule.",
      },
    ],
    bookingTag: "Maintenance",
    bookingMeta: "Most common long-term fit",
    shortDescription:
      "For clients who want an ongoing standard of presentation and less household-management stress.",
    serviceBadge: "Best for maintenance",
  },
  {
    slug: "move-in-move-out",
    kind: "service",
    eyebrow: "Service detail",
    title: "Move-in / move-out cleaning, positioned for transitions, presentation, and handoff readiness.",
    description:
      "Premium transition cleaning designed for handoffs, listings, fresh starts, and property-ready presentation.",
    heroBody:
      "This page demonstrates how transition cleaning should be framed as a polished handoff service that supports fresh starts, listings, and property-ready presentation.",
    relatedSlugs: [
      "deep-cleaning",
      "deep-cleaning-vs-recurring-cleaning",
    ],
    primaryCtaLabel: "Book Move-In / Move-Out",
    secondaryCtaLabel: "Get Pricing",
    includedTitle: "Built for transitions where presentation matters immediately.",
    includedItems: [
      "Whole-home visual reset designed for handoff readiness",
      "Kitchen and bathroom attention where move-related standards are judged fastest",
      "Clearer presentation for listings, fresh occupancy, and exit condition",
      "A service posture built around transition confidence",
    ],
    notIncludedTitle: "This service is for polished transitions, not repair work.",
    notIncludedItems: [
      "Repairs, patching, or restoration of damaged materials",
      "Trash haul-away or construction debris removal",
      "Exterior property cleanup",
      "Hazard or specialty remediation",
    ],
    processTitle: "Transition pages should emphasize readiness, not generic cleaning language.",
    processBody:
      "The client should understand that this is about handoff quality, listing presentation, and the confidence that comes with a visibly reset property.",
    processSteps: [
      {
        step: "01",
        title: "Frame the transition",
        body: "Assess whether the priority is move-in freshness, move-out presentation, or listing readiness.",
      },
      {
        step: "02",
        title: "Reset visible standards",
        body: "Prioritize the rooms and surfaces that most strongly influence the first impression.",
      },
      {
        step: "03",
        title: "Support a cleaner handoff",
        body: "Leave the property feeling more complete, more intentional, and easier to step into or turn over.",
      },
    ],
    positioningTitle:
      "Transition cleaning should feel like a presentation service, not a generic add-on.",
    positioningBody:
      "That positioning creates better client fit and a stronger premium perception.",
    positioningCallout:
      "The goal is a cleaner handoff, a stronger first impression, and more confidence around the transition itself.",
    faqTitle:
      "The page should resolve the questions clients ask when timing and presentation both matter.",
    faqs: [
      {
        q: "Is this better for move-in or move-out?",
        a: "Both. The framing changes slightly, but the core value is supporting a cleaner, more confident transition.",
      },
      {
        q: "Is this the same as deep cleaning?",
        a: "Not exactly. The service overlaps in intensity, but transition cleaning is positioned around handoff readiness and presentation.",
      },
      {
        q: "Should this be booked before listing photos or after moving out?",
        a: "That depends on the goal, but either way the value is strongest when the property needs to present well immediately.",
      },
    ],
    bookingTag: "Transition",
    bookingMeta: "Best for transitions",
    shortDescription:
      "For transitions, handoffs, listing prep, and property-ready presentation.",
    serviceBadge: "Best for transitions",
  },
  {
    slug: "how-often-should-a-house-be-cleaned",
    kind: "question",
    eyebrow: "Nu Standard Q&A",
    title: "How often should a house be cleaned to maintain a premium standard?",
    description:
      "A premium answer to how often a home should be cleaned, framed around presentation, traffic, and household-management pressure.",
    heroBody:
      "This page demonstrates how Q&A content should feel inside the Precision Luxury system: useful, calm, premium, and clearly connected to booking intent.",
    relatedSlugs: [
      "recurring-home-cleaning",
      "deep-cleaning",
      "deep-cleaning-vs-recurring-cleaning",
    ],
    sectionOne: {
      eyebrow: "The short answer",
      title: "The right schedule depends on lifestyle, traffic, and how polished you want the home to feel day to day.",
      body: "Some homes can hold their standard with bi-weekly care. Others need weekly attention to keep surfaces, presentation, and stress levels where clients want them.",
      callout:
        "The best cadence is the one that protects the feeling of order before buildup becomes visible.",
    },
    sectionTwo: {
      eyebrow: "What shapes the answer",
      title: "Cleaning frequency is really a presentation and management question.",
      body: "This is how Nu Standard should frame expertise: not as generic cleaning advice, but as a smarter way to think about upkeep, consistency, and household pressure.",
      points: [
        "Children and pets increase visual drift faster.",
        "Bathrooms and kitchens set the emotional tone of the home.",
        "A premium standard is easier to maintain than to recover.",
        "Recurring care reduces the stress of reactive cleaning.",
      ],
    },
    faqTitle: "Questions clients ask before choosing a recurring schedule",
    faqs: [
      {
        q: "Is weekly cleaning too often?",
        a: "Not for homes with higher traffic, children, pets, or a strong preference for polished day-to-day presentation.",
      },
      {
        q: "Is bi-weekly enough for most homes?",
        a: "For many households, yes. It is often the best balance between upkeep, appearance, and household-management relief.",
      },
      {
        q: "When does one-time cleaning stop being enough?",
        a: "When buildup starts dictating the cleaning experience instead of maintenance protecting the standard.",
      },
    ],
    ctaTitle: "Turn useful guidance into a real booking path.",
    ctaBody:
      "Q&A content should not sit in isolation. It should lead naturally into service understanding and booking intent.",
  },
  {
    slug: "deep-cleaning-vs-recurring-cleaning",
    kind: "guide",
    eyebrow: "Nu Standard Guide",
    title: "Deep cleaning vs recurring cleaning: how premium service pages should educate the difference.",
    description:
      "A premium guide comparing deep cleaning and recurring cleaning through service fit, presentation, and booking confidence.",
    heroBody:
      "This guide sample demonstrates how encyclopedia and educational content can share the same visual language as the core conversion pages without feeling repetitive.",
    relatedSlugs: [
      "deep-cleaning",
      "recurring-home-cleaning",
      "how-often-should-a-house-be-cleaned",
      "move-in-move-out",
    ],
    sectionOne: {
      eyebrow: "The distinction",
      title: "Recurring cleaning protects the standard. Deep cleaning restores it.",
      body: "That distinction should be made visually and verbally throughout the site. It helps clients self-select correctly and improves confidence before booking.",
      callout:
        "The best educational content reduces confusion and improves service fit before the first appointment happens.",
    },
    sectionTwo: {
      eyebrow: "How to position it",
      title: "This is where educational content becomes part of the moat.",
      body: "The purpose of the content system is not just SEO volume. It is to make the company feel more informed, more useful, and more premium than generic competitors.",
      points: [
        "Use clear service-language, not jargon.",
        "Tie education back to booking decisions.",
        "Keep the visual structure premium and restrained.",
        "Make every page feel connected to the main brand.",
      ],
    },
    faqTitle: "Guide follow-up questions",
    faqs: [
      {
        q: "Should first-time clients start with deep cleaning?",
        a: "Often yes, because it establishes the right baseline for ongoing maintenance.",
      },
      {
        q: "Can recurring cleaning recover a neglected home?",
        a: "Not efficiently. Recovery and maintenance are different service states and should be framed that way.",
      },
      {
        q: "Why does this matter for conversion?",
        a: "When clients understand the service fit more clearly, they feel more confident moving into booking.",
      },
    ],
    ctaTitle: "Build educational depth without losing conversion quality.",
    ctaBody:
      "The template system should scale across questions, guides, and encyclopedia pages while still looking like one premium brand.",
  },
];
