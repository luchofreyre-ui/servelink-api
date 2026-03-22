import type { Metadata } from "next";
import { PrecisionLuxuryHomepage } from "@/components/marketing/precision-luxury/home/PrecisionLuxuryHomepage";
import { buildHomepageMetadata } from "@/components/marketing/precision-luxury/content/publicContentMetadata";

export const metadata: Metadata = buildHomepageMetadata();

export default function PublicHomepageRoute() {
  return <PrecisionLuxuryHomepage />;
}
