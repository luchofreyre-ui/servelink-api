export const KNOWLEDGE_HUB_SLUG = "cleaning-guides";
export const KNOWLEDGE_DEFAULT_INDEXING = "noindex";
export const KNOWLEDGE_SITE_SECTION_NAME = "Cleaning Guides";

export const KNOWLEDGE_CATEGORIES = [
  { slug: "cleaning-techniques", name: "Cleaning Techniques" },
  { slug: "room-cleaning-guides", name: "Room Cleaning Guides" },
  { slug: "stain-removal", name: "Stain Removal" },
  { slug: "cleaning-schedules", name: "Cleaning Schedules" },
  { slug: "professional-cleaning", name: "Professional Cleaning" },
  { slug: "cleaning-tools", name: "Cleaning Tools & Products" },
  { slug: "move-out-cleaning-guides", name: "Move-Out Cleaning Guides" },
  { slug: "cleaning-problems", name: "Cleaning Problems & Solutions" },
  { slug: "cleaning-method", name: "Cleaning Standards & Methods" },
] as const;

export type KnowledgeCategorySlug = (typeof KNOWLEDGE_CATEGORIES)[number]["slug"];
