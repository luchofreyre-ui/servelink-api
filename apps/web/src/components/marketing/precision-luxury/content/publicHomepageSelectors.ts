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
    "Insured and accountable service",
    "Consistent quality expectations",
    "Premium in-home experience",
  ];
}

export function getHomepageStandards() {
  return [
    "Surface-aware methods",
    "Professionally trained teams",
    "Consistent service standards",
    "Clear communication from booking to finish",
  ];
}

export function getHomepageSteps() {
  return [
    {
      step: "01",
      title: "Choose the right service",
      body: "Start from a clear service path that matches the condition of the home and the result you want.",
    },
    {
      step: "02",
      title: "Book with confidence",
      body: "Move through a calm, guided booking flow that feels structured, premium, and easy to complete.",
    },
    {
      step: "03",
      title: "Come back to calm",
      body: "The home should feel lighter, sharper, and more controlled — without the stress of managing it yourself.",
    },
  ];
}
