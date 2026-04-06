export interface FranchiseOwnerProfile {
  id: string;
  name: string;
  slug: string;
  city: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
}

export const FRANCHISE_OWNER_PROFILES: FranchiseOwnerProfile[] = [
  {
    id: "fo-tulsa-001",
    name: "Nu Standard Tulsa North",
    slug: "nu-standard-tulsa-north",
    city: "Tulsa",
    specialties: ["deep cleaning", "bathroom restoration", "hard water"],
    rating: 4.9,
    reviewCount: 148,
  },
  {
    id: "fo-tulsa-002",
    name: "Nu Standard Tulsa South",
    slug: "nu-standard-tulsa-south",
    city: "Tulsa",
    specialties: ["recurring cleaning", "kitchen degreasing", "move-out"],
    rating: 4.8,
    reviewCount: 119,
  },
  {
    id: "fo-tulsa-003",
    name: "Nu Standard Midtown",
    slug: "nu-standard-midtown",
    city: "Tulsa",
    specialties: ["whole home resets", "odor control", "maintenance"],
    rating: 4.7,
    reviewCount: 96,
  },
];

export function getFranchiseOwnerById(id: string) {
  return FRANCHISE_OWNER_PROFILES.find((fo) => fo.id === id) ?? null;
}
