import { getAllServiceEntries, getAllArticleEntries } from "./publicContentSelectors";

export function getHomepageFeaturedServices() {
  return getAllServiceEntries().slice(0, 3);
}

export function getHomepageFeaturedArticles() {
  return getAllArticleEntries().slice(0, 2);
}

export function getHomepageTrustPoints() {
  return [
    "Background-checked professionals",
    "Insured service with explicit expectations",
    "Disciplined, respectful in-home conduct",
    "Realistic timing modeled before we arrive",
  ];
}

export function getHomepageStandards() {
  return [
    "Owner-operators accountable on every visit team",
    "Surface-aware methods and disciplined execution",
    "Consistent standards—not whoever was available that day",
    "Clear communication from booking through completion",
  ];
}

export function getHomepageSteps() {
  return [
    {
      step: "01",
      title: "Choose the right service",
      body: "Match the visit to how your home lives today and the outcome you want—so scope and timing stay honest.",
    },
    {
      step: "02",
      title: "Book with clarity",
      body: "Walk through a guided flow at your pace. Your estimate and schedule reflect real availability—not generic placeholders.",
    },
    {
      step: "03",
      title: "Come home to calm",
      body: "Expect an owner-led team accountable for quality and consistency—not anonymous labor at your door.",
    },
  ];
}
