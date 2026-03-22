import type { KnowledgeCategorySlug } from "./knowledgeConfig";

export type KnowledgeArticleOutlineSection = {
  id: string;
  heading: string;
};

export type KnowledgeArticleDefinition = {
  slug: string;
  title: string;
  categorySlug: KnowledgeCategorySlug;
  excerpt: string;
  outline: KnowledgeArticleOutlineSection[];
  relatedServiceSlugs: string[];
  relatedLocationSlugs: string[];
  isLive: boolean;
};

const DEFAULT_OUTLINE: KnowledgeArticleOutlineSection[] = [
  { id: "overview", heading: "Overview" },
  { id: "tools-and-supplies", heading: "Tools and supplies" },
  { id: "step-by-step", heading: "Step-by-step process" },
  { id: "common-mistakes", heading: "Common mistakes" },
  { id: "when-to-call-a-pro", heading: "When to call a professional" },
];

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function article(
  slug: string,
  categorySlug: KnowledgeCategorySlug,
  excerpt: string,
  relatedServiceSlugs: string[] = ["house-cleaning"],
  relatedLocationSlugs: string[] = ["tulsa"]
): KnowledgeArticleDefinition {
  return {
    slug,
    title: slugToTitle(slug),
    categorySlug,
    excerpt,
    outline: [...DEFAULT_OUTLINE],
    relatedServiceSlugs,
    relatedLocationSlugs,
    isLive: false,
  };
}

const TECH = "cleaning-techniques" as const;
const ROOM = "room-cleaning-guides" as const;
const STAIN = "stain-removal" as const;
const SCHED = "cleaning-schedules" as const;
const PRO = "professional-cleaning" as const;
const TOOLS = "cleaning-tools" as const;
const MOVEOUT = "move-out-cleaning-guides" as const;
const PROB = "cleaning-problems" as const;
const METHOD = "cleaning-method" as const;

