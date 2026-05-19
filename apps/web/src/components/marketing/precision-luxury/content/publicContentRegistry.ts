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
  bookingServiceSlug?: string;
  serviceDepth: {
    summaryEyebrow: string;
    summaryTitle: string;
    summaryBody: string;
    bestFor: string[];
    focusAreas: Array<{
      title: string;
      body: string;
    }>;
    zones: Array<{
      zone: string;
      emphasis: string;
      examples: string[];
    }>;
    afterVisit: string[];
    differentiation: {
      title: string;
      body: string;
    };
  };
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
    title: "Deep cleaning for a premium residential reset.",
    description:
      "Premium deep cleaning service designed for first visits, seasonal resets, and homes that need more than standard upkeep.",
    heroBody:
      "A deeper service for first visits, seasonal resets, and homes that need visible detail beyond routine upkeep.",
    relatedSlugs: [
      "recurring-home-cleaning",
      "move-in-move-out",
      "deep-cleaning-vs-recurring-cleaning",
      "how-often-should-a-house-be-cleaned",
    ],
    primaryCtaLabel: "Book Deep Cleaning",
    secondaryCtaLabel: "Get Pricing",
    serviceDepth: {
      summaryEyebrow: "Residential reset",
      summaryTitle: "Best when the home needs a stronger baseline before regular upkeep.",
      summaryBody:
        "Deep cleaning concentrates effort where visible buildup, edges, moisture, and touch points make the home feel behind. It is designed as a reset, not a routine maintenance pass.",
      bestFor: [
        "First appointments before recurring service begins",
        "Seasonal resets after long stretches between visits",
        "Homes with visible buildup in kitchens, baths, edges, or corners",
        "Preparing for guests, hosting, or a cleaner household baseline",
      ],
      focusAreas: [
        {
          title: "Buildup recovery",
          body: "More time goes toward areas that collect residue, fingerprints, mineral haze, and layered daily use.",
        },
        {
          title: "Detail visibility",
          body: "Edges, reachable corners, trim, fixtures, mirrors, and touch points receive closer attention than a standard upkeep visit.",
        },
        {
          title: "Reset pacing",
          body: "The visit is planned around condition and effort, so the team can prioritize the spaces that most affect the overall feel.",
        },
      ],
      zones: [
        {
          zone: "Kitchens",
          emphasis: "Degrease visible work zones and reset high-use surfaces.",
          examples: ["Counter edges", "Cabinet fronts", "Appliance exteriors", "Sink and fixture detail"],
        },
        {
          zone: "Bathrooms",
          emphasis: "Lift the rooms where moisture, mirrors, tile, and fixtures show drift fastest.",
          examples: ["Vanities", "Mirrors", "Shower glass", "Fixture shine"],
        },
        {
          zone: "Detail areas",
          emphasis: "Bring attention to the places routine cleaning often moves past quickly.",
          examples: ["Baseboards", "Reachable corners", "Door touch points", "Trim ledges"],
        },
      ],
      afterVisit: [
        "Rooms feel easier to maintain because the baseline is cleaner.",
        "High-touch and high-visibility areas read more finished.",
        "Recurring service, if selected later, starts from a clearer standard.",
      ],
      differentiation: {
        title: "Deep cleaning differs from routine upkeep by concentrating effort where recovery is needed.",
        body: "Routine visits preserve a stable home. Deep cleaning is the better fit when buildup, detail areas, or first-visit expectations need more time and attention before maintenance makes sense.",
      },
    },
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
    processTitle: "A clear plan for a deeper reset.",
    processBody:
      "We focus the visit around the areas that most affect how clean, calm, and complete the home feels.",
    processSteps: [
      {
        step: "01",
        title: "Assess the home",
        body: "We look at layout, buildup level, moisture zones, and the areas most likely to affect the overall result.",
      },
      {
        step: "02",
        title: "Apply the right level of detail",
        body: "The service is delivered with a deeper standard than maintenance cleaning, prioritizing visible reset, edge work, and higher-attention areas.",
      },
      {
        step: "03",
        title: "Leave the space feeling reset",
        body: "The result is designed to feel lighter, calmer, and visibly more complete when you walk in.",
      },
    ],
    positioningTitle:
      "A deeper clean without noisy promises or discount pressure.",
    positioningBody:
      "Nu Standard keeps the offer clear: thoughtful preparation, disciplined execution, and a standard that feels elevated without being overcomplicated.",
    positioningCallout:
      "A deep clean is often the right first step when the home needs a stronger reset before ongoing care.",
    faqTitle: "Questions clients ask before booking a deep clean",
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
      {
        q: "How will I know when my team is arriving?",
        a: "After booking, you receive confirmation with your arrival window and coordinated updates in plain language—transparent scheduling and respectful communication before anyone arrives.",
      },
    ],
    bookingTag: "Reset",
    bookingMeta: "Best starting point",
    shortDescription:
      "For first visits, seasonal resets, or homes that need more than light maintenance.",
    serviceBadge: "Best for first visits",
  },
  {
    slug: "first-time-clean-with-recurring-services",
    kind: "service",
    eyebrow: "Service detail",
    title: "First-time clean with recurring services",
    description:
      "A reset-style first clean that prepares the home for easier recurring maintenance afterward.",
    heroBody:
      "Start with the right reset, then move into easier ongoing upkeep with a recurring rhythm that fits the home.",
    relatedSlugs: [
      "deep-cleaning",
      "recurring-home-cleaning",
      "deep-cleaning-vs-recurring-cleaning",
      "how-often-should-a-house-be-cleaned",
    ],
    primaryCtaLabel: "Book First-Time Recurring",
    secondaryCtaLabel: "View All Services",
    bookingServiceSlug: "recurring-home-cleaning",
    serviceDepth: {
      summaryEyebrow: "First visit reset",
      summaryTitle: "Start with the right reset, then move into easier ongoing upkeep.",
      summaryBody:
        "This service is for homes that need an initial catch-up before ongoing care begins. The first visit is more detailed than regular maintenance so the recurring rhythm starts from a clearer, more realistic baseline.",
      bestFor: [
        "Homes that want recurring service but need a stronger first clean",
        "Clients who do not want the first recurring visit to be under-scoped",
        "Busy households ready to move from catch-up cleaning into routine upkeep",
        "Spaces where kitchens, bathrooms, edges, or high-touch areas need reset attention first",
      ],
      focusAreas: [
        {
          title: "What happens first",
          body: "The opening visit is planned as a reset-style clean, with more attention on visible buildup, detail areas, and rooms that would make maintenance feel rushed if left for a standard recurring appointment.",
        },
        {
          title: "What changes after the first visit",
          body: "Once the baseline is stronger, recurring visits can focus on preserving the standard instead of repeatedly catching the home back up.",
        },
        {
          title: "Recurring handoff",
          body: "The first clean clarifies the condition of the home, then the ongoing rhythm protects kitchens, bathrooms, floors, touch points, and presentation between visits.",
        },
      ],
      zones: [
        {
          zone: "Kitchen and dining areas",
          emphasis:
            "Reset the surfaces and touch points that usually determine whether the home feels ready for maintenance.",
          examples: ["Counters", "Sink and fixtures", "Appliance exteriors", "Cabinet touch points"],
        },
        {
          zone: "Bathrooms",
          emphasis:
            "Give moisture-prone rooms a stronger first pass before they move into routine upkeep.",
          examples: ["Vanities", "Mirrors", "Fixtures", "Tubs and shower surfaces"],
        },
        {
          zone: "Recurring maintenance zones",
          emphasis:
            "After the reset, ongoing visits maintain the areas that shape day-to-day comfort and presentation.",
          examples: ["Floors", "High-touch surfaces", "Common rooms", "Entry areas"],
        },
      ],
      afterVisit: [
        "The home is better positioned for recurring maintenance rather than repeated catch-up.",
        "Future recurring visits become easier to maintain because the first clean addressed the starting condition.",
        "Expectations are clearer around what the opening visit resets and what the ongoing rhythm preserves.",
      ],
      differentiation: {
        title: "The first visit is intentionally more detailed than regular maintenance.",
        body: "A standard recurring visit is built to preserve a home that is already manageable. This first-time path helps bridge the gap when the home needs catch-up work before recurring service can do its job well.",
      },
    },
    includedTitle: "Built to move from reset into rhythm.",
    includedItems: [
      "A more detailed first visit that addresses the starting condition of the home",
      "Focused attention on kitchens, bathrooms, high-touch surfaces, and visible catch-up areas",
      "A smoother transition into weekly, bi-weekly, or monthly recurring maintenance",
      "Ongoing visits that maintain the baseline after the first reset-style clean",
    ],
    notIncludedTitle: "Not meant for every situation.",
    notIncludedItems: [
      "Homes that only need a one-time seasonal deep clean with no ongoing service plan",
      "Restoration, repair, hazard cleanup, or specialty remediation",
      "Project-style add-ons outside normal residential cleaning scope",
      "A regular maintenance visit when the home clearly needs reset-level work first",
    ],
    processTitle: "How first-time recurring service works.",
    processBody:
      "The visit starts with reset-level attention, then shifts into a recurring rhythm once the home is easier to maintain.",
    processSteps: [
      {
        step: "01",
        title: "Start with a reset-style first clean",
        body: "The opening visit gives more time and attention to catch-up areas so recurring service is not asked to solve a reset problem in a maintenance slot.",
      },
      {
        step: "02",
        title: "Clarify the ongoing handoff",
        body: "After the first visit, the service rhythm can focus on maintaining the rooms, surfaces, and presentation standards that matter most.",
      },
      {
        step: "03",
        title: "Maintain the baseline over time",
        body: "Recurring visits become easier to plan and easier to feel because the home is no longer starting from behind each appointment.",
      },
    ],
    positioningTitle:
      "A better starting path for homes that want recurring care but need catch-up first.",
    positioningBody:
      "This option helps prevent the first recurring visit from being under-scoped by naming the difference between first-visit reset work and future maintenance.",
    positioningCallout:
      "Use this when the goal is ongoing care, but the first appointment needs more detail than regular upkeep.",
    faqTitle: "Questions clients ask before starting recurring service",
    faqs: [
      {
        q: "Why is the first visit different from regular recurring cleaning?",
        a: "The first visit may need to address buildup, detail areas, and catch-up work before the home is ready for easier maintenance.",
      },
      {
        q: "What changes after the first clean?",
        a: "Future visits focus more on preserving the baseline: kitchens, bathrooms, floors, touch points, and the areas that shape day-to-day presentation.",
      },
      {
        q: "Is this the same as deep cleaning?",
        a: "It borrows the reset logic of a deeper first clean, but the purpose is specifically to transition into recurring maintenance afterward.",
      },
      {
        q: "When should I choose this instead of standard recurring cleaning?",
        a: "Choose it when the home needs an initial catch-up before ongoing service would feel realistic, efficient, and properly scoped.",
      },
    ],
    bookingTag: "Reset + rhythm",
    bookingMeta: "First visit before recurring",
    shortDescription:
      "For homes that need an initial catch-up clean before moving into easier ongoing maintenance.",
    serviceBadge: "Best first step for upkeep",
  },
  {
    slug: "recurring-home-cleaning",
    kind: "service",
    eyebrow: "Service detail",
    title: "Recurring home cleaning for an ongoing standard of calm and control.",
    description:
      "Premium recurring home cleaning built for consistency, presentation, and a calmer weekly household standard.",
    heroBody:
      "A dependable rhythm for preserving presentation, reducing household-management stress, and keeping the home from slipping between visits.",
    relatedSlugs: [
      "deep-cleaning",
      "how-often-should-a-house-be-cleaned",
      "deep-cleaning-vs-recurring-cleaning",
    ],
    primaryCtaLabel: "Book Recurring Cleaning",
    secondaryCtaLabel: "Get Pricing",
    serviceDepth: {
      summaryEyebrow: "Maintenance rhythm",
      summaryTitle: "Best when the goal is keeping a good baseline from slipping.",
      summaryBody:
        "Recurring cleaning protects the rooms and surfaces that shape day-to-day comfort. The work is planned for consistency, presentation, and less catch-up between visits.",
      bestFor: [
        "Homes that already have a manageable baseline",
        "Busy households that want less reactive cleaning pressure",
        "Clients who care about kitchens and bathrooms staying guest-ready",
        "A weekly, bi-weekly, or monthly rhythm after an opening reset",
      ],
      focusAreas: [
        {
          title: "Repeatable upkeep",
          body: "Each visit reinforces the core rooms and surfaces that determine how the home feels between appointments.",
        },
        {
          title: "Presentation protection",
          body: "Work is directed toward visible order, clean counters, polished fixtures, and surfaces that show daily use.",
        },
        {
          title: "Cadence fit",
          body: "The schedule should match household traffic; higher-use homes usually need tighter spacing than lower-use homes.",
        },
      ],
      zones: [
        {
          zone: "Kitchens",
          emphasis: "Keep everyday prep and gathering areas from sliding into catch-up mode.",
          examples: ["Counters", "Sinks", "Stovetop surfaces", "Visible cabinet touch points"],
        },
        {
          zone: "Bathrooms",
          emphasis: "Maintain the rooms that influence freshness and presentation fastest.",
          examples: ["Vanities", "Mirrors", "Fixtures", "Toilets and tubs"],
        },
        {
          zone: "Living zones",
          emphasis: "Support the spaces where daily traffic, dust, and touch points accumulate.",
          examples: ["Floors", "High-touch surfaces", "Entry areas", "Common rooms"],
        },
      ],
      afterVisit: [
        "The home returns to a calmer, more maintained baseline.",
        "Buildup has less time to become a reset project.",
        "Household cleaning pressure is easier to manage between visits.",
      ],
      differentiation: {
        title: "Recurring cleaning is maintenance, not recovery.",
        body: "It works best after the home is already in a reasonable condition. If the home needs a heavy first reset, deep cleaning usually creates the better starting point.",
      },
    },
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
    processTitle: "Why recurring care changes the experience.",
    processBody:
      "Recurring cleaning is not just about frequency. It is about maintaining a standard before disorder becomes visible.",
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
        body: "The service creates consistency, predictability, and less cleaning pressure between visits.",
      },
    ],
    positioningTitle:
      "Recurring service gives the home a steadier rhythm.",
    positioningBody:
      "The value is clearer than generic weekly-cleaning language: fewer resets, better presentation, and less pressure to catch up.",
    positioningCallout:
      "Recurring care is how premium presentation becomes easier to maintain, not harder to recover.",
    faqTitle: "Questions clients ask before choosing a recurring schedule",
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
        q: "Why does recurring service feel more premium with Nu Standard?",
        a: "Because the visit is planned around preserving a standard, not just repeating a commodity task on a schedule.",
      },
      {
        q: "How does Nu Standard maintain consistent service standards?",
        a: "Owner-led teams align to documented quality methods with accountable scheduling—so rhythm stays predictable and professionally coordinated.",
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
    title: "Move-in / move-out cleaning for transitions, presentation, and handoff readiness.",
    description:
      "Premium transition cleaning designed for handoffs, listings, fresh starts, and property-ready presentation.",
    heroBody:
      "A polished transition service for fresh starts, listings, exit condition, and property-ready presentation.",
    relatedSlugs: [
      "deep-cleaning",
      "deep-cleaning-vs-recurring-cleaning",
    ],
    primaryCtaLabel: "Book Move-In / Move-Out",
    secondaryCtaLabel: "Get Pricing",
    serviceDepth: {
      summaryEyebrow: "Transition readiness",
      summaryTitle: "Best when timing, presentation, and handoff condition all matter.",
      summaryBody:
        "Move-in and move-out cleaning focuses on the rooms and surfaces that shape a first impression. The service supports cleaner transitions without pretending to replace repairs, hauling, or restoration.",
      bestFor: [
        "Move-outs before walkthroughs, listings, or key handoff",
        "Move-ins where the home needs a fresher starting point",
        "Occupied-to-vacant transitions where presentation matters",
        "Property-ready resets after furniture, traffic, or appliance use",
      ],
      focusAreas: [
        {
          title: "Handoff presentation",
          body: "The service prioritizes the spaces people judge first when entering, listing, or turning over a home.",
        },
        {
          title: "Empty or shifting rooms",
          body: "Vacant areas expose floors, baseboards, cabinet faces, and corners that are often hidden during normal occupancy.",
        },
        {
          title: "Move-related buildup",
          body: "Attention goes to fingerprints, cabinet fronts, appliance exteriors, entry paths, and bathroom/kitchen surfaces.",
        },
      ],
      zones: [
        {
          zone: "Entry and common areas",
          emphasis: "Support the first impression as someone steps into the home.",
          examples: ["Entry floors", "Visible baseboards", "Touch points", "Main living areas"],
        },
        {
          zone: "Kitchens",
          emphasis: "Clean the surfaces that most influence move-in confidence or listing presentation.",
          examples: ["Cabinet faces", "Counters", "Sink detail", "Appliance exteriors"],
        },
        {
          zone: "Bathrooms",
          emphasis: "Reset the rooms where freshness and condition are noticed immediately.",
          examples: ["Mirrors", "Fixtures", "Vanities", "Tub and shower surfaces"],
        },
      ],
      afterVisit: [
        "The property feels easier to hand off, list, or step into.",
        "High-visibility rooms read cleaner and more intentional.",
        "The service clarifies presentation; it does not mask repairs or damage.",
      ],
      differentiation: {
        title: "Transition cleaning differs from occupied-home upkeep because the home is being judged as a handoff.",
        body: "The focus shifts toward presentation, visible condition, and the rooms that influence move-in confidence. Repair work, debris removal, and restoration remain outside the cleaning scope.",
      },
    },
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
    processTitle: "A transition clean built around readiness.",
    processBody:
      "The focus is handoff quality, listing presentation, and the confidence that comes with a visibly reset property.",
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
      "Transition cleaning is presentation support, not a generic add-on.",
    positioningBody:
      "The service is built for moments when timing, first impressions, and property condition all matter at once.",
    positioningCallout:
      "The goal is a cleaner handoff, a stronger first impression, and more confidence around the transition itself.",
    faqTitle: "Questions clients ask when timing and presentation both matter",
    faqs: [
      {
        q: "Is this better for move-in or move-out?",
        a: "Both. The framing changes slightly, but the core value is supporting a cleaner, more confident transition.",
      },
      {
        q: "Is this the same as deep cleaning?",
        a: "Not exactly. The service overlaps in intensity, but transition cleaning is planned around handoff readiness and presentation.",
      },
      {
        q: "Should this be booked before listing photos or after moving out?",
        a: "That depends on the goal, but either way the value is strongest when the property needs to present well immediately.",
      },
      {
        q: "How does arrival coordination work for a transition clean?",
        a: "You receive the same clear arrival window and confirmation thread as any Nu Standard visit—respectful scheduling clarity during tight move timelines.",
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
      "A practical answer to how often a home should be cleaned, based on presentation, traffic, and household-management pressure.",
    heroBody:
      "The right cleaning cadence protects the way your home feels day to day, not just how it looks on cleaning day.",
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
      body: "The right cadence depends on how quickly the home shows use, how much pressure the household carries, and how polished you want the space to feel between visits.",
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
      {
        q: "What makes Nu Standard different from a traditional quote-based cleaning company?",
        a: "Transparent scheduling, documented service standards, and owner-led accountability—premium clarity from booking through arrival, not opaque quoting alone.",
      },
    ],
    ctaTitle: "Use the right cadence to protect the standard.",
    ctaBody:
      "If the home is already behind, start with a deeper reset. If the standard is in place, recurring care can help maintain it.",
  },
  {
    slug: "deep-cleaning-vs-recurring-cleaning",
    kind: "guide",
    eyebrow: "Nu Standard Guide",
    title: "Deep cleaning vs recurring cleaning: how to choose the right service.",
    description:
      "A premium guide comparing deep cleaning and recurring cleaning through service fit, presentation, and booking confidence.",
    heroBody:
      "Deep cleaning and recurring cleaning solve different problems. Choosing the right one helps the visit match the condition of the home.",
    relatedSlugs: [
      "deep-cleaning",
      "recurring-home-cleaning",
      "how-often-should-a-house-be-cleaned",
      "move-in-move-out",
    ],
    sectionOne: {
      eyebrow: "The distinction",
      title: "Recurring cleaning protects the standard. Deep cleaning restores it.",
      body: "That distinction helps clients self-select correctly and feel more confident before booking.",
      callout:
        "The best educational content reduces confusion and improves service fit before the first appointment happens.",
    },
    sectionTwo: {
      eyebrow: "How to decide",
      title: "Choose based on the current condition of the home.",
      body: "If the home needs a stronger reset, start with deep cleaning. If the home already has a manageable baseline, recurring care helps preserve it.",
      points: [
        "Choose deep cleaning for buildup, first visits, or seasonal resets.",
        "Choose recurring cleaning for ongoing consistency and less catch-up work.",
        "Use a deep clean first when maintenance alone would not be enough.",
        "Move into recurring care once the home has a clear baseline.",
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
        a: "Not efficiently. Recovery and maintenance are different service needs and call for different levels of service.",
      },
      {
        q: "Why does this matter before booking?",
        a: "When the service fits the condition of the home, expectations are clearer and the visit is easier to plan well.",
      },
      {
        q: "How does Nu Standard keep visits accountable beyond pricing?",
        a: "Owner-led teams operate under documented standards with transparent scheduling—professional coordination rather than vague handoffs.",
      },
    ],
    ctaTitle: "Choose the service that matches the condition of the home.",
    ctaBody:
      "Start with deep cleaning when the home needs a reset. Choose recurring cleaning when the goal is to preserve a standard over time.",
  },
];
