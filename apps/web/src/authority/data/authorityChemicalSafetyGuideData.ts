import type { AuthorityGuidePageData } from "@/authority/types/authorityPageTypes";

const M = (slug: string) => `/methods/${slug}`;
const S = (slug: string) => `/surfaces/${slug}`;
const P = (slug: string) => `/problems/${slug}`;

function es(
  slug: string,
  title: string,
  href: string,
  summary?: string,
): import("@/authority/types/authorityPageTypes").AuthorityEntitySummary {
  return { slug, title, href, summary, kind: href.startsWith("/methods") ? "method" : "surface" };
}

function rp(slug: string, title: string, summary?: string) {
  return { slug, title, href: P(slug), summary };
}

export const CHEMICAL_USAGE_AND_SAFETY_GUIDE: AuthorityGuidePageData = {
  slug: "chemical-usage-and-safety",
  title: "Chemical Usage and Safety for Home Cleaning",
  description:
    "Surface-first thinking, label respect, ventilation, and knowing when neutral cleaning beats stronger chemistry—without mixing products or improvising hazardous routines.",
  summary:
    "Surface-first thinking, label respect, ventilation, and knowing when neutral cleaning beats stronger chemistry—without mixing products or improvising hazardous routines.",
  category: "chemical_safety",
  sections: [
    {
      id: "surface-soil-first",
      title: "Start with the surface and the soil, not the strongest product",
      body: "Strength that is wrong for the finish is still wrong. Identify what the material is (or find manufacturer guidance), what the soil is (oil, mineral film, dust, adhesive), and what the label allows. Escalate chemistry only when a milder, compatible pass has failed and you still know the surface can tolerate the next step.",
    },
    {
      id: "dwell-agitation-rinse",
      title: "Why dwell time, agitation, and rinse technique matter",
      body: "Many products need a short contact period to loosen soil—then gentle agitation and thorough rinse or wipe-off. Skipping dwell forces scrubbing; skipping rinse leaves residue that attracts new soil and can interfere with the next product. Use timers for dwell, keep surfaces wet as the label directs, and finish with clean water or a fresh cloth pass when appropriate.",
    },
    {
      id: "neutral-safer-default",
      title: "When neutral cleaning is safer than stronger chemistry",
      body: "Mixed-finish rooms, sealed stone with unknown tolerance, coated glass, oiled wood, and many painted walls are often best served by pH-neutral or mild detergents and frequent water changes. Strong acids, alkalis, and solvents can shift sealers, cloud coatings, or raise grain—especially when applied repeatedly.",
    },
    {
      id: "stop-escalate",
      title: "When to stop and escalate",
      body: "Stop if you see etching, swelling seams, persistent chemical odor, or finish change after one careful attempt. Escalate structural moisture, widespread biological growth you cannot dry out, or any situation where labels conflict with the material—manufacturer or qualified professionals are the right next step.",
    },
  ],
  relatedMethods: [
    es("neutral-surface-cleaning", "Neutral surface cleaning", M("neutral-surface-cleaning")),
    es("soap-scum-removal", "Soap scum removal", M("soap-scum-removal")),
    es("degreasing", "Degreasing", M("degreasing")),
    es("glass-cleaning", "Glass cleaning", M("glass-cleaning")),
    es("touchpoint-sanitization", "Touchpoint sanitization", M("touchpoint-sanitization")),
    es("hard-water-deposit-removal", "Hard water deposit removal", M("hard-water-deposit-removal")),
  ],
  relatedSurfaces: [
    es("shower-glass", "Shower glass", S("shower-glass")),
    es("granite-countertops", "Granite countertops", S("granite-countertops")),
    es("quartz-countertops", "Quartz countertops", S("quartz-countertops")),
    es("finished-wood", "Finished wood", S("finished-wood")),
    es("painted-walls", "Painted walls", S("painted-walls")),
    es("stainless-steel", "Stainless steel", S("stainless-steel")),
  ],
  relatedProblems: [
    rp("soap-scum", "Soap scum"),
    rp("hard-water-deposits", "Hard water deposits"),
    rp("touchpoint-contamination", "Touchpoint contamination"),
    rp("general-soil", "General soil"),
    rp("stuck-on-residue", "Stuck-on residue"),
    rp("light-mildew", "Light mildew appearance"),
  ],
};