const ALL_ARTICLES: KnowledgeArticleDefinition[] = [
  // Category 1 — Cleaning Techniques (20)
  article("how-to-clean-kitchen", TECH, "A practical guide to cleaning your kitchen for a fresh, sanitary space.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-clean-bathroom", TECH, "A practical guide to cleaning your bathroom effectively.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-clean-oven", TECH, "A practical guide to cleaning your oven safely.", ["deep-cleaning"]),
  article("how-to-clean-grout", TECH, "A practical guide to cleaning and maintaining grout lines.", ["deep-cleaning"]),
  article("how-to-clean-hardwood-floors", TECH, "A practical guide to cleaning hardwood floors without damage.", ["house-cleaning"]),
  article("how-to-clean-carpet", TECH, "A practical guide to cleaning carpets and rugs.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-clean-baseboards", TECH, "A practical guide to cleaning baseboards and trim.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-clean-windows", TECH, "A practical guide to cleaning interior and exterior windows.", ["house-cleaning"]),
  article("how-to-clean-mattresses", TECH, "A practical guide to cleaning and maintaining your mattress.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-clean-blinds", TECH, "A practical guide to cleaning window blinds and shades.", ["house-cleaning"]),
  article("how-to-clean-ceiling-fans", TECH, "A practical guide to cleaning ceiling fans safely.", ["house-cleaning"]),
  article("how-to-clean-refrigerator", TECH, "A practical guide to cleaning your refrigerator inside and out.", ["deep-cleaning"]),
  article("how-to-clean-microwave", TECH, "A practical guide to cleaning your microwave effectively.", ["house-cleaning"]),
  article("how-to-clean-stainless-steel", TECH, "A practical guide to cleaning stainless steel appliances and surfaces.", ["house-cleaning"]),
  article("how-to-clean-cabinets", TECH, "A practical guide to cleaning kitchen and bathroom cabinets.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-clean-shower", TECH, "A practical guide to cleaning showers and tubs.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-clean-toilet", TECH, "A practical guide to cleaning and sanitizing toilets.", ["house-cleaning"]),
  article("how-to-clean-sinks", TECH, "A practical guide to cleaning kitchen and bathroom sinks.", ["house-cleaning"]),
  article("how-to-clean-tile", TECH, "A practical guide to cleaning tile floors and walls.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-clean-laminate-floors", TECH, "A practical guide to cleaning laminate flooring.", ["house-cleaning"]),
  // Category 2 — Room Cleaning Guides (10)
  article("kitchen-cleaning-guide", ROOM, "A room-by-room guide to cleaning your kitchen.", ["house-cleaning", "deep-cleaning"]),
  article("bathroom-cleaning-guide", ROOM, "A room-by-room guide to cleaning your bathroom.", ["house-cleaning", "deep-cleaning"]),
  article("living-room-cleaning-guide", ROOM, "A room-by-room guide to cleaning your living room.", ["house-cleaning"]),
  article("bedroom-cleaning-guide", ROOM, "A room-by-room guide to cleaning your bedroom.", ["house-cleaning"]),
  article("laundry-room-cleaning-guide", ROOM, "A room-by-room guide to cleaning your laundry room.", ["house-cleaning"]),
  article("garage-cleaning-guide", ROOM, "A room-by-room guide to cleaning your garage.", ["deep-cleaning"]),
  article("home-office-cleaning-guide", ROOM, "A room-by-room guide to cleaning your home office.", ["house-cleaning"]),
  article("basement-cleaning-guide", ROOM, "A room-by-room guide to cleaning your basement.", ["deep-cleaning"]),
  article("dining-room-cleaning-guide", ROOM, "A room-by-room guide to cleaning your dining room.", ["house-cleaning"]),
  article("guest-room-cleaning-guide", ROOM, "A room-by-room guide to cleaning your guest room.", ["house-cleaning", "airbnb-cleaning"]),
  // Category 3 — Stain Removal (12)
  article("how-to-remove-wine-stains", STAIN, "A practical guide to removing wine stains from fabric and surfaces.", ["house-cleaning"]),
  article("how-to-remove-pet-stains", STAIN, "A practical guide to removing pet stains and odors.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-remove-grease-stains", STAIN, "A practical guide to removing grease stains from kitchen and fabric.", ["house-cleaning"]),
  article("how-to-remove-carpet-stains", STAIN, "A practical guide to removing common carpet stains.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-remove-coffee-stains", STAIN, "A practical guide to removing coffee stains.", ["house-cleaning"]),
  article("how-to-remove-blood-stains", STAIN, "A practical guide to removing blood stains from fabric and surfaces.", ["house-cleaning"]),
  article("how-to-remove-oil-stains", STAIN, "A practical guide to removing oil stains from fabric and surfaces.", ["house-cleaning"]),
  article("how-to-remove-mold-stains", STAIN, "A practical guide to addressing mold stains safely.", ["deep-cleaning"]),
  article("how-to-remove-ink-stains", STAIN, "A practical guide to removing ink stains from fabric and surfaces.", ["house-cleaning"]),
  article("how-to-remove-food-stains", STAIN, "A practical guide to removing common food stains.", ["house-cleaning"]),
  article("how-to-remove-rust-stains", STAIN, "A practical guide to removing rust stains.", ["house-cleaning"]),
  article("how-to-remove-hard-water-stains", STAIN, "A practical guide to removing hard water stains and buildup.", ["house-cleaning", "deep-cleaning"]),
  // Category 4 — Cleaning Schedules (9)
  article("daily-cleaning-checklist", SCHED, "A practical daily cleaning checklist for maintaining your home.", ["house-cleaning", "recurring-cleaning"]),
  article("weekly-cleaning-checklist", SCHED, "A practical weekly cleaning checklist for residential upkeep.", ["house-cleaning", "recurring-cleaning"]),
  article("monthly-cleaning-checklist", SCHED, "A practical monthly cleaning checklist for deeper maintenance.", ["recurring-cleaning", "deep-cleaning"]),
  article("seasonal-cleaning-checklist", SCHED, "A practical seasonal cleaning checklist for your home.", ["deep-cleaning"]),
  article("spring-cleaning-checklist", SCHED, "A practical spring cleaning checklist for a full reset.", ["deep-cleaning"]),
  article("deep-cleaning-checklist", SCHED, "A practical deep cleaning checklist for thorough home cleaning.", ["deep-cleaning"]),
  article("move-out-cleaning-checklist", SCHED, "A practical move-out cleaning checklist for renters and sellers.", ["move-out-cleaning"]),
  article("pre-holiday-cleaning-checklist", SCHED, "A practical pre-holiday cleaning checklist.", ["house-cleaning", "deep-cleaning"]),
  article("post-party-cleaning-checklist", SCHED, "A practical post-party cleaning checklist.", ["house-cleaning", "deep-cleaning"]),
  // Category 5 — Professional Cleaning (11)
  article("what-is-house-cleaning", PRO, "An overview of what house cleaning typically includes.", ["house-cleaning"]),
  article("what-is-deep-cleaning", PRO, "An overview of what deep cleaning typically includes.", ["deep-cleaning"]),
  article("what-is-standard-cleaning", PRO, "An overview of standard residential cleaning scope.", ["house-cleaning"]),
  article("deep-cleaning-vs-regular-cleaning", PRO, "A comparison of deep cleaning and regular house cleaning.", ["house-cleaning", "deep-cleaning"]),
  article("move-out-cleaning-vs-deep-cleaning", PRO, "A comparison of move-out cleaning and deep cleaning.", ["move-out-cleaning", "deep-cleaning"]),
  article("how-long-does-house-cleaning-take", PRO, "A guide to typical house cleaning duration.", ["house-cleaning"]),
  article("how-much-does-house-cleaning-cost", PRO, "An overview of factors in residential cleaning cost.", ["house-cleaning", "recurring-cleaning"]),
  article("when-to-hire-professional-cleaners", PRO, "A guide to when to hire professional cleaning services.", ["house-cleaning", "deep-cleaning"]),
  article("what-to-expect-from-cleaning-service", PRO, "What to expect when you hire a residential cleaning service.", ["house-cleaning"]),
  article("how-professional-cleaners-clean-homes", PRO, "How professional cleaners typically approach home cleaning.", ["house-cleaning", "deep-cleaning"]),
  article("house-cleaning-frequency-guide", PRO, "A guide to how often to schedule house cleaning.", ["recurring-cleaning", "house-cleaning"]),
  // Category 6 — Cleaning Tools (10)
  article("best-cleaning-tools-for-home", TOOLS, "A guide to essential cleaning tools for the home.", ["house-cleaning"]),
  article("best-mops-for-hardwood", TOOLS, "A guide to choosing mops for hardwood floors.", ["house-cleaning"]),
  article("best-vacuums-for-carpet", TOOLS, "A guide to choosing vacuums for carpet cleaning.", ["house-cleaning"]),
  article("best-microfiber-cloths", TOOLS, "A guide to using microfiber cloths for cleaning.", ["house-cleaning"]),
  article("best-grout-cleaning-tools", TOOLS, "A guide to tools for cleaning grout.", ["deep-cleaning"]),
  article("best-bathroom-cleaning-tools", TOOLS, "A guide to essential bathroom cleaning tools.", ["house-cleaning"]),
  article("best-kitchen-cleaning-tools", TOOLS, "A guide to essential kitchen cleaning tools.", ["house-cleaning"]),
  article("best-floor-cleaning-tools", TOOLS, "A guide to floor cleaning tools by surface type.", ["house-cleaning"]),
  article("best-window-cleaning-tools", TOOLS, "A guide to window cleaning tools and techniques.", ["house-cleaning"]),
  article("best-dusting-tools", TOOLS, "A guide to dusting tools for home cleaning.", ["house-cleaning"]),
  // Category 7 — Move-Out Cleaning Guides (8)
  article("move-out-cleaning-checklist-guide", MOVEOUT, "A detailed guide to the move-out cleaning checklist.", ["move-out-cleaning"]),
  article("how-to-pass-a-rental-inspection", MOVEOUT, "A guide to preparing your rental for inspection.", ["move-out-cleaning"]),
  article("how-to-get-your-security-deposit-back", MOVEOUT, "A guide to cleaning and documentation for security deposit return.", ["move-out-cleaning"]),
  article("cleaning-before-selling-house", MOVEOUT, "A guide to cleaning before listing your home for sale.", ["move-out-cleaning", "deep-cleaning"]),
  article("cleaning-before-moving-in", MOVEOUT, "A guide to cleaning a new space before move-in.", ["deep-cleaning"]),
  article("rental-property-cleaning-guide", MOVEOUT, "A guide to cleaning rental properties for turnover.", ["move-out-cleaning", "airbnb-cleaning"]),
  article("apartment-move-out-cleaning", MOVEOUT, "A guide to apartment move-out cleaning.", ["move-out-cleaning"]),
  article("landlord-cleaning-standards", MOVEOUT, "An overview of typical landlord cleaning standards.", ["move-out-cleaning"]),
  // Category 8 — Cleaning Problems (10)
  article("why-does-my-house-get-dusty", PROB, "A guide to why homes get dusty and how to reduce it.", ["house-cleaning", "recurring-cleaning"]),
  article("how-to-stop-mold-in-bathroom", PROB, "A guide to preventing and addressing mold in bathrooms.", ["deep-cleaning"]),
  article("how-to-remove-soap-scum", PROB, "A practical guide to removing soap scum.", ["house-cleaning"]),
  article("how-to-remove-odor-from-carpet", PROB, "A practical guide to removing odors from carpet.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-remove-pet-odors", PROB, "A practical guide to removing pet odors from the home.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-remove-kitchen-grease", PROB, "A practical guide to removing built-up kitchen grease.", ["house-cleaning", "deep-cleaning"]),
  article("how-to-clean-smoke-residue", PROB, "A practical guide to cleaning smoke residue.", ["deep-cleaning"]),
  article("how-to-remove-limescale", PROB, "A practical guide to removing limescale buildup.", ["house-cleaning"]),
  article("how-to-remove-bathroom-mildew", PROB, "A practical guide to removing bathroom mildew.", ["house-cleaning", "deep-cleaning"]),
  article("why-does-my-house-smell-musty", PROB, "A guide to causes and solutions for musty odors.", ["house-cleaning", "deep-cleaning"]),
  // Category 9 — Cleaning Method (7)
  article("the-nu-standard-cleaning-method", METHOD, "An overview of the Nu Standard approach to residential cleaning.", ["house-cleaning", "deep-cleaning"]),
  article("professional-cleaning-order", METHOD, "A guide to the order professionals typically clean a home.", ["house-cleaning"]),
  article("how-professionals-clean-a-house", METHOD, "How professional cleaners approach a full-house clean.", ["house-cleaning", "deep-cleaning"]),
  article("eco-friendly-cleaning-methods", METHOD, "A guide to eco-friendly cleaning methods and products.", ["house-cleaning"]),
  article("non-toxic-cleaning-guide", METHOD, "A guide to non-toxic cleaning for the home.", ["house-cleaning"]),
  article("professional-cleaning-safety", METHOD, "A guide to safety in professional residential cleaning.", ["house-cleaning", "deep-cleaning"]),
  article("home-cleaning-best-practices", METHOD, "Best practices for effective home cleaning.", ["house-cleaning", "recurring-cleaning"]),
];

export const KNOWLEDGE_ARTICLES = ALL_ARTICLES;

export function getAllKnowledgeArticles(): KnowledgeArticleDefinition[] {
  return [...KNOWLEDGE_ARTICLES];
}

export function getKnowledgeArticleBySlug(slug: string): KnowledgeArticleDefinition | null {
  return KNOWLEDGE_ARTICLES.find((a) => a.slug === slug) ?? null;
}

export function getKnowledgeArticlesByCategory(categorySlug: KnowledgeCategorySlug): KnowledgeArticleDefinition[] {
  return KNOWLEDGE_ARTICLES.filter((a) => a.categorySlug === categorySlug);
}

export function isKnowledgeArticleSlug(slug: string): boolean {
  return KNOWLEDGE_ARTICLES.some((a) => a.slug === slug);
}
